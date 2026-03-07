import React from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
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

type InsightRange = 'all' | '30d' | '7d';
type PatternChipItem = {
  key: string;
  label: string;
  onPress?: () => void;
};

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

function formatCoverageValue(value: number, total: number) {
  return `${value}/${Math.max(total, 0)}`;
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
  const styles = createStatsScreenStyles(t);

  const openPatternDetail = React.useCallback((signal: string, kind: PatternDetailKind) => {
    navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
      signal,
      kind,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  const scopedDreams = React.useMemo(
    () => filterDreamsByRange(dreams, selectedRange),
    [dreams, selectedRange],
  );
  const totalWords = scopedDreams.reduce((sum, dream) => sum + countDreamWords(dream.text), 0);
  const voiceNotes = scopedDreams.filter(dream => Boolean(dream.audioUri)).length;
  const transcribedDreams = scopedDreams.filter(dream => Boolean(dream.transcript?.trim())).length;
  const taggedEntries = scopedDreams.filter(dream => dream.tags.length > 0).length;
  const moodEntries = scopedDreams.filter(dream => Boolean(dream.mood)).length;
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
  const entriesWithoutMood = Math.max(scopedDreams.length - moodEntries, 0);
  const entriesWithoutContext = Math.max(scopedDreams.length - sleepContextStats.withContext, 0);
  const rangeOptions = [
    { key: 'all' as const, label: copy.rangeAll },
    { key: '30d' as const, label: copy.range30Days },
    { key: '7d' as const, label: copy.range7Days },
  ];
  const summaryTiles = [
    { label: copy.entries, value: scopedDreams.length },
    { label: copy.wordsSaved, value: totalWords },
    { label: copy.voiceNotes, value: voiceNotes },
    { label: copy.transcribedDreams, value: transcribedDreams },
  ];
  const coverageGap =
    [
      { label: copy.takeawayGapAudioOnly, value: transcriptArchiveStats.audioOnly },
      { label: copy.takeawayGapMood, value: entriesWithoutMood },
      { label: copy.takeawayGapContext, value: entriesWithoutContext },
    ].sort((a, b) => b.value - a.value)[0] ?? null;
  const takeawayItems = [
    {
      label: copy.takeawayWordsLabel,
      value: topWord?.label ?? copy.noData,
      hint: topWord
        ? `${topWord.dreamCount} ${copy.reflectionThemeCountLabel}`
        : copy.takeawayWordsEmpty,
      onPress: topWord ? () => openPatternDetail(topWord.label, 'word') : undefined,
    },
    {
      label: copy.takeawayThemesLabel,
      value: topTheme?.label ?? copy.noData,
      hint: topTheme
        ? `${topTheme.dreamCount} ${copy.reflectionThemeCountLabel}`
        : copy.takeawayThemesEmpty,
      onPress: topTheme ? () => openPatternDetail(topTheme.label, 'theme') : undefined,
    },
    {
      label: copy.takeawayGapsLabel,
      value: coverageGap?.value ? coverageGap.label : copy.noData,
      hint:
        coverageGap && coverageGap.value > 0
          ? `${coverageGap.value} ${copy.entries}`
          : copy.takeawayGapsEmpty,
      onPress: undefined,
    },
  ];
  const coverageItems = [
    {
      label: copy.transcribedDreams,
      value: transcribedDreams,
      total: scopedDreams.length,
    },
    {
      label: copy.taggedDreams,
      value: taggedEntries,
      total: scopedDreams.length,
    },
    {
      label: copy.entriesWithContext,
      value: sleepContextStats.withContext,
      total: scopedDreams.length,
    },
  ];
  const attentionItems = [
    {
      label: copy.audioOnlyDreams,
      value: transcriptArchiveStats.audioOnly,
    },
    {
      label: copy.entriesWithoutMood,
      value: entriesWithoutMood,
    },
    {
      label: copy.entriesWithoutContext,
      value: entriesWithoutContext,
    },
  ];
  const patternGroups: Array<{ label: string; values: PatternChipItem[]; empty: string }> = [
    {
      label: copy.recurringWords,
      values: recurringWords.map(signal => ({
        key: signal.label,
        label: `${signal.label} · ${signal.dreamCount}`,
        onPress: () => openPatternDetail(signal.label, 'word'),
      })),
      empty: copy.recurringWordsEmpty,
    },
    {
      label: copy.recurringThemes,
      values: recurringThemes.map(signal => ({
        key: signal.label,
        label: `${signal.label} · ${signal.dreamCount}`,
        onPress: () => openPatternDetail(signal.label, 'theme'),
      })),
      empty: copy.recurringThemesEmpty,
    },
    {
      label: copy.recurringSymbols,
      values: recurringSymbols.map(signal => ({
        key: signal.label,
        label: `${signal.label} · ${signal.dreamCount}`,
        onPress: () => openPatternDetail(signal.label, 'symbol'),
      })),
      empty: copy.recurringSymbolsEmpty,
    },
    {
      label: copy.preSleepEmotions,
      values: preSleepEmotionSignals.map(signal => ({
        key: signal.emotion,
        label: `${preSleepEmotionLabels[signal.emotion]} · ${signal.count}`,
      })),
      empty: copy.emotionPatternsEmpty,
    },
  ];

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
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>{copy.monthLabel}</Text>
          <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
        </View>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{copy.currentStreak}</Text>
            <Text style={styles.summaryValue}>{overallStreak}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{copy.lastSevenDays}</Text>
            <Text style={styles.summaryValue}>{overallLastSevenDays}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{copy.averageWordsShort}</Text>
            <Text style={styles.summaryValue}>{averageWords}</Text>
          </Card>
        </View>

        <View style={styles.rangeHeader}>
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
      </Card>

      {!scopedDreams.length ? (
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      ) : (
        <>
          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.snapshotTitle} subtitle={copy.snapshotDescription} />
            <View style={styles.metricGrid}>
              {summaryTiles.map(tile => (
                <View key={tile.label} style={styles.metricTile}>
                  <Text style={styles.metricLabel}>{tile.label}</Text>
                  <Text style={styles.metricValue}>{tile.value}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.takeawaysTitle} subtitle={copy.takeawaysDescription} />
            <View style={styles.insightGrid}>
              {takeawayItems.map(item => (
                <Pressable
                  key={item.label}
                  disabled={!item.onPress}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.insightCard,
                    item.onPress ? styles.insightCardInteractive : null,
                    pressed && item.onPress ? styles.insightCardPressed : null,
                  ]}
                >
                  <Text style={styles.insightLabel}>{item.label}</Text>
                  <Text style={styles.insightValue} numberOfLines={2}>
                    {item.value}
                  </Text>
                  <Text style={styles.insightHint} numberOfLines={2}>
                    {item.hint}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.coverageTitle} subtitle={copy.coverageDescription} />
            <View style={styles.coverageList}>
              {coverageItems.map(item => (
                <View key={item.label} style={styles.coverageItem}>
                  <View style={styles.coverageHeader}>
                    <Text style={styles.coverageLabel}>{item.label}</Text>
                    <Text style={styles.coverageValue}>
                      {formatCoverageValue(item.value, item.total)}
                    </Text>
                  </View>
                  <View style={styles.coverageTrack}>
                    <View
                      style={[
                        styles.coverageFill,
                        { width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.attentionTitle} subtitle={copy.attentionDescription} />
            <View style={styles.attentionRow}>
              {attentionItems.map(item => (
                <View key={item.label} style={styles.attentionCard}>
                  <Text style={styles.attentionValue}>{item.value}</Text>
                  <Text style={styles.attentionLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.patternsTitle} subtitle={copy.patternsDescription} />
            <View style={styles.patternGroupList}>
              {patternGroups.map(group => (
                <View key={group.label} style={styles.patternGroup}>
                  <Text style={styles.patternGroupLabel}>{group.label}</Text>
                  {group.values.length ? (
                    <View style={styles.tagsWrap}>
                      {group.values.slice(0, 6).map(value => (
                        <TagChip
                          key={`${group.label}-${value.key}`}
                          label={value.label}
                          onPress={value.onPress}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.mutedText}>{group.empty}</Text>
                  )}
                </View>
              ))}
            </View>
          </Card>
        </>
      )}

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
            <Text style={styles.teaserHint}>
              {achievementSummary.highlightedId
                ? getAchievementContent(achievementSummary.highlightedId, copy).title
                : copy.milestoneInProgress}
            </Text>
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
    </ScreenContainer>
  );
}
