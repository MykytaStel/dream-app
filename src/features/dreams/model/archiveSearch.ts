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

// The sub-scores below each used to re-fold the same field — three
// `normalize('NFC').toLowerCase()` passes per field, per dream, per keystroke.
// They now take the already-folded haystack so a field is folded once.
function countHaystackMatches(haystack: string, query: string) {
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

function getFoldedFieldSearchScore(
  haystack: string,
  query: string,
  weights: { exact: number; prefix: number; match: number },
) {
  if (!query || !haystack) {
    return 0;
  }

  let score = countHaystackMatches(haystack, query) * weights.match;

  if (haystack === query) {
    score += weights.exact;
  } else if (haystack.startsWith(query)) {
    score += weights.prefix;
  }

  return score;
}

function getFieldSearchScore(
  value: string | undefined,
  query: string,
  weights: { exact: number; prefix: number; match: number },
) {
  return getFoldedFieldSearchScore(normalizeSearchValue(value), query, weights);
}

function getTagSearchScore(tags: string[], query: string) {
  return tags.reduce((score, tag) => {
    const haystack = normalizeSearchValue(tag);
    const matches = countHaystackMatches(haystack, query) * 14;

    if (haystack && haystack === query) {
      return score + 54 + matches;
    }

    if (haystack && haystack.startsWith(query)) {
      return score + 32 + matches;
    }

    return score + matches;
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
