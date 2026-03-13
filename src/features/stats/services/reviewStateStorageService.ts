import type { PatternDetailKind } from '../../../app/navigation/routes';
import { kv } from '../../../services/storage/mmkv';
import {
  MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY,
  PINNED_DREAM_THREADS_STORAGE_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
} from '../../../services/storage/keys';

export type ReviewStateSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export type SavedMonthlyReportRecord = {
  monthKey: string;
  savedAt: number;
};

export type SavedDreamThreadRecord = {
  signal: string;
  kind: PatternDetailKind;
  savedAt: number;
};

export type SavedReviewStateSnapshot = {
  updatedAt: number;
  savedMonths: SavedMonthlyReportRecord[];
  savedThreads: SavedDreamThreadRecord[];
  syncStatus: ReviewStateSyncStatus;
  lastSyncedAt?: number;
  syncError?: string;
};

type RawReviewStateSnapshot = Partial<SavedReviewStateSnapshot> & {
  savedMonths?: Array<Partial<SavedMonthlyReportRecord>>;
  savedThreads?: Array<Partial<SavedDreamThreadRecord>>;
};

function normalizeSavedMonthRecord(
  value: Partial<SavedMonthlyReportRecord> | null | undefined,
): SavedMonthlyReportRecord | null {
  if (!value?.monthKey || typeof value.monthKey !== 'string') {
    return null;
  }

  return {
    monthKey: value.monthKey,
    savedAt:
      typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
        ? value.savedAt
        : Date.now(),
  };
}

function normalizeSavedThreadRecord(
  value: Partial<SavedDreamThreadRecord> | null | undefined,
): SavedDreamThreadRecord | null {
  if (!value?.signal || typeof value.signal !== 'string') {
    return null;
  }

  if (value.kind !== 'word' && value.kind !== 'theme' && value.kind !== 'symbol') {
    return null;
  }

  return {
    signal: value.signal.trim(),
    kind: value.kind,
    savedAt:
      typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
        ? value.savedAt
        : Date.now(),
  };
}

function normalizeSyncStatus(value: unknown): ReviewStateSyncStatus {
  return value === 'syncing' || value === 'synced' || value === 'error' ? value : 'local';
}

function readLegacySavedMonths() {
  const raw = kv.getString(MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY);
  if (!raw) {
    return [] as SavedMonthlyReportRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<SavedMonthlyReportRecord>>;
    return parsed
      .map(normalizeSavedMonthRecord)
      .filter((item): item is SavedMonthlyReportRecord => Boolean(item))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [] as SavedMonthlyReportRecord[];
  }
}

function readLegacySavedThreads() {
  const raw = kv.getString(PINNED_DREAM_THREADS_STORAGE_KEY);
  if (!raw) {
    return [] as SavedDreamThreadRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<SavedDreamThreadRecord>>;
    return parsed
      .map(normalizeSavedThreadRecord)
      .filter((item): item is SavedDreamThreadRecord => Boolean(item))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [] as SavedDreamThreadRecord[];
  }
}

function createDefaultSnapshot(): SavedReviewStateSnapshot {
  return {
    updatedAt: 0,
    savedMonths: [],
    savedThreads: [],
    syncStatus: 'synced',
  };
}

function persistReviewState(snapshot: SavedReviewStateSnapshot) {
  kv.set(REVIEW_SAVED_STATE_STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

function normalizeSnapshot(raw: RawReviewStateSnapshot): SavedReviewStateSnapshot {
  return {
    updatedAt:
      typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : Date.now(),
    savedMonths: Array.isArray(raw.savedMonths)
      ? raw.savedMonths
          .map(normalizeSavedMonthRecord)
          .filter((item): item is SavedMonthlyReportRecord => Boolean(item))
          .sort((a, b) => b.savedAt - a.savedAt)
      : [],
    savedThreads: Array.isArray(raw.savedThreads)
      ? raw.savedThreads
          .map(normalizeSavedThreadRecord)
          .filter((item): item is SavedDreamThreadRecord => Boolean(item))
          .sort((a, b) => b.savedAt - a.savedAt)
      : [],
    syncStatus: normalizeSyncStatus(raw.syncStatus),
    lastSyncedAt:
      typeof raw.lastSyncedAt === 'number' && Number.isFinite(raw.lastSyncedAt)
        ? raw.lastSyncedAt
        : undefined,
    syncError: typeof raw.syncError === 'string' ? raw.syncError : undefined,
  };
}

export function getStoredReviewStateSnapshot(): SavedReviewStateSnapshot {
  const raw = kv.getString(REVIEW_SAVED_STATE_STORAGE_KEY);
  if (raw) {
    try {
      return normalizeSnapshot(JSON.parse(raw) as RawReviewStateSnapshot);
    } catch {
      return createDefaultSnapshot();
    }
  }

  const legacySavedMonths = readLegacySavedMonths();
  const legacySavedThreads = readLegacySavedThreads();
  if (!legacySavedMonths.length && !legacySavedThreads.length) {
    return createDefaultSnapshot();
  }

  const migrated = normalizeSnapshot({
    updatedAt: Date.now(),
    savedMonths: legacySavedMonths,
    savedThreads: legacySavedThreads,
    syncStatus: 'local',
  });
  persistReviewState(migrated);
  return migrated;
}

export function updateSavedReviewState(
  updater: (current: SavedReviewStateSnapshot) => SavedReviewStateSnapshot,
) {
  const next = normalizeSnapshot(updater(getStoredReviewStateSnapshot()));
  return persistReviewState(next);
}

export function saveSavedReviewStateSnapshot(input: {
  updatedAt?: number;
  savedMonths: SavedMonthlyReportRecord[];
  savedThreads: SavedDreamThreadRecord[];
}) {
  return persistReviewState(
    normalizeSnapshot({
      updatedAt: input.updatedAt ?? Date.now(),
      savedMonths: input.savedMonths,
      savedThreads: input.savedThreads,
      syncStatus: 'local',
    }),
  );
}

export function applyRemoteSavedReviewStateSnapshot(input: {
  updatedAt: number;
  savedMonths: SavedMonthlyReportRecord[];
  savedThreads: SavedDreamThreadRecord[];
  syncedAt?: number;
}) {
  return persistReviewState(
    normalizeSnapshot({
      updatedAt: input.updatedAt,
      savedMonths: input.savedMonths,
      savedThreads: input.savedThreads,
      syncStatus: 'synced',
      lastSyncedAt: input.syncedAt ?? Date.now(),
    }),
  );
}

export function markSavedReviewStateSyncing() {
  return updateSavedReviewState(current => ({
    ...current,
    syncStatus: 'syncing',
    syncError: undefined,
  }));
}

export function markSavedReviewStateSynced(syncedAt = Date.now()) {
  return updateSavedReviewState(current => ({
    ...current,
    syncStatus: 'synced',
    lastSyncedAt: syncedAt,
    syncError: undefined,
  }));
}

export function markSavedReviewStateSyncError(errorMessage?: string) {
  return updateSavedReviewState(current => ({
    ...current,
    syncStatus: 'error',
    syncError: errorMessage?.trim() || 'sync-error',
  }));
}
