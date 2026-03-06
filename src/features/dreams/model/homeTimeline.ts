import { Dream, Mood } from './dream';
import { resolveDreamSleepDate } from './dreamRules';

export type HomeArchiveFilter = 'all' | 'active' | 'archived';
export type HomeEntryTypeFilter = 'all' | 'text' | 'audio' | 'mixed';
export type HomeTranscriptFilter =
  | 'all'
  | 'with-transcript'
  | 'audio-only'
  | 'edited-transcript';
export type HomeSortOrder = 'newest' | 'oldest';
export type HomeDateRangeFilter = 'all' | '7d' | '30d' | '90d';

export type HomeTimelineFilters = {
  archive: HomeArchiveFilter;
  searchQuery: string;
  mood: 'all' | Mood;
  tags: string[];
  entryType: HomeEntryTypeFilter;
  transcript: HomeTranscriptFilter;
  dateRange: HomeDateRangeFilter;
  sortOrder: HomeSortOrder;
};

export const DEFAULT_HOME_TIMELINE_FILTERS: HomeTimelineFilters = {
  archive: 'all',
  searchQuery: '',
  mood: 'all',
  tags: [],
  entryType: 'all',
  transcript: 'all',
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

function countQueryMatches(value: string | undefined, query: string) {
  const haystack = value?.trim().toLowerCase();
  if (!haystack || !query) {
    return 0;
  }

  let matches = 0;
  let index = haystack.indexOf(query);

  while (index !== -1) {
    matches += 1;
    index = haystack.indexOf(query, index + query.length);
  }

  return matches;
}

export function getDreamSearchScore(dream: Dream, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  return (
    countQueryMatches(dream.title, normalizedQuery) * 6 +
    countQueryMatches(dream.text, normalizedQuery) * 5 +
    countQueryMatches(dream.transcript, normalizedQuery) * 4 +
    countQueryMatches(dream.sleepContext?.importantEvents, normalizedQuery) * 3 +
    countQueryMatches(dream.sleepContext?.medications, normalizedQuery) * 2 +
    countQueryMatches(dream.sleepContext?.healthNotes, normalizedQuery) * 2 +
    dream.tags.reduce((score, tag) => score + countQueryMatches(tag, normalizedQuery) * 4, 0)
  );
}

export function matchesDreamTranscriptFilter(dream: Dream, filter: HomeTranscriptFilter) {
  const hasAudio = Boolean(dream.audioUri?.trim());
  const hasTranscript = Boolean(dream.transcript?.trim());
  const hasText = Boolean(dream.text?.trim());

  if (filter === 'all') {
    return true;
  }

  if (filter === 'with-transcript') {
    return hasTranscript;
  }

  if (filter === 'audio-only') {
    return hasAudio && !hasTranscript && !hasText;
  }

  return hasTranscript && dream.transcriptSource === 'edited';
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

    if (!matchesDreamTranscriptFilter(dream, filters.transcript)) {
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

  const sorted = sortDreamsForTimeline(filtered, filters.sortOrder);
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return sorted;
  }

  return [...sorted].sort((a, b) => {
    const scoreDiff = getDreamSearchScore(b, normalizedQuery) - getDreamSearchScore(a, normalizedQuery);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return 0;
  });
}

export function hasActiveTimelineRefinements(filters: HomeTimelineFilters) {
  return (
    Boolean(filters.searchQuery.trim()) ||
    filters.mood !== 'all' ||
    filters.tags.length > 0 ||
    filters.entryType !== 'all' ||
    filters.transcript !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sortOrder !== DEFAULT_HOME_TIMELINE_FILTERS.sortOrder
  );
}
