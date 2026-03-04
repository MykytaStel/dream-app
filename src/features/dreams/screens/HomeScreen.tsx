import React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { Dream } from '../model/dream';
import { listDreams } from '../repository/dreamsRepository';
import { DREAM_COPY, DREAM_MOOD_LABELS } from '../../../constants/copy/dreams';
import { DREAM_PREVIEW_MAX_LENGTH } from '../../../constants/limits/dreams';
import { createHomeScreenStyles } from './HomeScreen.styles';

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
  const t = useTheme<Theme>();
  const [dreams, setDreams] = React.useState(() => listDreams());
  const styles = createHomeScreenStyles(t);

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  if (!dreams.length) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <Card style={styles.emptyCard}>
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
          <Card key={dream.id} style={styles.dreamCard}>
            <View style={styles.dreamMeta}>
              <Text style={styles.title}>
                {dream.title || DREAM_COPY.untitled}
              </Text>
              <Text style={styles.timestamp}>
                {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
                {' · '}
                {new Date(dream.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={styles.preview}>{formatPreview(dream)}</Text>

            <View style={styles.tags}>
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
