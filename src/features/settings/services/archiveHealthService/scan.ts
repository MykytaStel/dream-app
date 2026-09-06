import RNFS from 'react-native-fs';
import { observability } from '../../../../services/observability';
import { DIAG_EVENTS } from '../../../../services/observability/events';
import { reportStorageReadFailure } from '../../../../services/observability/errorReporting';
import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAMS_STORAGE_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../../../../services/storage/keys';
import { kv } from '../../../../services/storage/mmkv';
import type { Dream } from '../../../dreams/model/dream';
import {
  isValidSleepDate,
  sanitizeDream,
  validateDreamForSave,
} from '../../../dreams/model/dreamRules';
import {
  inspectDreamDerivedData,
  type DreamDerivedStoreStatus,
} from '../../../dreams/repository/dreamDerivedDataRepository';
import {
  getDreamDraft,
  getDreamEditDraft,
  type DreamDraft,
} from '../../../dreams/services/dreamDraftService';
import { appendHistory, historyId } from './history';
import {
  DERIVED_ISSUE_CODES,
  STALE_TRANSCRIPT_PROCESSING_MS,
  type ArchiveHealthIssue,
  type ArchiveHealthIssueCode,
  type ArchiveHealthSnapshot,
  type DerivedStoreKind,
  type InternalScan,
  type RecordShape,
  type RepairPlan,
} from './types';

export function isRecord(value: unknown): value is RecordShape {
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

function addDerivedStoreIssue(
  issues: Map<ArchiveHealthIssueCode, ArchiveHealthIssue>,
  kind: DerivedStoreKind,
  status: DreamDerivedStoreStatus,
) {
  if (status === 'current') {
    return;
  }

  const code = `dream-${kind}-${status}` as ArchiveHealthIssueCode;
  addIssue(issues, {
    code,
    severity: status === 'invalid' ? 'warning' : 'info',
    repair: 'automatic',
  });
}

export function isDerivedIssueCode(code: ArchiveHealthIssueCode) {
  return DERIVED_ISSUE_CODES.has(code);
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
    derivedIndexStatus: DreamDerivedStoreStatus | null;
    derivedMetaStatus: DreamDerivedStoreStatus | null;
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
    derivedIndexStatus: input.derivedIndexStatus,
    derivedMetaStatus: input.derivedMetaStatus,
    issueCount,
    repairableIssueCount,
    criticalCount,
    warningCount,
    infoCount,
    issues,
  };
}

export async function scanInternal(now = Date.now()): Promise<InternalScan> {
  const issues = new Map<ArchiveHealthIssueCode, ArchiveHealthIssue>();
  const plan: RepairPlan = {
    dreams: [],
    clearDreamAudioIds: new Set(),
    staleTranscriptIds: new Set(),
    rebuildDerivedData: false,
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

  let derivedIndexStatus: DreamDerivedStoreStatus | null = null;
  let derivedMetaStatus: DreamDerivedStoreStatus | null = null;
  const canInspectDerivedData =
    rawDreams.status === 'readable' &&
    Array.isArray(rawDreams.parsed) &&
    !issues.has('newer-storage-schema') &&
    !issues.has('dream-store-unreadable') &&
    !issues.has('invalid-dream-record') &&
    !issues.has('duplicate-dream-id');

  if (canInspectDerivedData) {
    const derived = inspectDreamDerivedData(plan.dreams);
    derivedIndexStatus = derived.indexStatus;
    derivedMetaStatus = derived.metaStatus;
    addDerivedStoreIssue(issues, 'index', derived.indexStatus);
    addDerivedStoreIssue(issues, 'meta', derived.metaStatus);
    plan.rebuildDerivedData =
      derived.indexStatus !== 'current' || derived.metaStatus !== 'current';
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
      derivedIndexStatus,
      derivedMetaStatus,
    }),
  };
}

export async function scanArchiveHealth(options: { record?: boolean } = {}) {
  const result = await scanInternal();
  const derivedIssueCount = result.snapshot.issues
    .filter(issue => isDerivedIssueCode(issue.code))
    .reduce((sum, issue) => sum + issue.count, 0);

  observability.trackEvent(DIAG_EVENTS.ArchiveHealthScanned, {
    status: result.snapshot.status,
    issue_count: result.snapshot.issueCount,
    repairable_issue_count: result.snapshot.repairableIssueCount,
    critical_count: result.snapshot.criticalCount,
    derived_issue_count: derivedIssueCount,
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
