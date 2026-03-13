import type { Dream } from '../../dreams/model/dream';
import type { PatternDetailKind } from '../../../app/navigation/routes';
import {
  getPatternDreamMatches,
  normalizePatternSignal,
} from '../model/patternMatches';
import {
  getStoredReviewStateSnapshot,
  updateSavedReviewState,
  type SavedDreamThreadRecord,
} from './reviewStateStorageService';

export type { SavedDreamThreadRecord } from './reviewStateStorageService';

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
  return getStoredReviewStateSnapshot().savedThreads;
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
    updateSavedReviewState(currentState => ({
      ...currentState,
      updatedAt: Date.now(),
      savedThreads: next.slice(0, 12),
      syncStatus: 'local',
      syncError: undefined,
    }));
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
    updateSavedReviewState(currentState => ({
      ...currentState,
      updatedAt: Date.now(),
      savedThreads: next,
      syncStatus: 'local',
      syncError: undefined,
    }));
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
  updateSavedReviewState(currentState => ({
    ...currentState,
    updatedAt: Date.now(),
    savedThreads: next.slice(0, 12),
    syncStatus: 'local',
    syncError: undefined,
  }));
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
