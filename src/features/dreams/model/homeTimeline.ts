import { Dream, Mood } from './dream';
import { resolveDreamSleepDate } from './dreamRules';

export type HomeArchiveFilter = 'all' | 'active' | 'archived';
export type HomeEntryTypeFilter = 'all' | 'text' | 'audio' | 'mixed';
export type HomeSortOrder = 'newest' | 'oldest';
export type HomeDateRangeFilter = 'all' | '7d' | '30d' | '90d';

export type HomeTimelineFilters = {
  archive: HomeArchiveFilter;
  searchQuery: string;
  mood: 'all' | Mood;
  tags: string[];
  entryType: HomeEntryTypeFilter;
  dateRange: HomeDateRangeFilter;
  sortOrder: HomeSortOrder;
};

export const DEFAULT_HOME_TIMELINE_FILTERS: HomeTimelineFilters = {
  archive: 'all',
  searchQuery: '',
  mood: 'all',
  tags: [],
  entryType: 'all',
  dateRange: 'all',
  sortOrder: 'newest',
};

function toLocalDateString(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getDateRangeCutoff(range: HomeDateRangeFilter, now: Date) {
  if (range === 'all') {
    return null;
  }

  const daysBack =
    range === '7d' ? 6 : range === '30d' ? 29 : 89;
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - daysBack);
  return toLocalDateString(cutoff);
}

export function isDreamArchived(dream: Dream) {
  return typeof dream.archivedAt === 'number';
}

export function getDreamEntryType(dream: Dream): HomeEntryTypeFilter {
  const hasText = Boolean(dream.text?.trim());
  const hasAudio = Boolean(dream.audioUri?.trim());

  if (hasText && hasAudio) {
    return 'mixed';
  }

  if (hasAudio) {
    return 'audio';
  }

  return 'text';
}

export function matchesDreamSearch(dream: Dream, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchableParts = [
    dream.title,
    dream.text,
    dream.transcript,
    dream.sleepContext?.importantEvents,
    dream.sleepContext?.medications,
    dream.sleepContext?.healthNotes,
    ...dream.tags,
  ];

  return searchableParts.some(part => part?.toLowerCase().includes(normalizedQuery));
}

function compareDreamsNewestFirst(a: Dream, b: Dream) {
  const dateCompare = resolveDreamSleepDate(b.sleepDate, b.createdAt).localeCompare(
    resolveDreamSleepDate(a.sleepDate, a.createdAt),
  );
  if (dateCompare !== 0) {
    return dateCompare;
  }

  if (b.createdAt !== a.createdAt) {
    return b.createdAt - a.createdAt;
  }

  return b.id.localeCompare(a.id);
}

export function sortDreamsForTimeline(dreams: Dream[], sortOrder: HomeSortOrder) {
  const newestFirst = [...dreams].sort(compareDreamsNewestFirst);
  return sortOrder === 'oldest' ? newestFirst.reverse() : newestFirst;
}

export function getAvailableTimelineTags(dreams: Dream[]) {
  return Array.from(new Set(dreams.flatMap(dream => dream.tags))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function applyHomeTimelineFilters(
  dreams: Dream[],
  filters: HomeTimelineFilters,
  now = new Date(),
) {
  const dateRangeCutoff = getDateRangeCutoff(filters.dateRange, now);
  const filtered = dreams.filter(dream => {
    if (filters.archive === 'active' && isDreamArchived(dream)) {
      return false;
    }

    if (filters.archive === 'archived' && !isDreamArchived(dream)) {
      return false;
    }

    if (filters.mood !== 'all' && dream.mood !== filters.mood) {
      return false;
    }

    if (filters.tags.length > 0 && !filters.tags.every(tag => dream.tags.includes(tag))) {
      return false;
    }

    if (filters.entryType !== 'all' && getDreamEntryType(dream) !== filters.entryType) {
      return false;
    }

    if (dateRangeCutoff) {
      const dreamDate = resolveDreamSleepDate(dream.sleepDate, dream.createdAt);
      if (dreamDate < dateRangeCutoff) {
        return false;
      }
    }

    if (!matchesDreamSearch(dream, filters.searchQuery)) {
      return false;
    }

    return true;
  });

  return sortDreamsForTimeline(filtered, filters.sortOrder);
}

export function hasActiveTimelineRefinements(filters: HomeTimelineFilters) {
  return (
    Boolean(filters.searchQuery.trim()) ||
    filters.mood !== 'all' ||
    filters.tags.length > 0 ||
    filters.entryType !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sortOrder !== DEFAULT_HOME_TIMELINE_FILTERS.sortOrder
  );
}
