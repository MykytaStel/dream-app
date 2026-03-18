import React from 'react';
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../../components/ui/Card';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { DREAM_PREVIEW_MAX_LENGTH } from '../../../../constants/limits/dreams';
import { Theme } from '../../../../theme/theme';
import { getDreamLayout } from '../../constants/layout';
import { Dream, Mood } from '../../model/dream';
import { getDreamDate } from '../../model/dreamAnalytics';
import {
  getDreamSearchMatchReasons,
  isDreamArchived,
  isDreamStarred,
  type DreamSearchMatchReason,
} from '../../model/homeTimeline';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';

type DreamSignalTone = 'accent' | 'primary' | 'danger' | 'muted';

type DreamSignalChip = {
  key: string;
  label: string;
  icon: string;
  tone: DreamSignalTone;
};

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

function buildSignalChips(
  dream: Dream,
  copy: DreamCopy,
  starred: boolean,
  archived: boolean,
): DreamSignalChip[] {
  const transcript = dream.transcript?.trim();
  const hasAudio = Boolean(dream.audioUri?.trim());
  const hasContext = Boolean(dream.sleepContext?.importantEvents?.trim());
  const transcriptStatus = dream.transcriptStatus ?? (transcript ? 'ready' : 'idle');

  return [
    starred
      ? {
          key: 'important',
          label: copy.starredTag,
          icon: 'sparkles-outline',
          tone: 'accent',
        }
      : null,
    archived
      ? {
          key: 'archived',
          label: copy.archivedTag,
          icon: 'archive-outline',
          tone: 'muted',
        }
      : null,
    hasContext
      ? {
          key: 'context',
          label: copy.homeSearchMatchContext,
          icon: 'flash-outline',
          tone: 'primary',
        }
      : null,
    hasAudio
      ? {
          key: 'audio',
          label: copy.audioTag,
          icon: 'mic-outline',
          tone: 'muted',
        }
      : null,
    transcriptStatus === 'processing'
      ? {
          key: 'transcript-processing',
          label: copy.detailTranscriptSummaryProcessing,
          icon: 'sync-outline',
          tone: 'primary',
        }
      : transcriptStatus === 'error'
        ? {
            key: 'transcript-error',
            label: copy.detailTranscriptSummaryError,
            icon: 'alert-circle-outline',
            tone: 'danger',
          }
        : transcript
          ? {
              key: dream.transcriptSource === 'edited' ? 'transcript-edited' : 'transcript',
              label:
                dream.transcriptSource === 'edited'
                  ? copy.editedTranscriptTag
                  : copy.transcriptTag,
              icon:
                dream.transcriptSource === 'edited'
                  ? 'create-outline'
                  : 'chatbubble-ellipses-outline',
              tone: dream.transcriptSource === 'edited' ? 'accent' : 'primary',
            }
          : null,
  ].filter((value): value is DreamSignalChip => Boolean(value));
}

function getSignalTone(theme: Theme, tone: DreamSignalTone) {
  switch (tone) {
    case 'accent':
      return {
        backgroundColor: `${theme.colors.accent}14`,
        borderColor: `${theme.colors.accent}44`,
        color: theme.colors.accent,
      };
    case 'danger':
      return {
        backgroundColor: `${theme.colors.danger}14`,
        borderColor: `${theme.colors.danger}44`,
        color: theme.colors.danger,
      };
    case 'primary':
      return {
        backgroundColor: `${theme.colors.primary}14`,
        borderColor: `${theme.colors.primary}44`,
        color: theme.colors.primary,
      };
    case 'muted':
    default:
      return {
        backgroundColor: `${theme.colors.textDim}10`,
        borderColor: `${theme.colors.border}F2`,
        color: theme.colors.textDim,
      };
  }
}

function getPreviewLabel(dream: Dream, copy: DreamCopy) {
  const hasText = Boolean(dream.text?.trim());
  const hasAudio = Boolean(dream.audioUri?.trim());
  const hasTranscript = Boolean(dream.transcript?.trim());

  if (dream.transcriptStatus === 'processing') {
    return copy.detailTranscriptSummaryProcessing;
  }

  if (dream.transcriptStatus === 'error') {
    return copy.detailTranscriptSummaryError;
  }

  if (hasText && hasAudio) {
    return copy.homeTypeFilterMixed;
  }

  if (hasText) {
    return copy.homeTypeFilterText;
  }

  if (hasTranscript) {
    return dream.transcriptSource === 'edited' ? copy.editedTranscriptTag : copy.transcriptTag;
  }

  if (hasAudio) {
    return copy.audioTag;
  }

  return copy.homeTypeFilterText;
}

function getPreviewIcon(dream: Dream): string {
  const hasText = Boolean(dream.text?.trim());
  const hasAudio = Boolean(dream.audioUri?.trim());
  const hasTranscript = Boolean(dream.transcript?.trim());

  if (dream.transcriptStatus === 'processing') {
    return 'sync-outline';
  }

  if (dream.transcriptStatus === 'error') {
    return 'alert-circle-outline';
  }

  if (hasText) {
    return hasAudio ? 'duplicate-outline' : 'document-text-outline';
  }

  if (hasTranscript) {
    return dream.transcriptSource === 'edited' ? 'create-outline' : 'chatbubble-ellipses-outline';
  }

  if (hasAudio) {
    return 'mic-outline';
  }

  return 'document-text-outline';
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
  index: number;
  copy: DreamCopy;
  searchQuery?: string;
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
  index,
  copy,
  searchQuery,
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
  const visibleTags = dream.tags.slice(0, 2);
  const hiddenTagCount = Math.max(0, dream.tags.length - visibleTags.length);
  const accentColor = starred ? theme.colors.accent : moodColor(theme, dream.mood);
  const signalChips = React.useMemo(
    () => buildSignalChips(dream, copy, starred, archived),
    [archived, copy, dream, starred],
  );
  const previewLabel = React.useMemo(() => getPreviewLabel(dream, copy), [copy, dream]);
  const previewIcon = React.useMemo(() => getPreviewIcon(dream), [dream]);
  const matchReasonLabels = React.useMemo(() => {
    const labelMap: Record<DreamSearchMatchReason, string> = {
      title: copy.homeSearchMatchTitle,
      notes: copy.homeSearchMatchNotes,
      transcript: copy.homeSearchMatchTranscript,
      tag: copy.homeSearchMatchTag,
      context: copy.homeSearchMatchContext,
    };

    return getDreamSearchMatchReasons(dream, searchQuery ?? '')
      .slice(0, 3)
      .map(reason => labelMap[reason]);
  }, [
    copy.homeSearchMatchContext,
    copy.homeSearchMatchNotes,
    copy.homeSearchMatchTag,
    copy.homeSearchMatchTitle,
    copy.homeSearchMatchTranscript,
    dream,
    searchQuery,
  ]);

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

  const hasFooter = Boolean(visibleTags.length || hiddenTagCount);
  const entering = index < 8 ? FadeInDown.delay(index * 45).duration(300) : undefined;

  return (
    <Animated.View entering={entering}>
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
          style={({ pressed }: { pressed: boolean }) => [
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
          <Card
            style={[
              styles.dreamCard,
              styles.dreamCardVisual,
              dream.mood ? { backgroundColor: `${accentColor}0B` } : null,
              starred ? styles.dreamCardStarred : null,
            ]}
          >
            <View
              pointerEvents="none"
              style={[styles.dreamCardGlowLarge, { backgroundColor: `${accentColor}1A` }]}
            />
            <View
              pointerEvents="none"
              style={[styles.dreamCardGlowSmall, { backgroundColor: `${accentColor}12` }]}
            />
            <View
              pointerEvents="none"
              style={[styles.dreamCardAccentBar, { backgroundColor: accentColor }]}
            />

            <View style={styles.dreamHeaderRow}>
              <View
                style={[
                  styles.dateBadge,
                  starred ? styles.dateBadgeFeatured : null,
                  {
                    backgroundColor: `${accentColor}14`,
                    borderColor: `${accentColor}33`,
                  },
                ]}
              >
                <Text style={styles.weekday}>{dateParts.weekday}</Text>
                <Text style={styles.dayNumber}>{String(dateParts.day)}</Text>
                <Text style={styles.month}>{dateParts.month}</Text>
              </View>
              <View style={[styles.dreamHeaderCopy, styles.dreamHeaderCopyExpanded]}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {dream.title || copy.untitled}
                  </Text>
                  {!mood ? (
                    <View style={[styles.moodDot, { backgroundColor: accentColor }]} />
                  ) : null}
                  {(dream.lucidity ?? 0) >= 2 ? (
                    <Text style={styles.lucidityGlyph}>✦</Text>
                  ) : null}
                </View>
                <View style={styles.headerMetaRow}>
                  {mood ? (
                    <View
                      style={[
                        styles.moodPill,
                        {
                          backgroundColor: `${accentColor}12`,
                          borderColor: `${accentColor}30`,
                        },
                      ]}
                    >
                      <View style={[styles.moodDot, { backgroundColor: accentColor }]} />
                      <Text style={styles.moodPillText}>{mood}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {signalChips.length ? (
              <View style={styles.signalRow}>
                {signalChips.map(chip => {
                  const tone = getSignalTone(theme, chip.tone);

                  return (
                    <View
                      key={`${dream.id}-${chip.key}`}
                      style={[
                        styles.signalChip,
                        {
                          backgroundColor: tone.backgroundColor,
                          borderColor: tone.borderColor,
                        },
                      ]}
                    >
                      <Ionicons name={chip.icon} size={12} color={tone.color} />
                      <Text style={[styles.signalChipText, { color: tone.color }]}>
                        {chip.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View
              style={[
                styles.previewPanel,
                {
                  backgroundColor: `${theme.colors.ink}33`,
                  borderColor: `${accentColor}20`,
                },
              ]}
            >
              <View style={[styles.previewAccent, { backgroundColor: accentColor }]} />
              <View style={styles.previewContent}>
                <View style={styles.previewHeaderRow}>
                  <View
                    style={[
                      styles.previewLabelPill,
                      {
                        backgroundColor: `${accentColor}16`,
                        borderColor: `${accentColor}2E`,
                      },
                    ]}
                  >
                    <Ionicons name={previewIcon} size={12} color={accentColor} />
                    <Text style={[styles.previewLabelText, { color: accentColor }]}>
                      {previewLabel}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.preview,
                    !dream.text?.trim() && dream.transcript ? styles.previewTranscript : null,
                  ]}
                  numberOfLines={3}
                >
                  {formatPreview(dream, copy)}
                </Text>
              </View>
            </View>

            {matchReasonLabels.length ? (
              <View style={styles.matchReasonsRow}>
                {matchReasonLabels.map(label => (
                  <View key={`${dream.id}-match-${label}`} style={styles.matchReasonPill}>
                    <Text style={styles.matchReasonPillText}>{label}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {hasFooter ? (
              <View style={styles.dreamFooterRow}>
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
              </View>
            ) : null}
          </Card>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
});
