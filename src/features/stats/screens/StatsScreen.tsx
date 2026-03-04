/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { Dream } from '../../dreams/model/dream';
import { listDreams } from '../../dreams/repository/dreamsRepository';

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
  const t = useTheme<Theme>();
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
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Stats</Text>
        <Text style={{ color: t.colors.textDim }}>
          Lightweight analytics from local dream entries.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700' }}>Current streak</Text>
          <Text style={{ marginTop: 6, fontSize: 28, fontWeight: '700' }}>
            {streak}
          </Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700' }}>Last 7 days</Text>
          <Text style={{ marginTop: 6, fontSize: 28, fontWeight: '700' }}>
            {lastSevenDays}
          </Text>
        </Card>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={{ fontWeight: '700' }}>Journal volume</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Entries</Text>
          <Text>{dreams.length}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Words saved</Text>
          <Text>{totalWords}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Average words</Text>
          <Text>{averageWords}</Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ fontWeight: '700' }}>Entry structure</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Voice notes</Text>
          <Text>{voiceNotes}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Tagged dreams</Text>
          <Text>{taggedEntries}</Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ fontWeight: '700' }}>Mood breakdown</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Bright</Text>
          <Text>{positive}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Calm</Text>
          <Text>{neutral}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.colors.textDim }}>Heavy</Text>
          <Text>{negative}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}
