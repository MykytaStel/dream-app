import React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { InfoRow } from '../../../components/ui/InfoRow';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { getStatsCopy } from '../../../constants/copy/stats';
import { Theme } from '../../../theme/theme';
import {
  countDreamWords,
  getAverageWords,
  getCurrentStreak,
  getEntriesLastSevenDays,
  getMoodCorrelationStats,
  getMoodCounts,
  type NegativeMoodRate,
  getSleepContextStats,
} from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getTranscriptArchiveStats,
  type DreamReflectionSignal,
} from '../model/dreamReflection';
import {
  getDreamAchievements,
  getDreamAchievementSummary,
  type DreamAchievementId,
} from '../model/achievements';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';

function formatCountWithShare(count: number, total: number) {
  if (total <= 0) {
    return '0 (0%)';
  }

  return `${count} (${Math.round((count / total) * 100)}%)`;
}

function formatReflectionSource(signal: DreamReflectionSignal, copy: ReturnType<typeof getStatsCopy>) {
  if (signal.source === 'mixed') {
    return copy.reflectionSourceMixed;
  }

  return signal.source === 'tag' ? copy.reflectionSourceTag : copy.reflectionSourceTranscript;
}

function formatNegativeRate(metric: NegativeMoodRate, noData: string, baselineRate?: number) {
  if (typeof metric.rate !== 'number') {
    return noData;
  }

  const delta =
    typeof baselineRate === 'number'
      ? `${metric.rate - baselineRate >= 0 ? '+' : ''}${metric.rate - baselineRate}pp`
      : undefined;

  return `${metric.rate}% (${metric.negativeCount}/${metric.total}${
    delta ? `, ${delta}` : ''
  })`;
}

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

export default function StatsScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const [dreams, setDreams] = React.useState(() => listDreams());
  const styles = createStatsScreenStyles(t);

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  const totalWords = dreams.reduce((sum, dream) => sum + countDreamWords(dream.text), 0);
  const voiceNotes = dreams.filter(dream => Boolean(dream.audioUri)).length;
  const transcribedDreams = dreams.filter(dream => Boolean(dream.transcript?.trim())).length;
  const taggedEntries = dreams.filter(dream => dream.tags.length > 0).length;
  const moodEntries = dreams.filter(dream => Boolean(dream.mood)).length;
  const moodCounts = getMoodCounts(dreams);
  const moodCorrelation = getMoodCorrelationStats(dreams);
  const streak = getCurrentStreak(dreams);
  const lastSevenDays = getEntriesLastSevenDays(dreams);
  const averageWords = getAverageWords(dreams);
  const sleepContextStats = getSleepContextStats(dreams);
  const transcriptArchiveStats = getTranscriptArchiveStats(dreams);
  const recurringThemes = getRecurringReflectionSignals(dreams, { limit: 6 });
  const recurringSymbols = getRecurringReflectionSignals(dreams, {
    limit: 6,
    transcriptOnly: true,
  });
  const achievements = getDreamAchievements(dreams);
  const achievementSummary = getDreamAchievementSummary(achievements);
  const weeklyGoalTarget = 3;
  const weeklyGoalComplete = lastSevenDays >= weeklyGoalTarget;
  const moodItems = [
    { label: copy.bright, count: moodCounts.positive, color: t.colors.accent },
    { label: copy.calm, count: moodCounts.neutral, color: t.colors.primary },
    { label: copy.heavy, count: moodCounts.negative, color: t.colors.primaryAlt },
  ];
  const maxMoodCount = Math.max(...moodItems.map(item => item.count), 1);
  const baselineNegativeRate = moodCorrelation.overall.rate;
  const showReadinessCard =
    dreams.length > 0 && (dreams.length < 3 || moodEntries < 2 || sleepContextStats.withContext < 2);

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
          <Text style={styles.heroEyebrow}>{copy.title}</Text>
          <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
          <Text style={styles.monthLabel}>{copy.monthLabel}</Text>
        </View>

        <View style={styles.summaryRow}>
          <StatCard label={copy.currentStreak} value={streak} />
          <StatCard label={copy.lastSevenDays} value={lastSevenDays} />
          <StatCard label={copy.averageWordsShort} value={averageWords} />
        </View>
      </Card>

      {showReadinessCard ? (
        <Card style={styles.sectionCard}>
          <SectionHeader title={copy.readinessTitle} subtitle={copy.readinessDescription} />
          <InfoRow label={copy.entries} value={dreams.length} />
          <InfoRow label={copy.entriesWithMood} value={moodEntries} />
          <InfoRow label={copy.entriesWithTags} value={taggedEntries} />
          <InfoRow label={copy.entriesWithContext} value={sleepContextStats.withContext} />
          <Text style={styles.sectionHint}>{copy.readinessHint}</Text>
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.milestonesTitle} subtitle={copy.milestonesDescription} />
        <View style={styles.weeklyGoalCard}>
          <View style={styles.achievementHeaderRow}>
            <View style={styles.achievementCopy}>
              <Text style={styles.achievementTitle}>{copy.weeklyGoalTitle}</Text>
              <Text style={styles.achievementDescription}>{copy.weeklyGoalDescription}</Text>
            </View>
            <View
              style={[
                styles.achievementBadge,
                weeklyGoalComplete ? styles.achievementBadgeUnlocked : null,
              ]}
            >
              <Text
                style={[
                  styles.achievementBadgeText,
                  weeklyGoalComplete ? styles.achievementBadgeTextUnlocked : null,
                ]}
              >
                {weeklyGoalComplete ? copy.weeklyGoalStatusDone : copy.weeklyGoalStatusPending}
              </Text>
            </View>
          </View>
          <InfoRow label={copy.weeklyGoalProgressLabel} value={`${lastSevenDays}/${weeklyGoalTarget}`} />
          <InfoRow label={copy.weeklyGoalTargetLabel} value={weeklyGoalTarget} />
        </View>

        <View style={styles.milestoneSummaryCard}>
          <View style={styles.achievementHeaderRow}>
            <View style={styles.achievementCopy}>
              <Text style={styles.achievementTitle}>
                {achievementSummary.unlockedCount === achievementSummary.totalCount
                  ? copy.milestonesCompleteTitle
                  : copy.milestonesTitle}
              </Text>
              <Text style={styles.achievementDescription}>
                {achievementSummary.unlockedCount === achievementSummary.totalCount
                  ? copy.milestonesCompleteDescription
                  : copy.milestonesDescription}
              </Text>
            </View>
            <View style={[styles.achievementBadge, styles.achievementBadgeUnlocked]}>
              <Text style={[styles.achievementBadgeText, styles.achievementBadgeTextUnlocked]}>
                {`${achievementSummary.unlockedCount}/${achievementSummary.totalCount}`}
              </Text>
            </View>
          </View>
          <InfoRow
            label={copy.milestonesUnlockedLabel}
            value={`${achievementSummary.unlockedCount}/${achievementSummary.totalCount}`}
          />
          {achievementSummary.highlightedId ? (
            <InfoRow
              label={copy.milestoneHighlightLabel}
              value={getAchievementContent(achievementSummary.highlightedId, copy).title}
            />
          ) : null}
        </View>

        <View style={styles.achievementsList}>
          {achievements.map(achievement => {
            const content = getAchievementContent(achievement.id, copy);
            const progressValue = `${Math.min(achievement.current, achievement.target)}/${achievement.target}`;
            const progressRatio = Math.min(achievement.current / achievement.target, 1);
            const isHighlighted = achievement.id === achievementSummary.highlightedId;

            return (
              <View
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  achievement.unlocked ? styles.achievementItemUnlocked : null,
                  isHighlighted ? styles.achievementItemHighlighted : null,
                ]}
              >
                <View style={styles.achievementHeaderRow}>
                  <View style={styles.achievementCopy}>
                    <Text style={styles.achievementTitle}>{content.title}</Text>
                    <Text style={styles.achievementDescription}>{content.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.achievementBadge,
                      achievement.unlocked ? styles.achievementBadgeUnlocked : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.achievementBadgeText,
                        achievement.unlocked ? styles.achievementBadgeTextUnlocked : null,
                      ]}
                    >
                      {achievement.unlocked ? copy.milestoneUnlocked : copy.milestoneInProgress}
                    </Text>
                  </View>
                </View>
                <InfoRow label={copy.milestoneProgressLabel} value={progressValue} />
                <View style={styles.achievementProgressTrack}>
                  <View
                    style={[
                      styles.achievementProgressFill,
                      achievement.unlocked ? styles.achievementProgressFillUnlocked : null,
                      { width: `${progressRatio * 100}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.journalVolume}</Text>
        <InfoRow label={copy.entries} value={dreams.length} />
        <InfoRow label={copy.wordsSaved} value={totalWords} />
        <InfoRow label={copy.averageWords} value={averageWords} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.entryStructure}</Text>
        <InfoRow label={copy.voiceNotes} value={voiceNotes} />
        <InfoRow label={copy.transcribedDreams} value={transcribedDreams} />
        <InfoRow label={copy.generatedTranscripts} value={transcriptArchiveStats.generatedTranscript} />
        <InfoRow label={copy.editedTranscripts} value={transcriptArchiveStats.editedTranscript} />
        <InfoRow label={copy.audioOnlyDreams} value={transcriptArchiveStats.audioOnly} />
        <InfoRow label={copy.taggedDreams} value={taggedEntries} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.moodBreakdown}</Text>
        {moodEntries > 0 ? (
          moodItems.map(item => (
            <View key={item.label} style={styles.moodRow}>
              <Text style={styles.moodLabel}>{item.label}</Text>
              <View style={styles.moodTrack}>
                <View
                  style={[
                    styles.moodFill,
                    {
                      width: `${(item.count / maxMoodCount) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.moodValue}>{item.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.mutedText}>{copy.moodBreakdownEmpty}</Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.sleepContextBreakdown}</Text>
        {sleepContextStats.withContext > 0 ? (
          <>
            <InfoRow
              label={copy.entriesWithContext}
              value={formatCountWithShare(sleepContextStats.withContext, dreams.length)}
            />
            <InfoRow
              label={copy.averageStressLevel}
              value={
                typeof sleepContextStats.averageStress === 'number'
                  ? `${sleepContextStats.averageStress.toFixed(1)} / 3`
                  : copy.noData
              }
            />
            <InfoRow
              label={copy.alcoholBeforeSleep}
              value={formatCountWithShare(sleepContextStats.alcoholTaken, dreams.length)}
            />
            <InfoRow
              label={copy.lateCaffeine}
              value={formatCountWithShare(sleepContextStats.caffeineLate, dreams.length)}
            />
            <InfoRow
              label={copy.medicationsNoted}
              value={formatCountWithShare(sleepContextStats.medications, dreams.length)}
            />
            <InfoRow
              label={copy.importantEventsNoted}
              value={formatCountWithShare(sleepContextStats.importantEvents, dreams.length)}
            />
            <InfoRow
              label={copy.healthNotesNoted}
              value={formatCountWithShare(sleepContextStats.healthNotes, dreams.length)}
            />
          </>
        ) : (
          <Text style={styles.mutedText}>{copy.sleepContextEmpty}</Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.moodSignalTitle}</Text>
        {moodCorrelation.overall.total > 0 ? (
          <>
            <InfoRow
              label={copy.negativeMoodRate}
              value={formatNegativeRate(moodCorrelation.overall, copy.noData)}
            />
            <InfoRow
              label={copy.negativeWithAlcohol}
              value={formatNegativeRate(
                moodCorrelation.alcoholTaken,
                copy.noData,
                baselineNegativeRate,
              )}
            />
            <InfoRow
              label={copy.negativeWithoutAlcohol}
              value={formatNegativeRate(
                moodCorrelation.noAlcohol,
                copy.noData,
                baselineNegativeRate,
              )}
            />
            <InfoRow
              label={copy.negativeWithLateCaffeine}
              value={formatNegativeRate(
                moodCorrelation.caffeineLate,
                copy.noData,
                baselineNegativeRate,
              )}
            />
            <InfoRow
              label={copy.negativeWithoutLateCaffeine}
              value={formatNegativeRate(
                moodCorrelation.noLateCaffeine,
                copy.noData,
                baselineNegativeRate,
              )}
            />
            <InfoRow
              label={copy.negativeWithHighStress}
              value={formatNegativeRate(
                moodCorrelation.highStress,
                copy.noData,
                baselineNegativeRate,
              )}
            />
            <InfoRow
              label={copy.negativeWithLowStress}
              value={formatNegativeRate(
                moodCorrelation.lowStress,
                copy.noData,
                baselineNegativeRate,
              )}
            />
          </>
        ) : (
          <Text style={styles.mutedText}>{copy.moodSignalEmpty}</Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <SectionHeader
          title={copy.localReflectionTitle}
          subtitle={copy.localReflectionDescription}
        />

        <Text style={styles.sectionTitle}>{copy.recurringThemes}</Text>
        <View style={styles.reflectionList}>
          {recurringThemes.length ? (
            recurringThemes.map(signal => (
              <View key={`theme-${signal.label}`} style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.reflectionLabel}>{signal.label}</Text>
                  <TagChip label={formatReflectionSource(signal, copy)} />
                </View>
                <Text style={styles.reflectionMeta}>
                  {signal.dreamCount} {copy.reflectionThemeCountLabel}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.monthLabel}>{copy.recurringThemesEmpty}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>{copy.recurringSymbols}</Text>
        <View style={styles.tagsWrap}>
          {recurringSymbols.length ? (
            recurringSymbols.map(signal => (
              <TagChip
                key={`symbol-${signal.label}`}
                label={`${signal.label} · ${signal.dreamCount}`}
              />
            ))
          ) : (
            <Text style={styles.monthLabel}>{copy.recurringSymbolsEmpty}</Text>
          )}
        </View>
      </Card>
    </ScreenContainer>
  );
}
