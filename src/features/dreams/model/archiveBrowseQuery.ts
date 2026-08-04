import type { Dream } from './dream';
import {
  applyArchiveStatusFilter,
  getMonthKey,
  searchArchiveMonthDreams,
  toLocalDateKey,
  type ArchiveFilter,
} from './archiveBrowser';
import {
  matchesArchiveSpecialFilter,
  type ArchiveSpecialFilter,
} from './archiveSearch';
import { getDreamDate } from './dreamAnalytics';

export type ArchiveBrowseQuery = {
  dreams: Dream[];
  filter: ArchiveFilter;
  selectedMonthKey: string | null;
  tagFilter: string | null;
  specialFilter: ArchiveSpecialFilter;
  searchQuery: string;
  selectedDate: string | null;
};

export type ArchiveBrowseResult = {
  statusScopedDreams: Dream[];
  monthDreams: Dream[];
  searchedMonthDreams: Dream[];
  visibleDreams: Dream[];
};

function normalizeArchiveTag(tag: string) {
  return tag.replace(/-/g, ' ').trim().toLowerCase();
}

function matchesArchiveTag(dream: Dream, tagFilter: string) {
  const normalizedFilter = normalizeArchiveTag(tagFilter);
  return dream.tags.some(tag => normalizeArchiveTag(tag) === normalizedFilter);
}

export function getArchiveBrowseResult({
  dreams,
  filter,
  selectedMonthKey,
  tagFilter,
  specialFilter,
  searchQuery,
  selectedDate,
}: ArchiveBrowseQuery): ArchiveBrowseResult {
  const statusScopedDreams = applyArchiveStatusFilter(dreams, filter);
  const monthDreams = selectedMonthKey
    ? statusScopedDreams.filter(dream => getMonthKey(dream) === selectedMonthKey)
    : [];
  const tagFilteredDreams = tagFilter
    ? monthDreams.filter(dream => matchesArchiveTag(dream, tagFilter))
    : monthDreams;
  const specialFilteredDreams =
    specialFilter === 'all'
      ? tagFilteredDreams
      : tagFilteredDreams.filter(dream =>
          matchesArchiveSpecialFilter(dream, specialFilter),
        );
  const searchedMonthDreams = searchArchiveMonthDreams(
    specialFilteredDreams,
    searchQuery,
  );
  const visibleDreams = selectedDate
    ? searchedMonthDreams.filter(
        dream => toLocalDateKey(getDreamDate(dream)) === selectedDate,
      )
    : searchedMonthDreams;

  return {
    statusScopedDreams,
    monthDreams,
    searchedMonthDreams,
    visibleDreams,
  };
}
