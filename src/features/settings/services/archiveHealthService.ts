import RNFS from 'react-native-fs';
import { kv } from '../../../services/storage/mmkv';
import {
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
} from '../../../services/storage/keys';
import { observability } from '../../../services/observability';
import { reportActionError } from '../../../services/observability/errorReporting';
import type { Dream } from '../../dreams/model/dream';
import { sanitizeDream } from '../../dreams/model/dreamRules';
import {
  listDreams,
  replaceAllDreams,
} from '../../dreams/repository/dreamsRepository';
import { exportDreamDataSnapshot } from './dataExportService';

export type ArchiveHealthSeverity = 'info' | 'warning' | 'critical';
export type ArchiveHealthIssueCode =
  | 'archive-unreadable'
  | 'duplicate-dream-id'
  | 'missing-audio-file'
  | 'stale-transcript-state'
  | 'derived-index-missing'
  | 'derived-index-invalid'
  | 'derived-meta-missing'
  | 'derived-meta-invalid'
  | 'orphan-edit-draft'
  | 'unreadable-edit-draft';

export type ArchiveRepairAction =
  | 'detach-missing-audio'
  | 'normalize-dream-records'
  | 'rebuild-derived-data'
  | 'remove-orphan-edit-drafts';

export type ArchiveHealthIssue = {
  code: ArchiveHealthIssueCode;
  severity: ArchiveHealthSeverity;
  count: number;
  repairAction?: ArchiveRepairAction;
  blocksRepair?: boolean;
};

export type ArchiveHealthSnapshot = {
  status: 'healthy' | 'attention' | 'blocked';
  archiveReadable: boolean;
  dreamCount: number;
  audioReferenceCount: number;
  checkedAudioCount: number;
  issues: ArchiveHealthIssue[];
  repairActions: ArchiveRepairAction[];
  fingerprint: string;
  checkedAt: number;
};

export type ArchiveRepairResult =
  | {
      status: 'completed';
      backupFilePath: string;
      appliedActions: ArchiveRepairAction[];
      detachedAudioCount: number;
      removedDraftCount: number;
      before: ArchiveHealthSnapshot;
      after: ArchiveHealthSnapshot;
    }
  | {
      status: 'blocked';
      reason: 'archive-unreadable' | 'duplicate-dream-id' | 'archive-changed';
      before: ArchiveHealthSnapshot;
    }
  | {
      status: 'failed';
      reason: 'backup-failed' | 'repair-failed';
      before: ArchiveHealthSnapshot;
    };

type ParsedArchive = {
  raw: string | null;
  dreams: Dream[];
  readable: boolean;
  duplicateIdCount: number;
};

function fingerprint(value: string | null) {
  const input = value ?? '';
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${input.length}:${(hash >>> 0).toString(16)}`;
}

function parseArchive(): ParsedArchive {
  const raw = kv.getString(DREAMS_STORAGE_KEY) ?? null;
  if (!raw) {
    return { raw, dreams: [], readable: true, duplicateIdCount: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('dream-store-not-array');
    }

    const dreams = parsed.map(value => sanitizeDream(value as Dream));
    const ids = new Set<string>();
    let duplicateIdCount = 0;
    for (const dream of dreams) {
      if (ids.has(dream.id)) {
        duplicateIdCount += 1;
      } else {
        ids.add(dream.id);
      }
    }

    return { raw, dreams, readable: true, duplicateIdCount };
  } catch (error) {
    reportActionError('archive_health.parse', error);
    return { raw, dreams: [], readable: false, duplicateIdCount: 0 };
  }
}

function isJsonArray(raw: string | undefined) {
  if (!raw) return false;
  try {
    return Array.isArray(JSON.parse(raw));
  } catch {
    return false;
  }
}

function isJsonObject(raw: string | undefined) {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Boolean(parsed) && typeof parsed === 'object' && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

function normalizeAudioPath(uri: string) {
  const trimmed = uri.trim();
  return trimmed.startsWith('file://') ? trimmed.slice('file://'.length) : trimmed;
}

function addIssue(
  issues: ArchiveHealthIssue[],
  issue: ArchiveHealthIssue,
) {
  const existing = issues.find(item => item.code === issue.code);
  if (existing) {
    existing.count += issue.count;
    return;
  }
  issues.push(issue);
}

function hasStaleTranscriptState(dream: Dream) {
  if (dream.transcriptStatus !== 'processing') {
    return false;
  }
  const updatedAt = dream.transcriptUpdatedAt ?? 0;
  return !updatedAt || Date.now() - updatedAt > 15 * 60 * 1000;
}

export async function readArchiveHealth(
  now: number = Date.now(),
): Promise<ArchiveHealthSnapshot> {
  const archive = parseArchive();
  const issues: ArchiveHealthIssue[] = [];

  if (!archive.readable) {
    issues.push({
      code: 'archive-unreadable',
      severity: 'critical',
      count: 1,
      blocksRepair: true,
    });
  }

  if (archive.duplicateIdCount > 0) {
    issues.push({
      code: 'duplicate-dream-id',
      severity: 'critical',
      count: archive.duplicateIdCount,
      blocksRepair: true,
    });
  }

  const staleTranscriptCount = archive.dreams.filter(hasStaleTranscriptState).length;
  if (staleTranscriptCount > 0) {
    issues.push({
      code: 'stale-transcript-state',
      severity: 'warning',
      count: staleTranscriptCount,
      repairAction: 'normalize-dream-records',
    });
  }

  const audioDreams = archive.dreams.filter(dream => Boolean(dream.audioUri?.trim()));
  let checkedAudioCount = 0;
  let missingAudioCount = 0;

  for (const dream of audioDreams) {
    const uri = dream.audioUri?.trim();
    if (!uri) continue;
    checkedAudioCount += 1;
    try {
      if (!(await RNFS.exists(normalizeAudioPath(uri)))) {
        missingAudioCount += 1;
      }
    } catch (error) {
      reportActionError('archive_health.audio_exists', error, {
        operation: 'exists',
      });
    }
  }

  if (missingAudioCount > 0) {
    issues.push({
      code: 'missing-audio-file',
      severity: 'warning',
      count: missingAudioCount,
      repairAction: 'detach-missing-audio',
    });
  }

  const indexRaw = kv.getString(DREAMS_INDEX_STORAGE_KEY);
  if (!indexRaw) {
    issues.push({
      code: 'derived-index-missing',
      severity: 'info',
      count: 1,
      repairAction: 'rebuild-derived-data',
    });
  } else if (!isJsonArray(indexRaw)) {
    issues.push({
      code: 'derived-index-invalid',
      severity: 'warning',
      count: 1,
      repairAction: 'rebuild-derived-data',
    });
  }

  const metaRaw = kv.getString(DREAMS_META_STORAGE_KEY);
  if (!metaRaw) {
    issues.push({
      code: 'derived-meta-missing',
      severity: 'info',
      count: 1,
      repairAction: 'rebuild-derived-data',
    });
  } else if (!isJsonObject(metaRaw)) {
    issues.push({
      code: 'derived-meta-invalid',
      severity: 'warning',
      count: 1,
      repairAction: 'rebuild-derived-data',
    });
  }

  const dreamIds = new Set(archive.dreams.map(dream => dream.id));
  for (const key of kv.getAllKeys()) {
    if (!key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX)) {
      continue;
    }

    const dreamId = key.slice(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX.length);
    const raw = kv.getString(key);
    if (!raw) continue;

    try {
      JSON.parse(raw);
      if (!dreamIds.has(dreamId)) {
        addIssue(issues, {
          code: 'orphan-edit-draft',
          severity: 'info',
          count: 1,
          repairAction: 'remove-orphan-edit-drafts',
        });
      }
    } catch {
      addIssue(issues, {
        code: 'unreadable-edit-draft',
        severity: 'warning',
        count: 1,
        blocksRepair: true,
      });
    }
  }

  const repairActions = Array.from(
    new Set(
      issues
        .map(issue => issue.repairAction)
        .filter((value): value is ArchiveRepairAction => Boolean(value)),
    ),
  );
  const blocked = issues.some(issue => issue.blocksRepair);
  const status = blocked
    ? 'blocked'
    : issues.some(issue => issue.severity !== 'info')
      ? 'attention'
      : issues.length
        ? 'attention'
        : 'healthy';

  const snapshot: ArchiveHealthSnapshot = {
    status,
    archiveReadable: archive.readable,
    dreamCount: archive.dreams.length,
    audioReferenceCount: audioDreams.length,
    checkedAudioCount,
    issues,
    repairActions,
    fingerprint: fingerprint(archive.raw),
    checkedAt: now,
  };

  observability.trackEvent('archive_health_checked', {
    status,
    dream_count: snapshot.dreamCount,
    audio_reference_count: snapshot.audioReferenceCount,
    issue_count: issues.reduce((total, issue) => total + issue.count, 0),
    repair_action_count: repairActions.length,
  });

  return snapshot;
}

function detachMissingAudio(dream: Dream, missingPaths: Set<string>): Dream {
  const uri = dream.audioUri?.trim();
  if (!uri || !missingPaths.has(normalizeAudioPath(uri))) {
    return dream;
  }

  const next: Dream = {
    ...dream,
    updatedAt: Math.max(Date.now(), dream.createdAt),
    syncStatus: 'local',
    transcriptStatus: dream.transcript?.trim() ? 'ready' : 'idle',
  };
  delete next.audioUri;
  if (!dream.transcript?.trim()) {
    delete next.transcriptSource;
    delete next.transcriptUpdatedAt;
  }
  delete next.syncError;
  return sanitizeDream(next);
}

export async function repairArchiveHealth(
  expected: ArchiveHealthSnapshot,
): Promise<ArchiveRepairResult> {
  if (!expected.archiveReadable) {
    return { status: 'blocked', reason: 'archive-unreadable', before: expected };
  }
  if (expected.issues.some(issue => issue.code === 'duplicate-dream-id')) {
    return { status: 'blocked', reason: 'duplicate-dream-id', before: expected };
  }
  if (expected.issues.some(issue => issue.code === 'unreadable-edit-draft')) {
    return { status: 'blocked', reason: 'archive-unreadable', before: expected };
  }

  const currentRaw = kv.getString(DREAMS_STORAGE_KEY) ?? null;
  if (fingerprint(currentRaw) !== expected.fingerprint) {
    return { status: 'blocked', reason: 'archive-changed', before: expected };
  }

  let backupFilePath: string;
  try {
    backupFilePath = (await exportDreamDataSnapshot()).filePath;
  } catch (error) {
    reportActionError('archive_health.backup', error);
    return { status: 'failed', reason: 'backup-failed', before: expected };
  }

  try {
    const current = listDreams();
    const missingPaths = new Set<string>();
    for (const dream of current) {
      const uri = dream.audioUri?.trim();
      if (!uri) continue;
      const path = normalizeAudioPath(uri);
      try {
        if (!(await RNFS.exists(path))) {
          missingPaths.add(path);
        }
      } catch {
        // Unknown existence is not permission to detach the reference.
      }
    }

    const normalized = current.map(dream =>
      detachMissingAudio(sanitizeDream(dream), missingPaths),
    );
    replaceAllDreams(normalized);

    let removedDraftCount = 0;
    const dreamIds = new Set(normalized.map(dream => dream.id));
    for (const key of kv.getAllKeys()) {
      if (!key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX)) continue;
      const dreamId = key.slice(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX.length);
      if (!dreamIds.has(dreamId)) {
        kv.remove(key);
        removedDraftCount += 1;
      }
    }

    const after = await readArchiveHealth();
    const appliedActions = expected.repairActions;
    observability.trackEvent('archive_health_repaired', {
      applied_action_count: appliedActions.length,
      detached_audio_count: missingPaths.size,
      removed_draft_count: removedDraftCount,
      remaining_issue_count: after.issues.reduce(
        (total, issue) => total + issue.count,
        0,
      ),
    });

    return {
      status: 'completed',
      backupFilePath,
      appliedActions,
      detachedAudioCount: missingPaths.size,
      removedDraftCount,
      before: expected,
      after,
    };
  } catch (error) {
    reportActionError('archive_health.repair', error);
    return { status: 'failed', reason: 'repair-failed', before: expected };
  }
}
