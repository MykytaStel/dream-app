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
import { STATS_COPY } from '../../../constants/copy/stats';
import { Theme } from '../../../theme/theme';
import {
  countDreamWords,
  getAverageWords,
  getCurrentStreak,
  getEntriesLastSevenDays,
  getMoodCounts,
} from '../../dreams/model/dreamAnalytics';
import { createStatsScreenStyles } from './StatsScreen.styles';

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

export default function StatsScreen() {
  const t = useTheme<Theme>();
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
  const streak = getCurrentStreak(dreams);
  const lastSevenDays = getEntriesLastSevenDays(dreams);
  const averageWords = getAverageWords(dreams);
  const recurringTags = getRecurringTags(dreams.flatMap(dream => dream.tags));
  const moodItems = [
    { label: STATS_COPY.bright, count: moodCounts.positive, color: t.colors.accent },
    { label: STATS_COPY.calm, count: moodCounts.neutral, color: t.colors.primary },
    { label: STATS_COPY.heavy, count: moodCounts.negative, color: t.colors.primaryAlt },
  ];
  const maxMoodCount = Math.max(...moodItems.map(item => item.count), 1);

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>{STATS_COPY.title}</Text>
          <SectionHeader title={STATS_COPY.title} subtitle={STATS_COPY.subtitle} large />
          <Text style={styles.monthLabel}>{STATS_COPY.monthLabel}</Text>
        </View>

        <View style={styles.summaryRow}>
          <StatCard label={STATS_COPY.currentStreak} value={streak} />
          <StatCard label={STATS_COPY.lastSevenDays} value={lastSevenDays} />
          <StatCard label={STATS_COPY.averageWordsShort} value={averageWords} />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{STATS_COPY.journalVolume}</Text>
        <InfoRow label={STATS_COPY.entries} value={dreams.length} />
        <InfoRow label={STATS_COPY.wordsSaved} value={totalWords} />
        <InfoRow label={STATS_COPY.averageWords} value={averageWords} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{STATS_COPY.entryStructure}</Text>
        <InfoRow label={STATS_COPY.voiceNotes} value={voiceNotes} />
        <InfoRow label={STATS_COPY.taggedDreams} value={taggedEntries} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{STATS_COPY.moodBreakdown}</Text>
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
        <Text style={styles.sectionTitle}>{STATS_COPY.recurringThemes}</Text>
        <View style={styles.tagsWrap}>
          {recurringTags.length ? (
            recurringTags.map(tag => <TagChip key={tag} label={tag} />)
          ) : (
            <Text style={styles.monthLabel}>Add tags to surface recurring themes here.</Text>
          )}
        </View>
      </Card>
    </ScreenContainer>
  );
}
