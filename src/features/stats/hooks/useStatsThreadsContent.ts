import React from 'react';
import { type AppLocale } from '../../../i18n/types';
import { type getStatsCopy } from '../../../constants/copy/stats';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { type Dream } from '../../dreams/model/dream';
import { getRecurringReflectionSignals, getRecurringWordSignals } from '../model/dreamReflection';
import {
  buildReflectionRecurringDashboardItems,
  buildSavedDreamThreadShelfItems,
  buildWordRecurringDashboardItems,
  type RecurringSignalDashboardItem,
} from '../model/dreamThread';
import { type PatternDetailKind } from '../../../app/navigation/routes';

type StatsCopy = ReturnType<typeof getStatsCopy>;
const RECURRING_GROUP_LIMIT = 4;

export function useStatsThreadsContent(args: {
  copy: StatsCopy;
  dreamCopy: DreamCopy;
  locale: AppLocale;
  scopedDreams: Dream[];
  savedThreadRecords: Array<{
    signal: string;
    kind: 'word' | 'theme' | 'symbol';
    savedAt: number;
  }>;
  isThreadsMode: boolean;
}) {
  const {
    copy,
    dreamCopy,
    locale,
    scopedDreams,
    savedThreadRecords,
    isThreadsMode,
  } = args;
  const recurringThemes = React.useMemo(
    () =>
      isThreadsMode
        ? getRecurringReflectionSignals(scopedDreams, { limit: RECURRING_GROUP_LIMIT })
        : [],
    [isThreadsMode, scopedDreams],
  );
  const recurringSymbols = React.useMemo(
    () =>
      isThreadsMode
        ? getRecurringReflectionSignals(scopedDreams, {
            limit: RECURRING_GROUP_LIMIT,
            transcriptOnly: true,
          })
        : [],
    [isThreadsMode, scopedDreams],
  );
  const recurringWords = React.useMemo(
    () => (isThreadsMode ? getRecurringWordSignals(scopedDreams, RECURRING_GROUP_LIMIT) : []),
    [isThreadsMode, scopedDreams],
  );

  const patternGroups = React.useMemo<
    Array<{
      key: PatternDetailKind;
      label: string;
      description: string;
      values: RecurringSignalDashboardItem[];
      empty: string;
    }>
  >(
    () =>
      !isThreadsMode
        ? []
        : [
            {
              key: 'symbol',
              label: copy.recurringSymbols,
              description: copy.recurringSymbolsDescription,
              values: buildReflectionRecurringDashboardItems({
                signals: recurringSymbols,
                kind: 'symbol',
                locale,
                dreams: scopedDreams,
                statsCopy: copy,
                dreamCopy,
              }),
              empty: copy.recurringSymbolsEmpty,
            },
            {
              key: 'theme',
              label: copy.recurringThemes,
              description: copy.recurringThemesDescription,
              values: buildReflectionRecurringDashboardItems({
                signals: recurringThemes,
                kind: 'theme',
                locale,
                dreams: scopedDreams,
                statsCopy: copy,
                dreamCopy,
              }),
              empty: copy.recurringThemesEmpty,
            },
            {
              key: 'word',
              label: copy.recurringWords,
              description: copy.recurringWordsDescription,
              values: buildWordRecurringDashboardItems({
                signals: recurringWords,
                locale,
                dreams: scopedDreams,
                statsCopy: copy,
                dreamCopy,
              }),
              empty: copy.recurringWordsEmpty,
            },
          ],
    [
      copy,
      dreamCopy,
      isThreadsMode,
      locale,
      recurringSymbols,
      recurringThemes,
      recurringWords,
      scopedDreams,
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
