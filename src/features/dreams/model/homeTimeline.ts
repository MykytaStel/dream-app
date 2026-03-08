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
export type DreamSearchMatchReason = 'title' | 'notes' | 'transcript' | 'tag' | 'context';

export type HomeTimelineFilters = {
  archive: HomeArchiveFilter;
  starredOnly: boolean;
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
  starredOnly: false,
  searchQuery: '',
  mood: 'all',
  tags: [],
  entryType: 'all',
  transcript: 'all',
  dateRange: 'all',
  sortOrder: 'newest',
};

export function normalizeHomeTimelineFilters(
  filters: Partial<HomeTimelineFilters> | HomeTimelineFilters,
): HomeTimelineFilters {
  const uniqueTags = Array.from(
    new Set((filters.tags ?? []).map(tag => tag.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  return {
    archive:
      filters.archive === 'active' || filters.archive === 'archived' ? filters.archive : 'all',
    starredOnly: Boolean(filters.starredOnly),
    searchQuery: filters.searchQuery?.trim() ?? '',
    mood:
      filters.mood === 'positive' ||
      filters.mood === 'neutral' ||
      filters.mood === 'negative'
        ? filters.mood
        : 'all',
    tags: uniqueTags,
    entryType:
      filters.entryType === 'text' ||
      filters.entryType === 'audio' ||
      filters.entryType === 'mixed'
        ? filters.entryType
        : 'all',
    transcript:
      filters.transcript === 'with-transcript' ||
      filters.transcript === 'audio-only' ||
      filters.transcript === 'edited-transcript'
        ? filters.transcript
        : 'all',
    dateRange:
      filters.dateRange === '7d' ||
      filters.dateRange === '30d' ||
      filters.dateRange === '90d'
        ? filters.dateRange
        : 'all',
    sortOrder: filters.sortOrder === 'oldest' ? 'oldest' : 'newest',
  };
}

export function getHomeTimelineFiltersSignature(filters: HomeTimelineFilters) {
  return JSON.stringify(normalizeHomeTimelineFilters(filters));
}

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

export function isDreamStarred(dream: Dream) {
  return typeof dream.starredAt === 'number';
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

  return getDreamSearchMatchReasons(dream, normalizedQuery).length > 0;
}

export function getDreamSearchMatchReasons(
  dream: Dream,
  query: string,
): DreamSearchMatchReason[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const reasons: DreamSearchMatchReason[] = [];
  const hasMatch = (value?: string) => value?.toLowerCase().includes(normalizedQuery);

  if (hasMatch(dream.title)) {
    reasons.push('title');
  }

  if (hasMatch(dream.text)) {
    reasons.push('notes');
  }

  if (hasMatch(dream.transcript)) {
    reasons.push('transcript');
  }

  if (dream.tags.some(tag => hasMatch(tag))) {
    reasons.push('tag');
  }

  if (
    hasMatch(dream.sleepContext?.importantEvents) ||
    hasMatch(dream.sleepContext?.medications) ||
    hasMatch(dream.sleepContext?.healthNotes)
  ) {
    reasons.push('context');
  }

  return reasons;
}

function normalizeSearchValue(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function isExactSearchMatch(value: string | undefined, query: string) {
  const normalizedValue = normalizeSearchValue(value);
  return Boolean(normalizedValue) && normalizedValue === query;
}

function startsWithSearchQuery(value: string | undefined, query: string) {
  const normalizedValue = normalizeSearchValue(value);
  return Boolean(normalizedValue) && normalizedValue.startsWith(query);
}

function countQueryMatches(value: string | undefined, query: string) {
  const haystack = normalizeSearchValue(value);
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

function getFieldSearchScore(
  value: string | undefined,
  query: string,
  weights: { exact: number; prefix: number; match: number },
) {
  if (!query) {
    return 0;
  }

  let score = countQueryMatches(value, query) * weights.match;

  if (isExactSearchMatch(value, query)) {
    score += weights.exact;
  } else if (startsWithSearchQuery(value, query)) {
    score += weights.prefix;
  }

  return score;
}

function getTagSearchScore(tags: string[], query: string) {
  return tags.reduce((score, tag) => {
    if (isExactSearchMatch(tag, query)) {
      return score + 54 + countQueryMatches(tag, query) * 14;
    }

    if (startsWithSearchQuery(tag, query)) {
      return score + 32 + countQueryMatches(tag, query) * 14;
    }

    return score + countQueryMatches(tag, query) * 14;
  }, 0);
}

export function getDreamSearchScore(dream: Dream, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  return (
    getFieldSearchScore(dream.title, normalizedQuery, {
      exact: 72,
      prefix: 40,
      match: 18,
    }) +
    getFieldSearchScore(dream.text, normalizedQuery, {
      exact: 44,
      prefix: 22,
      match: 10,
    }) +
    getFieldSearchScore(dream.transcript, normalizedQuery, {
      exact: 36,
      prefix: 16,
      match: 8,
    }) +
    getFieldSearchScore(dream.sleepContext?.importantEvents, normalizedQuery, {
      exact: 20,
      prefix: 10,
      match: 4,
    }) +
    getFieldSearchScore(dream.sleepContext?.medications, normalizedQuery, {
      exact: 16,
      prefix: 8,
      match: 3,
    }) +
    getFieldSearchScore(dream.sleepContext?.healthNotes, normalizedQuery, {
      exact: 16,
      prefix: 8,
      match: 3,
    }) +
    getTagSearchScore(dream.tags, normalizedQuery)
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

    if (filters.starredOnly && !isDreamStarred(dream)) {
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
    filters.starredOnly ||
    filters.mood !== 'all' ||
    filters.tags.length > 0 ||
    filters.entryType !== 'all' ||
    filters.transcript !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sortOrder !== DEFAULT_HOME_TIMELINE_FILTERS.sortOrder
  );
}
