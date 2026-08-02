import React from 'react';
import { buildSavedDreamThreadShelfItems } from '../model/dreamThread';
import { buildSavedMonthlyReviewItems } from '../model/statsScreenModel';
import {
  buildReviewWorkspaceImportantDreamItems,
  buildReviewWorkspaceSavedSetItems,
} from '../model/reviewWorkspace';
import type { StatsCopy } from '../../../constants/copy/stats';
import type { AppLocale } from '../../../i18n/types';
import type { Dream } from '../../dreams/model/dream';

/**
 * The four shelves of things the reader has kept: months, threads, important
 * dreams, saved sets.
 *
 * One cluster, four memos, and the same guard on every one — outside overview
 * mode there is nothing to build. They came out together because they answer
 * the same question about the same inputs, which is the only honest reason to
 * group anything.
 */

export function useSavedShelves({
  copy,
  locale,
  dreams,
  savedMonths,
  savedThreadRecords,
  wakeEmotionLabels,
  isOverviewMode,
}: {
  copy: StatsCopy;
  locale: AppLocale;
  dreams: Dream[];
  savedMonths: Array<{ monthKey: string; savedAt: number }>;
  savedThreadRecords: Array<{
    signal: string;
    kind: 'word' | 'theme' | 'symbol';
    savedAt: number;
  }>;
  wakeEmotionLabels: Record<string, string>;
  isOverviewMode: boolean;
}) {
  const savedMonthItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : buildSavedMonthlyReviewItems({
            savedMonthKeys: savedMonths.map(item => item.monthKey),
            dreams,
            locale,
            copy,
            wakeEmotionLabels,
          }),
    [copy, dreams, isOverviewMode, locale, savedMonths, wakeEmotionLabels],
  );
  const savedOverviewThreadItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : buildSavedDreamThreadShelfItems({
            records: savedThreadRecords,
            dreams,
            statsCopy: copy,
          }),
    [copy, dreams, isOverviewMode, savedThreadRecords],
  );
  const importantDreamItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : buildReviewWorkspaceImportantDreamItems({
            dreams,
            locale,
            copy,
          }),
    [copy, dreams, isOverviewMode, locale],
  );
  const savedSetItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : buildReviewWorkspaceSavedSetItems({
            savedMonths,
            savedThreads: savedThreadRecords,
            dreams,
            locale,
            copy,
            wakeEmotionLabels,
          }),
    [
      copy,
      dreams,
      isOverviewMode,
      locale,
      savedMonths,
      savedThreadRecords,
      wakeEmotionLabels,
    ],
  );

  return {
    savedMonthItems,
    savedOverviewThreadItems,
    importantDreamItems,
    savedSetItems,
  };
}
