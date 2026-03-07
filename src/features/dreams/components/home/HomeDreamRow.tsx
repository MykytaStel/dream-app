import React from 'react';
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Card } from '../../../../components/ui/Card';
import { Text } from '../../../../components/ui/Text';
import {
  type DreamCopy,
} from '../../../../constants/copy/dreams';
import { DREAM_PREVIEW_MAX_LENGTH } from '../../../../constants/limits/dreams';
import { Theme } from '../../../../theme/theme';
import { getDreamLayout } from '../../constants/layout';
import { Dream, Mood } from '../../model/dream';
import { getDreamDate } from '../../model/dreamAnalytics';
import { isDreamArchived, isDreamStarred } from '../../model/homeTimeline';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';

function formatPreview(dream: Dream, copy: DreamCopy) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > DREAM_PREVIEW_MAX_LENGTH
      ? `${text.slice(0, DREAM_PREVIEW_MAX_LENGTH - 3)}...`
      : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    const prefix =
      dream.transcriptSource === 'edited'
        ? `${copy.editedTranscriptPreviewPrefix}: `
        : `${copy.transcriptPreviewPrefix}: `;
    const availableLength = Math.max(12, DREAM_PREVIEW_MAX_LENGTH - prefix.length);
    const clippedTranscript =
      transcript.length > availableLength
        ? `${transcript.slice(0, availableLength - 3)}...`
        : transcript;
    return `${prefix}${clippedTranscript}`;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

function moodLabel(mood: Dream['mood'] | undefined, moodLabels: Record<Mood, string>) {
  return mood ? moodLabels[mood] : undefined;
}

function moodColor(theme: Theme, mood?: Dream['mood']) {
  if (mood === 'positive') {
    return theme.colors.accent;
  }

  if (mood === 'negative') {
    return theme.colors.primaryAlt;
  }

  return theme.colors.primary;
}

function formatDateParts(dream: Dream) {
  const date = getDreamDate(dream);
  return {
    weekday: date.toLocaleDateString([], { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString([], { month: 'short' }),
  };
}

function getDreamStateLabels(dream: Dream, copy: DreamCopy, starred: boolean, archived: boolean) {
  return [
    starred ? copy.starredTag : null,
    archived ? copy.archivedTag : null,
    dream.transcriptSource === 'edited'
      ? copy.editedTranscriptTag
      : dream.transcript
        ? copy.transcriptTag
        : dream.audioUri
          ? copy.audioTag
          : null,
  ].filter((value): value is string => Boolean(value));
}

function SwipeActionButton({
  label,
  onPress,
  actionStyle,
  textStyle,
  hitSlop,
}: {
  label: string;
  onPress: () => void;
  actionStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  hitSlop: number;
}) {
  return (
    <Pressable hitSlop={hitSlop} style={actionStyle} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

type HomeDreamRowProps = {
  dream: Dream;
  copy: DreamCopy;
  moodLabels: Record<Mood, string>;
  theme: Theme;
  styles: ReturnType<typeof createHomeScreenStyles>;
  layout: ReturnType<typeof getDreamLayout>;
  closeActiveSwipe: () => void;
  closePreviousSwipe: (dreamId: string) => void;
  closeSwipe: (dreamId: string) => void;
  bindSwipeMethods: (dreamId: string, methods: SwipeableMethods) => void;
  onSwipeClosed: (dreamId: string) => void;
  onSwipeOpened: (dreamId: string) => void;
  openDreamDetail: (dreamId: string) => void;
  openDreamEditor: (dreamId: string) => void;
  openDreamQuickActions: (dream: Dream) => void;
  toggleArchiveFromList: (dream: Dream) => void;
  removeDreamFromList: (dreamId: string) => void;
};

export const HomeDreamRow = React.memo(function HomeDreamRow({
  dream,
  copy,
  moodLabels,
  theme,
  styles,
  layout,
  closeActiveSwipe,
  closePreviousSwipe,
  closeSwipe,
  bindSwipeMethods,
  onSwipeClosed,
  onSwipeOpened,
  openDreamDetail,
  openDreamEditor,
  openDreamQuickActions,
  toggleArchiveFromList,
  removeDreamFromList,
}: HomeDreamRowProps) {
  const mood = moodLabel(dream.mood, moodLabels);
  const dateParts = formatDateParts(dream);
  const archived = isDreamArchived(dream);
  const starred = isDreamStarred(dream);
  const stateLabels = getDreamStateLabels(dream, copy, starred, archived).slice(0, 2);
  const visibleTags = dream.tags.slice(0, 2);
  const hiddenTagCount = Math.max(0, dream.tags.length - visibleTags.length);
  const accentColor = starred ? theme.colors.accent : moodColor(theme, dream.mood);

  const renderRightActions = React.useCallback(
    (_: unknown, __: unknown, methods: SwipeableMethods) => {
      bindSwipeMethods(dream.id, methods);

      return (
        <View style={[styles.swipeActionsContainer, styles.swipeRightActionsContainer]}>
          <SwipeActionButton
            label={copy.swipeEdit}
            hitSlop={layout.swipeActionHitSlop}
            actionStyle={[styles.swipeAction, styles.swipeEditAction]}
            textStyle={styles.swipeActionText}
            onPress={() => {
              closeSwipe(dream.id);
              openDreamEditor(dream.id);
            }}
          />
          <SwipeActionButton
            label={copy.swipeDelete}
            hitSlop={layout.swipeActionHitSlop}
            actionStyle={[styles.swipeAction, styles.swipeDeleteAction]}
            textStyle={[styles.swipeActionText, styles.swipeActionTextInverted]}
            onPress={() => {
              closeSwipe(dream.id);
              removeDreamFromList(dream.id);
            }}
          />
        </View>
      );
    },
    [
      bindSwipeMethods,
      closeSwipe,
      copy.swipeDelete,
      copy.swipeEdit,
      dream.id,
      layout.swipeActionHitSlop,
      openDreamEditor,
      removeDreamFromList,
      styles,
    ],
  );

  const renderLeftActions = React.useCallback(
    (_: unknown, __: unknown, methods: SwipeableMethods) => {
      bindSwipeMethods(dream.id, methods);
      const archiveLabel = archived ? copy.swipeUnarchive : copy.swipeArchive;
      const archiveActionStyle = archived
        ? styles.swipeUnarchiveAction
        : styles.swipeArchiveAction;

      return (
        <View style={[styles.swipeActionsContainer, styles.swipeLeftActionsContainer]}>
          <SwipeActionButton
            label={archiveLabel}
            hitSlop={layout.swipeActionHitSlop}
            actionStyle={[styles.swipeAction, archiveActionStyle]}
            textStyle={[styles.swipeActionText, styles.swipeActionTextInverted]}
            onPress={() => {
              closeSwipe(dream.id);
              toggleArchiveFromList(dream);
            }}
          />
        </View>
      );
    },
    [
      archived,
      bindSwipeMethods,
      closeSwipe,
      copy.swipeArchive,
      copy.swipeUnarchive,
      dream,
      layout.swipeActionHitSlop,
      styles,
      toggleArchiveFromList,
    ],
  );

  return (
    <ReanimatedSwipeable
      containerStyle={styles.swipeableContainer}
      overshootRight={false}
      overshootLeft={false}
      leftThreshold={layout.swipeThreshold}
      rightThreshold={layout.swipeThreshold}
      dragOffsetFromLeftEdge={layout.swipeDragOffset}
      dragOffsetFromRightEdge={layout.swipeDragOffset}
      friction={1.9}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => closePreviousSwipe(dream.id)}
      onSwipeableOpen={() => onSwipeOpened(dream.id)}
      onSwipeableClose={() => onSwipeClosed(dream.id)}
    >
      <Pressable
        style={({ pressed }) => [
          styles.dreamPressable,
          pressed ? styles.dreamPressablePressed : null,
        ]}
        onPress={() => {
          closeActiveSwipe();
          openDreamDetail(dream.id);
        }}
        onLongPress={() => openDreamQuickActions(dream)}
        delayLongPress={220}
      >
        <Card style={styles.dreamCard}>
          <View style={styles.dreamHeaderRow}>
            <View style={[styles.dateBadge, starred ? styles.dateBadgeFeatured : null]}>
              <Text style={styles.weekday}>{dateParts.weekday}</Text>
              <Text style={styles.dayNumber}>{dateParts.day}</Text>
              <Text style={styles.month}>{dateParts.month}</Text>
            </View>

            <View style={styles.dreamHeaderCopy}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {dream.title || copy.untitled}
                </Text>
                {!mood ? (
                  <View style={[styles.moodDot, { backgroundColor: accentColor }]} />
                ) : null}
              </View>
              <View style={styles.timestampRow}>
                {mood ? (
                  <View style={styles.moodPill}>
                    <View style={[styles.moodDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.moodPillText}>{mood}</Text>
                  </View>
                ) : null}
                <Text style={styles.timestamp}>
                  {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
                  {' · '}
                  {new Date(dream.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.previewPanel}>
            <View style={[styles.previewAccent, { backgroundColor: accentColor }]} />
            <Text style={styles.preview} numberOfLines={3}>
              {formatPreview(dream, copy)}
            </Text>
          </View>

          <View style={styles.dreamFooterRow}>
            {stateLabels.length ? (
              <View style={styles.statePills}>
                {stateLabels.map(label => (
                  <View key={label} style={styles.statePill}>
                    <Text style={styles.statePillText}>{label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View />
            )}

            {visibleTags.length || hiddenTagCount ? (
              <View style={styles.tags}>
                {visibleTags.map(tag => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{tag}</Text>
                  </View>
                ))}
                {hiddenTagCount ? (
                  <View style={[styles.tagPill, styles.tagOverflowPill]}>
                    <Text style={styles.tagPillText}>{`+${hiddenTagCount}`}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </Card>
      </Pressable>
    </ReanimatedSwipeable>
  );
});
