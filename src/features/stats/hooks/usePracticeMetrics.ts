import React from 'react';
import {
  formatCoverageValue,
  formatDreamCountLabel,
  formatEntryCountLabel,
} from '../model/statsScreenModel';
import { getDreamDate } from '../../dreams/model/dreamAnalytics';
import type { AppLocale } from '../../../i18n/types';
import type { StatsCopy } from '../../../constants/copy/stats';
import type {
  LucidDreamStats,
  LucidPracticeStats,
  NightmareStats,
} from '../../dreams/model/dreamAnalytics';

/**
 * The two metric groups the overview shows for lucid practice and nightmares.
 *
 * They were the two largest blocks in `useStatsOverviewContent` — a hundred and
 * thirty lines between them, in a file with thirty-eight memos where size alone
 * made them hard to find. Nothing about them changes here; they are lifted
 * whole, and what they need is now written down rather than inferred from a
 * dependency array halfway down the file.
 */

/**
 * The four cadence and recency phrases these metrics use.
 *
 * They lived beside the memos in the old file and are used by nothing else, so
 * they came along rather than becoming a shared helper nobody shares.
 */
function formatNightmareCadence(
  nightmareCount: number,
  totalDreams: number,
  copy: StatsCopy,
) {
  if (!nightmareCount || !totalDreams) {
    return copy.nightmareFrequencyShareEmptyHint;
  }

  const everyDreamCount = Math.max(1, Math.round(totalDreams / nightmareCount));
  return `${copy.nightmareFrequencyShareHintPrefix}${everyDreamCount}${
    copy.nightmareFrequencyShareHintSuffix
  }`;
}

function formatNightmareLatestValue(
  timestamp: number | undefined,
  locale: AppLocale,
  copy: StatsCopy,
) {
  if (typeof timestamp !== 'number') {
    return copy.nightmareFrequencyLatestEmptyValue;
  }

  return new Date(timestamp).toLocaleDateString(
    locale === 'uk' ? 'uk-UA' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
    },
  );
}

function formatLucidCadence(
  lucidCount: number,
  totalDreams: number,
  copy: StatsCopy,
) {
  if (!lucidCount || !totalDreams) {
    return copy.lucidFrequencyShareEmptyHint;
  }

  const everyDreamCount = Math.max(1, Math.round(totalDreams / lucidCount));
  return `${copy.lucidFrequencyShareHintPrefix}${everyDreamCount}${
    copy.lucidFrequencyShareHintSuffix
  }`;
}

function formatInsightLatestValue(
  timestamp: number | undefined,
  locale: AppLocale,
  emptyValue: string,
) {
  if (typeof timestamp !== 'number') {
    return emptyValue;
  }

  return new Date(timestamp).toLocaleDateString(
    locale === 'uk' ? 'uk-UA' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
    },
  );
}

export function usePracticeMetrics({
  copy,
  locale,
  scopedLucidStats,
  scopedLucidPracticeStats,
  scopedNightmareStats,
}: {
  copy: StatsCopy;
  locale: AppLocale;
  scopedLucidStats: LucidDreamStats;
  scopedLucidPracticeStats: LucidPracticeStats;
  scopedNightmareStats: NightmareStats;
}) {
  const lucidMetrics = React.useMemo(
    () => [
      {
        label: copy.lucidFrequencyCountLabel,
        value: formatCoverageValue(
          scopedLucidStats.lucidCount,
          scopedLucidStats.totalDreams,
        ),
        hint:
          scopedLucidStats.lucidCount > 0
            ? copy.lucidFrequencyCountHint
            : copy.lucidFrequencyCountEmptyHint,
      },
      {
        label: copy.lucidFrequencyShareLabel,
        value: `${scopedLucidStats.rate ?? 0}%`,
        hint: formatLucidCadence(
          scopedLucidStats.lucidCount,
          scopedLucidStats.totalDreams,
          copy,
        ),
      },
      {
        label: copy.lucidFrequencyLatestLabel,
        value: formatInsightLatestValue(
          scopedLucidStats.latestLucidDream
            ? getDreamDate(scopedLucidStats.latestLucidDream).getTime()
            : undefined,
          locale,
          copy.lucidFrequencyLatestEmptyValue,
        ),
        hint: scopedLucidStats.latestLucidDream
          ? copy.lucidFrequencyLatestHint
          : copy.lucidFrequencyLatestEmptyHint,
      },
      {
        label: copy.lucidAwareLabel,
        value: String(scopedLucidPracticeStats.awareCount),
        hint: copy.lucidFrequencyCountHint,
      },
      {
        label: copy.lucidControlledLabel,
        value: String(scopedLucidPracticeStats.controlledCount),
        hint: copy.lucidFrequencyCountHint,
      },
      {
        label: copy.lucidTopTechniqueLabel,
        value:
          scopedLucidPracticeStats.byTechnique[0]?.technique ??
          copy.lucidTechniqueEmptyValue,
        hint: scopedLucidPracticeStats.byTechnique[0]?.count
          ? formatDreamCountLabel(
              scopedLucidPracticeStats.byTechnique[0].count,
              locale,
            )
          : copy.lucidFrequencyCountEmptyHint,
      },
      {
        label: copy.lucidDreamSignsLabel,
        value:
          scopedLucidPracticeStats.topDreamSigns[0]?.sign ??
          copy.lucidDreamSignsEmptyValue,
        hint: scopedLucidPracticeStats.topDreamSigns[0]?.count
          ? formatEntryCountLabel(
              scopedLucidPracticeStats.topDreamSigns[0].count,
              locale,
            )
          : copy.lucidFrequencyCountEmptyHint,
      },
    ],
    [copy, locale, scopedLucidPracticeStats, scopedLucidStats],
  );

  const nightmareMetrics = React.useMemo(
    () => [
      {
        label: copy.nightmareFrequencyCountLabel,
        value: formatCoverageValue(
          scopedNightmareStats.nightmareCount,
          scopedNightmareStats.totalDreams,
        ),
        hint:
          scopedNightmareStats.nightmareCount > 0
            ? copy.nightmareFrequencyCountHint
            : copy.nightmareFrequencyCountEmptyHint,
      },
      {
        label: copy.nightmareFrequencyShareLabel,
        value: `${scopedNightmareStats.rate ?? 0}%`,
        hint: formatNightmareCadence(
          scopedNightmareStats.nightmareCount,
          scopedNightmareStats.totalDreams,
          copy,
        ),
      },
      {
        label: copy.nightmareFrequencyLatestLabel,
        value: formatNightmareLatestValue(
          scopedNightmareStats.latestNightmareDream
            ? getDreamDate(scopedNightmareStats.latestNightmareDream).getTime()
            : undefined,
          locale,
          copy,
        ),
        hint: scopedNightmareStats.latestNightmareDream
          ? copy.nightmareFrequencyLatestHint
          : copy.nightmareFrequencyLatestEmptyHint,
      },
      {
        label: copy.nightmareRecurringLabel,
        value: String(scopedNightmareStats.recurringCount),
        hint: copy.nightmareFrequencyCountHint,
      },
      {
        label: copy.nightmareHighDistressLabel,
        value: String(scopedNightmareStats.highDistressCount),
        hint: copy.nightmareFrequencyCountHint,
      },
      {
        label: copy.nightmareRescriptedLabel,
        value: String(scopedNightmareStats.rescriptedCount),
        hint: copy.nightmareFrequencyCountHint,
      },
      {
        label: copy.nightmareDerivedLabel,
        value: String(scopedNightmareStats.derivedCount),
        hint: copy.nightmareDerivedHint,
      },
    ],
    [copy, locale, scopedNightmareStats],
  );

  return { lucidMetrics, nightmareMetrics };
}
