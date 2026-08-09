import React from 'react';
import { usePracticeMetrics } from './usePracticeMetrics';
import { useSavedShelves } from './useSavedShelves';
import { type AppLocale } from '../../../i18n/types';
import { type getStatsCopy } from '../../../constants/copy/stats';
import { type Dream, type Mood } from '../../dreams/model/dream';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import {
  getDreamDate,
  getDreamLucidityLevel,
  getLucidDreamStats,
  getLucidPracticeStats,
  getNightmareStats,
  getSleepContextStats,
  getTopPreSleepEmotionSignals,
  getTopWakeEmotionSignals,
  isLucidDream,
} from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../model/dreamReflection';
import {
  buildRecentActivityBars,
  formatDreamCountLabel,
  formatEntryCountLabel,
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
import {} from '../model/reviewWorkspace';
import {
  buildWeeklyPatternCards,
  type WeeklyPatternCard,
} from '../model/weeklyPatternCards';

type StatsCopy = ReturnType<typeof getStatsCopy>;

/** One shared empty array, so the memos above keep a stable dependency. */
const NO_DREAMS: Dream[] = [];

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
  lucidityLabels: Record<0 | 1 | 2 | 3, string>;
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
    lucidityLabels,
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

  /**
   * Nothing to measure, outside overview mode.
   *
   * Each statistic below used to carry its own hand-written empty record for
   * this case — the same nine-field nightmare object twice, the same five-field
   * summary twice — which is a copy of what the model already returns for an
   * empty array, kept in step by hand and compared by nothing. Measuring no
   * dreams costs nothing and cannot drift.
   *
   * A module constant rather than a fresh `[]`, so the memos below see a stable
   * reference and do not recompute on every render.
   */
  const measuredDreams = isOverviewMode ? scopedDreams : NO_DREAMS;
  const measuredPreviousDreams = isOverviewMode
    ? previousScopedDreams
    : NO_DREAMS;

  const scopedSummary = React.useMemo(
    () => summarizeScopedDreams(measuredDreams),
    [measuredDreams],
  );
  const previousScopedSummary = React.useMemo(
    () => summarizeScopedDreams(measuredPreviousDreams),
    [measuredPreviousDreams],
  );
  const scopedNightmareStats = React.useMemo(
    () => getNightmareStats(measuredDreams),
    [measuredDreams],
  );
  const previousScopedNightmareStats = React.useMemo(
    () => getNightmareStats(measuredPreviousDreams),
    [measuredPreviousDreams],
  );
  const scopedLucidStats = React.useMemo(
    () => getLucidDreamStats(measuredDreams),
    [measuredDreams],
  );
  const previousScopedLucidStats = React.useMemo(
    () => getLucidDreamStats(measuredPreviousDreams),
    [measuredPreviousDreams],
  );
  const scopedLucidPracticeStats = React.useMemo(
    () => getLucidPracticeStats(measuredDreams),
    [measuredDreams],
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
        label: copy.lucidFrequencyCountLabel,
        current: scopedLucidStats.lucidCount,
        previous: previousScopedLucidStats.lucidCount,
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
      previousScopedLucidStats.lucidCount,
      previousScopedNightmareStats.nightmareCount,
      previousScopedDreams.length,
      previousScopedSummary.totalWords,
      previousScopedSummary.transcribedDreams,
      scopedLucidStats.lucidCount,
      scopedNightmareStats.nightmareCount,
      scopedDreams.length,
      scopedSummary.totalWords,
      scopedSummary.transcribedDreams,
    ],
  );
  const { lucidMetrics, nightmareMetrics } = usePracticeMetrics({
    copy,
    locale,
    scopedLucidStats,
    scopedLucidPracticeStats,
    scopedNightmareStats,
  });
  const lucidHistoryItems = React.useMemo(
    () =>
      !isOverviewMode
        ? []
        : scopedDreams
            .filter(isLucidDream)
            .slice()
            .sort((left, right) => {
              const byDate =
                getDreamDate(right).getTime() - getDreamDate(left).getTime();
              if (byDate !== 0) {
                return byDate;
              }

              return right.createdAt - left.createdAt;
            })
            .slice(0, 5)
            .map(dream => {
              const level = getDreamLucidityLevel(dream) ?? 2;

              return {
                dreamId: dream.id,
                title:
                  dream.title?.trim() || copy.reviewWorkspaceDreamFallbackTitle,
                meta: getDreamDate(dream).toLocaleDateString(
                  locale === 'uk' ? 'uk-UA' : 'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  },
                ),
                levelLabel: lucidityLabels[level],
              };
            }),
    [
      copy.reviewWorkspaceDreamFallbackTitle,
      isOverviewMode,
      locale,
      lucidityLabels,
      scopedDreams,
    ],
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
  const {
    savedMonthItems,
    savedOverviewThreadItems,
    importantDreamItems,
    savedSetItems,
  } = useSavedShelves({
    copy,
    locale,
    dreams,
    savedMonths,
    savedThreadRecords,
    wakeEmotionLabels,
    isOverviewMode,
  });
  return {
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
    lucidHistoryItems,
    lucidMetrics,
    memoryNudge,
    nightmareMetrics,
    nightmareCount: scopedNightmareStats.nightmareCount,
    savedMonthItems,
    savedOverviewThreadItems,
    savedSetItems,
    summaryTiles,
    topSignal,
    weeklyPatternCards,
    workQueueItems,
  };
}
