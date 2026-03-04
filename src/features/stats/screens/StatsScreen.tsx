import React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../../components/ui/Card';
import { InfoRow } from '../../../components/ui/InfoRow';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Text } from '../../../components/ui/Text';
import { Dream } from '../../dreams/model/dream';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { STATS_COPY } from '../../../constants/copy/stats';
import { statsScreenStyles } from './StatsScreen.styles';

function toDreamDate(dream: Dream) {
  const value = dream.sleepDate ?? new Date(dream.createdAt).toISOString().slice(0, 10);
  return new Date(`${value}T00:00:00`);
}

function countWords(text?: string) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0;
}

function getCurrentStreak(dreams: Dream[]) {
  const uniqueDays = Array.from(
    new Set(dreams.map(dream => toDreamDate(dream).toISOString().slice(0, 10))),
  ).sort((a, b) => b.localeCompare(a));

  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const current = cursor.toISOString().slice(0, 10);
    if (day === current) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      const yesterday = new Date();
      yesterday.setHours(0, 0, 0, 0);
      yesterday.setDate(yesterday.getDate() - 1);
      if (day === yesterday.toISOString().slice(0, 10)) {
        streak += 1;
        cursor = yesterday;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
    break;
  }

  return streak;
}

function getEntriesLastSevenDays(dreams: Dream[]) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);

  return dreams.filter(dream => toDreamDate(dream) >= cutoff).length;
}

export default function StatsScreen() {
  const [dreams, setDreams] = React.useState(() => listDreams());

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  const totalWords = dreams.reduce((sum, dream) => sum + countWords(dream.text), 0);
  const voiceNotes = dreams.filter(dream => Boolean(dream.audioUri)).length;
  const taggedEntries = dreams.filter(dream => dream.tags.length > 0).length;
  const positive = dreams.filter(dream => dream.mood === 'positive').length;
  const neutral = dreams.filter(dream => dream.mood === 'neutral').length;
  const negative = dreams.filter(dream => dream.mood === 'negative').length;
  const streak = getCurrentStreak(dreams);
  const lastSevenDays = getEntriesLastSevenDays(dreams);
  const averageWords = dreams.length ? Math.round(totalWords / dreams.length) : 0;

  return (
    <ScreenContainer scroll>
      <SectionHeader title={STATS_COPY.title} subtitle={STATS_COPY.subtitle} large />

      <View style={statsScreenStyles.summaryRow}>
        <StatCard label={STATS_COPY.currentStreak} value={streak} />
        <StatCard label={STATS_COPY.lastSevenDays} value={lastSevenDays} />
      </View>

      <Card style={statsScreenStyles.sectionCard}>
        <Text style={statsScreenStyles.sectionTitle}>{STATS_COPY.journalVolume}</Text>
        <InfoRow label={STATS_COPY.entries} value={dreams.length} />
        <InfoRow label={STATS_COPY.wordsSaved} value={totalWords} />
        <InfoRow label={STATS_COPY.averageWords} value={averageWords} />
      </Card>

      <Card style={statsScreenStyles.sectionCard}>
        <Text style={statsScreenStyles.sectionTitle}>{STATS_COPY.entryStructure}</Text>
        <InfoRow label={STATS_COPY.voiceNotes} value={voiceNotes} />
        <InfoRow label={STATS_COPY.taggedDreams} value={taggedEntries} />
      </Card>

      <Card style={statsScreenStyles.sectionCard}>
        <Text style={statsScreenStyles.sectionTitle}>{STATS_COPY.moodBreakdown}</Text>
        <InfoRow label={STATS_COPY.bright} value={positive} />
        <InfoRow label={STATS_COPY.calm} value={neutral} />
        <InfoRow label={STATS_COPY.heavy} value={negative} />
      </Card>
    </ScreenContainer>
  );
}
