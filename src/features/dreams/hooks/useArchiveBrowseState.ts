import React from 'react';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { type AppLocale } from '../../../i18n/types';
import { Dream } from '../model/dream';
import {
  buildArchiveSections,
  getArchiveRevisitCue,
  buildCalendarCells,
  buildCalendarRows,
  formatArchiveActiveDaysCount,
  formatArchiveEntryCount,
  getArchiveEmptyContent,
  getAvailableMonthKeys,
  getDistinctDayCount,
  getQuickJumpMonthKeys,
  getTopArchiveTags,
  type ArchiveFilter,
  type ArchiveTagSignal,
  type ArchiveViewMode,
} from '../model/archiveBrowser';
import { getArchiveBrowseResult } from '../model/archiveBrowseQuery';
import { type ArchiveSpecialFilter } from '../model/archiveSearch';
import { getPracticeCopy } from '../../../constants/copy/practice';
import {
  trackFiltersApplied,
  trackSearchUsed,
} from '../../../services/observability/events';

const ARCHIVE_SEARCH_DEBOUNCE_MS = 160;
const DEFAULT_ARCHIVE_FILTER: ArchiveFilter = 'archived';

type UseArchiveBrowseStateArgs = {
  dreams: Dream[];
  copy: DreamCopy;
  locale: AppLocale;
  onBrowseMutate?: () => void;
};

export function useArchiveBrowseState({
  dreams,
  copy,
  locale,
  onBrowseMutate,
}: UseArchiveBrowseStateArgs) {
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const [filter, setFilter] = React.useState<ArchiveFilter>(
    DEFAULT_ARCHIVE_FILTER,
  );
  const [specialFilter, setSpecialFilter] =
    React.useState<ArchiveSpecialFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [viewMode, setViewMode] =
    React.useState<ArchiveViewMode>('comfortable');
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);

  const debouncedSearchQuery = useDebouncedValue(
    searchQuery,
    ARCHIVE_SEARCH_DEBOUNCE_MS,
  );
  const deferredSearchQuery = React.useDeferredValue(debouncedSearchQuery);
  const isSearchPending =
    searchQuery !== debouncedSearchQuery ||
    deferredSearchQuery !== debouncedSearchQuery;

  const {
    statusScopedDreams,
    monthDreams,
    searchedMonthDreams,
    visibleDreams,
  } = React.useMemo(
    () =>
      getArchiveBrowseResult({
        dreams,
        filter,
        selectedMonthKey,
        tagFilter,
        specialFilter,
        searchQuery: deferredSearchQuery,
        selectedDate,
      }),
    [
      deferredSearchQuery,
      dreams,
      filter,
      selectedDate,
      selectedMonthKey,
      specialFilter,
      tagFilter,
    ],
  );

  const availableMonthKeys = React.useMemo(
    () => getAvailableMonthKeys(dreams),
    [dreams],
  );

  React.useEffect(() => {
    if (!availableMonthKeys.length) {
      setSelectedMonthKey(null);
      setSelectedDate(null);
      return;
    }

    if (!selectedMonthKey || !availableMonthKeys.includes(selectedMonthKey)) {
      setSelectedMonthKey(availableMonthKeys[0]);
      setSelectedDate(null);
    }
  }, [availableMonthKeys, selectedMonthKey]);

  React.useEffect(() => {
    if (
      selectedDate &&
      selectedMonthKey &&
      !selectedDate.startsWith(selectedMonthKey)
    ) {
      setSelectedDate(null);
    }
  }, [selectedDate, selectedMonthKey]);

  const topMonthTags = React.useMemo<ArchiveTagSignal[]>(
    () => getTopArchiveTags(monthDreams),
    [monthDreams],
  );

  const revisitCue = React.useMemo(
    () => getArchiveRevisitCue(visibleDreams, copy),
    [visibleDreams, copy],
  );

  const sections = React.useMemo(
    () =>
      buildArchiveSections(
        visibleDreams,
        selectedMonthKey,
        localeKey,
        selectedDate,
      ),
    [visibleDreams, selectedMonthKey, localeKey, selectedDate],
  );

  const calendarCells = React.useMemo(
    () =>
      selectedMonthKey
        ? buildCalendarCells(selectedMonthKey, searchedMonthDreams)
        : [],
    [searchedMonthDreams, selectedMonthKey],
  );
  const calendarRows = React.useMemo(
    () => buildCalendarRows(calendarCells),
    [calendarCells],
  );

  const monthEntryCount = searchedMonthDreams.length;
  const monthActiveDays = getDistinctDayCount(searchedMonthDreams);
  const monthMetaText = `${formatArchiveEntryCount(monthEntryCount, locale)} · ${formatArchiveActiveDaysCount(monthActiveDays, locale)}`;
  const selectedMonthIndex = selectedMonthKey
    ? availableMonthKeys.indexOf(selectedMonthKey)
    : -1;
  const canGoOlder =
    selectedMonthIndex >= 0 &&
    selectedMonthIndex < availableMonthKeys.length - 1;
  const canGoNewer = selectedMonthIndex > 0;
  const quickJumpMonthKeys = React.useMemo(
    () => getQuickJumpMonthKeys(availableMonthKeys, selectedMonthIndex),
    [availableMonthKeys, selectedMonthIndex],
  );

  const weekdayLabels = React.useMemo(
    () => [
      copy.archiveWeekdayMon,
      copy.archiveWeekdayTue,
      copy.archiveWeekdayWed,
      copy.archiveWeekdayThu,
      copy.archiveWeekdayFri,
      copy.archiveWeekdaySat,
      copy.archiveWeekdaySun,
    ],
    [copy],
  );

  const archiveFilters = React.useMemo(
    () => [
      { key: 'archived' as const, label: copy.archiveFilterArchived },
      { key: 'active' as const, label: copy.archiveFilterActive },
      { key: 'starred' as const, label: copy.archiveFilterStarred },
      { key: 'all' as const, label: copy.archiveFilterAll },
    ],
    [copy],
  );
  const browseModes = React.useMemo(
    () => [
      { key: 'comfortable' as const, label: copy.archiveBrowseComfortable },
      { key: 'compact' as const, label: copy.archiveBrowseCompact },
    ],
    [copy],
  );
  const specialFilters = React.useMemo(
    () => [
      { key: 'all' as const, label: copy.archiveFilterAll },
      { key: 'lucid' as const, label: practiceCopy.filterLucid },
      { key: 'nightmare' as const, label: practiceCopy.filterNightmare },
      {
        key: 'recurring-nightmare' as const,
        label: practiceCopy.filterRecurringNightmare,
      },
      { key: 'control' as const, label: practiceCopy.filterControl },
      { key: 'high-distress' as const, label: practiceCopy.filterHighDistress },
    ],
    [copy.archiveFilterAll, practiceCopy],
  );

  const hasScopedDreams = statusScopedDreams.length > 0;
  const hasVisibleDreams = visibleDreams.length > 0;
  const archiveEmptyContent = getArchiveEmptyContent(
    copy,
    filter,
    hasScopedDreams,
    hasVisibleDreams,
  );
  const hasResettableView =
    Boolean(searchQuery.trim()) ||
    Boolean(selectedDate) ||
    Boolean(tagFilter) ||
    specialFilter !== 'all';
  const hasHardReset =
    Boolean(searchQuery.trim()) ||
    Boolean(tagFilter) ||
    specialFilter !== 'all';
  const visibleEntriesLabel = formatArchiveEntryCount(
    visibleDreams.length,
    locale,
  );
  const filterCount =
    Number(filter !== DEFAULT_ARCHIVE_FILTER) +
    Number(Boolean(selectedDate)) +
    Number(Boolean(tagFilter)) +
    Number(specialFilter !== 'all');
  const filterSignature = React.useMemo(
    () => JSON.stringify({ filter, selectedDate, tagFilter, specialFilter }),
    [filter, selectedDate, specialFilter, tagFilter],
  );
  const lastTrackedSearchQueryRef = React.useRef('');
  const lastTrackedFilterSignatureRef = React.useRef(filterSignature);

  React.useEffect(() => {
    const normalizedQuery = deferredSearchQuery.trim();
    if (!normalizedQuery) {
      lastTrackedSearchQueryRef.current = '';
      return;
    }

    if (lastTrackedSearchQueryRef.current === normalizedQuery) {
      return;
    }

    lastTrackedSearchQueryRef.current = normalizedQuery;
    trackSearchUsed({
      surface: 'archive',
      queryLength: normalizedQuery.length,
      resultCount: visibleDreams.length,
    });
  }, [deferredSearchQuery, visibleDreams.length]);

  React.useEffect(() => {
    if (filterCount === 0) {
      lastTrackedFilterSignatureRef.current = filterSignature;
      return;
    }

    if (lastTrackedFilterSignatureRef.current === filterSignature) {
      return;
    }

    lastTrackedFilterSignatureRef.current = filterSignature;
    trackFiltersApplied({
      surface: 'archive',
      filterCount,
    });
  }, [filterCount, filterSignature]);

  const selectMonth = React.useCallback(
    (monthKey: string) => {
      if (monthKey === selectedMonthKey) {
        return;
      }

      setSelectedMonthKey(monthKey);
      setSelectedDate(null);
      onBrowseMutate?.();
    },
    [onBrowseMutate, selectedMonthKey],
  );

  const moveMonth = React.useCallback(
    (direction: 'older' | 'newer') => {
      if (selectedMonthIndex < 0) {
        return;
      }

      const nextIndex =
        direction === 'older' ? selectedMonthIndex + 1 : selectedMonthIndex - 1;
      const nextMonthKey = availableMonthKeys[nextIndex];
      if (!nextMonthKey) {
        return;
      }

      selectMonth(nextMonthKey);
    },
    [availableMonthKeys, selectedMonthIndex, selectMonth],
  );

  const resetArchiveView = React.useCallback(() => {
    setFilter(DEFAULT_ARCHIVE_FILTER);
    setSpecialFilter('all');
    setSearchQuery('');
    setSelectedDate(null);
    setTagFilter(null);
    onBrowseMutate?.();
  }, [onBrowseMutate]);

  const selectFilter = React.useCallback(
    (nextFilter: ArchiveFilter) => {
      setFilter(nextFilter);
      setSpecialFilter('all');
      setSelectedDate(null);
      setTagFilter(null);
      onBrowseMutate?.();
    },
    [onBrowseMutate],
  );

  const selectTagFilter = React.useCallback(
    (tag: string | null) => {
      setTagFilter(current => (current === tag ? null : tag));
      onBrowseMutate?.();
    },
    [onBrowseMutate],
  );
  const selectSpecialFilter = React.useCallback(
    (value: ArchiveSpecialFilter) => {
      setSpecialFilter(current => (current === value ? 'all' : value));
      onBrowseMutate?.();
    },
    [onBrowseMutate],
  );

  const clearSelectedDate = React.useCallback(() => {
    setSelectedDate(null);
    onBrowseMutate?.();
  }, [onBrowseMutate]);

  const selectCalendarDate = React.useCallback((date: string | null) => {
    setSelectedDate(current => (current === date ? null : date));
  }, []);

  return {
    localeKey,
    filter,
    searchQuery,
    setSearchQuery,
    selectedMonthKey,
    selectedDate,
    viewMode,
    setViewMode,
    tagFilter,
    specialFilter,
    topMonthTags,
    deferredSearchQuery,
    isSearchPending,
    archiveFilters,
    specialFilters,
    browseModes,
    weekdayLabels,
    availableMonthKeys,
    visibleDreams,
    revisitCue,
    sections,
    calendarRows,
    monthMetaText,
    canGoOlder,
    canGoNewer,
    quickJumpMonthKeys,
    archiveEmptyContent,
    hasResettableView,
    hasHardReset,
    visibleEntriesLabel,
    selectMonth,
    moveMonth,
    resetArchiveView,
    selectFilter,
    selectTagFilter,
    selectSpecialFilter,
    clearSelectedDate,
    selectCalendarDate,
  };
}
