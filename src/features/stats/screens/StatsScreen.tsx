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
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';

function getRecurringTags(tags: string[]) {
  const entries = Object.entries(
    tags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {}),
  );

  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

function formatCountWithShare(count: number, total: number) {
  if (total <= 0) {
    return '0 (0%)';
  }

  return `${count} (${Math.round((count / total) * 100)}%)`;
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
  const taggedEntries = dreams.filter(dream => dream.tags.length > 0).length;
  const moodCounts = getMoodCounts(dreams);
  const moodCorrelation = getMoodCorrelationStats(dreams);
  const streak = getCurrentStreak(dreams);
  const lastSevenDays = getEntriesLastSevenDays(dreams);
  const averageWords = getAverageWords(dreams);
  const sleepContextStats = getSleepContextStats(dreams);
  const recurringTags = getRecurringTags(dreams.flatMap(dream => dream.tags));
  const moodItems = [
    { label: copy.bright, count: moodCounts.positive, color: t.colors.accent },
    { label: copy.calm, count: moodCounts.neutral, color: t.colors.primary },
    { label: copy.heavy, count: moodCounts.negative, color: t.colors.primaryAlt },
  ];
  const maxMoodCount = Math.max(...moodItems.map(item => item.count), 1);
  const baselineNegativeRate = moodCorrelation.overall.rate;

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

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.journalVolume}</Text>
        <InfoRow label={copy.entries} value={dreams.length} />
        <InfoRow label={copy.wordsSaved} value={totalWords} />
        <InfoRow label={copy.averageWords} value={averageWords} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.entryStructure}</Text>
        <InfoRow label={copy.voiceNotes} value={voiceNotes} />
        <InfoRow label={copy.taggedDreams} value={taggedEntries} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.moodBreakdown}</Text>
        {moodItems.map(item => (
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
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.sleepContextBreakdown}</Text>
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
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.moodSignalTitle}</Text>
        <InfoRow
          label={copy.negativeMoodRate}
          value={formatNegativeRate(moodCorrelation.overall, copy.noData)}
        />
        <InfoRow
          label={copy.negativeWithAlcohol}
          value={formatNegativeRate(moodCorrelation.alcoholTaken, copy.noData, baselineNegativeRate)}
        />
        <InfoRow
          label={copy.negativeWithoutAlcohol}
          value={formatNegativeRate(moodCorrelation.noAlcohol, copy.noData, baselineNegativeRate)}
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
          value={formatNegativeRate(moodCorrelation.highStress, copy.noData, baselineNegativeRate)}
        />
        <InfoRow
          label={copy.negativeWithLowStress}
          value={formatNegativeRate(moodCorrelation.lowStress, copy.noData, baselineNegativeRate)}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.recurringThemes}</Text>
        <View style={styles.tagsWrap}>
          {recurringTags.length ? (
            recurringTags.map(tag => <TagChip key={tag} label={tag} />)
          ) : (
            <Text style={styles.monthLabel}>{copy.recurringThemesEmpty}</Text>
          )}
        </View>
      </Card>
    </ScreenContainer>
  );
}
