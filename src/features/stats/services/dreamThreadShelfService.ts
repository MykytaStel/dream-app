import type { Dream } from '../../dreams/model/dream';
import type { PatternDetailKind } from '../../../app/navigation/routes';
import { PINNED_DREAM_THREADS_STORAGE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import {
  getPatternDreamMatches,
  normalizePatternSignal,
} from '../model/patternMatches';

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
  return (
    leftKind === rightKind &&
    normalizePatternSignal(leftSignal) === normalizePatternSignal(rightSignal)
  );
}

function buildSavedThreadKey(signal: string, kind: PatternDetailKind) {
  return `${kind}:${normalizePatternSignal(signal)}`;
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

export function reconcileSavedDreamThreads(dreams: Dream[]) {
  const current = getSavedDreamThreads();
  if (!current.length) {
    return current;
  }

  const seenKeys = new Set<string>();
  const matchesCache = new Map<string, ReturnType<typeof getPatternDreamMatches>>();
  const next = current.filter(record => {
    const key = buildSavedThreadKey(record.signal, record.kind);

    if (!normalizePatternSignal(record.signal) || seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);

    const matches =
      matchesCache.get(key) ?? getPatternDreamMatches(dreams, record.signal, record.kind);
    matchesCache.set(key, matches);

    return matches.length > 0;
  });

  const changed =
    next.length !== current.length ||
    next.some((record, index) => {
      const previous = current[index];
      return (
        !previous ||
        record.signal !== previous.signal ||
        record.kind !== previous.kind ||
        record.savedAt !== previous.savedAt
      );
    });

  if (changed) {
    persistSavedDreamThreads(next);
  }

  return next;
}

export function toggleSavedDreamThread(signal: string, kind: PatternDetailKind) {
  const trimmedSignal = signal.trim();
  if (!trimmedSignal) {
    return getSavedDreamThreads();
  }

  const current = getSavedDreamThreads();
  const existing = current.find(item =>
    areSameSavedThread(item.signal, item.kind, trimmedSignal, kind),
  );

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
