import type { AppLocale } from '../../../i18n/types';
import type { ArchiveFilter } from './archiveBrowser';
import type { ArchiveSpecialFilter } from './archiveSearch';

export type ArchiveFilterSelection = {
  filter: ArchiveFilter;
  specialFilter: ArchiveSpecialFilter;
  tagFilter: string | null;
};

export type ArchiveFilterSheetCopy = {
  triggerLabel: string;
  title: string;
  statusLabel: string;
  specialLabel: string;
  tagsLabel: string;
  allTagsLabel: string;
  noTagsLabel: string;
  resetLabel: string;
  cancelLabel: string;
  applyLabel: string;
};

export const DEFAULT_ARCHIVE_FILTER_SELECTION: ArchiveFilterSelection = {
  filter: 'all',
  specialFilter: 'all',
  tagFilter: null,
};

export function countActiveArchiveFilters({
  filter,
  specialFilter,
  tagFilter,
}: ArchiveFilterSelection) {
  return (
    Number(filter !== DEFAULT_ARCHIVE_FILTER_SELECTION.filter) +
    Number(specialFilter !== DEFAULT_ARCHIVE_FILTER_SELECTION.specialFilter) +
    Number(Boolean(tagFilter))
  );
}

export function getArchiveFilterSheetCopy(
  locale: AppLocale,
): ArchiveFilterSheetCopy {
  if (locale === 'uk') {
    return {
      triggerLabel: 'Фільтри',
      title: 'Фільтри журналу',
      statusLabel: 'Статус',
      specialLabel: 'Тип сну',
      tagsLabel: 'Теги',
      allTagsLabel: 'Усі теги',
      noTagsLabel: 'У цьому зрізі ще немає тегів.',
      resetLabel: 'Скинути',
      cancelLabel: 'Скасувати',
      applyLabel: 'Застосувати',
    };
  }

  return {
    triggerLabel: 'Filters',
    title: 'Journal filters',
    statusLabel: 'Status',
    specialLabel: 'Dream type',
    tagsLabel: 'Tags',
    allTagsLabel: 'All tags',
    noTagsLabel: 'There are no tags in this scope yet.',
    resetLabel: 'Reset',
    cancelLabel: 'Cancel',
    applyLabel: 'Apply',
  };
}
