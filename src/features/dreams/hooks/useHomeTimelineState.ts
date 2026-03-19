import React from 'react';
import { Alert } from 'react-native';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { getPracticeCopy } from '../../../constants/copy/practice';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { type AppLocale } from '../../../i18n/types';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import {
  type HomeFilterChip,
  type HomeOption,
} from '../components/home/homeTypes';
import {
  buildActiveFilterChips,
  buildSearchPresetLabel,
  formatHeroDateLabel,
  formatLastViewedDreamMeta,
  formatResultCount,
  getContextGreeting,
  getHomeRevisitCue,
} from '../model/homeOverview';
import { getAverageWords, getCurrentStreak } from '../model/dreamAnalytics';
import { Dream, Mood } from '../model/dream';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getAvailableTimelineTags,
  getHomeTimelineFiltersSignature,
  hasActiveTimelineFilters,
  hasActiveTimelineRefinements,
  isDreamArchived,
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  type HomeSpecialFilter,
  type HomeSortOrder,
  type HomeTimelineFilters,
  type HomeTranscriptFilter,
} from '../model/homeTimeline';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../../stats/model/dreamReflection';
import { buildWeeklyPatternCards } from '../../stats/model/weeklyPatternCards';
import {
  removeHomeSearchPreset,
  saveHomeSearchPreset,
  type HomeSearchPreset,
} from '../services/homeSearchPresetService';
import {
  trackFiltersApplied,
  trackSearchUsed,
} from '../../../services/observability/events';

const HOME_RECENT_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 160;

type UseHomeTimelineStateArgs = {
  dreams: Dream[];
  copy: DreamCopy;
  locale: AppLocale;
  moodLabels: Record<Mood, string>;
  savedSearchPresets: HomeSearchPreset[];
  setSavedSearchPresets: React.Dispatch<
    React.SetStateAction<HomeSearchPreset[]>
  >;
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
  const [isFilterMutationPending, startFilterMutation] = React.useTransition();
  const [timelineFilters, setTimelineFilters] =
    React.useState<HomeTimelineFilters>(DEFAULT_HOME_TIMELINE_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);

  const homeFilters = React.useMemo<Array<HomeOption<HomeArchiveFilter>>>(
    () => [
      { key: 'active', label: copy.homeFilterActive },
      { key: 'all', label: copy.homeFilterAll },
    ],
    [copy.homeFilterActive, copy.homeFilterAll],
  );
  const moodFilters = React.useMemo<
    Array<HomeOption<HomeTimelineFilters['mood']>>
  >(
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
  const specialFilters = React.useMemo<Array<HomeOption<HomeSpecialFilter>>>(
    () => [
      { key: 'all', label: copy.homeFilterAll },
      { key: 'lucid', label: practiceCopy.filterLucid },
      { key: 'nightmare', label: practiceCopy.filterNightmare },
      { key: 'recurring-nightmare', label: practiceCopy.filterRecurringNightmare },
      { key: 'control', label: practiceCopy.filterControl },
      { key: 'high-distress', label: practiceCopy.filterHighDistress },
    ],
    [copy.homeFilterAll, practiceCopy],
  );
  const transcriptFilters = React.useMemo<
    Array<HomeOption<HomeTranscriptFilter>>
  >(
    () => [
      { key: 'all', label: copy.homeTranscriptFilterAll },
      {
        key: 'with-transcript',
        label: copy.homeTranscriptFilterWithTranscript,
      },
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
  const dateRangeFilters = React.useMemo<
    Array<HomeOption<HomeDateRangeFilter>>
  >(
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
  const debouncedSearchQuery = useDebouncedValue(
    timelineFilters.searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const effectiveTimelineFilters = React.useMemo(
    () => ({
      ...timelineFilters,
      searchQuery: debouncedSearchQuery,
    }),
    [debouncedSearchQuery, timelineFilters],
  );
  const deferredTimelineFilters = React.useDeferredValue(
    effectiveTimelineFilters,
  );
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
  const hasCustomSort =
    timelineFilters.sortOrder !== DEFAULT_HOME_TIMELINE_FILTERS.sortOrder;
  const shouldLimitHomeFeed = !hasActiveRefinements && !hasCustomSort;
  const displayedDreams = React.useMemo(
    () =>
      shouldLimitHomeFeed
        ? visibleDreams.slice(0, HOME_RECENT_LIMIT)
        : visibleDreams,
    [shouldLimitHomeFeed, visibleDreams],
  );

  // Deferred: expensive O(n×m) analytics don't block the list render
  const deferredActiveDreams = React.useDeferredValue(activeDreams);

  const streak = React.useMemo(
    () => getCurrentStreak(activeDreams),
    [activeDreams],
  );
  const averageWords = React.useMemo(
    () => getAverageWords(activeDreams),
    [activeDreams],
  );
  const spotlightWord = React.useMemo(
    () => getRecurringWordSignals(deferredActiveDreams, 1)[0],
    [deferredActiveDreams],
  );
  const spotlightTheme = React.useMemo(
    () => getRecurringReflectionSignals(deferredActiveDreams, { limit: 1 })[0],
    [deferredActiveDreams],
  );
  const transcriptArchiveStats = React.useMemo(
    () => getTranscriptArchiveStats(deferredActiveDreams),
    [deferredActiveDreams],
  );
  const moodBacklogCount = React.useMemo(
    () => deferredActiveDreams.filter(dream => !dream.mood).length,
    [deferredActiveDreams],
  );

  const heroGreeting = React.useMemo(() => getContextGreeting(copy), [copy]);
  const heroDateLabel = React.useMemo(
    () => formatHeroDateLabel(locale),
    [locale],
  );
  const revisitCue = React.useMemo(
    () => getHomeRevisitCue(deferredActiveDreams, copy),
    [deferredActiveDreams, copy],
  );
  const lastViewedDreamMeta = React.useMemo(
    () => formatLastViewedDreamMeta(lastViewedDream, copy, locale),
    [copy, lastViewedDream, locale],
  );

  const spotlightPattern =
    spotlightWord?.label ??
    spotlightTheme?.label ??
    copy.homeSpotlightNoPattern;
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
      formatResultCount(
        (spotlightWord?.dreamCount ?? spotlightTheme?.dreamCount) || 0,
        copy,
      ),
    [copy, spotlightTheme?.dreamCount, spotlightWord?.dreamCount],
  );
  const weeklyPatternCards = React.useMemo(
    () =>
      activeDreams.length
        ? buildWeeklyPatternCards({
            dreams: activeDreams,
            locale,
            copy,
            moodLabels,
          })
        : [],
    [activeDreams, copy, locale, moodLabels],
  );
  const attentionValue =
    transcriptArchiveStats.audioOnly > 0
      ? transcriptArchiveStats.audioOnly === 1
        ? copy.homeSpotlightAttentionAudioSingle
        : `${transcriptArchiveStats.audioOnly} ${copy.homeSpotlightAttentionAudioPlural}`
      : moodBacklogCount > 0
      ? moodBacklogCount === 1
        ? copy.homeSpotlightAttentionMoodSingle
        : `${moodBacklogCount} ${copy.homeSpotlightAttentionMoodPlural}`
      : copy.homeSpotlightAttentionClear;
  const attentionHint =
    transcriptArchiveStats.audioOnly > 0
      ? copy.homeSpotlightAttentionAudioHint
      : moodBacklogCount > 0
      ? copy.homeSpotlightAttentionMoodHint
      : copy.homeSpotlightAttentionClearHint;

  const activeFilterChips = React.useMemo<HomeFilterChip[]>(
    () =>
      buildActiveFilterChips({
        filters: timelineFilters,
        copy,
        moodLabels,
        homeFilters,
        typeFilters,
        transcriptFilters,
        dateRangeFilters,
        specialFilters,
      }),
    [
      copy,
      dateRangeFilters,
      homeFilters,
      moodLabels,
      specialFilters,
      timelineFilters,
      transcriptFilters,
      typeFilters,
    ],
  );
  const hasSearchQuery = Boolean(timelineFilters.searchQuery.trim());
  const hasNonSearchRefinements = React.useMemo(
    () => hasActiveTimelineFilters(timelineFilters),
    [timelineFilters],
  );
  const hasCustomView = hasActiveRefinements || hasCustomSort;
  const filterGroupCount = React.useMemo(
    () =>
      Number(
        timelineFilters.archive !== DEFAULT_HOME_TIMELINE_FILTERS.archive,
      ) +
      Number(timelineFilters.starredOnly) +
      Number(timelineFilters.mood !== DEFAULT_HOME_TIMELINE_FILTERS.mood) +
      Number(timelineFilters.tags.length > 0) +
      Number(timelineFilters.special !== DEFAULT_HOME_TIMELINE_FILTERS.special) +
      Number(
        timelineFilters.entryType !== DEFAULT_HOME_TIMELINE_FILTERS.entryType,
      ) +
      Number(
        timelineFilters.transcript !== DEFAULT_HOME_TIMELINE_FILTERS.transcript,
      ) +
      Number(
        timelineFilters.dateRange !== DEFAULT_HOME_TIMELINE_FILTERS.dateRange,
      ) +
      Number(
        timelineFilters.sortOrder !== DEFAULT_HOME_TIMELINE_FILTERS.sortOrder,
      ),
    [timelineFilters],
  );
  const currentFilterSignature = React.useMemo(
    () => getHomeTimelineFiltersSignature(timelineFilters),
    [timelineFilters],
  );
  const activeSearchPresetId = React.useMemo(
    () =>
      savedSearchPresets.find(
        preset =>
          getHomeTimelineFiltersSignature(preset.filters) ===
          currentFilterSignature,
      )?.id ?? null,
    [currentFilterSignature, savedSearchPresets],
  );
  const canSaveSearchPreset = React.useMemo(
    () => hasActiveRefinements && !activeSearchPresetId,
    [activeSearchPresetId, hasActiveRefinements],
  );
  const lastTrackedSearchQueryRef = React.useRef('');
  const lastTrackedFilterSignatureRef = React.useRef(currentFilterSignature);

  React.useEffect(() => {
    const nextTags = timelineFilters.tags.filter(tag =>
      availableTags.includes(tag),
    );
    if (nextTags.length === timelineFilters.tags.length) {
      return;
    }

    setTimelineFilters(current => ({
      ...current,
      tags: current.tags.filter(tag => availableTags.includes(tag)),
    }));
  }, [availableTags, timelineFilters.tags]);

  React.useEffect(() => {
    const normalizedQuery = deferredTimelineFilters.searchQuery.trim();
    if (!normalizedQuery) {
      lastTrackedSearchQueryRef.current = '';
      return;
    }

    if (lastTrackedSearchQueryRef.current === normalizedQuery) {
      return;
    }

    lastTrackedSearchQueryRef.current = normalizedQuery;
    trackSearchUsed({
      surface: 'home',
      queryLength: normalizedQuery.length,
      resultCount: visibleDreams.length,
    });
  }, [deferredTimelineFilters.searchQuery, visibleDreams.length]);

  React.useEffect(() => {
    if (filterGroupCount === 0) {
      lastTrackedFilterSignatureRef.current = currentFilterSignature;
      return;
    }

    if (lastTrackedFilterSignatureRef.current === currentFilterSignature) {
      return;
    }

    lastTrackedFilterSignatureRef.current = currentFilterSignature;
    trackFiltersApplied({
      surface: 'home',
      filterCount: filterGroupCount,
    });
  }, [currentFilterSignature, filterGroupCount]);

  const updateTimelineFilters = React.useCallback(
    (updater: (current: HomeTimelineFilters) => HomeTimelineFilters) => {
      closeActiveSwipe();
      startFilterMutation(() => {
        setTimelineFilters(current => updater(current));
      });
    },
    [closeActiveSwipe, startFilterMutation],
  );

  const clearTimelineFilters = React.useCallback(() => {
    closeActiveSwipe();
    startFilterMutation(() => {
      setTimelineFilters(current => ({
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        searchQuery: current.searchQuery,
        sortOrder: current.sortOrder,
      }));
    });
  }, [closeActiveSwipe, startFilterMutation]);

  const clearTimelineSearch = React.useCallback(() => {
    closeActiveSwipe();
    startFilterMutation(() => {
      setTimelineFilters(current => ({
        ...current,
        searchQuery: '',
      }));
    });
  }, [closeActiveSwipe, startFilterMutation]);

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
          specialFilters,
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
      specialFilters,
      setSavedSearchPresets,
      timelineFilters,
    transcriptFilters,
    typeFilters,
  ]);

  const applySearchPreset = React.useCallback(
    (preset: HomeSearchPreset) => {
      closeActiveSwipe();
      startFilterMutation(() => {
        setTimelineFilters(preset.filters);
      });
    },
    [closeActiveSwipe, startFilterMutation],
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
    specialFilters,
    sortOptions,
    availableTags,
    activeDreams,
    archiveScopedDreams,
    visibleDreams,
    displayedDreams,
    deferredSearchQuery: deferredTimelineFilters.searchQuery,
    isSearchPending,
    isFilterMutationPending,
    activeFilterChips,
    hasSearchQuery,
    hasNonSearchRefinements,
    hasCustomView,
    hasCustomSort,
    activeSearchPresetId,
    canSaveSearchPreset,
    heroGreeting,
    heroDateLabel,
    revisitCue,
    lastViewedDreamMeta,
    streak,
    averageWords,
    spotlightPattern,
    spotlightPatternKind,
    spotlightCountLabel,
    weeklyPatternCards,
    attentionValue,
    attentionHint,
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
