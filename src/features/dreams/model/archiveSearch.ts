import type { Dream } from './dream';
import { normalizeUnicode } from '../../../utils/text';
import {
  isControlledLucidDream,
  isHighDistressNightmare,
  isLucidDream,
  isNightmareDream,
  isRecurringNightmare,
} from './dreamAnalytics';

// Both sides of every comparison pass through here: the same word typed with a
// precomposed accent and with a combining one are different strings, and
// without folding them a search for "café" would miss a dream that stored the
// other form. Paste from iOS and macOS routinely produces the decomposed form.
function foldForSearch(value: string): string {
  return normalizeUnicode(value).toLowerCase();
}

export type ArchiveSpecialFilter =
  | 'all'
  | 'lucid'
  | 'nightmare'
  | 'recurring-nightmare'
  | 'control'
  | 'high-distress';

export type ArchiveSearchMatchReason =
  'title' | 'notes' | 'transcript' | 'tag' | 'context';

export function matchesArchiveSpecialFilter(
  dream: Dream,
  filter: ArchiveSpecialFilter,
) {
  switch (filter) {
    case 'lucid':
      return isLucidDream(dream);
    case 'nightmare':
      return isNightmareDream(dream);
    case 'recurring-nightmare':
      return isRecurringNightmare(dream);
    case 'control':
      return isControlledLucidDream(dream);
    case 'high-distress':
      return isHighDistressNightmare(dream);
    case 'all':
    default:
      return true;
  }
}

export function getArchiveSearchMatchReasons(
  dream: Dream,
  query: string,
): ArchiveSearchMatchReason[] {
  const normalizedQuery = foldForSearch(query).trim();
  if (!normalizedQuery) {
    return [];
  }

  const reasons: ArchiveSearchMatchReason[] = [];
  const hasMatch = (value?: string) =>
    value ? foldForSearch(value).includes(normalizedQuery) : false;

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
  return value ? foldForSearch(value).trim() : '';
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

export function getArchiveSearchScore(dream: Dream, query: string) {
  const normalizedQuery = foldForSearch(query).trim();
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
