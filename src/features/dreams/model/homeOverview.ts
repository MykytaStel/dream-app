import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';
import { Dream, Mood } from './dream';
import {
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  type HomeSortOrder,
  type HomeTimelineFilters,
  type HomeTranscriptFilter,
} from './homeTimeline';
import { type HomeFilterChip, type HomeOption } from '../components/home/homeTypes';

export function getContextGreeting(copy: DreamCopy, now = new Date()) {
  const hour = now.getHours();

  if (hour < 5) {
    return copy.homeGreetingNight;
  }

  if (hour < 12) {
    return copy.homeGreetingMorning;
  }

  if (hour < 18) {
    return copy.homeGreetingAfternoon;
  }

  return copy.homeGreetingEvening;
}

export function isWakeCaptureWindow(now = new Date()) {
  const hour = now.getHours();
  return hour >= 4 && hour < 12;
}

export function formatResultCount(count: number, copy: DreamCopy) {
  return `${count} ${count === 1 ? copy.homeResultsSingle : copy.homeResultsPlural}`;
}

export function moodLabel(
  mood: Dream['mood'] | undefined,
  moodLabels: Record<Mood, string>,
) {
  return mood ? moodLabels[mood] : undefined;
}

export function clipPresetLabel(value: string, maxLength = 28) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}

type BuildSearchPresetLabelArgs = {
  filters: HomeTimelineFilters;
  copy: DreamCopy;
  moodLabels: Record<Mood, string>;
  transcriptFilters: Array<HomeOption<HomeTranscriptFilter>>;
  typeFilters: Array<HomeOption<HomeEntryTypeFilter>>;
  dateRangeFilters: Array<HomeOption<HomeDateRangeFilter>>;
  homeFilters: Array<HomeOption<HomeArchiveFilter>>;
};

export function buildSearchPresetLabel({
  filters,
  copy,
  moodLabels,
  transcriptFilters,
  typeFilters,
  dateRangeFilters,
  homeFilters,
}: BuildSearchPresetLabelArgs) {
  const searchLabel = filters.searchQuery.trim();
  if (searchLabel) {
    return clipPresetLabel(searchLabel);
  }

  if (filters.tags.length > 0) {
    const [firstTag, ...restTags] = filters.tags;
    return clipPresetLabel(restTags.length > 0 ? `${firstTag} +${restTags.length}` : firstTag);
  }

  if (filters.starredOnly) {
    return copy.homeFilterStarred;
  }

  if (filters.mood !== 'all') {
    return moodLabel(filters.mood, moodLabels) ?? copy.homeSearchPresetFallback;
  }

  if (filters.transcript !== 'all') {
    return (
      transcriptFilters.find(filter => filter.key === filters.transcript)?.label ??
      copy.homeSearchPresetFallback
    );
  }

  if (filters.entryType !== 'all') {
    return (
      typeFilters.find(filter => filter.key === filters.entryType)?.label ??
      copy.homeSearchPresetFallback
    );
  }

  if (filters.dateRange !== 'all') {
    return (
      dateRangeFilters.find(filter => filter.key === filters.dateRange)?.label ??
      copy.homeSearchPresetFallback
    );
  }

  if (filters.archive !== 'all') {
    return (
      homeFilters.find(filter => filter.key === filters.archive)?.label ??
      copy.homeSearchPresetFallback
    );
  }

  return copy.homeSearchPresetFallback;
}

type BuildActiveFilterChipsArgs = {
  filters: HomeTimelineFilters;
  copy: DreamCopy;
  moodLabels: Record<Mood, string>;
  typeFilters: Array<HomeOption<HomeEntryTypeFilter>>;
  transcriptFilters: Array<HomeOption<HomeTranscriptFilter>>;
  dateRangeFilters: Array<HomeOption<HomeDateRangeFilter>>;
  sortOptions: Array<HomeOption<HomeSortOrder>>;
};

export function buildActiveFilterChips({
  filters,
  copy,
  moodLabels,
  typeFilters,
  transcriptFilters,
  dateRangeFilters,
  sortOptions,
}: BuildActiveFilterChipsArgs): HomeFilterChip[] {
  const chips: HomeFilterChip[] = [];

  if (filters.mood !== 'all') {
    chips.push({
      key: `mood:${filters.mood}`,
      label: moodLabel(filters.mood, moodLabels) ?? copy.homeMoodFilterAll,
    });
  }

  if (filters.starredOnly) {
    chips.push({
      key: 'starred',
      label: copy.homeFilterStarred,
    });
  }

  if (filters.entryType !== 'all') {
    chips.push({
      key: `entry:${filters.entryType}`,
      label:
        typeFilters.find(filter => filter.key === filters.entryType)?.label ??
        filters.entryType,
    });
  }

  if (filters.transcript !== 'all') {
    chips.push({
      key: `transcript:${filters.transcript}`,
      label:
        transcriptFilters.find(filter => filter.key === filters.transcript)?.label ??
        filters.transcript,
    });
  }

  filters.tags.forEach(tag => {
    chips.push({
      key: `tag:${tag}`,
      label: tag,
    });
  });

  if (filters.dateRange !== 'all') {
    chips.push({
      key: `date:${filters.dateRange}`,
      label:
        dateRangeFilters.find(filter => filter.key === filters.dateRange)?.label ??
        filters.dateRange,
    });
  }

  if (filters.sortOrder !== 'newest') {
    chips.push({
      key: `sort:${filters.sortOrder}`,
      label:
        sortOptions.find(option => option.key === filters.sortOrder)?.label ??
        filters.sortOrder,
    });
  }

  if (filters.searchQuery.trim()) {
    chips.push({
      key: 'search',
      label: filters.searchQuery.trim(),
    });
  }

  return chips;
}

export function formatHeroDateLabel(locale: AppLocale) {
  return new Date().toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLastViewedDreamMeta(
  dream: Dream | null,
  copy: DreamCopy,
  locale: AppLocale,
) {
  if (!dream) {
    return null;
  }

  return `${copy.homeLastDreamMetaPrefix} ${new Date(dream.createdAt).toLocaleDateString(
    locale === 'uk' ? 'uk-UA' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
    },
  )}`;
}
