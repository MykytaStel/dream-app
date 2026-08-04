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
  dateScopedDreams: Dream[];
  searchedScopeDreams: Dream[];
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
  const dateScopedDreams = selectedMonthKey
    ? statusScopedDreams.filter(
        dream => getMonthKey(dream) === selectedMonthKey,
      )
    : statusScopedDreams;
  const tagFilteredDreams = tagFilter
    ? dateScopedDreams.filter(dream => matchesArchiveTag(dream, tagFilter))
    : dateScopedDreams;
  const specialFilteredDreams =
    specialFilter === 'all'
      ? tagFilteredDreams
      : tagFilteredDreams.filter(dream =>
          matchesArchiveSpecialFilter(dream, specialFilter),
        );
  const searchedScopeDreams = searchArchiveMonthDreams(
    specialFilteredDreams,
    searchQuery,
  );
  const visibleDreams =
    selectedMonthKey && selectedDate
      ? searchedScopeDreams.filter(
          dream => toLocalDateKey(getDreamDate(dream)) === selectedDate,
        )
      : searchedScopeDreams;

  return {
    statusScopedDreams,
    dateScopedDreams,
    searchedScopeDreams,
    visibleDreams,
  };
}
