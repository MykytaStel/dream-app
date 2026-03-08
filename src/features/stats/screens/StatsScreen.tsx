import React from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import {
  getDreamPreSleepEmotionLabels,
} from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { Theme } from '../../../theme/theme';
import {
  countDreamWords,
  getAverageWords,
  getCurrentStreak,
  getDreamDate,
  getEntriesLastSevenDays,
  getSleepContextStats,
  getTopPreSleepEmotionSignals,
} from '../../dreams/model/dreamAnalytics';
import {
  type DreamReflectionSignal,
  type DreamWordSignal,
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../model/dreamReflection';
import {
  getDreamAchievements,
  getDreamAchievementSummary,
  type DreamAchievementId,
} from '../model/achievements';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import { Dream } from '../../dreams/model/dream';
import { PatternGroupCard, type PatternGroupCardItem } from '../components/PatternGroupCard';
import { AppLocale } from '../../../i18n/types';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';

type InsightRange = 'all' | '30d' | '7d';
type InsightMode = 'snapshot' | 'compare';
type PatternGroupKey = 'themes' | 'words' | 'symbols' | 'pre-sleep';

const statsLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

function getAchievementContent(id: DreamAchievementId, copy: ReturnType<typeof getStatsCopy>) {
  switch (id) {
    case 'first-dream':
      return {
        title: copy.milestoneFirstDreamTitle,
        description: copy.milestoneFirstDreamDescription,
      };
    case 'three-day-streak':
      return {
        title: copy.milestoneThreeDayStreakTitle,
        description: copy.milestoneThreeDayStreakDescription,
      };
    case 'ten-dreams':
      return {
        title: copy.milestoneTenDreamsTitle,
        description: copy.milestoneTenDreamsDescription,
      };
    case 'first-voice-dream':
      return {
        title: copy.milestoneFirstVoiceDreamTitle,
        description: copy.milestoneFirstVoiceDreamDescription,
      };
  }
}

function filterDreamsByRange(dreams: Dream[], range: InsightRange) {
  if (range === 'all') {
    return dreams;
  }

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (range === '7d' ? 6 : 29));

  return dreams.filter(dream => getDreamDate(dream) >= cutoff);
}

function getPreviousRangeDreams(dreams: Dream[], range: InsightRange) {
  if (range === 'all') {
    return [] as Dream[];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periodLength = range === '7d' ? 7 : 30;
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - (periodLength - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  previousStart.setHours(0, 0, 0, 0);
  previousStart.setDate(previousStart.getDate() - (periodLength - 1));

  return dreams.filter(dream => {
    const dreamDate = getDreamDate(dream);
    return dreamDate >= previousStart && dreamDate <= previousEnd;
  });
}

function summarizeScopedDreams(scopedDreams: Dream[]) {
  let totalWords = 0;
  let voiceNotes = 0;
  let transcribedDreams = 0;
  let taggedEntries = 0;
  let moodEntries = 0;

  scopedDreams.forEach(dream => {
    totalWords += countDreamWords(dream.text);

    if (dream.audioUri) {
      voiceNotes += 1;
    }

    if (dream.transcript?.trim()) {
      transcribedDreams += 1;
    }

    if (dream.tags.length > 0) {
      taggedEntries += 1;
    }

    if (dream.mood) {
      moodEntries += 1;
    }
  });

  return {
    totalWords,
    voiceNotes,
    transcribedDreams,
    taggedEntries,
    moodEntries,
  };
}

function toLocalDateKey(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function buildRecentActivityBars(dreams: Dream[], range: InsightRange, locale: AppLocale) {
  const totalDays = range === '7d' ? 7 : 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();

  dreams.forEach(dream => {
    const dateKey = toLocalDateKey(getDreamDate(dream));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  });

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (totalDays - index - 1));
    const dateKey = toLocalDateKey(date);

    return {
      key: dateKey,
      label: date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
        weekday: 'narrow',
      }),
      count: counts.get(dateKey) ?? 0,
    };
  });
}

function formatCoverageValue(value: number, total: number) {
  return `${value}/${Math.max(total, 0)}`;
}

function formatCountUnit(
  count: number,
  locale: AppLocale,
  forms: {
    en: { one: string; other: string };
    uk: { one: string; few: string; many: string };
  },
) {
  if (locale === 'uk') {
    const absolute = Math.abs(count);
    const lastTwo = absolute % 100;
    const last = absolute % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
      return forms.uk.many;
    }

    if (last === 1) {
      return forms.uk.one;
    }

    if (last >= 2 && last <= 4) {
      return forms.uk.few;
    }

    return forms.uk.many;
  }

  return Math.abs(count) === 1 ? forms.en.one : forms.en.other;
}

function formatDreamCountLabel(count: number, locale: AppLocale) {
  return `${count} ${formatCountUnit(count, locale, {
    en: { one: 'dream', other: 'dreams' },
    uk: { one: 'сон', few: 'сни', many: 'снів' },
  })}`;
}

function formatEntryCountLabel(count: number, locale: AppLocale) {
  return `${count} ${formatCountUnit(count, locale, {
    en: { one: 'entry', other: 'entries' },
    uk: { one: 'запис', few: 'записи', many: 'записів' },
  })}`;
}

function formatSignedDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function getReflectionSourceLabel(
  source: DreamReflectionSignal['source'],
  copy: ReturnType<typeof getStatsCopy>,
) {
  switch (source) {
    case 'tag':
      return copy.reflectionSourceTag;
    case 'mixed':
      return copy.reflectionSourceMixed;
    case 'transcript':
    default:
      return copy.reflectionSourceTranscript;
  }
}

function createWordPatternItems(
  values: DreamWordSignal[],
  locale: AppLocale,
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void,
): PatternGroupCardItem[] {
  return values.map(signal => ({
    key: signal.label,
    label: signal.label,
    countLabel: formatDreamCountLabel(signal.dreamCount, locale),
    countBadge: String(signal.dreamCount),
    onPress: () => onOpenPatternDetail(signal.label, 'word'),
  }));
}

function createReflectionPatternItems(
  values: DreamReflectionSignal[],
  locale: AppLocale,
  kind: Extract<PatternDetailKind, 'theme' | 'symbol'>,
  copy: ReturnType<typeof getStatsCopy>,
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void,
): PatternGroupCardItem[] {
  return values.map(signal => ({
    key: signal.label,
    label: signal.label,
    countLabel: formatDreamCountLabel(signal.dreamCount, locale),
    countBadge: String(signal.dreamCount),
    sourceLabel: getReflectionSourceLabel(signal.source, copy),
    onPress: () => onOpenPatternDetail(signal.label, kind),
  }));
}

export default function StatsScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const [dreams, setDreams] = React.useState(() => listDreams());
  const [selectedRange, setSelectedRange] = React.useState<InsightRange>('all');
  const [selectedMode, setSelectedMode] = React.useState<InsightMode>('snapshot');
  const [selectedPatternGroup, setSelectedPatternGroup] =
    React.useState<PatternGroupKey>('themes');
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);
  const styles = createStatsScreenStyles(t);

  const openPatternDetail = React.useCallback((signal: string, kind: PatternDetailKind) => {
    navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
      signal,
      kind,
    });
  }, [navigation]);

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
  const overallStreak = getCurrentStreak(dreams);
  const overallLastSevenDays = getEntriesLastSevenDays(dreams);
  const averageWords = getAverageWords(scopedDreams);
  const sleepContextStats = getSleepContextStats(scopedDreams);
  const preSleepEmotionSignals = getTopPreSleepEmotionSignals(scopedDreams, 6);
  const transcriptArchiveStats = getTranscriptArchiveStats(scopedDreams);
  const recurringThemes = getRecurringReflectionSignals(scopedDreams, { limit: 6 });
  const recurringSymbols = getRecurringReflectionSignals(scopedDreams, {
    limit: 6,
    transcriptOnly: true,
  });
  const recurringWords = getRecurringWordSignals(scopedDreams, 6);
  const achievements = getDreamAchievements(dreams);
  const achievementSummary = getDreamAchievementSummary(achievements);
  const weeklyGoalTarget = 3;
  const weeklyGoalComplete = overallLastSevenDays >= weeklyGoalTarget;
  const topTheme = recurringThemes[0];
  const topWord = recurringWords[0];
  const entriesWithoutMood = Math.max(scopedDreams.length - scopedSummary.moodEntries, 0);
  const entriesWithoutContext = Math.max(scopedDreams.length - sleepContextStats.withContext, 0);
  const rangeOptions = [
    { key: 'all' as const, label: copy.rangeAll },
    { key: '30d' as const, label: copy.range30Days },
    { key: '7d' as const, label: copy.range7Days },
  ];
  const canCompare = selectedRange !== 'all';
  const compareOptions = [
    { key: 'snapshot' as const, label: copy.compareSnapshot, disabled: false },
    { key: 'compare' as const, label: copy.compareMode, disabled: !canCompare },
  ];
  const selectedRangeLabel =
    rangeOptions.find(option => option.key === selectedRange)?.label ?? copy.rangeAll;
  const summaryTiles = [
    { label: copy.entries, value: scopedDreams.length },
    { label: copy.wordsSaved, value: scopedSummary.totalWords },
    { label: copy.voiceNotes, value: scopedSummary.voiceNotes },
    { label: copy.transcribedDreams, value: scopedSummary.transcribedDreams },
  ];
  const heroSummaryTiles = [
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
  ];
  const compareMetrics = [
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
  ];
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
  const activityBars = React.useMemo(
    () => buildRecentActivityBars(scopedDreams, selectedRange, locale),
    [locale, scopedDreams, selectedRange],
  );
  const coverageItems = [
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
  ];
  const attentionItems = [
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
  ];
  const patternGroups: Array<{
    key: PatternGroupKey;
    label: string;
    description: string;
    values: PatternGroupCardItem[];
    empty: string;
  }> = [
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
  ];
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

  if (!dreams.length) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
        </View>

        <View style={styles.heroTopGrid}>
          <View style={styles.rangeSection}>
            <Text style={styles.rangeLabel}>{copy.rangeLabel}</Text>
            <View style={styles.rangeRow}>
              {rangeOptions.map(option => {
                const active = selectedRange === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.rangeChip, active ? styles.rangeChipActive : null]}
                    onPress={() => setSelectedRange(option.key)}
                  >
                    <Text
                      style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.rangeSection}>
            <Text style={styles.rangeLabel}>{copy.compareLabel}</Text>
            <View style={styles.rangeRow}>
              {compareOptions.map(option => {
                const active = selectedMode === option.key;
                return (
                  <Pressable
                    key={option.key}
                    disabled={option.disabled}
                    style={[
                      styles.rangeChip,
                      active ? styles.rangeChipActive : null,
                      option.disabled ? { opacity: 0.45 } : null,
                    ]}
                    onPress={() => setSelectedMode(option.key)}
                  >
                    <Text
                      style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          {heroSummaryTiles.map(tile => (
            <View key={tile.label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{tile.label}</Text>
              <Text style={styles.summaryValue}>{tile.value}</Text>
              <Text style={styles.summaryHint}>{tile.hint}</Text>
            </View>
          ))}
        </View>

        {selectedMode === 'compare' && canCompare ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            layout={statsLayoutTransition}
            style={styles.comparePanel}
          >
            <View style={styles.comparePanelHeader}>
              <Text style={styles.comparePanelTitle}>
                {`${copy.compareCurrentPeriod}: ${selectedRangeLabel}`}
              </Text>
              <Text style={styles.comparePanelSubtitle}>
                {`${copy.comparePreviousPeriod}: ${selectedRangeLabel}`}
              </Text>
            </View>

            <View style={styles.compareMetricGrid}>
              {compareMetrics.map(metric => {
                const delta = metric.current - metric.previous;
                const deltaStyle =
                  delta > 0
                    ? styles.compareMetricDeltaPositive
                    : delta < 0
                      ? styles.compareMetricDeltaNegative
                      : styles.compareMetricDeltaNeutral;

                return (
                  <View key={metric.label} style={styles.compareMetricTile}>
                    <Text style={styles.compareMetricLabel}>{metric.label}</Text>
                    <Text style={styles.compareMetricValue}>{metric.current}</Text>
                    <Text style={[styles.compareMetricMeta, deltaStyle]}>
                      {`${formatSignedDelta(delta)} ${copy.compareDeltaLabel}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(220)} layout={statsLayoutTransition}>
            <View style={styles.overviewPanel}>
              <View style={styles.overviewPanelHeader}>
                <Text style={styles.overviewPanelTitle}>{copy.overviewActivityTitle}</Text>
                <Text style={styles.overviewPanelSubtitle}>
                  {copy.overviewActivityDescription}
                </Text>
              </View>

              <View style={styles.activityBarsRow}>
                {activityBars.map(bar => {
                  const maxCount = Math.max(...activityBars.map(item => item.count), 1);
                  const height = bar.count > 0 ? Math.max(10, (bar.count / maxCount) * 48) : 4;

                  return (
                    <View key={bar.key} style={styles.activityBarColumn}>
                      <View style={styles.activityBarTrack}>
                        <View style={[styles.activityBarFill, { height }]} />
                      </View>
                      <Text style={styles.activityBarLabel}>{bar.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.storyRow}>
                <Pressable
                  disabled={!topSignal?.onPress}
                  onPress={topSignal?.onPress}
                  style={({ pressed }) => [
                    styles.storyCard,
                    styles.storyCardAccent,
                    pressed && topSignal?.onPress ? styles.insightCardPressed : null,
                  ]}
                >
                  <Text style={styles.storyLabel}>{copy.overviewTopSignalLabel}</Text>
                  <Text style={styles.storyValue} numberOfLines={2}>
                    {topSignal?.label ?? copy.overviewTopSignalEmpty}
                  </Text>
                  <Text style={styles.storyHint} numberOfLines={2}>
                    {topSignal?.hint ?? copy.takeawayThemesEmpty}
                  </Text>
                </Pressable>

                <View style={styles.storyCard}>
                  <Text style={styles.storyLabel}>{copy.overviewNextStepLabel}</Text>
                  <Text style={styles.storyValue} numberOfLines={2}>
                    {coverageGap?.value ? coverageGap.label : copy.overviewNextStepEmpty}
                  </Text>
                  <Text style={styles.storyHint} numberOfLines={2}>
                    {coverageGap?.value
                      ? `${coverageGap.value} ${copy.entries}`
                      : copy.takeawayGapsEmpty}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </Card>
      </Animated.View>

      {!scopedDreams.length ? (
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      ) : (
        <>
          <Animated.View layout={statsLayoutTransition}>
            <Card style={styles.sectionCard}>
              <SectionHeader title={copy.patternsTitle} subtitle={copy.patternsDescription} />
              <View style={styles.patternTabsRow}>
                {patternGroups.map(group => {
                  const active = group.key === activePatternGroup.key;

                  return (
                    <Pressable
                      key={group.key}
                      style={[styles.patternTabChip, active ? styles.patternTabChipActive : null]}
                      onPress={() => setSelectedPatternGroup(group.key)}
                    >
                      <Text
                        style={[
                          styles.patternTabChipText,
                          active ? styles.patternTabChipTextActive : null,
                        ]}
                      >
                        {group.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.patternGroupList}>
                {activePatternGroup ? (
                  <PatternGroupCard
                    key={activePatternGroup.key}
                    title={activePatternGroup.label}
                    description={activePatternGroup.description}
                    items={activePatternGroup.values}
                    emptyLabel={activePatternGroup.empty}
                    leadLabel={copy.patternsTopLabel}
                    moreLabel={copy.patternsMoreLabel}
                  />
                ) : null}
              </View>
            </Card>
          </Animated.View>

          <Animated.View layout={statsLayoutTransition}>
            <Card style={styles.sectionCard}>
              <Pressable
                style={styles.detailsToggleRow}
                onPress={() => setIsDetailsExpanded(current => !current)}
              >
                <View style={styles.detailsToggleCopy}>
                  <Text style={styles.detailsToggleTitle}>{copy.detailsTitle}</Text>
                  <Text style={styles.detailsToggleDescription}>{copy.detailsDescription}</Text>
                </View>
                <View style={styles.detailsTogglePill}>
                  <Text style={styles.detailsTogglePillText}>
                    {isDetailsExpanded ? copy.detailsHide : copy.detailsShow}
                  </Text>
                  <Ionicons
                    name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={t.colors.text}
                  />
                </View>
              </Pressable>

              {isDetailsExpanded ? (
                <Animated.View
                  entering={FadeInDown.duration(180)}
                  layout={statsLayoutTransition}
                  style={styles.detailsSectionContent}
                >
                  <View>
                    <SectionHeader title={copy.snapshotTitle} subtitle={copy.snapshotDescription} />
                    <View style={styles.metricGrid}>
                      <View style={styles.metricTile}>
                        <Text style={styles.metricLabel}>{copy.lastSevenDays}</Text>
                        <Text style={styles.metricValue}>{overallLastSevenDays}</Text>
                      </View>
                      {summaryTiles.map(tile => (
                        <View key={tile.label} style={styles.metricTile}>
                          <Text style={styles.metricLabel}>{tile.label}</Text>
                          <Text style={styles.metricValue}>{tile.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailsSubsection}>
                    <SectionHeader title={copy.coverageTitle} subtitle={copy.coverageDescription} />
                    <View style={styles.coverageGrid}>
                      {coverageItems.map((item, index) => (
                        <View
                          key={item.label}
                          style={[
                            styles.coverageCard,
                            index === coverageItems.length - 1 ? styles.coverageCardWide : null,
                          ]}
                        >
                          <Text style={styles.coverageLabel}>{item.label}</Text>
                          <Text style={styles.coverageValue}>
                            {formatCoverageValue(item.value, item.total)}
                          </Text>
                          <Text style={styles.coverageHint}>{item.hint}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailsSubsection}>
                    <SectionHeader title={copy.attentionTitle} subtitle={copy.attentionDescription} />
                    <View style={styles.attentionRow}>
                      {attentionItems.map((item, index) => (
                        <View
                          key={item.label}
                          style={[
                            styles.attentionCard,
                            index === attentionItems.length - 1 ? styles.attentionCardWide : null,
                          ]}
                        >
                          <Text style={styles.attentionValue}>{item.value}</Text>
                          <Text style={styles.attentionLabel}>{item.label}</Text>
                          <Text style={styles.attentionHint}>{item.hint}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              ) : null}
            </Card>
          </Animated.View>
        </>
      )}

      <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.milestonesTitle} subtitle={copy.milestonesDescription} />

        <View style={styles.teaserRow}>
          <View style={styles.teaserCard}>
            <Text style={styles.teaserLabel}>{copy.weeklyGoalTitle}</Text>
            <Text style={styles.teaserValue}>{`${overallLastSevenDays}/${weeklyGoalTarget}`}</Text>
            <Text style={styles.teaserHint}>
              {weeklyGoalComplete ? copy.weeklyGoalStatusDone : copy.weeklyGoalStatusPending}
            </Text>
          </View>
          <View style={[styles.teaserCard, styles.teaserCardAccent]}>
            <Text style={styles.teaserLabel}>{copy.milestonesUnlockedLabel}</Text>
            <Text style={styles.teaserValue}>
              {`${achievementSummary.unlockedCount}/${achievementSummary.totalCount}`}
            </Text>
            <Text style={styles.teaserHint}>{milestoneSummaryHint}</Text>
          </View>
        </View>

        <Button
          title={copy.progressOpenButton}
          variant="ghost"
          size="sm"
          icon="chevron-forward"
          iconPosition="right"
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.Progress)}
        />
      </Card>
      </Animated.View>
    </ScreenContainer>
  );
}
