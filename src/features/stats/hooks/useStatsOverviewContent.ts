import React from 'react';
import { type AppLocale } from '../../../i18n/types';
import { type getStatsCopy } from '../../../constants/copy/stats';
import { type Dream, type Mood } from '../../dreams/model/dream';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import {
  getEntriesLastSevenDays,
  getDreamDate,
  getNightmareStats,
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
import { buildSavedDreamThreadShelfItems } from '../model/dreamThread';
import {
  buildSavedMonthlyReviewItems,
  buildRecentActivityBars,
  formatCoverageValue,
  formatDreamCountLabel,
  formatEntryCountLabel,
  getAchievementContent,
  getMemoryNudge,
  getMemoryWorkQueue,
  getPreviousRangeDreams,
  summarizeScopedDreams,
  type MemoryWorkQueueItem,
  type MemoryNudge,
} from '../model/statsScreenModel';
import {
  buildEmotionalTrendSeries,
  getEmotionalTrendInsight,
  type EmotionalTrendEntry,
} from '../model/emotionalTrends';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { type DreamFingerprintFacet } from '../components/DreamFingerprintCard';
import {
  buildReviewWorkspaceImportantDreamItems,
  buildReviewWorkspaceSavedSetItems,
} from '../model/reviewWorkspace';
import {
  buildWeeklyPatternCards,
  type WeeklyPatternCard,
} from '../model/weeklyPatternCards';

type StatsCopy = ReturnType<typeof getStatsCopy>;

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

  return new Date(timestamp).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function useStatsOverviewContent(args: {
  locale: AppLocale;
  copy: StatsCopy;
  dreams: Dream[];
  scopedDreams: Dream[];
  selectedRange: 'all' | '30d' | '7d';
  analysisSettings: DreamAnalysisSettings;
  savedMonths: Array<{ monthKey: string; savedAt: number }>;
  savedThreadRecords: Array<{
    signal: string;
    kind: 'word' | 'theme' | 'symbol';
    savedAt: number;
  }>;
  wakeEmotionLabels: Record<string, string>;
  moodLabels: Record<Mood, string>;
  preSleepEmotionLabels: Record<string, string>;
  openPatternDetail: (signal: string, kind: PatternDetailKind) => void;
  isOverviewMode: boolean;
  isThreadsMode: boolean;
}) {
  const {
    locale,
    copy,
    dreams,
    scopedDreams,
    selectedRange,
    analysisSettings,
    savedMonths,
    savedThreadRecords,
    wakeEmotionLabels,
    moodLabels,
    preSleepEmotionLabels,
    openPatternDetail,
    isOverviewMode,
  } = args;
  const previousScopedDreams = React.useMemo(
    () => (isOverviewMode ? getPreviousRangeDreams(dreams, selectedRange) : []),
    [dreams, isOverviewMode, selectedRange],
  );
  const scopedSummary = React.useMemo(
    () =>
      isOverviewMode
        ? summarizeScopedDreams(scopedDreams)
        : {
            totalWords: 0,
            voiceNotes: 0,
            transcribedDreams: 0,
            taggedEntries: 0,
            moodEntries: 0,
          },
    [isOverviewMode, scopedDreams],
  );
  const previousScopedSummary = React.useMemo(
    () =>
      isOverviewMode
        ? summarizeScopedDreams(previousScopedDreams)
        : {
            totalWords: 0,
            voiceNotes: 0,
            transcribedDreams: 0,
            taggedEntries: 0,
            moodEntries: 0,
          },
    [isOverviewMode, previousScopedDreams],
  );
  const scopedNightmareStats = React.useMemo(
    () =>
      isOverviewMode
        ? getNightmareStats(scopedDreams)
        : {
            totalDreams: 0,
            nightmareCount: 0,
            taggedCount: 0,
            derivedCount: 0,
            rate: undefined,
            latestNightmareDream: null,
          },
    [isOverviewMode, scopedDreams],
  );
  const previousScopedNightmareStats = React.useMemo(
    () =>
      isOverviewMode
        ? getNightmareStats(previousScopedDreams)
        : {
            totalDreams: 0,
            nightmareCount: 0,
            taggedCount: 0,
            derivedCount: 0,
            rate: undefined,
            latestNightmareDream: null,
          },
    [isOverviewMode, previousScopedDreams],
  );
  const overallLastSevenDays = React.useMemo(
    () => (isOverviewMode ? getEntriesLastSevenDays(dreams) : 0),
    [dreams, isOverviewMode],
  );
  const weeklyPatternCards = React.useMemo<WeeklyPatternCard[]>(
    () =>
      isOverviewMode
        ? buildWeeklyPatternCards({
            dreams,
            locale,
            copy,
            moodLabels,
          })
        : [],
    [copy, dreams, isOverviewMode, locale, moodLabels],
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
    () => (isOverviewMode ? getTopWakeEmotionSignals(scopedDreams, 6) : []),
    [isOverviewMode, scopedDreams],
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
      isOverviewMode
        ? getRecurringReflectionSignals(scopedDreams, { limit: 6 })
        : [],
    [isOverviewMode, scopedDreams],
  );
  const recurringSymbols = React.useMemo(
    () =>
      isOverviewMode
        ? getRecurringReflectionSignals(scopedDreams, {
            limit: 6,
            transcriptOnly: true,
          })
        : [],
    [isOverviewMode, scopedDreams],
  );
  const recurringWords = React.useMemo(
    () => (isOverviewMode ? getRecurringWordSignals(scopedDreams, 6) : []),
    [isOverviewMode, scopedDreams],
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
  const entriesWithoutMood = Math.max(
    scopedDreams.length - scopedSummary.moodEntries,
    0,
  );
  const entriesWithoutContext = Math.max(
    scopedDreams.length - sleepContextStats.withContext,
    0,
  );

  const summaryTiles = React.useMemo(
    () => [
      { label: copy.entries, value: scopedDreams.length },
      { label: copy.wordsSaved, value: scopedSummary.totalWords },
      { label: copy.voiceNotes, value: scopedSummary.voiceNotes },
      { label: copy.transcribedDreams, value: scopedSummary.transcribedDreams },
    ],
    [
      copy,
      scopedDreams.length,
      scopedSummary.totalWords,
      scopedSummary.transcribedDreams,
      scopedSummary.voiceNotes,
    ],
  );
  const compareMetrics = React.useMemo(
    () => [
      {
        label: copy.entries,
        current: scopedDreams.length,
        previous: previousScopedDreams.length,
      },
      {
        label: copy.nightmareFrequencyCountLabel,
        current: scopedNightmareStats.nightmareCount,
        previous: previousScopedNightmareStats.nightmareCount,
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
      previousScopedNightmareStats.nightmareCount,
      previousScopedDreams.length,
      previousScopedSummary.totalWords,
      previousScopedSummary.transcribedDreams,
      scopedNightmareStats.nightmareCount,
      scopedDreams.length,
      scopedSummary.totalWords,
      scopedSummary.transcribedDreams,
    ],
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
    ],
    [copy, locale, scopedNightmareStats],
  );
  const coverageGap =
    [
      {
        label: copy.takeawayGapAudioOnly,
        value: transcriptArchiveStats.audioOnly,
      },
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
      isOverviewMode
        ? getMemoryNudge(
            scopedDreams,
            copy,
            recurringThemes,
            recurringWords,
            recurringSymbols,
          )
        : null,
    [
      copy,
      isOverviewMode,
      recurringSymbols,
      recurringThemes,
      recurringWords,
      scopedDreams,
    ],
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
                  meta: formatEntryCountLabel(
                    wakeEmotionSignals[0].count,
                    locale,
                  ),
                }
              : null,
            preSleepEmotionSignals[0]
              ? {
                  key: 'pre-sleep',
                  label: copy.fingerprintPreSleepLabel,
                  value:
                    preSleepEmotionLabels[preSleepEmotionSignals[0].emotion],
                  meta: formatEntryCountLabel(
                    preSleepEmotionSignals[0].count,
                    locale,
                  ),
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
  const activityBars = React.useMemo(
    () =>
      isOverviewMode
        ? buildRecentActivityBars(scopedDreams, selectedRange, locale)
        : [],
    [isOverviewMode, locale, scopedDreams, selectedRange],
  );
  const emotionalTrendSeries = React.useMemo<EmotionalTrendEntry[]>(
    () =>
      isOverviewMode
        ? buildEmotionalTrendSeries(scopedDreams, selectedRange, locale)
        : [],
    [isOverviewMode, locale, scopedDreams, selectedRange],
  );
  const emotionalTrendInsight = React.useMemo(
    () =>
      isOverviewMode
        ? getEmotionalTrendInsight(emotionalTrendSeries, {
            emotionalTrendArcPositive: copy.emotionalTrendArcPositive,
            emotionalTrendArcNeutral: copy.emotionalTrendArcNeutral,
            emotionalTrendArcNegative: copy.emotionalTrendArcNegative,
            emotionalTrendArcMixed: copy.emotionalTrendArcMixed,
            emotionalTrendArcEmpty: copy.emotionalTrendEmptyLabel,
            emotionalTrendEmptyLabel: copy.emotionalTrendEmptyLabel,
          })
        : '',
    [copy, emotionalTrendSeries, isOverviewMode],
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
              hint:
                entriesWithoutMood > 0
                  ? copy.attentionMoodHint
                  : copy.attentionAllSetHint,
            },
            {
              label: copy.attentionContextLabel,
              value: entriesWithoutContext,
              hint:
                entriesWithoutContext > 0
                  ? copy.attentionContextHint
                  : copy.attentionAllSetHint,
            },
          ],
    [
      copy,
      entriesWithoutContext,
      entriesWithoutMood,
      isOverviewMode,
      transcriptArchiveStats.audioOnly,
    ],
  );
  const workQueueItems = React.useMemo<MemoryWorkQueueItem[]>(
    () =>
      !isOverviewMode
        ? []
        : getMemoryWorkQueue(scopedDreams, copy, analysisSettings),
    [analysisSettings, copy, isOverviewMode, scopedDreams],
  );
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
  const highlightedAchievementTitle = achievementSummary.highlightedId
    ? getAchievementContent(achievementSummary.highlightedId, copy).title
    : null;
  const milestoneSummaryHint =
    achievementSummary.unlockedCount === achievementSummary.totalCount
      ? copy.milestonesCompleteTitle
      : highlightedAchievementTitle ?? copy.milestoneInProgress;

  return {
    achievementSummary,
    achievements,
    activityBars,
    attentionItems,
    compareMetrics,
    coverageGap,
    coverageItems,
    emotionalTrendInsight,
    emotionalTrendSeries,
    fingerprintFacets,
    fingerprintLeadSignals,
    importantDreamItems,
    memoryNudge,
    milestoneSummaryHint,
    nightmareMetrics,
    overallLastSevenDays,
    savedMonthItems,
    savedOverviewThreadItems,
    savedSetItems,
    summaryTiles,
    topSignal,
    weeklyPatternCards,
    weeklyGoalComplete,
    weeklyGoalTarget,
    workQueueItems,
  };
}
