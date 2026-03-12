import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import {
  getDreamsMeta,
  listDreams,
  type DreamsMeta,
} from '../../dreams/repository/dreamsRepository';
import {
  getDreamPreSleepEmotionLabels,
  getDreamWakeEmotionLabels,
} from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { type AppLocale } from '../../../i18n/types';
import {
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
  getMemoryNudge,
  getMemoryWorkQueue,
  getPreviousRangeDreams,
  summarizeScopedDreams,
  type MemoryWorkQueueItem,
  type InsightRange,
  type MemoryNudge,
  type PatternGroupKey,
} from '../model/statsScreenModel';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';
import { type DreamFingerprintFacet } from '../components/DreamFingerprintCard';
import { type PatternGroupCardItem } from '../components/PatternGroupCard';
import { type MemoryMode } from '../components/StatsScreenSections';

type StatsCopy = ReturnType<typeof getStatsCopy>;
export type InsightMode = 'snapshot' | 'compare';

type UseStatsScreenControllerArgs = {
  locale: AppLocale;
  copy: StatsCopy;
  selectedMemoryMode: MemoryMode;
  openPatternDetail: (signal: string, kind: PatternDetailKind) => void;
};

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export function useStatsScreenController({
  locale,
  copy,
  selectedMemoryMode,
  openPatternDetail,
}: UseStatsScreenControllerArgs) {
  const isOverviewMode = selectedMemoryMode === 'overview';
  const isThreadsMode = selectedMemoryMode === 'threads';
  const isMonthlyMode = selectedMemoryMode === 'monthly';
  const hydrationRequestRef = React.useRef(0);
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const wakeEmotionLabels = React.useMemo(() => getDreamWakeEmotionLabels(locale), [locale]);
  const [meta, setMeta] = React.useState<DreamsMeta>(() => getDreamsMeta());
  const [dreams, setDreams] = React.useState(() => [] as ReturnType<typeof listDreams>);
  const [analysisSettings, setAnalysisSettings] = React.useState(() => getDreamAnalysisSettings());
  const [loading, setLoading] = React.useState(meta.totalCount > 0);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedRange, setSelectedRange] = React.useState<InsightRange>('all');
  const [selectedMode, setSelectedMode] = React.useState<InsightMode>('snapshot');
  const [selectedPatternGroup, setSelectedPatternGroup] =
    React.useState<PatternGroupKey>('themes');
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);
  const [isMilestonesExpanded, setIsMilestonesExpanded] = React.useState(false);

  const refreshDreams = React.useCallback(
    (mode: 'initial' | 'silent' = 'silent') => {
      const startedAt = Date.now();
      setLoadError(null);

      try {
        const requestId = ++hydrationRequestRef.current;
        const nextMeta = getDreamsMeta();
        setMeta(nextMeta);
        setAnalysisSettings(getDreamAnalysisSettings());

        if (mode === 'initial') {
          setLoading(nextMeta.totalCount > 0);
        }

        trackLocalSurfaceLoad('memory_refresh', startedAt, nextMeta.totalCount);

        const runHydration = () => {
          try {
            const nextDreams = listDreams();

            React.startTransition(() => {
              if (hydrationRequestRef.current !== requestId) {
                return;
              }

              setDreams(nextDreams);
              setLoading(false);
              setLoadError(null);
            });
          } catch (error) {
            if (hydrationRequestRef.current !== requestId) {
              return;
            }

            if (mode === 'initial') {
              setDreams([]);
            }
            setLoading(false);
            setLoadError(String(error));
          }
        };

        const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
        if (typeof scheduler.requestIdleCallback === 'function') {
          scheduler.requestIdleCallback(runHydration);
          return;
        }

        setTimeout(runHydration, 0);
      } catch (error) {
        setLoading(false);
        setLoadError(String(error));
      }
    },
    [],
  );

  React.useEffect(() => {
    const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: IdleCallbackHandle | null = null;

    if (typeof scheduler.requestIdleCallback === 'function') {
      idleHandle = scheduler.requestIdleCallback(() => {
        refreshDreams('initial');
      });
    } else {
      timeoutId = setTimeout(() => {
        refreshDreams('initial');
      }, 0);
    }

    return () => {
      if (idleHandle !== null && typeof scheduler.cancelIdleCallback === 'function') {
        scheduler.cancelIdleCallback(idleHandle);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshDreams]);

  useFocusEffect(
    React.useCallback(() => {
      refreshDreams('silent');
    }, [refreshDreams]),
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
  const overallLastSevenDays = React.useMemo(
    () => (isOverviewMode ? getEntriesLastSevenDays(dreams) : 0),
    [dreams, isOverviewMode],
  );
  const sleepContextStats = React.useMemo(
    () =>
      isOverviewMode
        ? getSleepContextStats(scopedDreams)
        : {
            withContext: 0,
            withStress: 0,
            withPreSleepEmotions: 0,
            caffeineLate: 0,
            alcoholTaken: 0,
          },
    [isOverviewMode, scopedDreams],
  );
  const wakeEmotionSignals = React.useMemo(
    () => ((isOverviewMode || isMonthlyMode) ? getTopWakeEmotionSignals(scopedDreams, 6) : []),
    [isMonthlyMode, isOverviewMode, scopedDreams],
  );
  const preSleepEmotionSignals = React.useMemo(
    () => (isOverviewMode ? getTopPreSleepEmotionSignals(scopedDreams, 6) : []),
    [isOverviewMode, scopedDreams],
  );
  const transcriptArchiveStats = React.useMemo(
    () =>
      isOverviewMode
        ? getTranscriptArchiveStats(scopedDreams)
        : {
            audioOnly: 0,
            withTranscript: 0,
            editedTranscript: 0,
          },
    [isOverviewMode, scopedDreams],
  );
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
  const achievements = React.useMemo(
    () => (isOverviewMode ? getDreamAchievements(dreams) : []),
    [dreams, isOverviewMode],
  );
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
  const memoryNudge = React.useMemo<MemoryNudge | null>(
    () =>
      isOverviewMode || isThreadsMode
        ? getMemoryNudge(scopedDreams, copy, recurringThemes, recurringWords, recurringSymbols)
        : null,
    [copy, isOverviewMode, isThreadsMode, recurringSymbols, recurringThemes, recurringWords, scopedDreams],
  );

  const fingerprintFacets = React.useMemo<DreamFingerprintFacet[]>(
    () =>
      !isOverviewMode
        ? []
        : [
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
      isOverviewMode,
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
    () =>
      isMonthlyMode ? getMonthlyReportMonths(dreams, locale === 'uk' ? 'uk-UA' : 'en-US') : [],
    [dreams, isMonthlyMode, locale],
  );
  const latestMonthlyReport = React.useMemo(
    () =>
      isMonthlyMode ? getMonthlyReportData(dreams, monthlyReportMonths[0]?.key) : null,
    [dreams, isMonthlyMode, monthlyReportMonths],
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
    () => (isOverviewMode ? buildRecentActivityBars(scopedDreams, selectedRange, locale) : []),
    [isOverviewMode, locale, scopedDreams, selectedRange],
  );
  const coverageItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : [
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
    [
      copy,
      isOverviewMode,
      scopedDreams.length,
      scopedSummary.taggedEntries,
      scopedSummary.transcribedDreams,
      sleepContextStats.withContext,
    ],
  );
  const attentionItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : [
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
    [copy, entriesWithoutContext, entriesWithoutMood, isOverviewMode, transcriptArchiveStats.audioOnly],
  );
  const workQueueItems = React.useMemo<MemoryWorkQueueItem[]>(
    () =>
      !isOverviewMode
        ? []
        : getMemoryWorkQueue(scopedDreams, copy, analysisSettings),
    [analysisSettings, copy, isOverviewMode, scopedDreams],
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
    if (!isThreadsMode) {
      return;
    }

    if (!patternGroups.some(group => group.key === selectedPatternGroup)) {
      setSelectedPatternGroup(patternGroups[0]?.key ?? 'themes');
    }
  }, [isThreadsMode, patternGroups, selectedPatternGroup]);

  return {
    loading,
    loadError,
    meta,
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
    isMilestonesExpanded,
    setIsMilestonesExpanded,
    rangeOptions,
    canCompare,
    compareOptions,
    selectedRangeLabel,
    compareMetrics,
    activityBars,
    topSignal,
    memoryNudge,
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
    workQueueItems,
    weeklyGoalTarget,
    weeklyGoalComplete,
    achievements,
    achievementSummary,
    milestoneSummaryHint,
  };
}
