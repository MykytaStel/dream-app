import type { AppLocale } from '../../../i18n/types';

export const HOME_RECENT_DREAM_LIMIT = 3;

export type HomeFeedItem = {
  id: string;
  createdAt: number;
  sleepDate?: string;
  archivedAt?: number;
};

export type HomeFeedState<T extends HomeFeedItem> = {
  activeItems: T[];
  recentItems: T[];
  activeCount: number;
};

export type HomeFeedCopy = {
  openArchiveAction: string;
};

function toLocalDateKey(epoch: number) {
  const date = new Date(epoch);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function resolveItemDate(item: HomeFeedItem) {
  return item.sleepDate?.trim() || toLocalDateKey(item.createdAt);
}

function compareHomeItemsNewestFirst(left: HomeFeedItem, right: HomeFeedItem) {
  const dateCompare = resolveItemDate(right).localeCompare(
    resolveItemDate(left),
  );
  if (dateCompare !== 0) {
    return dateCompare;
  }

  if (right.createdAt !== left.createdAt) {
    return right.createdAt - left.createdAt;
  }

  return right.id.localeCompare(left.id);
}

export function getHomeFeedState<T extends HomeFeedItem>(
  items: ReadonlyArray<T>,
): HomeFeedState<T> {
  const activeItems = items
    .filter(item => typeof item.archivedAt !== 'number')
    .slice()
    .sort(compareHomeItemsNewestFirst);

  return {
    activeItems,
    recentItems: activeItems.slice(0, HOME_RECENT_DREAM_LIMIT),
    activeCount: activeItems.length,
  };
}

export function getHomeFeedCopy(locale: AppLocale): HomeFeedCopy {
  return locale === 'uk'
    ? { openArchiveAction: 'Відкрити весь архів' }
    : { openArchiveAction: 'Open full archive' };
}
