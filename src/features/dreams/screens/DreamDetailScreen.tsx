import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { InfoRow } from '../../../components/ui/InfoRow';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { DREAM_COPY, DREAM_MOOD_LABELS } from '../../../constants/copy/dreams';
import { Theme } from '../../../theme/theme';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { Dream } from '../model/dream';
import { countDreamWords } from '../model/dreamAnalytics';
import { deleteDream, getDream } from '../repository/dreamsRepository';
import { createDreamDetailScreenStyles } from './DreamDetailScreen.styles';
import { Button } from '../../../components/ui/Button';

function moodColor(theme: Theme, mood?: Dream['mood']) {
  if (mood === 'positive') {
    return theme.colors.accent;
  }

  if (mood === 'negative') {
    return theme.colors.primaryAlt;
  }

  return theme.colors.primary;
}

function formatMetaDate(value: number | string) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DreamDetailScreen() {
  const t = useTheme<Theme>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.DreamDetail>>();
  const styles = createDreamDetailScreenStyles(t);
  const [dream, setDream] = React.useState(() => getDream(route.params.dreamId));

  useFocusEffect(
    React.useCallback(() => {
      setDream(getDream(route.params.dreamId));
    }, [route.params.dreamId]),
  );

  if (!dream) {
    return (
      <ScreenContainer scroll>
        <Card style={styles.heroCard}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backLabel}>{DREAM_COPY.detailBack}</Text>
          </Pressable>
          <SectionHeader
            title={DREAM_COPY.detailMissingTitle}
            subtitle={DREAM_COPY.detailMissingDescription}
            large
          />
        </Card>
      </ScreenContainer>
    );
  }

  const dreamId = dream.id;
  const moodLabel = dream.mood ? DREAM_MOOD_LABELS[dream.mood] : undefined;
  const wordsCount = countDreamWords(dream.text);

  function onDeleteDream() {
    Alert.alert(
      DREAM_COPY.detailDeleteTitle,
      DREAM_COPY.detailDeleteDescription,
      [
        {
          text: DREAM_COPY.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: DREAM_COPY.detailDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            deleteDream(dreamId);
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backLabel}>{DREAM_COPY.detailBack}</Text>
        </Pressable>

        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>{DREAM_COPY.detailMetaTitle}</Text>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>{dream.title || DREAM_COPY.untitled}</Text>
            <View
              style={[
                styles.moodDot,
                { backgroundColor: moodColor(t, dream.mood) },
              ]}
            />
          </View>
          <Text style={styles.heroSubtitle}>
            {dream.sleepDate ? formatMetaDate(dream.sleepDate) : formatMetaDate(dream.createdAt)}
          </Text>
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>{DREAM_COPY.sleepDateLabel}</Text>
            <Text style={styles.metaChipValue}>
              {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>{DREAM_COPY.wordsUnit}</Text>
            <Text style={styles.metaChipValue}>{wordsCount}</Text>
          </View>
          {moodLabel ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>{DREAM_COPY.moodTitle}</Text>
              <Text style={styles.metaChipValue}>{moodLabel}</Text>
            </View>
          ) : null}
        </View>

        <Button
          title={DREAM_COPY.detailEdit}
          variant="ghost"
          onPress={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
              dreamId,
            })
          }
        />
        <Button
          title={DREAM_COPY.detailDelete}
          variant="danger"
          onPress={onDeleteDream}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{DREAM_COPY.detailTranscriptTitle}</Text>
        <Text style={dream.text ? styles.bodyText : styles.mutedText}>
          {dream.text || DREAM_COPY.detailTranscriptEmpty}
        </Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{DREAM_COPY.tagsTitle}</Text>
        <View style={styles.tagsRow}>
          {dream.tags.length ? (
            dream.tags.map(tag => <TagChip key={tag} label={tag} />)
          ) : (
            <Text style={styles.mutedText}>{DREAM_COPY.detailTagsEmpty}</Text>
          )}
        </View>
      </Card>

      {dream.audioUri ? (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{DREAM_COPY.voiceTitle}</Text>
          <View style={styles.audioCard}>
            <Text>{DREAM_COPY.detailAudioDescription}</Text>
            <InfoRow label={DREAM_COPY.detailAudioPathLabel} value={dream.audioUri} />
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
