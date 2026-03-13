import type { Dream } from '../../dreams/model/dream';
import {
  getStoredReviewStateSnapshot,
  updateSavedReviewState,
  type SavedMonthlyReportRecord,
} from './reviewStateStorageService';

type MonthlyReportShelfRecord = SavedMonthlyReportRecord;

export function getSavedMonthlyReportMonths() {
  return getStoredReviewStateSnapshot().savedMonths;
}

function toLocalDateKey(epoch: number) {
  const date = new Date(epoch);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getDreamMonthKey(dream: Pick<Dream, 'createdAt' | 'sleepDate'>) {
  const dateKey = dream.sleepDate || toLocalDateKey(dream.createdAt);
  return dateKey.slice(0, 7);
}

export function reconcileSavedMonthlyReportMonths(dreams: Dream[]) {
  const current = getSavedMonthlyReportMonths();
  if (!current.length) {
    return current;
  }

  const monthKeys = new Set(dreams.map(getDreamMonthKey));
  const seenKeys = new Set<string>();
  const next = current.filter(record => {
    if (!record.monthKey.trim() || seenKeys.has(record.monthKey)) {
      return false;
    }

    seenKeys.add(record.monthKey);
    return monthKeys.has(record.monthKey);
  });

  const changed =
    next.length !== current.length ||
    next.some((record, index) => {
      const previous = current[index];
      return !previous || record.monthKey !== previous.monthKey || record.savedAt !== previous.savedAt;
    });

  if (changed) {
    updateSavedReviewState(currentState => ({
      ...currentState,
      updatedAt: Date.now(),
      savedMonths: next.slice(0, 12),
      syncStatus: 'local',
      syncError: undefined,
    }));
  }

  return next;
}

export function toggleSavedMonthlyReportMonth(monthKey: string) {
  const current = getSavedMonthlyReportMonths();
  const existing = current.find(item => item.monthKey === monthKey);

  if (existing) {
    const next = current.filter(item => item.monthKey !== monthKey);
    updateSavedReviewState(currentState => ({
      ...currentState,
      updatedAt: Date.now(),
      savedMonths: next,
      syncStatus: 'local',
      syncError: undefined,
    }));
    return next;
  }

  const nextRecord: MonthlyReportShelfRecord = {
    monthKey,
    savedAt: Date.now(),
  };
  const next = [nextRecord, ...current.filter(item => item.monthKey !== monthKey)];
  updateSavedReviewState(currentState => ({
    ...currentState,
    updatedAt: Date.now(),
    savedMonths: next.slice(0, 12),
    syncStatus: 'local',
    syncError: undefined,
  }));
  return next;
}

export function isMonthlyReportMonthSaved(monthKey: string) {
  return getSavedMonthlyReportMonths().some(item => item.monthKey === monthKey);
}
