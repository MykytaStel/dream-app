/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { Dream } from '../model/dream';
import { listDreams } from '../repository/dreamsRepository';
import { DREAM_COPY, DREAM_MOOD_LABELS } from '../../../constants/copy/dreams';
import { DREAM_PREVIEW_MAX_LENGTH } from '../../../constants/limits/dreams';

function formatPreview(dream: Dream) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > DREAM_PREVIEW_MAX_LENGTH
      ? `${text.slice(0, DREAM_PREVIEW_MAX_LENGTH - 3)}...`
      : text;
  }

  if (dream.audioUri) {
    return DREAM_COPY.audioOnlyPreview;
  }

  return DREAM_COPY.noDetailsPreview;
}

function moodLabel(mood?: Dream['mood']) {
  return mood ? DREAM_MOOD_LABELS[mood] : undefined;
}

export default function HomeScreen() {
  const [dreams, setDreams] = React.useState(() => listDreams());

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  if (!dreams.length) {
    return (
      <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
        <Card style={{ gap: 10 }}>
          <SectionHeader title={DREAM_COPY.emptyTitle} subtitle={DREAM_COPY.emptyDescription} />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionHeader
        title={DREAM_COPY.homeTitle}
        subtitle={DREAM_COPY.homeSubtitle}
        large
      />

      {dreams.map(dream => {
        const mood = moodLabel(dream.mood);
        return (
          <Card key={dream.id} style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>
                {dream.title || DREAM_COPY.untitled}
              </Text>
              <Text style={{ color: '#B6B6C2' }}>
                {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
                {' · '}
                {new Date(dream.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={{ color: '#B6B6C2' }}>{formatPreview(dream)}</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {mood ? <TagChip label={mood} /> : null}
              {dream.audioUri ? <TagChip label="Audio" /> : null}
              {dream.tags.map(tag => <TagChip key={tag} label={tag} />)}
            </View>
          </Card>
        );
      })}
    </ScreenContainer>
  );
}
