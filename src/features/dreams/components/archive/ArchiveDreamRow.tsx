import React from 'react';
import { Pressable, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../../components/ui/Card';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../../app/navigation/routes';
import { Theme } from '../../../../theme/theme';
import { type AppLocale } from '../../../../i18n/types';
import { Dream, Mood } from '../../model/dream';
import { getDreamDate, getMoodValence } from '../../model/dreamAnalytics';
import { isDreamArchived, isDreamStarred } from '../../model/homeTimeline';
import {
  formatArchivePreview,
  getArchiveMatchReasonLabels,
  getArchiveMoodLabel,
  type ArchiveViewMode,
} from '../../model/archiveBrowser';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';

type ArchiveSignalTone = 'accent' | 'primary' | 'danger' | 'muted';

type ArchiveSignalChip = {
  key: string;
  label: string;
  icon: string;
  tone: ArchiveSignalTone;
};

function getAccentColor(theme: Theme, dream: Dream) {
  if (isDreamStarred(dream)) {
    return theme.colors.accent;
  }

  if (!dream.mood) {
    return theme.colors.primary;
  }

  const valence = getMoodValence(dream.mood);
  if (valence === 'positive') {
    return theme.colors.accent;
  }

  if (valence === 'negative') {
    return theme.colors.primaryAlt;
  }

  return theme.colors.primary;
}

function getSignalTone(theme: Theme, tone: ArchiveSignalTone) {
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

function buildSignalChips(dream: Dream, copy: DreamCopy, mood?: string): ArchiveSignalChip[] {
  const transcript = dream.transcript?.trim();
  const transcriptStatus = dream.transcriptStatus ?? (transcript ? 'ready' : 'idle');
  const hasAudio = Boolean(dream.audioUri?.trim());
  const hasContext = Boolean(dream.sleepContext?.importantEvents?.trim());
  const starred = isDreamStarred(dream);
  const archived = isDreamArchived(dream);

  return [
    mood
      ? {
          key: 'mood',
          label: mood,
          icon: 'moon-outline',
          tone: 'primary',
        }
      : null,
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
  ].filter((value): value is ArchiveSignalChip => Boolean(value));
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

type ArchiveDreamRowProps = {
  dream: Dream;
  copy: DreamCopy;
  searchQuery: string;
  locale: AppLocale;
  moodLabels: Record<Mood, string>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  viewMode: ArchiveViewMode;
};

export const ArchiveDreamRow = React.memo(function ArchiveDreamRow({
  dream,
  copy,
  searchQuery,
  locale,
  moodLabels,
  navigation,
  styles,
  viewMode,
}: ArchiveDreamRowProps) {
  const theme = useTheme<Theme>();
  const date = getDreamDate(dream);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const mood = getArchiveMoodLabel(dream.mood, moodLabels);
  const isCompact = viewMode === 'compact';
  const accentColor = getAccentColor(theme, dream);
  const signalChips = React.useMemo(
    () => buildSignalChips(dream, copy, mood).slice(0, isCompact ? 3 : 5),
    [copy, dream, isCompact, mood],
  );
  const matchReasons = React.useMemo(
    () => getArchiveMatchReasonLabels(dream, searchQuery, copy).slice(0, isCompact ? 1 : 2),
    [copy, dream, isCompact, searchQuery],
  );
  const visibleTags = dream.tags.slice(0, isCompact ? 1 : 2);
  const hiddenTagCount = Math.max(0, dream.tags.length - visibleTags.length);
  const rowDateLabel = `${date.toLocaleDateString(localeKey, {
    month: 'short',
    day: 'numeric',
  })} · ${date.toLocaleDateString(localeKey, {
    weekday: 'short',
  })}`;
  const compactMonthLabel = date.toLocaleDateString(localeKey, { month: 'short' });
  const compactDayLabel = String(date.getDate());
  const preview = formatArchivePreview(dream, copy);
  const previewLabel = getPreviewLabel(dream, copy);
  const previewIcon = getPreviewIcon(dream);

  if (isCompact) {
    return (
      <Pressable
        onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId: dream.id })}
        style={({ pressed }: { pressed: boolean }) => [
          styles.listRowPressable,
          pressed ? styles.listRowPressed : null,
        ]}
      >
        <Card
          style={[
            styles.listRowCard,
            styles.listRowCardCompact,
            styles.listRowCardVisual,
            { backgroundColor: `${accentColor}0A` },
          ]}
        >
          <View
            pointerEvents="none"
            style={[styles.listRowGlow, { backgroundColor: `${accentColor}16` }]}
          />
          <View
            pointerEvents="none"
            style={[styles.listRowAccentBar, { backgroundColor: accentColor }]}
          />

          <View
            style={[
              styles.compactDateBlock,
              {
                backgroundColor: `${accentColor}14`,
                borderColor: `${accentColor}30`,
              },
            ]}
          >
            <Text style={styles.compactDayLabel}>{compactDayLabel}</Text>
            <Text style={styles.compactMonthLabel}>{compactMonthLabel}</Text>
          </View>

          <View style={styles.compactContent}>
            <View style={styles.compactTitleRow}>
              <Text style={styles.rowTitleCompact} numberOfLines={1}>
                {dream.title || copy.untitled}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={theme.colors.textDim} />
            </View>

            <Text style={styles.compactDateMeta}>{rowDateLabel}</Text>

            {signalChips.length ? (
              <View style={styles.compactSignalRow}>
                {signalChips.map(chip => {
                  const tone = getSignalTone(theme, chip.tone);

                  return (
                    <View
                      key={`${dream.id}-${chip.key}`}
                      style={[
                        styles.compactSignalChip,
                        {
                          backgroundColor: tone.backgroundColor,
                          borderColor: tone.borderColor,
                        },
                      ]}
                    >
                      <Ionicons name={chip.icon} size={11} color={tone.color} />
                    </View>
                  );
                })}
                {matchReasons[0] ? (
                  <Text style={styles.compactMatchText} numberOfLines={1}>
                    {matchReasons[0]}
                  </Text>
                ) : null}
              </View>
            ) : matchReasons[0] ? (
              <Text style={styles.compactMatchText} numberOfLines={1}>
                {matchReasons[0]}
              </Text>
            ) : null}

            <Text style={styles.rowPreviewCompact} numberOfLines={2}>
              {preview}
            </Text>

            {visibleTags.length || hiddenTagCount ? (
              <View style={styles.compactTagRow}>
                {visibleTags.map(tag => (
                  <View key={`${dream.id}-${tag}`} style={styles.compactTagPill}>
                    <Text style={styles.compactTagText}>{tag}</Text>
                  </View>
                ))}
                {hiddenTagCount ? (
                  <View style={styles.compactTagPill}>
                    <Text style={styles.compactTagText}>{`+${hiddenTagCount}`}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId: dream.id })}
      style={({ pressed }: { pressed: boolean }) => [
        styles.listRowPressable,
        pressed ? styles.listRowPressed : null,
      ]}
    >
      <Card
        style={[
          styles.listRowCard,
          styles.listRowCardVisual,
          { backgroundColor: `${accentColor}0A` },
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.listRowGlow, { backgroundColor: `${accentColor}18` }]}
        />
        <View
          pointerEvents="none"
          style={[styles.listRowAccentBar, { backgroundColor: accentColor }]}
        />

        <View style={styles.comfortableTop}>
          <View style={styles.comfortableDateWrap}>
            <View
              style={[
                styles.rowDateChip,
                {
                  backgroundColor: `${accentColor}14`,
                  borderColor: `${accentColor}33`,
                },
              ]}
            >
              <Text style={[styles.rowDateChipText, styles.rowDateChipTextStrong]}>{rowDateLabel}</Text>
            </View>
            {matchReasons[0] ? (
              <View style={styles.matchReasonPill}>
                <Text style={styles.matchReasonPillText}>{matchReasons[0]}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.rowChevron}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
          </View>
        </View>

        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {dream.title || copy.untitled}
          </Text>

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
                    <Text style={[styles.signalChipText, { color: tone.color }]}>{chip.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View
            style={[
              styles.rowPreviewPanel,
              {
                backgroundColor: `${theme.colors.ink}30`,
                borderColor: `${accentColor}20`,
              },
            ]}
          >
            <View style={[styles.rowPreviewAccent, { backgroundColor: accentColor }]} />
            <View style={styles.rowPreviewContent}>
              <View style={styles.rowPreviewHeader}>
                <View
                  style={[
                    styles.rowPreviewTypePill,
                    {
                      backgroundColor: `${accentColor}16`,
                      borderColor: `${accentColor}2E`,
                    },
                  ]}
                >
                  <Ionicons name={previewIcon} size={12} color={accentColor} />
                  <Text style={[styles.rowPreviewTypeText, { color: accentColor }]}>
                    {previewLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowPreview} numberOfLines={3}>
                {preview}
              </Text>
            </View>
          </View>
        </View>

        {matchReasons[1] ? (
          <View style={styles.matchReasonsRow}>
            <View style={styles.matchReasonPill}>
              <Text style={styles.matchReasonPillText}>{matchReasons[1]}</Text>
            </View>
          </View>
        ) : null}

        {visibleTags.length || hiddenTagCount ? (
          <View style={styles.pillsRow}>
            {visibleTags.map(tag => (
              <View key={`${dream.id}-${tag}`} style={styles.pill}>
                <Text style={styles.pillText}>{tag}</Text>
              </View>
            ))}
            {hiddenTagCount ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{`+${hiddenTagCount}`}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
});
