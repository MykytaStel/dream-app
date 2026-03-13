import React from 'react';
import { type AppLocale } from '../../../i18n/types';
import { type getStatsCopy } from '../../../constants/copy/stats';
import { type Dream } from '../../dreams/model/dream';
import { getRecurringReflectionSignals, getRecurringWordSignals } from '../model/dreamReflection';
import { buildSavedDreamThreadShelfItems } from '../model/dreamThread';
import {
  createReflectionPatternItems,
  createWordPatternItems,
  type PatternGroupKey,
} from '../model/statsScreenModel';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { type PatternGroupCardItem } from '../components/PatternGroupCard';

type StatsCopy = ReturnType<typeof getStatsCopy>;

export function useStatsThreadsContent(args: {
  copy: StatsCopy;
  locale: AppLocale;
  scopedDreams: Dream[];
  savedThreadRecords: Array<{
    signal: string;
    kind: 'word' | 'theme' | 'symbol';
    savedAt: number;
  }>;
  openPatternDetail: (signal: string, kind: PatternDetailKind) => void;
  isOverviewMode: boolean;
  isThreadsMode: boolean;
}) {
  const {
    copy,
    locale,
    scopedDreams,
    savedThreadRecords,
    openPatternDetail,
    isOverviewMode,
    isThreadsMode,
  } = args;
  const recurringThemes = React.useMemo(
    () =>
      isOverviewMode || isThreadsMode
        ? getRecurringReflectionSignals(scopedDreams, { limit: 6 })
        : [],
    [isOverviewMode, isThreadsMode, scopedDreams],
  );
  const recurringSymbols = React.useMemo(
    () =>
      isThreadsMode
        ? getRecurringReflectionSignals(scopedDreams, {
            limit: 6,
            transcriptOnly: true,
          })
        : [],
    [isThreadsMode, scopedDreams],
  );
  const recurringWords = React.useMemo(
    () => ((isOverviewMode || isThreadsMode) ? getRecurringWordSignals(scopedDreams, 6) : []),
    [isOverviewMode, isThreadsMode, scopedDreams],
  );

  const patternGroups = React.useMemo<
    Array<{
      key: PatternGroupKey;
      label: string;
      description: string;
      values: PatternGroupCardItem[];
      empty: string;
    }>
  >(
    () =>
      !isThreadsMode
        ? []
        : [
            {
              key: 'themes',
              label: copy.recurringThemes,
              description: copy.recurringThemesDescription,
              values: createReflectionPatternItems(
                recurringThemes,
                locale,
                'theme',
                copy,
                openPatternDetail,
              ),
              empty: copy.recurringThemesEmpty,
            },
            {
              key: 'words',
              label: copy.recurringWords,
              description: copy.recurringWordsDescription,
              values: createWordPatternItems(recurringWords, locale, openPatternDetail),
              empty: copy.recurringWordsEmpty,
            },
            {
              key: 'symbols',
              label: copy.recurringSymbols,
              description: copy.recurringSymbolsDescription,
              values: createReflectionPatternItems(
                recurringSymbols,
                locale,
                'symbol',
                copy,
                openPatternDetail,
              ),
              empty: copy.recurringSymbolsEmpty,
            },
          ],
    [
      copy,
      isThreadsMode,
      locale,
      openPatternDetail,
      recurringSymbols,
      recurringThemes,
      recurringWords,
    ],
  );
  const savedThreadItems = React.useMemo(
    () =>
      isThreadsMode
        ? buildSavedDreamThreadShelfItems({
            records: savedThreadRecords,
            dreams: scopedDreams,
            statsCopy: copy,
          })
        : [],
    [copy, isThreadsMode, savedThreadRecords, scopedDreams],
  );

  return {
    patternGroups,
    savedThreadItems,
  };
}
