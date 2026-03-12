import type { PatternDetailKind } from '../../../app/navigation/routes';
import { PINNED_DREAM_THREADS_STORAGE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import { normalizePatternSignal } from '../model/patternMatches';

export type SavedDreamThreadRecord = {
  signal: string;
  kind: PatternDetailKind;
  savedAt: number;
};

function normalizeRecord(
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

function areSameSavedThread(
  leftSignal: string,
  leftKind: PatternDetailKind,
  rightSignal: string,
  rightKind: PatternDetailKind,
) {
  return leftKind === rightKind && normalizePatternSignal(leftSignal) === normalizePatternSignal(rightSignal);
}

export function getSavedDreamThreads() {
  const raw = kv.getString(PINNED_DREAM_THREADS_STORAGE_KEY);
  if (!raw) {
    return [] as SavedDreamThreadRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<SavedDreamThreadRecord>>;
    return parsed
      .map(normalizeRecord)
      .filter((item): item is SavedDreamThreadRecord => Boolean(item))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [] as SavedDreamThreadRecord[];
  }
}

function persistSavedDreamThreads(records: SavedDreamThreadRecord[]) {
  kv.set(PINNED_DREAM_THREADS_STORAGE_KEY, JSON.stringify(records.slice(0, 12)));
}

export function toggleSavedDreamThread(signal: string, kind: PatternDetailKind) {
  const trimmedSignal = signal.trim();
  if (!trimmedSignal) {
    return getSavedDreamThreads();
  }

  const current = getSavedDreamThreads();
  const existing = current.find(item => areSameSavedThread(item.signal, item.kind, trimmedSignal, kind));

  if (existing) {
    const next = current.filter(
      item => !areSameSavedThread(item.signal, item.kind, trimmedSignal, kind),
    );
    persistSavedDreamThreads(next);
    return next;
  }

  const nextRecord: SavedDreamThreadRecord = {
    signal: trimmedSignal,
    kind,
    savedAt: Date.now(),
  };
  const next = [
    nextRecord,
    ...current.filter(item => !areSameSavedThread(item.signal, item.kind, trimmedSignal, kind)),
  ];
  persistSavedDreamThreads(next);
  return next;
}

export function isDreamThreadSaved(signal: string, kind: PatternDetailKind) {
  const trimmedSignal = signal.trim();
  if (!trimmedSignal) {
    return false;
  }

  return getSavedDreamThreads().some(
    item => areSameSavedThread(item.signal, item.kind, trimmedSignal, kind),
  );
}
