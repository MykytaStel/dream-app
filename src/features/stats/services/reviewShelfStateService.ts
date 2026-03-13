import type { Dream } from '../../dreams/model/dream';
import {
  getSavedDreamThreads,
  reconcileSavedDreamThreads,
  type SavedDreamThreadRecord,
} from './dreamThreadShelfService';
import {
  getSavedMonthlyReportMonths,
  reconcileSavedMonthlyReportMonths,
} from './monthlyReportShelfService';

export type SavedReviewStateSnapshot = {
  savedMonths: ReturnType<typeof getSavedMonthlyReportMonths>;
  savedThreads: SavedDreamThreadRecord[];
};

export function getSavedReviewStateSnapshot(): SavedReviewStateSnapshot {
  return {
    savedMonths: getSavedMonthlyReportMonths(),
    savedThreads: getSavedDreamThreads(),
  };
}

export function reconcileSavedReviewState(dreams: Dream[]): SavedReviewStateSnapshot {
  return {
    savedMonths: reconcileSavedMonthlyReportMonths(dreams),
    savedThreads: reconcileSavedDreamThreads(dreams),
  };
}
