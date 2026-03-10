import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import {
  getDreamPreSleepEmotionLabels,
  getDreamWakeEmotionLabels,
} from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { type AppLocale } from '../../../i18n/types';
import {
  getAverageWords,
  getCurrentStreak,
  getEntriesLastSevenDays,
  getSleepContextStats,
  getTopPreSleepEmotionSignals,
  getTopWakeEmotionSignals,
} from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../model/dreamReflection';
import {
  getDreamAchievementSummary,
  getDreamAchievements,
} from '../model/achievements';
import { getMonthlyReportData, getMonthlyReportMonths } from '../model/monthlyReport';
import {
  buildRecentActivityBars,
  createReflectionPatternItems,
  createWordPatternItems,
  filterDreamsByRange,
  formatDreamCountLabel,
  formatEntryCountLabel,
  formatMonthTitle,
  getAchievementContent,
  getPreviousRangeDreams,
  summarizeScopedDreams,
  type InsightRange,
  type PatternGroupKey,
} from '../model/statsScreenModel';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';
import { type DreamFingerprintFacet } from '../components/DreamFingerprintCard';
import { type PatternGroupCardItem } from '../components/PatternGroupCard';

type StatsCopy = ReturnType<typeof getStatsCopy>;
export type InsightMode = 'snapshot' | 'compare';

type UseStatsScreenControllerArgs = {
  locale: AppLocale;
  copy: StatsCopy;
  openPatternDetail: (signal: string, kind: PatternDetailKind) => void;
};

export function useStatsScreenController({
  locale,
  copy,
  openPatternDetail,
}: UseStatsScreenControllerArgs) {
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const wakeEmotionLabels = React.useMemo(() => getDreamWakeEmotionLabels(locale), [locale]);
  const [dreams, setDreams] = React.useState(() => listDreams());
  const [selectedRange, setSelectedRange] = React.useState<InsightRange>('all');
  const [selectedMode, setSelectedMode] = React.useState<InsightMode>('snapshot');
  const [selectedPatternGroup, setSelectedPatternGroup] =
    React.useState<PatternGroupKey>('themes');
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const startedAt = Date.now();
      const nextDreams = listDreams();
      React.startTransition(() => {
        setDreams(nextDreams);
      });
      trackLocalSurfaceLoad('insights_refresh', startedAt, nextDreams.length);
    }, []),
  );

  const scopedDreams = React.useMemo(
    () => filterDreamsByRange(dreams, selectedRange),
    [dreams, selectedRange],
  );
  const previousScopedDreams = React.useMemo(
    () => getPreviousRangeDreams(dreams, selectedRange),
    [dreams, selectedRange],
  );
  const scopedSummary = React.useMemo(() => summarizeScopedDreams(scopedDreams), [scopedDreams]);
  const previousScopedSummary = React.useMemo(
    () => summarizeScopedDreams(previousScopedDreams),
    [previousScopedDreams],
  );
  const overallStreak = React.useMemo(() => getCurrentStreak(dreams), [dreams]);
  const overallLastSevenDays = React.useMemo(() => getEntriesLastSevenDays(dreams), [dreams]);
  const averageWords = React.useMemo(() => getAverageWords(scopedDreams), [scopedDreams]);
  const sleepContextStats = React.useMemo(() => getSleepContextStats(scopedDreams), [scopedDreams]);
  const wakeEmotionSignals = React.useMemo(
    () => getTopWakeEmotionSignals(scopedDreams, 6),
    [scopedDreams],
  );
  const preSleepEmotionSignals = React.useMemo(
    () => getTopPreSleepEmotionSignals(scopedDreams, 6),
    [scopedDreams],
  );
  const transcriptArchiveStats = React.useMemo(
    () => getTranscriptArchiveStats(scopedDreams),
    [scopedDreams],
  );
  const recurringThemes = React.useMemo(
    () => getRecurringReflectionSignals(scopedDreams, { limit: 6 }),
    [scopedDreams],
  );
  const recurringSymbols = React.useMemo(
    () =>
      getRecurringReflectionSignals(scopedDreams, {
        limit: 6,
        transcriptOnly: true,
      }),
    [scopedDreams],
  );
  const recurringWords = React.useMemo(
    () => getRecurringWordSignals(scopedDreams, 6),
    [scopedDreams],
  );
  const achievements = React.useMemo(() => getDreamAchievements(dreams), [dreams]);
  const achievementSummary = React.useMemo(
    () => getDreamAchievementSummary(achievements),
    [achievements],
  );

  const weeklyGoalTarget = 3;
  const weeklyGoalComplete = overallLastSevenDays >= weeklyGoalTarget;
  const topTheme = recurringThemes[0];
  const topSymbol = recurringSymbols[0];
  const topWord = recurringWords[0];
  const entriesWithoutMood = Math.max(scopedDreams.length - scopedSummary.moodEntries, 0);
  const entriesWithoutContext = Math.max(scopedDreams.length - sleepContextStats.withContext, 0);
  const rangeOptions = React.useMemo(
    () => [
      { key: 'all' as const, label: copy.rangeAll },
      { key: '30d' as const, label: copy.range30Days },
      { key: '7d' as const, label: copy.range7Days },
    ],
    [copy],
  );
  const canCompare = selectedRange !== 'all';
  const compareOptions = React.useMemo(
    () => [
      { key: 'snapshot' as const, label: copy.compareSnapshot, disabled: false },
      { key: 'compare' as const, label: copy.compareMode, disabled: !canCompare },
    ],
    [canCompare, copy],
  );
  const selectedRangeLabel =
    rangeOptions.find(option => option.key === selectedRange)?.label ?? copy.rangeAll;
  const summaryTiles = React.useMemo(
    () => [
      { label: copy.entries, value: scopedDreams.length },
      { label: copy.wordsSaved, value: scopedSummary.totalWords },
      { label: copy.voiceNotes, value: scopedSummary.voiceNotes },
      { label: copy.transcribedDreams, value: scopedSummary.transcribedDreams },
    ],
    [copy, scopedDreams.length, scopedSummary.totalWords, scopedSummary.transcribedDreams, scopedSummary.voiceNotes],
  );
  const heroSummaryTiles = React.useMemo(
    () => [
      {
        label: copy.entries,
        value: scopedDreams.length,
        hint: formatEntryCountLabel(scopedDreams.length, locale),
      },
      {
        label: copy.wordsSaved,
        value: scopedSummary.totalWords,
        hint: `${averageWords} ${copy.averageWordsShort.toLowerCase()}`,
      },
      {
        label: copy.currentStreak,
        value: overallStreak,
        hint: formatEntryCountLabel(overallLastSevenDays, locale),
      },
    ],
    [averageWords, copy, locale, overallLastSevenDays, overallStreak, scopedDreams.length, scopedSummary.totalWords],
  );
  const compareMetrics = React.useMemo(
    () => [
      {
        label: copy.entries,
        current: scopedDreams.length,
        previous: previousScopedDreams.length,
      },
      {
        label: copy.wordsSaved,
        current: scopedSummary.totalWords,
        previous: previousScopedSummary.totalWords,
      },
      {
        label: copy.transcribedDreams,
        current: scopedSummary.transcribedDreams,
        previous: previousScopedSummary.transcribedDreams,
      },
    ],
    [
      copy,
      previousScopedDreams.length,
      previousScopedSummary.totalWords,
      previousScopedSummary.transcribedDreams,
      scopedDreams.length,
      scopedSummary.totalWords,
      scopedSummary.transcribedDreams,
    ],
  );
  const coverageGap =
    [
      { label: copy.takeawayGapAudioOnly, value: transcriptArchiveStats.audioOnly },
      { label: copy.takeawayGapMood, value: entriesWithoutMood },
      { label: copy.takeawayGapContext, value: entriesWithoutContext },
    ].sort((a, b) => b.value - a.value)[0] ?? null;

  const topSignal = React.useMemo(() => {
    if (topTheme && topWord) {
      return topTheme.dreamCount >= topWord.dreamCount
        ? {
            label: topTheme.label,
            hint: `${topTheme.dreamCount} ${copy.reflectionThemeCountLabel}`,
            onPress: () => openPatternDetail(topTheme.label, 'theme'),
          }
        : {
            label: topWord.label,
            hint: `${topWord.dreamCount} ${copy.reflectionThemeCountLabel}`,
            onPress: () => openPatternDetail(topWord.label, 'word'),
          };
    }

    if (topTheme) {
      return {
        label: topTheme.label,
        hint: `${topTheme.dreamCount} ${copy.reflectionThemeCountLabel}`,
        onPress: () => openPatternDetail(topTheme.label, 'theme'),
      };
    }

    if (topWord) {
      return {
        label: topWord.label,
        hint: `${topWord.dreamCount} ${copy.reflectionThemeCountLabel}`,
        onPress: () => openPatternDetail(topWord.label, 'word'),
      };
    }

    return null;
  }, [copy.reflectionThemeCountLabel, openPatternDetail, topTheme, topWord]);

  const fingerprintFacets = React.useMemo<DreamFingerprintFacet[]>(
    () =>
      [
        topTheme
          ? {
              key: 'theme',
              label: copy.fingerprintThemeLabel,
              value: topTheme.label,
              meta: formatDreamCountLabel(topTheme.dreamCount, locale),
              onPress: () => openPatternDetail(topTheme.label, 'theme'),
            }
          : null,
        topSymbol
          ? {
              key: 'symbol',
              label: copy.fingerprintSymbolLabel,
              value: topSymbol.label,
              meta: formatDreamCountLabel(topSymbol.dreamCount, locale),
              onPress: () => openPatternDetail(topSymbol.label, 'symbol'),
            }
          : null,
        wakeEmotionSignals[0]
          ? {
              key: 'wake',
              label: copy.fingerprintWakeLabel,
              value: wakeEmotionLabels[wakeEmotionSignals[0].emotion],
              meta: formatEntryCountLabel(wakeEmotionSignals[0].count, locale),
            }
          : null,
        preSleepEmotionSignals[0]
          ? {
              key: 'pre-sleep',
              label: copy.fingerprintPreSleepLabel,
              value: preSleepEmotionLabels[preSleepEmotionSignals[0].emotion],
              meta: formatEntryCountLabel(preSleepEmotionSignals[0].count, locale),
            }
          : null,
      ].filter((value): value is DreamFingerprintFacet => value !== null),
    [
      copy.fingerprintPreSleepLabel,
      copy.fingerprintSymbolLabel,
      copy.fingerprintThemeLabel,
      copy.fingerprintWakeLabel,
      locale,
      openPatternDetail,
      preSleepEmotionLabels,
      preSleepEmotionSignals,
      topSymbol,
      topTheme,
      wakeEmotionLabels,
      wakeEmotionSignals,
    ],
  );
  const fingerprintLeadSignals = React.useMemo(
    () => fingerprintFacets.slice(0, 3).map(facet => facet.value),
    [fingerprintFacets],
  );
  const monthlyReportMonths = React.useMemo(
    () => getMonthlyReportMonths(dreams, locale === 'uk' ? 'uk-UA' : 'en-US'),
    [dreams, locale],
  );
  const latestMonthlyReport = React.useMemo(
    () => getMonthlyReportData(dreams, monthlyReportMonths[0]?.key),
    [dreams, monthlyReportMonths],
  );
  const latestMonthlyReportTitle = latestMonthlyReport
    ? formatMonthTitle(latestMonthlyReport.month.year, latestMonthlyReport.month.month, locale)
    : null;
  const monthlyReportPreviewSignals = React.useMemo(() => {
    if (!latestMonthlyReport) {
      return [];
    }

    return [
      latestMonthlyReport.topTheme?.label,
      latestMonthlyReport.topSymbol?.label,
      latestMonthlyReport.topWakeEmotion
        ? wakeEmotionLabels[latestMonthlyReport.topWakeEmotion.emotion]
        : null,
    ].filter((value): value is string => Boolean(value));
  }, [latestMonthlyReport, wakeEmotionLabels]);
  const activityBars = React.useMemo(
    () => buildRecentActivityBars(scopedDreams, selectedRange, locale),
    [locale, scopedDreams, selectedRange],
  );
  const coverageItems = React.useMemo(
    () => [
      {
        label: copy.coverageTranscriptsLabel,
        value: scopedSummary.transcribedDreams,
        total: scopedDreams.length,
        hint: copy.coverageTranscriptsHint,
      },
      {
        label: copy.coverageTagsLabel,
        value: scopedSummary.taggedEntries,
        total: scopedDreams.length,
        hint: copy.coverageTagsHint,
      },
      {
        label: copy.coverageContextLabel,
        value: sleepContextStats.withContext,
        total: scopedDreams.length,
        hint: copy.coverageContextHint,
      },
    ],
    [copy, scopedDreams.length, scopedSummary.taggedEntries, scopedSummary.transcribedDreams, sleepContextStats.withContext],
  );
  const attentionItems = React.useMemo(
    () => [
      {
        label: copy.attentionAudioLabel,
        value: transcriptArchiveStats.audioOnly,
        hint:
          transcriptArchiveStats.audioOnly > 0
            ? copy.attentionAudioHint
            : copy.attentionAllSetHint,
      },
      {
        label: copy.attentionMoodLabel,
        value: entriesWithoutMood,
        hint: entriesWithoutMood > 0 ? copy.attentionMoodHint : copy.attentionAllSetHint,
      },
      {
        label: copy.attentionContextLabel,
        value: entriesWithoutContext,
        hint:
          entriesWithoutContext > 0 ? copy.attentionContextHint : copy.attentionAllSetHint,
      },
    ],
    [copy, entriesWithoutContext, entriesWithoutMood, transcriptArchiveStats.audioOnly],
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
    () => [
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
      {
        key: 'pre-sleep',
        label: copy.preSleepEmotions,
        description: copy.preSleepEmotionsDescription,
        values: preSleepEmotionSignals.map(signal => ({
          key: signal.emotion,
          label: preSleepEmotionLabels[signal.emotion],
          countLabel: formatEntryCountLabel(signal.count, locale),
          countBadge: String(signal.count),
        })),
        empty: copy.emotionPatternsEmpty,
      },
    ],
    [
      copy,
      locale,
      openPatternDetail,
      preSleepEmotionLabels,
      preSleepEmotionSignals,
      recurringSymbols,
      recurringThemes,
      recurringWords,
    ],
  );
  const activePatternGroup =
    patternGroups.find(group => group.key === selectedPatternGroup) ?? patternGroups[0];
  const highlightedAchievementTitle = achievementSummary.highlightedId
    ? getAchievementContent(achievementSummary.highlightedId, copy).title
    : null;
  const milestoneSummaryHint =
    achievementSummary.unlockedCount === achievementSummary.totalCount
      ? copy.milestonesCompleteTitle
      : highlightedAchievementTitle ?? copy.milestoneInProgress;

  React.useEffect(() => {
    if (!canCompare && selectedMode === 'compare') {
      setSelectedMode('snapshot');
    }
  }, [canCompare, selectedMode]);

  React.useEffect(() => {
    if (!patternGroups.some(group => group.key === selectedPatternGroup)) {
      setSelectedPatternGroup(patternGroups[0]?.key ?? 'themes');
    }
  }, [patternGroups, selectedPatternGroup]);

  return {
    dreams,
    scopedDreams,
    selectedRange,
    setSelectedRange,
    selectedMode,
    setSelectedMode,
    selectedPatternGroup,
    setSelectedPatternGroup,
    isDetailsExpanded,
    setIsDetailsExpanded,
    rangeOptions,
    canCompare,
    compareOptions,
    selectedRangeLabel,
    heroSummaryTiles,
    compareMetrics,
    activityBars,
    topSignal,
    coverageGap,
    latestMonthlyReport,
    latestMonthlyReportTitle,
    monthlyReportPreviewSignals,
    fingerprintLeadSignals,
    fingerprintFacets,
    patternGroups,
    activePatternGroup,
    summaryTiles,
    overallLastSevenDays,
    coverageItems,
    attentionItems,
    weeklyGoalTarget,
    weeklyGoalComplete,
    achievementSummary,
    milestoneSummaryHint,
  };
}
