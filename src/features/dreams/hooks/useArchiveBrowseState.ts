import React from 'react';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { type AppLocale } from '../../../i18n/types';
import { Dream } from '../model/dream';
import {
  applyArchiveStatusFilter,
  buildArchiveSections,
  buildCalendarCells,
  buildCalendarRows,
  formatArchiveActiveDaysCount,
  formatArchiveEntryCount,
  getArchiveEmptyContent,
  getAvailableMonthKeys,
  getDistinctDayCount,
  getQuickJumpMonthKeys,
  getMonthKey,
  searchArchiveMonthDreams,
  toLocalDateKey,
  type ArchiveFilter,
  type ArchiveViewMode,
} from '../model/archiveBrowser';
import { getDreamDate } from '../model/dreamAnalytics';

const ARCHIVE_SEARCH_DEBOUNCE_MS = 160;

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
  const [filter, setFilter] = React.useState<ArchiveFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ArchiveViewMode>('comfortable');

  const debouncedSearchQuery = useDebouncedValue(searchQuery, ARCHIVE_SEARCH_DEBOUNCE_MS);
  const deferredSearchQuery = React.useDeferredValue(debouncedSearchQuery);
  const isSearchPending =
    searchQuery !== debouncedSearchQuery || deferredSearchQuery !== debouncedSearchQuery;

  const statusScopedDreams = React.useMemo(
    () => applyArchiveStatusFilter(dreams, filter),
    [dreams, filter],
  );

  const availableMonthKeys = React.useMemo(
    () => getAvailableMonthKeys(statusScopedDreams),
    [statusScopedDreams],
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
    if (selectedDate && selectedMonthKey && !selectedDate.startsWith(selectedMonthKey)) {
      setSelectedDate(null);
    }
  }, [selectedDate, selectedMonthKey]);

  const monthDreams = React.useMemo(
    () =>
      selectedMonthKey
        ? statusScopedDreams.filter(dream => getMonthKey(dream) === selectedMonthKey)
        : [],
    [selectedMonthKey, statusScopedDreams],
  );

  const searchedMonthDreams = React.useMemo(
    () => searchArchiveMonthDreams(monthDreams, deferredSearchQuery),
    [deferredSearchQuery, monthDreams],
  );

  const visibleDreams = React.useMemo(
    () =>
      selectedDate
        ? searchedMonthDreams.filter(dream => toLocalDateKey(getDreamDate(dream)) === selectedDate)
        : searchedMonthDreams,
    [searchedMonthDreams, selectedDate],
  );

  const sections = React.useMemo(
    () => buildArchiveSections(visibleDreams, selectedMonthKey, localeKey, selectedDate),
    [visibleDreams, selectedMonthKey, localeKey, selectedDate],
  );

  const calendarCells = React.useMemo(
    () => (selectedMonthKey ? buildCalendarCells(selectedMonthKey, searchedMonthDreams) : []),
    [searchedMonthDreams, selectedMonthKey],
  );
  const calendarRows = React.useMemo(
    () => buildCalendarRows(calendarCells),
    [calendarCells],
  );

  const monthEntryCount = searchedMonthDreams.length;
  const monthActiveDays = getDistinctDayCount(searchedMonthDreams);
  const monthMetaText = `${formatArchiveEntryCount(monthEntryCount, locale)} · ${formatArchiveActiveDaysCount(monthActiveDays, locale)}`;
  const selectedMonthIndex = selectedMonthKey ? availableMonthKeys.indexOf(selectedMonthKey) : -1;
  const canGoOlder =
    selectedMonthIndex >= 0 && selectedMonthIndex < availableMonthKeys.length - 1;
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
      { key: 'all' as const, label: copy.archiveFilterAll },
      { key: 'active' as const, label: copy.archiveFilterActive },
      { key: 'starred' as const, label: copy.archiveFilterStarred },
      { key: 'archived' as const, label: copy.archiveFilterArchived },
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

  const hasScopedDreams = statusScopedDreams.length > 0;
  const hasVisibleDreams = visibleDreams.length > 0;
  const archiveEmptyContent = getArchiveEmptyContent(
    copy,
    filter,
    hasScopedDreams,
    hasVisibleDreams,
  );
  const hasResettableView =
    filter !== 'all' || Boolean(searchQuery.trim()) || Boolean(selectedDate);
  const hasHardReset = filter !== 'all' || Boolean(searchQuery.trim());
  const visibleEntriesLabel = formatArchiveEntryCount(visibleDreams.length, locale);

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
    setFilter('all');
    setSearchQuery('');
    setSelectedDate(null);
    onBrowseMutate?.();
  }, [onBrowseMutate]);

  const selectFilter = React.useCallback(
    (nextFilter: ArchiveFilter) => {
      setFilter(nextFilter);
      setSelectedDate(null);
      onBrowseMutate?.();
    },
    [onBrowseMutate],
  );

  const clearSelectedDate = React.useCallback(() => {
    setSelectedDate(null);
    onBrowseMutate?.();
  }, [onBrowseMutate]);

  const toggleCalendarExpanded = React.useCallback(() => {
    setIsCalendarExpanded(current => !current);
  }, []);

  const selectCalendarDate = React.useCallback(
    (date: string | null) => {
      setSelectedDate(current => (current === date ? null : date));
    },
    [],
  );

  return {
    localeKey,
    filter,
    searchQuery,
    setSearchQuery,
    selectedMonthKey,
    selectedDate,
    isCalendarExpanded,
    viewMode,
    setViewMode,
    deferredSearchQuery,
    isSearchPending,
    archiveFilters,
    browseModes,
    weekdayLabels,
    availableMonthKeys,
    visibleDreams,
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
    clearSelectedDate,
    toggleCalendarExpanded,
    selectCalendarDate,
  };
}
