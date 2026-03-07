import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import {
  getDreamCopy,
  getDreamMoodLabels,
  type DreamCopy,
} from '../../../constants/copy/dreams';
import { DREAM_PREVIEW_MAX_LENGTH } from '../../../constants/limits/dreams';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { getDreamLayout } from '../constants/layout';
import { Dream, Mood } from '../model/dream';
import {
  getAverageWords,
  getCurrentStreak,
  getDreamDate,
  getEntriesLastSevenDays,
} from '../model/dreamAnalytics';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getAvailableTimelineTags,
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  hasActiveTimelineRefinements,
  isDreamArchived,
  isDreamStarred,
  type HomeSortOrder,
  type HomeTranscriptFilter,
  type HomeTimelineFilters,
} from '../model/homeTimeline';
import {
  archiveDream,
  deleteDream,
  listDreams,
  starDream,
  unarchiveDream,
  unstarDream,
} from '../repository/dreamsRepository';
import { getDreamDraft, type DreamDraft } from '../services/dreamDraftService';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../../stats/model/dreamReflection';
import { createHomeScreenStyles } from './HomeScreen.styles';

const HOME_RECENT_LIMIT = 12;

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

function formatResultCount(count: number, copy: DreamCopy) {
  return `${count} ${count === 1 ? copy.homeResultsSingle : copy.homeResultsPlural}`;
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

export default function HomeScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const layout = React.useMemo(() => getDreamLayout(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [draft, setDraft] = React.useState<DreamDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [timelineFilters, setTimelineFilters] = React.useState<HomeTimelineFilters>(
    DEFAULT_HOME_TIMELINE_FILTERS,
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);
  const styles = createHomeScreenStyles(t);
  const homeFilters = React.useMemo<Array<{ key: HomeArchiveFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeFilterAll },
      { key: 'active', label: copy.homeFilterActive },
      { key: 'archived', label: copy.homeFilterArchived },
    ],
    [copy],
  );
  const moodFilters = React.useMemo<Array<{ key: HomeTimelineFilters['mood']; label: string }>>(
    () => [
      { key: 'all', label: copy.homeMoodFilterAll },
      { key: 'positive', label: moodLabels.positive },
      { key: 'neutral', label: moodLabels.neutral },
      { key: 'negative', label: moodLabels.negative },
    ],
    [copy, moodLabels],
  );
  const typeFilters = React.useMemo<Array<{ key: HomeEntryTypeFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeTypeFilterAll },
      { key: 'text', label: copy.homeTypeFilterText },
      { key: 'audio', label: copy.homeTypeFilterAudio },
      { key: 'mixed', label: copy.homeTypeFilterMixed },
    ],
    [copy],
  );
  const transcriptFilters = React.useMemo<Array<{ key: HomeTranscriptFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeTranscriptFilterAll },
      { key: 'with-transcript', label: copy.homeTranscriptFilterWithTranscript },
      { key: 'audio-only', label: copy.homeTranscriptFilterAudioOnly },
      { key: 'edited-transcript', label: copy.homeTranscriptFilterEdited },
    ],
    [copy],
  );
  const dateRangeFilters = React.useMemo<Array<{ key: HomeDateRangeFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeDateRangeAll },
      { key: '7d', label: copy.homeDateRange7d },
      { key: '30d', label: copy.homeDateRange30d },
      { key: '90d', label: copy.homeDateRange90d },
    ],
    [copy],
  );
  const sortOptions = React.useMemo<Array<{ key: HomeSortOrder; label: string }>>(
    () => [
      { key: 'newest', label: copy.homeSortFilterNewest },
      { key: 'oldest', label: copy.homeSortFilterOldest },
    ],
    [copy],
  );
  const activeDreams = React.useMemo(
    () => dreams.filter(dream => !isDreamArchived(dream)),
    [dreams],
  );
  const archiveScopedDreams = React.useMemo(
    () =>
      dreams.filter(dream => {
        if (timelineFilters.archive === 'active') {
          return !isDreamArchived(dream);
        }

        if (timelineFilters.archive === 'archived') {
          return isDreamArchived(dream);
        }

        return true;
      }),
    [dreams, timelineFilters.archive],
  );
  const availableTags = React.useMemo(
    () => getAvailableTimelineTags(archiveScopedDreams),
    [archiveScopedDreams],
  );
  const visibleDreams = React.useMemo(
    () => applyHomeTimelineFilters(dreams, timelineFilters),
    [dreams, timelineFilters],
  );
  const hasActiveRefinements = React.useMemo(
    () => hasActiveTimelineRefinements(timelineFilters),
    [timelineFilters],
  );
  const shouldLimitHomeFeed = !hasActiveRefinements;
  const displayedDreams = React.useMemo(
    () => (shouldLimitHomeFeed ? visibleDreams.slice(0, HOME_RECENT_LIMIT) : visibleDreams),
    [shouldLimitHomeFeed, visibleDreams],
  );
  const streak = getCurrentStreak(activeDreams);
  const averageWords = getAverageWords(activeDreams);
  const weeklyEntries = getEntriesLastSevenDays(activeDreams);
  const spotlightWord = React.useMemo(() => getRecurringWordSignals(activeDreams, 1)[0], [activeDreams]);
  const spotlightTheme = React.useMemo(
    () => getRecurringReflectionSignals(activeDreams, { limit: 1 })[0],
    [activeDreams],
  );
  const transcriptArchiveStats = React.useMemo(
    () => getTranscriptArchiveStats(activeDreams),
    [activeDreams],
  );
  const moodBacklogCount = React.useMemo(
    () => activeDreams.filter(dream => !dream.mood).length,
    [activeDreams],
  );
  const backlogValue = transcriptArchiveStats.audioOnly || moodBacklogCount;
  const spotlightPattern = spotlightWord?.label ?? spotlightTheme?.label ?? copy.homeSpotlightNoPattern;
  const spotlightPatternKind: PatternDetailKind | null = spotlightWord
    ? 'word'
    : spotlightTheme
      ? 'theme'
      : null;

  const refreshDreams = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);

    try {
      setDreams(listDreams());
      setDraft(getDreamDraft());
    } catch (error) {
      setLoadError(String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const swipeMethods = React.useRef<Record<string, SwipeableMethods>>({});
  const activeSwipeId = React.useRef<string | null>(null);

  const closeActiveSwipe = React.useCallback(() => {
    const activeId = activeSwipeId.current;
    if (!activeId) {
      return;
    }

    swipeMethods.current[activeId]?.close();
    activeSwipeId.current = null;
  }, []);

  const closeSwipe = React.useCallback((dreamId: string) => {
    swipeMethods.current[dreamId]?.close();
    if (activeSwipeId.current === dreamId) {
      activeSwipeId.current = null;
    }
  }, []);

  const closePreviousSwipe = React.useCallback((dreamId: string) => {
    if (activeSwipeId.current && activeSwipeId.current !== dreamId) {
      swipeMethods.current[activeSwipeId.current]?.close();
    }

    activeSwipeId.current = dreamId;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshDreams();
      return () => {
        closeActiveSwipe();
      };
    }, [closeActiveSwipe, refreshDreams]),
  );

  React.useEffect(() => {
    const dreamIds = new Set(dreams.map(dream => dream.id));

    Object.keys(swipeMethods.current).forEach(dreamId => {
      if (dreamIds.has(dreamId)) {
        return;
      }

      delete swipeMethods.current[dreamId];
      if (activeSwipeId.current === dreamId) {
        activeSwipeId.current = null;
      }
    });
  }, [dreams]);

  React.useEffect(() => {
    const nextTags = timelineFilters.tags.filter(tag => availableTags.includes(tag));
    if (nextTags.length === timelineFilters.tags.length) {
      return;
    }

    setTimelineFilters(current => ({
      ...current,
      tags: current.tags.filter(tag => availableTags.includes(tag)),
    }));
  }, [availableTags, timelineFilters.tags]);

  React.useEffect(() => {
    if (!activeSwipeId.current) {
      return;
    }

    const activeStillVisible = visibleDreams.some(dream => dream.id === activeSwipeId.current);
    if (!activeStillVisible) {
      activeSwipeId.current = null;
    }
  }, [visibleDreams]);

  const openDreamEditor = React.useCallback((dreamId: string) => {
    navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
      dreamId,
    });
  }, [navigation]);

  const openDreamDetail = React.useCallback((dreamId: string) => {
    navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
      dreamId,
    });
  }, [navigation]);

  const toggleArchiveFromList = React.useCallback((dream: Dream) => {
    if (isDreamArchived(dream)) {
      unarchiveDream(dream.id);
    } else {
      archiveDream(dream.id);
    }

    refreshDreams();
  }, [refreshDreams]);

  const toggleStarFromList = React.useCallback((dream: Dream) => {
    if (isDreamStarred(dream)) {
      unstarDream(dream.id);
    } else {
      starDream(dream.id);
    }

    refreshDreams();
  }, [refreshDreams]);

  const removeDreamFromList = React.useCallback((dreamId: string) => {
    Alert.alert(
      copy.detailDeleteTitle,
      copy.detailDeleteDescription,
      [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            deleteDream(dreamId);
            refreshDreams();
          },
        },
      ],
    );
  }, [copy, refreshDreams]);

  const openDreamQuickActions = React.useCallback((dream: Dream) => {
    closeActiveSwipe();

    const archiveLabel = isDreamArchived(dream)
      ? copy.swipeUnarchive
      : copy.swipeArchive;
    const starLabel = isDreamStarred(dream)
      ? copy.detailUnstar
      : copy.detailStar;

    if (Platform.OS === 'ios') {
      const options = [
        copy.homeQuickOpen,
        copy.swipeEdit,
        starLabel,
        archiveLabel,
        copy.swipeDelete,
        copy.detailDeleteCancel,
      ];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: dream.title || copy.untitled,
          message: dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10),
          options,
          cancelButtonIndex: 5,
          destructiveButtonIndex: 4,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            openDreamDetail(dream.id);
            return;
          }

          if (buttonIndex === 1) {
            openDreamEditor(dream.id);
            return;
          }

          if (buttonIndex === 2) {
            toggleStarFromList(dream);
            return;
          }

          if (buttonIndex === 3) {
            toggleArchiveFromList(dream);
            return;
          }

          if (buttonIndex === 4) {
            removeDreamFromList(dream.id);
          }
        },
      );
      return;
    }

    Alert.alert(dream.title || copy.untitled, undefined, [
      {
        text: copy.homeQuickOpen,
        onPress: () => openDreamDetail(dream.id),
      },
      {
        text: starLabel,
        onPress: () => toggleStarFromList(dream),
      },
      {
        text: archiveLabel,
        onPress: () => toggleArchiveFromList(dream),
      },
    ]);
  }, [
    closeActiveSwipe,
    copy,
    openDreamDetail,
    openDreamEditor,
    removeDreamFromList,
    toggleArchiveFromList,
    toggleStarFromList,
  ]);

  const openContinueDraft = React.useCallback(() => {
    closeActiveSwipe();
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.New,
      params: {
        entryMode: 'default',
      },
    });
  }, [closeActiveSwipe, navigation]);

  const openQuickVoiceCapture = React.useCallback(() => {
    closeActiveSwipe();
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.New,
      params: {
        entryMode: 'voice',
        launchKey: Date.now(),
      },
    });
  }, [closeActiveSwipe, navigation]);

  const openArchive = React.useCallback(() => {
    closeActiveSwipe();
    navigation.navigate(ROOT_ROUTE_NAMES.Archive);
  }, [closeActiveSwipe, navigation]);

  const openPatternDetail = React.useCallback((signal: string, kind: PatternDetailKind) => {
    closeActiveSwipe();
    navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
      signal,
      kind,
    });
  }, [closeActiveSwipe, navigation]);

  const updateTimelineFilters = React.useCallback(
    (updater: (current: HomeTimelineFilters) => HomeTimelineFilters) => {
      closeActiveSwipe();
      setTimelineFilters(current => updater(current));
    },
    [closeActiveSwipe],
  );

  const renderRightActions = (
    dream: Dream,
    swipeableMethods: SwipeableMethods,
  ) => {
    swipeMethods.current[dream.id] = swipeableMethods;

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
  };

  const renderLeftActions = (
    dream: Dream,
    swipeableMethods: SwipeableMethods,
  ) => {
    swipeMethods.current[dream.id] = swipeableMethods;
    const archiveLabel = isDreamArchived(dream)
      ? copy.swipeUnarchive
      : copy.swipeArchive;
    const archiveActionStyle = isDreamArchived(dream)
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
  };

  if (loading) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="loading"
          title={copy.timelineLoadingTitle}
          subtitle={copy.timelineLoadingDescription}
        />
      </ScreenContainer>
    );
  }

  if (loadError) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={copy.timelineErrorTitle}
          subtitle={copy.timelineErrorDescription}
          actionLabel={copy.actionRetry}
          onAction={refreshDreams}
        />
      </ScreenContainer>
    );
  }

  if (!dreams.length && !draft) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroGlowLarge} />
        <View pointerEvents="none" style={styles.heroGlowSmall} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{copy.homeGreeting}</Text>
            <Text style={styles.heroTitle}>{copy.homeTitle}</Text>
            <Text style={styles.heroSubtitle}>{copy.homeSubtitle}</Text>
          </View>
          <View style={styles.heroVisualShell}>
            <View style={[styles.heroFacet, styles.heroFacetPrimary]} />
            <View style={[styles.heroFacet, styles.heroFacetAccent]} />
            <View style={[styles.heroFacet, styles.heroFacetAlt]} />
          </View>
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{copy.homeStreakLabel}</Text>
              <Text style={styles.statValue}>{`${streak} ${copy.homeDaysUnit}`}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{copy.homeTotalLabel}</Text>
              <Text style={styles.statValue}>{activeDreams.length}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{copy.homeAverageLabel}</Text>
              <Text style={styles.statValue}>{averageWords}</Text>
            </View>
          </View>

          <View style={styles.heroActionsRow}>
            <Button
              title={copy.homeRecordNow}
              onPress={openQuickVoiceCapture}
              style={styles.heroPrimaryAction}
              icon="mic"
              size="md"
            />
            {draft ? (
              <Button
                title={copy.homeContinueDraft}
                variant="ghost"
                onPress={openContinueDraft}
                style={styles.heroSecondaryAction}
                icon="create-outline"
                size="sm"
              />
            ) : null}
          </View>

          {draft ? (
            <Text style={styles.heroActionHint}>{copy.homeDraftShortcutHint}</Text>
          ) : null}
        </View>
      </Card>

      <Card style={styles.spotlightCard}>
        <View style={styles.spotlightHeader}>
          <Text style={styles.sectionLabel}>{copy.homeSpotlightTitle}</Text>
          <Text style={styles.spotlightSubtitle}>{copy.homeSpotlightSubtitle}</Text>
        </View>

        <View style={styles.spotlightRow}>
          {spotlightPatternKind ? (
            <Pressable
              style={({ pressed }) => [
                styles.spotlightTile,
                styles.spotlightTileFeatured,
                pressed ? styles.spotlightTilePressed : null,
              ]}
              onPress={() => openPatternDetail(spotlightPattern, spotlightPatternKind)}
            >
              <Text style={styles.spotlightLabel}>{copy.homeSpotlightPatternLabel}</Text>
              <Text style={styles.spotlightValue}>{spotlightPattern}</Text>
              <Text style={styles.spotlightHint}>
                {formatResultCount(
                  (spotlightWord?.dreamCount ?? spotlightTheme?.dreamCount) || 0,
                  copy,
                )}
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.spotlightTile, styles.spotlightTileFeatured]}>
              <Text style={styles.spotlightLabel}>{copy.homeSpotlightPatternLabel}</Text>
              <Text style={styles.spotlightValue}>{spotlightPattern}</Text>
              <Text style={styles.spotlightHint}>{copy.homeSpotlightNoPattern}</Text>
            </View>
          )}

          <View style={styles.spotlightTile}>
            <Text style={styles.spotlightLabel}>{copy.homeSpotlightWeeklyLabel}</Text>
            <Text style={styles.spotlightValue}>{`${weeklyEntries}/3`}</Text>
            <Text style={styles.spotlightHint}>
              {weeklyEntries >= 3 ? copy.homeSpotlightWeeklyOnTrack : copy.homeSpotlightWeeklyOffTrack}
            </Text>
          </View>

          <View style={styles.spotlightTile}>
            <Text style={styles.spotlightLabel}>{copy.homeSpotlightBacklogLabel}</Text>
            <Text style={styles.spotlightValue}>
              {backlogValue ? String(backlogValue) : copy.homeSpotlightNoBacklog}
            </Text>
            <Text style={styles.spotlightHint}>
              {transcriptArchiveStats.audioOnly > 0
                ? copy.homeSpotlightBacklogAudio
                : moodBacklogCount > 0
                  ? copy.homeSpotlightBacklogMood
                  : copy.homeSpotlightNoBacklog}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.timelineHeaderRow}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
          <Text style={styles.sectionHint}>{copy.openDreamHint}</Text>
        </View>
        <View style={styles.timelineHeaderActions}>
          <View style={styles.timelineCountPill}>
            <Text style={styles.timelineCountLabel}>
              {formatResultCount(visibleDreams.length, copy)}
            </Text>
          </View>
          <Button
            title={copy.homeOpenArchive}
            variant="ghost"
            size="sm"
            icon="albums-outline"
            onPress={openArchive}
          />
        </View>
      </View>
      <Card style={styles.searchCard}>
        <FormField
          placeholder={copy.homeSearchPlaceholder}
          value={timelineFilters.searchQuery}
          onChangeText={value =>
            updateTimelineFilters(current => ({
              ...current,
              searchQuery: value,
            }))
          }
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.primaryControlsRow}>
          <View style={styles.filterRow}>
            {homeFilters.map(filter => {
              const active = timelineFilters.archive === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    active ? styles.filterButtonActive : null,
                  ]}
                  onPress={() =>
                    updateTimelineFilters(current => ({
                      ...current,
                      archive: filter.key,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonLabel,
                      active ? styles.filterButtonLabelActive : null,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.primaryActionsRow}>
            <Pressable
              style={[
                styles.inlineActionButton,
                timelineFilters.starredOnly ? styles.inlineActionButtonActive : null,
              ]}
              onPress={() =>
                updateTimelineFilters(current => ({
                  ...current,
                  starredOnly: !current.starredOnly,
                }))
              }
            >
              <Text
                style={[
                  styles.inlineActionButtonText,
                  timelineFilters.starredOnly ? styles.inlineActionButtonTextActive : null,
                ]}
              >
                {copy.homeFilterStarred}
              </Text>
            </Pressable>
            <Pressable
              style={styles.inlineActionButton}
              onPress={() => setIsFilterSheetOpen(true)}
            >
              <Text style={styles.inlineActionButtonText}>{copy.homeShowFilters}</Text>
            </Pressable>
          </View>
        </View>

        {hasActiveRefinements ? (
          <View style={styles.activeFiltersRow}>
            {timelineFilters.mood !== 'all' ? (
              <TagChip label={moodLabel(timelineFilters.mood, moodLabels) ?? copy.homeMoodFilterAll} />
            ) : null}
            {timelineFilters.starredOnly ? <TagChip label={copy.homeFilterStarred} /> : null}
            {timelineFilters.entryType !== 'all' ? (
              <TagChip
                label={typeFilters.find(filter => filter.key === timelineFilters.entryType)?.label ?? timelineFilters.entryType}
              />
            ) : null}
            {timelineFilters.transcript !== 'all' ? (
              <TagChip
                label={
                  transcriptFilters.find(filter => filter.key === timelineFilters.transcript)?.label ??
                  timelineFilters.transcript
                }
              />
            ) : null}
            {timelineFilters.tags.map(tag => <TagChip key={tag} label={tag} />)}
            {timelineFilters.dateRange !== 'all' ? (
              <TagChip
                label={
                  dateRangeFilters.find(filter => filter.key === timelineFilters.dateRange)?.label ??
                  timelineFilters.dateRange
                }
              />
            ) : null}
            {timelineFilters.sortOrder !== 'newest' ? (
              <TagChip
                label={
                  sortOptions.find(option => option.key === timelineFilters.sortOrder)?.label ??
                  timelineFilters.sortOrder
                }
              />
            ) : null}
            {timelineFilters.searchQuery.trim() ? <TagChip label={timelineFilters.searchQuery.trim()} /> : null}
            <Pressable
              style={styles.clearFiltersButton}
              onPress={() => {
                closeActiveSwipe();
                setTimelineFilters(current => ({
                  ...DEFAULT_HOME_TIMELINE_FILTERS,
                  archive: current.archive,
                }));
              }}
            >
              <Text style={styles.clearFiltersButtonText}>{copy.homeClearFilters}</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      <Modal
        transparent
        animationType="slide"
        visible={isFilterSheetOpen}
        onRequestClose={() => setIsFilterSheetOpen(false)}
      >
        <View style={styles.filterSheetRoot}>
          <Pressable style={styles.filterSheetBackdrop} onPress={() => setIsFilterSheetOpen(false)} />
          <View style={styles.filterSheetCard}>
            <View style={styles.filterSheetHeader}>
              <View style={styles.filterSheetHandle} />
              <SectionHeader title={copy.homeRefineLabel} />
              <Button
                title={copy.homeHideFilters}
                variant="ghost"
                size="sm"
                onPress={() => setIsFilterSheetOpen(false)}
              />
            </View>

            <ScrollView
              style={styles.filterSheetScroll}
              contentContainerStyle={styles.filterSheetBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{copy.homeMoodFilterLabel}</Text>
                <View style={styles.filterRow}>
                  {moodFilters.map(filter => {
                    const active = timelineFilters.mood === filter.key;
                    return (
                      <Pressable
                        key={filter.key}
                        style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            mood: filter.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{copy.homeTypeFilterLabel}</Text>
                <View style={styles.filterRow}>
                  {typeFilters.map(filter => {
                    const active = timelineFilters.entryType === filter.key;
                    return (
                      <Pressable
                        key={filter.key}
                        style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            entryType: filter.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{copy.homeTranscriptFilterLabel}</Text>
                <View style={styles.filterRow}>
                  {transcriptFilters.map(filter => {
                    const active = timelineFilters.transcript === filter.key;
                    return (
                      <Pressable
                        key={filter.key}
                        style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            transcript: filter.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {availableTags.length > 0 ? (
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>{copy.homeTagFilterLabel}</Text>
                  <View style={styles.filterRow}>
                    {availableTags.map(tag => {
                      const active = timelineFilters.tags.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                          onPress={() =>
                            updateTimelineFilters(current => ({
                              ...current,
                              tags: current.tags.includes(tag)
                                ? current.tags.filter(value => value !== tag)
                                : [...current.tags, tag],
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.filterButtonLabel,
                              active ? styles.filterButtonLabelActive : null,
                            ]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{copy.homeDateRangeFilterLabel}</Text>
                <View style={styles.filterRow}>
                  {dateRangeFilters.map(filter => {
                    const active = timelineFilters.dateRange === filter.key;
                    return (
                      <Pressable
                        key={filter.key}
                        style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            dateRange: filter.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{copy.homeSortFilterLabel}</Text>
                <View style={styles.filterRow}>
                  {sortOptions.map(option => {
                    const active = timelineFilters.sortOrder === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            sortOrder: option.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {!archiveScopedDreams.length ? (
        <Card style={styles.emptyCard}>
          <SectionHeader
            title={
              timelineFilters.archive === 'archived'
                ? copy.emptyArchivedTitle
                : copy.emptyActiveTitle
            }
            subtitle={
              timelineFilters.archive === 'archived'
                ? copy.emptyArchivedDescription
                : copy.emptyActiveDescription
            }
          />
        </Card>
      ) : null}

      {archiveScopedDreams.length > 0 && !visibleDreams.length ? (
        <ScreenStateCard
          variant="empty"
          title={copy.homeSearchEmptyTitle}
          subtitle={copy.homeSearchEmptyDescription}
        />
      ) : null}

      {visibleDreams.length > displayedDreams.length ? (
        <Text style={styles.recentLimitHint}>{copy.homeRecentLimitHint}</Text>
      ) : null}

      {displayedDreams.map(dream => {
        const mood = moodLabel(dream.mood, moodLabels);
        const dateParts = formatDateParts(dream);
        const archived = isDreamArchived(dream);
        const starred = isDreamStarred(dream);
        const stateLabels = getDreamStateLabels(dream, copy, starred, archived).slice(0, 2);
        const visibleTags = dream.tags.slice(0, 2);
        const hiddenTagCount = Math.max(0, dream.tags.length - visibleTags.length);
        const accentColor = starred ? t.colors.accent : moodColor(t, dream.mood);
        return (
          <ReanimatedSwipeable
            key={dream.id}
            containerStyle={styles.swipeableContainer}
            overshootRight={false}
            overshootLeft={false}
            leftThreshold={layout.swipeThreshold}
            rightThreshold={layout.swipeThreshold}
            dragOffsetFromLeftEdge={layout.swipeDragOffset}
            dragOffsetFromRightEdge={layout.swipeDragOffset}
            friction={1.9}
            renderLeftActions={(_, __, methods) =>
              renderLeftActions(dream, methods)
            }
            renderRightActions={(_, __, methods) =>
              renderRightActions(dream, methods)
            }
            onSwipeableWillOpen={() => closePreviousSwipe(dream.id)}
            onSwipeableOpen={() => {
              activeSwipeId.current = dream.id;
            }}
            onSwipeableClose={() => {
              if (activeSwipeId.current === dream.id) {
                activeSwipeId.current = null;
              }
            }}
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
                  <View
                    style={[
                      styles.dateBadge,
                      starred ? styles.dateBadgeFeatured : null,
                    ]}
                  >
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
                        <View
                          style={[
                            styles.moodDot,
                            { backgroundColor: accentColor },
                          ]}
                        />
                      ) : null}
                    </View>
                    <View style={styles.timestampRow}>
                      {mood ? (
                        <View style={styles.moodPill}>
                          <View
                            style={[
                              styles.moodDot,
                              { backgroundColor: accentColor },
                            ]}
                          />
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
                  <View
                    style={[
                      styles.previewAccent,
                      { backgroundColor: accentColor },
                    ]}
                  />
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
      })}
    </ScreenContainer>
  );
}
