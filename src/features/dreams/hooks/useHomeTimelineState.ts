import React from 'react';
import { Alert } from 'react-native';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { type AppLocale } from '../../../i18n/types';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { type HomeFilterChip, type HomeOption } from '../components/home/homeTypes';
import {
  buildActiveFilterChips,
  buildSearchPresetLabel,
  formatHeroDateLabel,
  formatLastViewedDreamMeta,
  formatResultCount,
  getContextGreeting,
} from '../model/homeOverview';
import {
  getAverageWords,
  getCurrentStreak,
  getEntriesLastSevenDays,
} from '../model/dreamAnalytics';
import { Dream, Mood } from '../model/dream';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getAvailableTimelineTags,
  getHomeTimelineFiltersSignature,
  hasActiveTimelineRefinements,
  isDreamArchived,
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  type HomeSortOrder,
  type HomeTimelineFilters,
  type HomeTranscriptFilter,
} from '../model/homeTimeline';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../../stats/model/dreamReflection';
import {
  removeHomeSearchPreset,
  saveHomeSearchPreset,
  type HomeSearchPreset,
} from '../services/homeSearchPresetService';

const HOME_RECENT_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 160;

type UseHomeTimelineStateArgs = {
  dreams: Dream[];
  copy: DreamCopy;
  locale: AppLocale;
  moodLabels: Record<Mood, string>;
  savedSearchPresets: HomeSearchPreset[];
  setSavedSearchPresets: React.Dispatch<React.SetStateAction<HomeSearchPreset[]>>;
  lastViewedDream: Dream | null;
  closeActiveSwipe: () => void;
};

export function useHomeTimelineState({
  dreams,
  copy,
  locale,
  moodLabels,
  savedSearchPresets,
  setSavedSearchPresets,
  lastViewedDream,
  closeActiveSwipe,
}: UseHomeTimelineStateArgs) {
  const [timelineFilters, setTimelineFilters] = React.useState<HomeTimelineFilters>(
    DEFAULT_HOME_TIMELINE_FILTERS,
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);

  const homeFilters = React.useMemo<Array<HomeOption<HomeArchiveFilter>>>(
    () => [
      { key: 'all', label: copy.homeFilterAll },
      { key: 'active', label: copy.homeFilterActive },
    ],
    [copy.homeFilterActive, copy.homeFilterAll],
  );
  const moodFilters = React.useMemo<Array<HomeOption<HomeTimelineFilters['mood']>>>(
    () => [
      { key: 'all', label: copy.homeMoodFilterAll },
      { key: 'positive', label: moodLabels.positive },
      { key: 'neutral', label: moodLabels.neutral },
      { key: 'negative', label: moodLabels.negative },
    ],
    [copy.homeMoodFilterAll, moodLabels],
  );
  const typeFilters = React.useMemo<Array<HomeOption<HomeEntryTypeFilter>>>(
    () => [
      { key: 'all', label: copy.homeTypeFilterAll },
      { key: 'text', label: copy.homeTypeFilterText },
      { key: 'audio', label: copy.homeTypeFilterAudio },
      { key: 'mixed', label: copy.homeTypeFilterMixed },
    ],
    [
      copy.homeTypeFilterAll,
      copy.homeTypeFilterAudio,
      copy.homeTypeFilterMixed,
      copy.homeTypeFilterText,
    ],
  );
  const transcriptFilters = React.useMemo<Array<HomeOption<HomeTranscriptFilter>>>(
    () => [
      { key: 'all', label: copy.homeTranscriptFilterAll },
      { key: 'with-transcript', label: copy.homeTranscriptFilterWithTranscript },
      { key: 'audio-only', label: copy.homeTranscriptFilterAudioOnly },
      { key: 'edited-transcript', label: copy.homeTranscriptFilterEdited },
    ],
    [
      copy.homeTranscriptFilterAll,
      copy.homeTranscriptFilterAudioOnly,
      copy.homeTranscriptFilterEdited,
      copy.homeTranscriptFilterWithTranscript,
    ],
  );
  const dateRangeFilters = React.useMemo<Array<HomeOption<HomeDateRangeFilter>>>(
    () => [
      { key: 'all', label: copy.homeDateRangeAll },
      { key: '7d', label: copy.homeDateRange7d },
      { key: '30d', label: copy.homeDateRange30d },
      { key: '90d', label: copy.homeDateRange90d },
    ],
    [
      copy.homeDateRange30d,
      copy.homeDateRange7d,
      copy.homeDateRange90d,
      copy.homeDateRangeAll,
    ],
  );
  const sortOptions = React.useMemo<Array<HomeOption<HomeSortOrder>>>(
    () => [
      { key: 'newest', label: copy.homeSortFilterNewest },
      { key: 'oldest', label: copy.homeSortFilterOldest },
    ],
    [copy.homeSortFilterNewest, copy.homeSortFilterOldest],
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

  const streak = React.useMemo(() => getCurrentStreak(activeDreams), [activeDreams]);
  const averageWords = React.useMemo(() => getAverageWords(activeDreams), [activeDreams]);
  const weeklyEntries = React.useMemo(() => getEntriesLastSevenDays(activeDreams), [activeDreams]);
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
  const heroDateLabel = React.useMemo(() => formatHeroDateLabel(locale), [locale]);
  const lastViewedDreamMeta = React.useMemo(
    () => formatLastViewedDreamMeta(lastViewedDream, copy, locale),
    [copy, lastViewedDream, locale],
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

  const activeFilterChips = React.useMemo<HomeFilterChip[]>(
    () =>
      buildActiveFilterChips({
        filters: timelineFilters,
        copy,
        moodLabels,
        typeFilters,
        transcriptFilters,
        dateRangeFilters,
        sortOptions,
      }),
    [copy, dateRangeFilters, moodLabels, sortOptions, timelineFilters, transcriptFilters, typeFilters],
  );
  const hasSearchQuery = Boolean(timelineFilters.searchQuery.trim());
  const hasNonSearchRefinements = React.useMemo(
    () => activeFilterChips.some(chip => chip.key !== 'search'),
    [activeFilterChips],
  );
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
        label: buildSearchPresetLabel({
          filters: timelineFilters,
          copy,
          moodLabels,
          transcriptFilters,
          typeFilters,
          dateRangeFilters,
          homeFilters,
        }),
        filters: timelineFilters,
      }),
    );
  }, [
    canSaveSearchPreset,
    closeActiveSwipe,
    copy,
    dateRangeFilters,
    homeFilters,
    moodLabels,
    setSavedSearchPresets,
    timelineFilters,
    transcriptFilters,
    typeFilters,
  ]);

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
      setSavedSearchPresets,
    ],
  );

  return {
    timelineFilters,
    isFilterSheetOpen,
    setIsFilterSheetOpen,
    homeFilters,
    moodFilters,
    typeFilters,
    transcriptFilters,
    dateRangeFilters,
    sortOptions,
    availableTags,
    activeDreams,
    archiveScopedDreams,
    visibleDreams,
    displayedDreams,
    deferredSearchQuery: deferredTimelineFilters.searchQuery,
    isSearchPending,
    activeFilterChips,
    hasSearchQuery,
    hasNonSearchRefinements,
    activeSearchPresetId,
    canSaveSearchPreset,
    heroGreeting,
    heroDateLabel,
    lastViewedDreamMeta,
    streak,
    averageWords,
    spotlightPattern,
    spotlightPatternKind,
    spotlightCountLabel,
    weeklyValue,
    weeklyHint,
    backlogDisplayValue,
    backlogHint,
    searchResultsLabel,
    savedSearchPresets,
    updateTimelineFilters,
    clearTimelineFilters,
    clearTimelineSearch,
    saveCurrentSearchPreset,
    applySearchPreset,
    deleteSearchPreset,
  };
}
