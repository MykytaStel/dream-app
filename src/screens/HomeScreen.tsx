/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { listDreams } from '../storage/dreams';
import { Dream } from '../types/dream';
import { Theme } from '../theme/theme';

function formatPreview(dream: Dream) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > 140 ? `${text.slice(0, 137)}...` : text;
  }

  if (dream.audioUri) {
    return 'Voice note saved. Transcript can be added later.';
  }

  return 'No written details yet.';
}

function moodLabel(mood?: Dream['mood']) {
  if (mood === 'positive') return 'Bright';
  if (mood === 'negative') return 'Heavy';
  if (mood === 'neutral') return 'Calm';
  return undefined;
}

export default function HomeScreen() {
  const t = useTheme<Theme>();
  const [dreams, setDreams] = React.useState(() => listDreams());

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  if (!dreams.length) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          justifyContent: 'center',
          backgroundColor: t.colors.background,
        }}
      >
        <Card style={{ gap: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>No dreams yet</Text>
          <Text style={{ color: t.colors.textDim }}>
            Record the first one from the New tab. Keep it fast: title, voice note,
            or a few raw lines are enough.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Dream log</Text>
        <Text style={{ color: t.colors.textDim }}>
          Your latest entries are stored locally and ready for future analysis.
        </Text>
      </View>

      {dreams.map(dream => {
        const mood = moodLabel(dream.mood);
        return (
          <Card key={dream.id} style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>
                {dream.title || 'Untitled dream'}
              </Text>
              <Text style={{ color: t.colors.textDim }}>
                {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
                {' · '}
                {new Date(dream.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={{ color: t.colors.textDim }}>{formatPreview(dream)}</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {mood ? (
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: t.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: t.colors.border,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ fontWeight: '600' }}>{mood}</Text>
                </View>
              ) : null}

              {dream.audioUri ? (
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: t.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: t.colors.border,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ fontWeight: '600' }}>Audio</Text>
                </View>
              ) : null}

              {dream.tags.map(tag => (
                <View
                  key={tag}
                  style={{
                    borderRadius: 999,
                    backgroundColor: t.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: t.colors.border,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ fontWeight: '600' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}
