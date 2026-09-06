import { reportStorageReadFailure } from '../../../../services/observability/errorReporting';
import { ARCHIVE_HEALTH_HISTORY_STORAGE_KEY } from '../../../../services/storage/keys';
import { kv } from '../../../../services/storage/mmkv';
import {
  ARCHIVE_HEALTH_HISTORY_LIMIT,
  type ArchiveHealthHistoryEntry,
} from './types';

export function readHistory(): ArchiveHealthHistoryEntry[] {
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

export function appendHistory(entry: ArchiveHealthHistoryEntry) {
  const next = [entry, ...readHistory()].slice(0, ARCHIVE_HEALTH_HISTORY_LIMIT);
  kv.set(ARCHIVE_HEALTH_HISTORY_STORAGE_KEY, JSON.stringify(next));
}

export function historyId(kind: ArchiveHealthHistoryEntry['kind'], at: number) {
  return `${kind}:${at}:${Math.random().toString(36).slice(2, 8)}`;
}

export function getArchiveHealthHistory() {
  return readHistory();
}
