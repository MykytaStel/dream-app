import {
  MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY,
  PINNED_DREAM_THREADS_STORAGE_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
} from '../keys';
import { kv } from '../mmkv';

type LegacySavedMonthRecord = {
  monthKey: string;
  savedAt: number;
};

type LegacySavedThreadRecord = {
  signal: string;
  kind: 'word' | 'theme' | 'symbol';
  savedAt: number;
};

function normalizeLegacySavedMonthRecord(
  value: unknown,
): LegacySavedMonthRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.monthKey !== 'string' || !record.monthKey.trim()) {
    return null;
  }

  return {
    monthKey: record.monthKey,
    savedAt:
      typeof record.savedAt === 'number' && Number.isFinite(record.savedAt)
        ? record.savedAt
        : Date.now(),
  };
}

function normalizeLegacySavedThreadRecord(
  value: unknown,
): LegacySavedThreadRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.signal !== 'string' || !record.signal.trim()) {
    return null;
  }

  if (
    record.kind !== 'word' &&
    record.kind !== 'theme' &&
    record.kind !== 'symbol'
  ) {
    return null;
  }

  return {
    signal: record.signal.trim(),
    kind: record.kind,
    savedAt:
      typeof record.savedAt === 'number' && Number.isFinite(record.savedAt)
        ? record.savedAt
        : Date.now(),
  };
}

export function migrateReviewSavedStateToV9() {
  const existingRaw = kv.getString(REVIEW_SAVED_STATE_STORAGE_KEY);
  if (existingRaw) {
    return;
  }

  let savedMonths: LegacySavedMonthRecord[] = [];
  let savedThreads: LegacySavedThreadRecord[] = [];

  const rawMonths = kv.getString(MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY);
  if (rawMonths) {
    try {
      const parsed = JSON.parse(rawMonths) as unknown[];
      savedMonths = Array.isArray(parsed)
        ? parsed
            .map(normalizeLegacySavedMonthRecord)
            .filter((item): item is LegacySavedMonthRecord => Boolean(item))
        : [];
    } catch {
      savedMonths = [];
    }
  }

  const rawThreads = kv.getString(PINNED_DREAM_THREADS_STORAGE_KEY);
  if (rawThreads) {
    try {
      const parsed = JSON.parse(rawThreads) as unknown[];
      savedThreads = Array.isArray(parsed)
        ? parsed
            .map(normalizeLegacySavedThreadRecord)
            .filter((item): item is LegacySavedThreadRecord => Boolean(item))
        : [];
    } catch {
      savedThreads = [];
    }
  }

  if (!savedMonths.length && !savedThreads.length) {
    return;
  }

  kv.set(
    REVIEW_SAVED_STATE_STORAGE_KEY,
    JSON.stringify({
      updatedAt: Date.now(),
      savedMonths,
      savedThreads,
      syncStatus: 'local',
    }),
  );
}
