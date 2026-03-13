import type { Dream } from '../../dreams/model/dream';
import {
  getSavedDreamThreads,
  reconcileSavedDreamThreads,
} from './dreamThreadShelfService';
import {
  getSavedMonthlyReportMonths,
  reconcileSavedMonthlyReportMonths,
} from './monthlyReportShelfService';
import {
  getStoredReviewStateSnapshot,
  type SavedReviewStateSnapshot,
} from './reviewStateStorageService';

export type { SavedReviewStateSnapshot } from './reviewStateStorageService';

export function getDerivedReviewStateSnapshot(): SavedReviewStateSnapshot {
  const snapshot = getStoredReviewStateSnapshot();
  return {
    ...snapshot,
    savedMonths: getSavedMonthlyReportMonths(),
    savedThreads: getSavedDreamThreads(),
  };
}

export function reconcileDerivedReviewState(dreams: Dream[]): SavedReviewStateSnapshot {
  reconcileSavedMonthlyReportMonths(dreams);
  reconcileSavedDreamThreads(dreams);
  return getStoredReviewStateSnapshot();
}
