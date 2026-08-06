import RNFS from 'react-native-fs';
import { observability } from '../../../services/observability';
import {
  reportActionError,
  reportStorageReadFailure,
} from '../../../services/observability/errorReporting';
import {
  ARCHIVE_HEALTH_HISTORY_STORAGE_KEY,
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAMS_STORAGE_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import type { Dream } from '../../dreams/model/dream';
import {
  isValidSleepDate,
  sanitizeDream,
  validateDreamForSave,
} from '../../dreams/model/dreamRules';
import {
  clearDreamDeletionTombstone,
  listDreamDeletionTombstones,
  replaceAllDreamDeletionTombstones,
} from '../../dreams/repository/dreamDeletionTombstonesRepository';
import { replaceAllDreams } from '../../dreams/repository/dreamsRepository';
import {
  clearDreamEditDraft,
  getDreamDraft,
  getDreamEditDraft,
  saveDreamDraft,
  saveDreamEditDraft,
  type DreamDraft,
} from '../../dreams/services/dreamDraftService';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from './localDataTransactionService';

const STALE_TRANSCRIPT_PROCESSING_MS = 15 * 60 * 1000;
const ARCHIVE_HEALTH_HISTORY_LIMIT = 20;

type RecordShape = Record<string, unknown>;

export type ArchiveHealthSeverity = 'info' | 'warning' | 'critical';
export type ArchiveHealthStatus = 'healthy' | 'attention' | 'critical';
export type ArchiveHealthRepairMode = 'automatic' | 'manual' | 'none';

export type ArchiveHealthIssueCode =
  | 'newer-storage-schema'
  | 'dream-store-unreadable'
  | 'invalid-dream-record'
  | 'duplicate-dream-id'
  | 'invalid-sleep-date'
  | 'stale-transcript-processing'
  | 'missing-dream-audio'
  | 'missing-audio-only-dream'
  | 'draft-store-unreadable'
  | 'missing-draft-audio'
  | 'missing-audio-only-draft'
  | 'edit-draft-unreadable'
  | 'orphan-edit-draft'
  | 'missing-edit-draft-audio'
  | 'missing-audio-only-edit-draft'
  | 'tombstone-store-unreadable'
  | 'tombstone-conflict'
  | 'duplicate-tombstone';

export type ArchiveHealthIssue = {
  code: ArchiveHealthIssueCode;
  severity: ArchiveHealthSeverity;
  repair: ArchiveHealthRepairMode;
  count: number;
};

export type ArchiveHealthSnapshot = {
  status: ArchiveHealthStatus;
  scannedAt: number;
  dreamCount: number | null;
  draftCount: number | null;
  editDraftCount: number | null;
  tombstoneCount: number | null;
  issueCount: number;
  repairableIssueCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: ArchiveHealthIssue[];
};

export type ArchiveHealthHistoryEntry = {
  id: string;
  kind: 'scan' | 'repair';
  at: number;
  status: ArchiveHealthStatus | 'failed' | 'blocked';
  issueCount: number;
  repairedIssueCount: number;
  checkpointCreated: boolean;
};

export type ArchiveRepairResult =
  | {
      status: 'completed';
      repairedIssueCount: number;
      checkpointFilePath: string | null;
      snapshot: ArchiveHealthSnapshot;
    }
  | {
      status: 'blocked';
      reason: 'critical-issues' | 'nothing-to-repair';
      repairedIssueCount: 0;
      checkpointFilePath: null;
      snapshot: ArchiveHealthSnapshot;
    }
  | {
      status: 'failed';
      repairedIssueCount: 0;
      checkpointFilePath: string | null;
      snapshot: ArchiveHealthSnapshot;
    };

type RepairPlan = {
  dreams: Dream[];
  clearDreamAudioIds: Set<string>;
  staleTranscriptIds: Set<string>;
  clearCreateDraftAudio: boolean;
  clearEditDraftAudioIds: Set<string>;
  orphanEditDraftIds: Set<string>;
  tombstoneConflictIds: Set<string>;
  deduplicateTombstones: boolean;
};

type InternalScan = {
  snapshot: ArchiveHealthSnapshot;
  plan: RepairPlan;
};

function isRecord(value: unknown): value is RecordShape {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function addIssue(
  issues: Map<ArchiveHealthIssueCode, ArchiveHealthIssue>,
  issue: Omit<ArchiveHealthIssue, 'count'>,
  count = 1,
) {
  const current = issues.get(issue.code);
  if (current) {
    current.count += count;
    return;
  }
  issues.set(issue.code, { ...issue, count });
}

function normalizeAudioPath(uri: string) {
  const trimmed = uri.trim();
  if (!trimmed) {
    return '';
  }
  const path = trimmed.startsWith('file://')
    ? trimmed.slice('file://'.length)
    : trimmed;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

async function audioExists(uri: string) {
  const path = normalizeAudioPath(uri);
  if (!path) {
    return false;
  }
  try {
    return await RNFS.exists(path);
  } catch {
    return false;
  }
}

function hasDraftContentWithoutAudio(draft: Partial<DreamDraft>) {
  return Boolean(
    draft.title?.trim() ||
    draft.text?.trim() ||
    draft.mood ||
    typeof draft.dreamIntensity === 'number' ||
    typeof draft.lucidity === 'number' ||
    draft.wakeEmotions?.length ||
    draft.tags?.length ||
    draft.medications?.trim() ||
    draft.importantEvents?.trim() ||
    draft.healthNotes?.trim() ||
    typeof draft.stressLevel === 'number' ||
    draft.preSleepEmotions?.length ||
    typeof draft.alcoholTaken === 'boolean' ||
    typeof draft.caffeineLate === 'boolean' ||
    draft.dreamSigns?.length ||
    draft.lucidTrigger?.trim() ||
    draft.controlAreas?.length ||
    draft.stabilizationActions?.length ||
    typeof draft.recallScore === 'number' ||
    draft.lucidTechnique ||
    typeof draft.nightmareExplicit === 'boolean' ||
    typeof draft.nightmareDistress === 'number' ||
    typeof draft.nightmareRecurring === 'boolean' ||
    draft.nightmareRecurringKey?.trim() ||
    typeof draft.nightmareWokeFromDream === 'boolean' ||
    draft.nightmareAftereffects?.length ||
    draft.nightmareGroundingUsed?.length ||
    draft.nightmareRewrittenEnding?.trim() ||
    draft.nightmareRescriptStatus,
  );
}

function parseJsonValue(key: string) {
  const raw = kv.getString(key);
  if (raw === undefined) {
    return { status: 'missing' as const, raw: null, parsed: null };
  }

  try {
    return {
      status: 'readable' as const,
      raw,
      parsed: JSON.parse(raw) as unknown,
    };
  } catch (error) {
    reportStorageReadFailure(key, error);
    return { status: 'unreadable' as const, raw, parsed: null };
  }
}

function buildSnapshot(
  issuesMap: Map<ArchiveHealthIssueCode, ArchiveHealthIssue>,
  input: {
    scannedAt: number;
    dreamCount: number | null;
    draftCount: number | null;
    editDraftCount: number | null;
    tombstoneCount: number | null;
  },
): ArchiveHealthSnapshot {
  const issues = Array.from(issuesMap.values()).sort((left, right) => {
    const rank = { critical: 0, warning: 1, info: 2 } as const;
    return rank[left.severity] - rank[right.severity];
  });
  const criticalCount = issues
    .filter(issue => issue.severity === 'critical')
    .reduce((sum, issue) => sum + issue.count, 0);
  const warningCount = issues
    .filter(issue => issue.severity === 'warning')
    .reduce((sum, issue) => sum + issue.count, 0);
  const infoCount = issues
    .filter(issue => issue.severity === 'info')
    .reduce((sum, issue) => sum + issue.count, 0);
  const issueCount = criticalCount + warningCount + infoCount;
  const repairableIssueCount = issues
    .filter(issue => issue.repair === 'automatic')
    .reduce((sum, issue) => sum + issue.count, 0);

  return {
    status:
      criticalCount > 0 ? 'critical' : issueCount > 0 ? 'attention' : 'healthy',
    scannedAt: input.scannedAt,
    dreamCount: input.dreamCount,
    draftCount: input.draftCount,
    editDraftCount: input.editDraftCount,
    tombstoneCount: input.tombstoneCount,
    issueCount,
    repairableIssueCount,
    criticalCount,
    warningCount,
    infoCount,
    issues,
  };
}

async function scanInternal(now = Date.now()): Promise<InternalScan> {
  const issues = new Map<ArchiveHealthIssueCode, ArchiveHealthIssue>();
  const plan: RepairPlan = {
    dreams: [],
    clearDreamAudioIds: new Set(),
    staleTranscriptIds: new Set(),
    clearCreateDraftAudio: false,
    clearEditDraftAudioIds: new Set(),
    orphanEditDraftIds: new Set(),
    tombstoneConflictIds: new Set(),
    deduplicateTombstones: false,
  };

  const schemaVersion = kv.getNumber(STORAGE_SCHEMA_VERSION_KEY);
  if (
    typeof schemaVersion === 'number' &&
    schemaVersion > CURRENT_STORAGE_SCHEMA_VERSION
  ) {
    addIssue(issues, {
      code: 'newer-storage-schema',
      severity: 'critical',
      repair: 'none',
    });
  }

  let dreamCount: number | null = 0;
  const dreamIds = new Set<string>();
  const rawDreams = parseJsonValue(DREAMS_STORAGE_KEY);
  if (rawDreams.status === 'unreadable' || !Array.isArray(rawDreams.parsed)) {
    if (rawDreams.status !== 'missing') {
      addIssue(issues, {
        code: 'dream-store-unreadable',
        severity: 'critical',
        repair: 'none',
      });
      dreamCount = null;
    }
  } else {
    dreamCount = rawDreams.parsed.length;
    for (const rawDream of rawDreams.parsed) {
      if (!isRecord(rawDream)) {
        addIssue(issues, {
          code: 'invalid-dream-record',
          severity: 'critical',
          repair: 'none',
        });
        continue;
      }

      const rawId = typeof rawDream.id === 'string' ? rawDream.id.trim() : '';
      const rawCreatedAt = rawDream.createdAt;
      if (
        !rawId ||
        typeof rawCreatedAt !== 'number' ||
        !Number.isFinite(rawCreatedAt)
      ) {
        addIssue(issues, {
          code: 'invalid-dream-record',
          severity: 'critical',
          repair: 'none',
        });
        continue;
      }

      if (dreamIds.has(rawId)) {
        addIssue(issues, {
          code: 'duplicate-dream-id',
          severity: 'critical',
          repair: 'none',
        });
        continue;
      }
      dreamIds.add(rawId);

      let dream: Dream;
      try {
        dream = sanitizeDream(rawDream as Dream);
      } catch {
        addIssue(issues, {
          code: 'invalid-dream-record',
          severity: 'critical',
          repair: 'none',
        });
        continue;
      }

      if (validateDreamForSave(dream)) {
        addIssue(issues, {
          code: 'invalid-dream-record',
          severity: 'critical',
          repair: 'none',
        });
      }

      if (
        typeof rawDream.sleepDate === 'string' &&
        rawDream.sleepDate.trim() &&
        !isValidSleepDate(rawDream.sleepDate.trim())
      ) {
        addIssue(issues, {
          code: 'invalid-sleep-date',
          severity: 'info',
          repair: 'automatic',
        });
      }

      if (
        rawDream.transcriptStatus === 'processing' &&
        typeof rawDream.transcriptUpdatedAt === 'number' &&
        now - rawDream.transcriptUpdatedAt > STALE_TRANSCRIPT_PROCESSING_MS
      ) {
        addIssue(issues, {
          code: 'stale-transcript-processing',
          severity: 'warning',
          repair: 'automatic',
        });
        plan.staleTranscriptIds.add(rawId);
      }

      if (dream.audioUri?.trim() && !(await audioExists(dream.audioUri))) {
        if (dream.title?.trim() || dream.text?.trim()) {
          addIssue(issues, {
            code: 'missing-dream-audio',
            severity: 'warning',
            repair: 'automatic',
          });
          plan.clearDreamAudioIds.add(rawId);
        } else {
          addIssue(issues, {
            code: 'missing-audio-only-dream',
            severity: 'critical',
            repair: 'manual',
          });
        }
      }

      plan.dreams.push(dream);
    }
  }

  let draftCount: number | null = 0;
  const rawDraft = parseJsonValue(DREAM_DRAFT_STORAGE_KEY);
  if (rawDraft.status === 'unreadable') {
    addIssue(issues, {
      code: 'draft-store-unreadable',
      severity: 'warning',
      repair: 'none',
    });
    draftCount = null;
  } else if (rawDraft.status === 'readable') {
    if (!isRecord(rawDraft.parsed)) {
      addIssue(issues, {
        code: 'draft-store-unreadable',
        severity: 'warning',
        repair: 'none',
      });
      draftCount = null;
    } else {
      draftCount = 1;
      const draft = getDreamDraft();
      if (draft?.audioUri && !(await audioExists(draft.audioUri))) {
        if (hasDraftContentWithoutAudio(draft)) {
          addIssue(issues, {
            code: 'missing-draft-audio',
            severity: 'warning',
            repair: 'automatic',
          });
          plan.clearCreateDraftAudio = true;
        } else {
          addIssue(issues, {
            code: 'missing-audio-only-draft',
            severity: 'critical',
            repair: 'manual',
          });
        }
      }
    }
  }

  let editDraftCount = 0;
  const editDraftKeys = kv
    .getAllKeys()
    .filter(key => key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX));
  for (const key of editDraftKeys) {
    editDraftCount += 1;
    const dreamId = key.slice(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX.length);
    const raw = parseJsonValue(key);
    if (raw.status !== 'readable' || !isRecord(raw.parsed)) {
      addIssue(issues, {
        code: 'edit-draft-unreadable',
        severity: 'warning',
        repair: 'none',
      });
      continue;
    }

    if (!dreamIds.has(dreamId)) {
      addIssue(issues, {
        code: 'orphan-edit-draft',
        severity: 'info',
        repair: 'automatic',
      });
      plan.orphanEditDraftIds.add(dreamId);
      continue;
    }

    const draft = getDreamEditDraft(dreamId);
    if (draft?.audioUri && !(await audioExists(draft.audioUri))) {
      if (hasDraftContentWithoutAudio(draft)) {
        addIssue(issues, {
          code: 'missing-edit-draft-audio',
          severity: 'warning',
          repair: 'automatic',
        });
        plan.clearEditDraftAudioIds.add(dreamId);
      } else {
        addIssue(issues, {
          code: 'missing-audio-only-edit-draft',
          severity: 'critical',
          repair: 'manual',
        });
      }
    }
  }

  let tombstoneCount: number | null = 0;
  const rawTombstones = parseJsonValue(DREAM_DELETION_TOMBSTONES_STORAGE_KEY);
  if (
    rawTombstones.status === 'unreadable' ||
    (rawTombstones.status === 'readable' &&
      !Array.isArray(rawTombstones.parsed))
  ) {
    addIssue(issues, {
      code: 'tombstone-store-unreadable',
      severity: 'critical',
      repair: 'none',
    });
    tombstoneCount = null;
  } else if (
    rawTombstones.status === 'readable' &&
    Array.isArray(rawTombstones.parsed)
  ) {
    tombstoneCount = rawTombstones.parsed.length;
    const seenTombstones = new Set<string>();
    for (const rawTombstone of rawTombstones.parsed) {
      if (!isRecord(rawTombstone) || typeof rawTombstone.dreamId !== 'string') {
        addIssue(issues, {
          code: 'tombstone-store-unreadable',
          severity: 'critical',
          repair: 'none',
        });
        continue;
      }
      const dreamId = rawTombstone.dreamId;
      if (seenTombstones.has(dreamId)) {
        addIssue(issues, {
          code: 'duplicate-tombstone',
          severity: 'warning',
          repair: 'automatic',
        });
        plan.deduplicateTombstones = true;
      }
      seenTombstones.add(dreamId);
      if (dreamIds.has(dreamId)) {
        addIssue(issues, {
          code: 'tombstone-conflict',
          severity: 'warning',
          repair: 'automatic',
        });
        plan.tombstoneConflictIds.add(dreamId);
      }
    }
  }

  return {
    plan,
    snapshot: buildSnapshot(issues, {
      scannedAt: now,
      dreamCount,
      draftCount,
      editDraftCount,
      tombstoneCount,
    }),
  };
}

function readHistory(): ArchiveHealthHistoryEntry[] {
  const raw = kv.getString(ARCHIVE_HEALTH_HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ArchiveHealthHistoryEntry[];
    return Array.isArray(parsed)
      ? parsed
          .filter(entry => entry && typeof entry.at === 'number')
          .slice(0, ARCHIVE_HEALTH_HISTORY_LIMIT)
      : [];
  } catch (error) {
    reportStorageReadFailure(ARCHIVE_HEALTH_HISTORY_STORAGE_KEY, error);
    return [];
  }
}

function appendHistory(entry: ArchiveHealthHistoryEntry) {
  const next = [entry, ...readHistory()].slice(0, ARCHIVE_HEALTH_HISTORY_LIMIT);
  kv.set(ARCHIVE_HEALTH_HISTORY_STORAGE_KEY, JSON.stringify(next));
}

function historyId(kind: ArchiveHealthHistoryEntry['kind'], at: number) {
  return `${kind}:${at}:${Math.random().toString(36).slice(2, 8)}`;
}

export function getArchiveHealthHistory() {
  return readHistory();
}

export async function scanArchiveHealth(options: { record?: boolean } = {}) {
  const result = await scanInternal();
  observability.trackEvent('archive_health_scanned', {
    status: result.snapshot.status,
    issue_count: result.snapshot.issueCount,
    repairable_issue_count: result.snapshot.repairableIssueCount,
    critical_count: result.snapshot.criticalCount,
  });

  if (options.record) {
    appendHistory({
      id: historyId('scan', result.snapshot.scannedAt),
      kind: 'scan',
      at: result.snapshot.scannedAt,
      status: result.snapshot.status,
      issueCount: result.snapshot.issueCount,
      repairedIssueCount: 0,
      checkpointCreated: false,
    });
  }

  return result.snapshot;
}

function clearAudioUri<T extends { audioUri?: string }>(input: T): T {
  const next = { ...input };
  delete next.audioUri;
  return next;
}

export async function repairArchiveHealth(): Promise<ArchiveRepairResult> {
  const before = await scanInternal();
  if (before.snapshot.criticalCount > 0) {
    const at = Date.now();
    appendHistory({
      id: historyId('repair', at),
      kind: 'repair',
      at,
      status: 'blocked',
      issueCount: before.snapshot.issueCount,
      repairedIssueCount: 0,
      checkpointCreated: false,
    });
    return {
      status: 'blocked',
      reason: 'critical-issues',
      repairedIssueCount: 0,
      checkpointFilePath: null,
      snapshot: before.snapshot,
    };
  }

  if (before.snapshot.repairableIssueCount === 0) {
    return {
      status: 'blocked',
      reason: 'nothing-to-repair',
      repairedIssueCount: 0,
      checkpointFilePath: null,
      snapshot: before.snapshot,
    };
  }

  let checkpointFilePath: string | null = null;
  try {
    const transaction = await runLocalDataTransaction(
      { label: 'archive-health-repair', checkpointPolicy: 'required' },
      async () => {
        const current = await scanInternal();
        if (current.snapshot.criticalCount > 0) {
          throw new Error('Archive changed and now contains critical issues.');
        }

        let repairedIssueCount = 0;
        const plan = current.plan;
        const shouldRewriteDreams =
          plan.clearDreamAudioIds.size > 0 ||
          plan.staleTranscriptIds.size > 0 ||
          current.snapshot.issues.some(
            issue => issue.code === 'invalid-sleep-date',
          );

        if (shouldRewriteDreams) {
          const nextDreams = plan.dreams.map(dream => {
            let next = { ...dream };
            if (plan.clearDreamAudioIds.has(dream.id)) {
              next = clearAudioUri(next);
              repairedIssueCount += 1;
            }
            if (plan.staleTranscriptIds.has(dream.id)) {
              next.transcriptStatus = 'error';
              next.transcriptUpdatedAt = Date.now();
              repairedIssueCount += 1;
            }
            return next;
          });
          const invalidDateCount = current.snapshot.issues.find(
            issue => issue.code === 'invalid-sleep-date',
          )?.count;
          repairedIssueCount += invalidDateCount ?? 0;
          replaceAllDreams(nextDreams);
        }

        if (plan.clearCreateDraftAudio) {
          const draft = getDreamDraft();
          if (draft) {
            saveDreamDraft(clearAudioUri(draft));
            repairedIssueCount += 1;
          }
        }

        for (const dreamId of plan.clearEditDraftAudioIds) {
          const draft = getDreamEditDraft(dreamId);
          if (draft) {
            saveDreamEditDraft(dreamId, clearAudioUri(draft));
            repairedIssueCount += 1;
          }
        }

        for (const dreamId of plan.orphanEditDraftIds) {
          clearDreamEditDraft(dreamId);
          repairedIssueCount += 1;
        }

        for (const dreamId of plan.tombstoneConflictIds) {
          clearDreamDeletionTombstone(dreamId);
          repairedIssueCount += 1;
        }

        if (plan.deduplicateTombstones) {
          const tombstones = listDreamDeletionTombstones();
          const unique = new Map(
            tombstones.map(
              tombstone => [tombstone.dreamId, tombstone] as const,
            ),
          );
          const deduplicated = Array.from(unique.values());
          replaceAllDreamDeletionTombstones(deduplicated);
          repairedIssueCount += Math.max(
            0,
            tombstones.length - deduplicated.length,
          );
        }

        return repairedIssueCount;
      },
    );
    checkpointFilePath = transaction.checkpointFilePath;
    const snapshot = await scanArchiveHealth();
    const at = Date.now();
    appendHistory({
      id: historyId('repair', at),
      kind: 'repair',
      at,
      status: snapshot.status,
      issueCount: snapshot.issueCount,
      repairedIssueCount: transaction.value,
      checkpointCreated: Boolean(checkpointFilePath),
    });
    observability.trackEvent('archive_health_repaired', {
      repaired_issue_count: transaction.value,
      remaining_issue_count: snapshot.issueCount,
      checkpoint_created: Boolean(checkpointFilePath),
    });
    return {
      status: 'completed',
      repairedIssueCount: transaction.value,
      checkpointFilePath,
      snapshot,
    };
  } catch (error) {
    if (error instanceof LocalDataTransactionError) {
      checkpointFilePath = error.checkpointFilePath;
    }
    reportActionError('archive_health.repair', error);
    const snapshot = await scanArchiveHealth();
    const at = Date.now();
    appendHistory({
      id: historyId('repair', at),
      kind: 'repair',
      at,
      status: 'failed',
      issueCount: snapshot.issueCount,
      repairedIssueCount: 0,
      checkpointCreated: Boolean(checkpointFilePath),
    });
    return {
      status: 'failed',
      repairedIssueCount: 0,
      checkpointFilePath,
      snapshot,
    };
  }
}
