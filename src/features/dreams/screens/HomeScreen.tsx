import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import {
  getDreamCopy,
  getDreamMoodLabels,
  type DreamCopy,
} from '../../../constants/copy/dreams';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { HomeDreamRow } from '../components/home/HomeDreamRow';
import { HomeFilterSheet } from '../components/home/HomeFilterSheet';
import { HomeHero } from '../components/home/HomeHero';
import { HomeListHeader } from '../components/home/HomeListHeader';
import { type HomeFilterChip, type HomeOption } from '../components/home/homeTypes';
import { getDreamLayout } from '../constants/layout';
import { Dream, Mood } from '../model/dream';
import {
  getAverageWords,
  getCurrentStreak,
  getEntriesLastSevenDays,
} from '../model/dreamAnalytics';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getHomeTimelineFiltersSignature,
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
  getHomeSearchPresets,
  removeHomeSearchPreset,
  saveHomeSearchPreset,
  type HomeSearchPreset,
} from '../services/homeSearchPresetService';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../../stats/model/dreamReflection';
import { createHomeScreenStyles } from './HomeScreen.styles';

const HOME_RECENT_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 160;
const HERO_COLLAPSE_DISTANCE = 132;

function getContextGreeting(copy: DreamCopy, now = new Date()) {
  const hour = now.getHours();

  if (hour < 5) {
    return copy.homeGreetingNight;
  }

  if (hour < 12) {
    return copy.homeGreetingMorning;
  }

  if (hour < 18) {
    return copy.homeGreetingAfternoon;
  }

  return copy.homeGreetingEvening;
}

function formatResultCount(count: number, copy: DreamCopy) {
  return `${count} ${count === 1 ? copy.homeResultsSingle : copy.homeResultsPlural}`;
}

function moodLabel(mood: Dream['mood'] | undefined, moodLabels: Record<Mood, string>) {
  return mood ? moodLabels[mood] : undefined;
}

function clipPresetLabel(value: string, maxLength = 28) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}

export default function HomeScreen() {
  const t = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const layout = React.useMemo(() => getDreamLayout(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [draft, setDraft] = React.useState<DreamDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [timelineFilters, setTimelineFilters] = React.useState<HomeTimelineFilters>(
    DEFAULT_HOME_TIMELINE_FILTERS,
  );
  const [savedSearchPresets, setSavedSearchPresets] = React.useState<HomeSearchPreset[]>(
    () => getHomeSearchPresets(),
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);
  const styles = createHomeScreenStyles(t);
  const homeFilters = React.useMemo<Array<HomeOption<HomeArchiveFilter>>>(
    () => [
      { key: 'all', label: copy.homeFilterAll },
      { key: 'active', label: copy.homeFilterActive },
    ],
    [copy],
  );
  const moodFilters = React.useMemo<Array<HomeOption<HomeTimelineFilters['mood']>>>(
    () => [
      { key: 'all', label: copy.homeMoodFilterAll },
      { key: 'positive', label: moodLabels.positive },
      { key: 'neutral', label: moodLabels.neutral },
      { key: 'negative', label: moodLabels.negative },
    ],
    [copy, moodLabels],
  );
  const typeFilters = React.useMemo<Array<HomeOption<HomeEntryTypeFilter>>>(
    () => [
      { key: 'all', label: copy.homeTypeFilterAll },
      { key: 'text', label: copy.homeTypeFilterText },
      { key: 'audio', label: copy.homeTypeFilterAudio },
      { key: 'mixed', label: copy.homeTypeFilterMixed },
    ],
    [copy],
  );
  const transcriptFilters = React.useMemo<Array<HomeOption<HomeTranscriptFilter>>>(
    () => [
      { key: 'all', label: copy.homeTranscriptFilterAll },
      { key: 'with-transcript', label: copy.homeTranscriptFilterWithTranscript },
      { key: 'audio-only', label: copy.homeTranscriptFilterAudioOnly },
      { key: 'edited-transcript', label: copy.homeTranscriptFilterEdited },
    ],
    [copy],
  );
  const dateRangeFilters = React.useMemo<Array<HomeOption<HomeDateRangeFilter>>>(
    () => [
      { key: 'all', label: copy.homeDateRangeAll },
      { key: '7d', label: copy.homeDateRange7d },
      { key: '30d', label: copy.homeDateRange30d },
      { key: '90d', label: copy.homeDateRange90d },
    ],
    [copy],
  );
  const sortOptions = React.useMemo<Array<HomeOption<HomeSortOrder>>>(
    () => [
      { key: 'newest', label: copy.homeSortFilterNewest },
      { key: 'oldest', label: copy.homeSortFilterOldest },
    ],
    [copy],
  );
  const buildSearchPresetLabel = React.useCallback(
    (filters: HomeTimelineFilters) => {
      const searchLabel = filters.searchQuery.trim();
      if (searchLabel) {
        return clipPresetLabel(searchLabel);
      }

      if (filters.tags.length > 0) {
        const [firstTag, ...restTags] = filters.tags;
        return clipPresetLabel(restTags.length > 0 ? `${firstTag} +${restTags.length}` : firstTag);
      }

      if (filters.starredOnly) {
        return copy.homeFilterStarred;
      }

      if (filters.mood !== 'all') {
        return moodLabel(filters.mood, moodLabels) ?? copy.homeSearchPresetFallback;
      }

      if (filters.transcript !== 'all') {
        return (
          transcriptFilters.find(filter => filter.key === filters.transcript)?.label ??
          copy.homeSearchPresetFallback
        );
      }

      if (filters.entryType !== 'all') {
        return (
          typeFilters.find(filter => filter.key === filters.entryType)?.label ??
          copy.homeSearchPresetFallback
        );
      }

      if (filters.dateRange !== 'all') {
        return (
          dateRangeFilters.find(filter => filter.key === filters.dateRange)?.label ??
          copy.homeSearchPresetFallback
        );
      }

      if (filters.archive !== 'all') {
        return (
          homeFilters.find(filter => filter.key === filters.archive)?.label ??
          copy.homeSearchPresetFallback
        );
      }

      return copy.homeSearchPresetFallback;
    },
    [copy.homeFilterStarred, copy.homeSearchPresetFallback, dateRangeFilters, homeFilters, moodLabels, transcriptFilters, typeFilters],
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
  const debouncedSearchQuery = useDebouncedValue(timelineFilters.searchQuery, SEARCH_DEBOUNCE_MS);
  const effectiveTimelineFilters = React.useMemo(
    () => ({
      ...timelineFilters,
      searchQuery: debouncedSearchQuery,
    }),
    [debouncedSearchQuery, timelineFilters],
  );
  const deferredTimelineFilters = React.useDeferredValue(effectiveTimelineFilters);
  const visibleDreams = React.useMemo(
    () => applyHomeTimelineFilters(dreams, deferredTimelineFilters),
    [deferredTimelineFilters, dreams],
  );
  const isSearchPending =
    timelineFilters.searchQuery !== debouncedSearchQuery ||
    deferredTimelineFilters.searchQuery !== debouncedSearchQuery;
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
  const heroGreeting = React.useMemo(() => getContextGreeting(copy), [copy]);
  const heroDateLabel = React.useMemo(
    () =>
      new Date().toLocaleDateString(localeKey, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [localeKey],
  );
  const backlogValue = transcriptArchiveStats.audioOnly || moodBacklogCount;
  const spotlightPattern = spotlightWord?.label ?? spotlightTheme?.label ?? copy.homeSpotlightNoPattern;
  const spotlightPatternKind: PatternDetailKind | null = spotlightWord
    ? 'word'
    : spotlightTheme
      ? 'theme'
      : null;
  const searchResultsLabel = React.useMemo(
    () => formatResultCount(visibleDreams.length, copy),
    [copy, visibleDreams.length],
  );
  const spotlightCountLabel = React.useMemo(
    () =>
      formatResultCount((spotlightWord?.dreamCount ?? spotlightTheme?.dreamCount) || 0, copy),
    [copy, spotlightTheme?.dreamCount, spotlightWord?.dreamCount],
  );
  const weeklyValue = `${weeklyEntries}/3`;
  const weeklyHint =
    weeklyEntries >= 3 ? copy.homeSpotlightWeeklyOnTrack : copy.homeSpotlightWeeklyOffTrack;
  const backlogDisplayValue = backlogValue ? String(backlogValue) : copy.homeSpotlightNoBacklog;
  const backlogHint =
    transcriptArchiveStats.audioOnly > 0
      ? copy.homeSpotlightBacklogAudio
      : moodBacklogCount > 0
        ? copy.homeSpotlightBacklogMood
        : copy.homeSpotlightNoBacklog;
  const activeFilterChips = React.useMemo<HomeFilterChip[]>(() => {
    const chips: HomeFilterChip[] = [];

    if (timelineFilters.mood !== 'all') {
      chips.push({
        key: `mood:${timelineFilters.mood}`,
        label: moodLabel(timelineFilters.mood, moodLabels) ?? copy.homeMoodFilterAll,
      });
    }

    if (timelineFilters.starredOnly) {
      chips.push({
        key: 'starred',
        label: copy.homeFilterStarred,
      });
    }

    if (timelineFilters.entryType !== 'all') {
      chips.push({
        key: `entry:${timelineFilters.entryType}`,
        label:
          typeFilters.find(filter => filter.key === timelineFilters.entryType)?.label ??
          timelineFilters.entryType,
      });
    }

    if (timelineFilters.transcript !== 'all') {
      chips.push({
        key: `transcript:${timelineFilters.transcript}`,
        label:
          transcriptFilters.find(filter => filter.key === timelineFilters.transcript)?.label ??
          timelineFilters.transcript,
      });
    }

    timelineFilters.tags.forEach(tag => {
      chips.push({
        key: `tag:${tag}`,
        label: tag,
      });
    });

    if (timelineFilters.dateRange !== 'all') {
      chips.push({
        key: `date:${timelineFilters.dateRange}`,
        label:
          dateRangeFilters.find(filter => filter.key === timelineFilters.dateRange)?.label ??
          timelineFilters.dateRange,
      });
    }

    if (timelineFilters.sortOrder !== 'newest') {
      chips.push({
        key: `sort:${timelineFilters.sortOrder}`,
        label:
          sortOptions.find(option => option.key === timelineFilters.sortOrder)?.label ??
          timelineFilters.sortOrder,
      });
    }

    if (timelineFilters.searchQuery.trim()) {
      chips.push({
        key: 'search',
        label: timelineFilters.searchQuery.trim(),
      });
    }

    return chips;
  }, [copy.homeFilterStarred, copy.homeMoodFilterAll, dateRangeFilters, moodLabels, sortOptions, timelineFilters, transcriptFilters, typeFilters]);
  const hasSearchQuery = Boolean(timelineFilters.searchQuery.trim());
  const hasNonSearchRefinements = React.useMemo(
    () => activeFilterChips.some(chip => chip.key !== 'search'),
    [activeFilterChips],
  );
  const heroInsetTop = insets.top + t.spacing.sm;
  const heroExpandedHeight = 214;
  const heroCollapsedHeight = 104;
  const currentFilterSignature = React.useMemo(
    () => getHomeTimelineFiltersSignature(timelineFilters),
    [timelineFilters],
  );
  const activeSearchPresetId = React.useMemo(
    () =>
      savedSearchPresets.find(
        preset => getHomeTimelineFiltersSignature(preset.filters) === currentFilterSignature,
      )?.id ?? null,
    [currentFilterSignature, savedSearchPresets],
  );
  const canSaveSearchPreset = React.useMemo(
    () =>
      (timelineFilters.archive !== DEFAULT_HOME_TIMELINE_FILTERS.archive ||
        hasActiveTimelineRefinements(timelineFilters)) &&
      !activeSearchPresetId,
    [activeSearchPresetId, timelineFilters],
  );

  const refreshDreams = React.useCallback(
    (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      if (mode === 'initial') {
        setLoading(true);
      }

      if (mode === 'refresh') {
        setRefreshing(true);
      }

      setLoadError(null);

      try {
        setDreams(listDreams());
        setDraft(getDreamDraft());
        setSavedSearchPresets(getHomeSearchPresets());
      } catch (error) {
        setLoadError(String(error));
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        }

        if (mode === 'refresh') {
          setRefreshing(false);
        }
      }
    },
    [],
  );

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

  const bindSwipeMethods = React.useCallback((dreamId: string, methods: SwipeableMethods) => {
    swipeMethods.current[dreamId] = methods;
  }, []);

  const onSwipeOpened = React.useCallback((dreamId: string) => {
    activeSwipeId.current = dreamId;
  }, []);

  const onSwipeClosed = React.useCallback((dreamId: string) => {
    if (activeSwipeId.current === dreamId) {
      activeSwipeId.current = null;
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshDreams(loading ? 'initial' : 'silent');
      return () => {
        closeActiveSwipe();
      };
    }, [closeActiveSwipe, loading, refreshDreams]),
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

  const onPullToRefresh = React.useCallback(() => {
    closeActiveSwipe();
    refreshDreams('refresh');
  }, [closeActiveSwipe, refreshDreams]);

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
  const clearTimelineFilters = React.useCallback(() => {
    closeActiveSwipe();
    setTimelineFilters(current => ({
      ...DEFAULT_HOME_TIMELINE_FILTERS,
      archive: current.archive,
    }));
  }, [closeActiveSwipe]);
  const clearTimelineSearch = React.useCallback(() => {
    closeActiveSwipe();
    setTimelineFilters(current => ({
      ...current,
      searchQuery: '',
    }));
  }, [closeActiveSwipe]);
  const saveCurrentSearchPreset = React.useCallback(() => {
    if (!canSaveSearchPreset) {
      return;
    }

    closeActiveSwipe();
    setSavedSearchPresets(
      saveHomeSearchPreset({
        label: buildSearchPresetLabel(timelineFilters),
        filters: timelineFilters,
      }),
    );
  }, [buildSearchPresetLabel, canSaveSearchPreset, closeActiveSwipe, timelineFilters]);
  const applySearchPreset = React.useCallback(
    (preset: HomeSearchPreset) => {
      closeActiveSwipe();
      setTimelineFilters(preset.filters);
    },
    [closeActiveSwipe],
  );
  const deleteSearchPreset = React.useCallback(
    (preset: HomeSearchPreset) => {
      Alert.alert(
        copy.homeSearchPresetDeleteTitle,
        copy.homeSearchPresetDeleteDescription,
        [
          {
            text: copy.detailDeleteCancel,
            style: 'cancel',
          },
          {
            text: copy.detailDeleteConfirm,
            style: 'destructive',
            onPress: () => {
              setSavedSearchPresets(removeHomeSearchPreset(preset.id));
            },
          },
        ],
      );
    },
    [
      copy.detailDeleteCancel,
      copy.detailDeleteConfirm,
      copy.homeSearchPresetDeleteDescription,
      copy.homeSearchPresetDeleteTitle,
    ],
  );

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <Card style={styles.heroCard}>
          <SkeletonBlock width="26%" height={12} />
          <SkeletonBlock width="52%" height={26} />
          <SkeletonBlock width="72%" height={16} />
          <View style={styles.statsRow}>
            <SkeletonBlock width="31%" height={56} />
            <SkeletonBlock width="31%" height={56} />
            <SkeletonBlock width="31%" height={56} />
          </View>
        </Card>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`home-skeleton-${index}`} style={styles.skeletonCard}>
            <View style={styles.skeletonHeaderRow}>
              <SkeletonBlock style={styles.skeletonDateBadge} />
              <View style={styles.skeletonHeaderCopy}>
                <SkeletonBlock width="72%" height={16} />
                <SkeletonBlock width="48%" height={12} />
              </View>
            </View>
            <View style={styles.skeletonPreviewBlock}>
              <SkeletonBlock width="92%" height={12} />
              <SkeletonBlock width="84%" height={12} />
              <SkeletonBlock width="66%" height={12} />
            </View>
            <View style={styles.skeletonFooterRow}>
              <SkeletonBlock width="34%" height={24} />
              <SkeletonBlock width="26%" height={24} />
            </View>
          </Card>
        ))}
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
    <ScreenContainer scroll={false} padded={false}>
      <HomeHero
        copy={copy}
        styles={styles}
        scrollY={scrollY}
        insetTop={heroInsetTop}
        expandedHeight={heroExpandedHeight}
        collapsedHeight={heroCollapsedHeight}
        collapseDistance={HERO_COLLAPSE_DISTANCE}
        greeting={heroGreeting}
        dateLabel={heroDateLabel}
        streak={streak}
        totalDreams={activeDreams.length}
        averageWords={averageWords}
      />
      <FlatList
        data={displayedDreams}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HomeDreamRow
            dream={item}
            copy={copy}
            searchQuery={deferredTimelineFilters.searchQuery}
            moodLabels={moodLabels}
            theme={t}
            styles={styles}
            layout={layout}
            closeActiveSwipe={closeActiveSwipe}
            closePreviousSwipe={closePreviousSwipe}
            closeSwipe={closeSwipe}
            bindSwipeMethods={bindSwipeMethods}
            onSwipeClosed={onSwipeClosed}
            onSwipeOpened={onSwipeOpened}
            openDreamDetail={openDreamDetail}
            openDreamEditor={openDreamEditor}
            openDreamQuickActions={openDreamQuickActions}
            toggleArchiveFromList={toggleArchiveFromList}
            removeDreamFromList={removeDreamFromList}
          />
        )}
        ListHeaderComponent={
          <HomeListHeader
            copy={copy}
            styles={styles}
            timelineFilters={timelineFilters}
            homeFilters={homeFilters}
            activeFilterChips={activeFilterChips}
            visibleDreamCount={visibleDreams.length}
            archiveScopedCount={archiveScopedDreams.length}
            displayedDreamCount={displayedDreams.length}
            searchResultsLabel={searchResultsLabel}
            isSearchPending={isSearchPending}
            hasSearchQuery={hasSearchQuery}
            hasNonSearchRefinements={hasNonSearchRefinements}
            savedSearchPresets={savedSearchPresets}
            activeSearchPresetId={activeSearchPresetId}
            canSaveSearchPreset={canSaveSearchPreset}
            spotlightPattern={spotlightPattern}
            spotlightPatternKind={spotlightPatternKind}
            spotlightCountLabel={spotlightCountLabel}
            weeklyValue={weeklyValue}
            weeklyHint={weeklyHint}
            backlogValue={backlogDisplayValue}
            backlogHint={backlogHint}
            onOpenPatternDetail={openPatternDetail}
            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
            onClearFilters={clearTimelineFilters}
            onClearSearch={clearTimelineSearch}
            onSaveSearchPreset={saveCurrentSearchPreset}
            onApplySearchPreset={applySearchPreset}
            onDeleteSearchPreset={deleteSearchPreset}
            updateTimelineFilters={updateTimelineFilters}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: t.spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={t.colors.primary}
            colors={[t.colors.primary, t.colors.accent]}
            progressBackgroundColor={t.colors.surface}
            progressViewOffset={heroCollapsedHeight + heroInsetTop - 8}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: heroExpandedHeight + heroInsetTop + t.spacing.md,
            paddingBottom: getTabBarReservedSpace(insets.bottom) + t.spacing.xs,
          },
        ]}
      />

      <HomeFilterSheet
        visible={isFilterSheetOpen}
        copy={copy}
        styles={styles}
        timelineFilters={timelineFilters}
        moodFilters={moodFilters}
        typeFilters={typeFilters}
        transcriptFilters={transcriptFilters}
        availableTags={availableTags}
        dateRangeFilters={dateRangeFilters}
        sortOptions={sortOptions}
        onClose={() => setIsFilterSheetOpen(false)}
        updateTimelineFilters={updateTimelineFilters}
      />
    </ScreenContainer>
  );
}
