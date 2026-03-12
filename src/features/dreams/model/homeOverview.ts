import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';
import { Dream, Mood } from './dream';
import { getRelatedDreams } from './relatedDreams';
import { getDreamResurfacingMatch, type DreamResurfacingWindow } from './resurfacingCue';
import {
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  type HomeSortOrder,
  type HomeTimelineFilters,
  type HomeTranscriptFilter,
} from './homeTimeline';
import { type HomeFilterChip, type HomeOption } from '../components/home/homeTypes';

export type HomeRevisitCue = {
  dreamId: string;
  title: string;
  reason: string;
  contextLabel: string;
  actionLabel: string;
  icon: string;
};

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
  homeFilters: Array<HomeOption<HomeArchiveFilter>>;
  typeFilters: Array<HomeOption<HomeEntryTypeFilter>>;
  transcriptFilters: Array<HomeOption<HomeTranscriptFilter>>;
  dateRangeFilters: Array<HomeOption<HomeDateRangeFilter>>;
  sortOptions: Array<HomeOption<HomeSortOrder>>;
};

export function buildActiveFilterChips({
  filters,
  copy,
  moodLabels,
  homeFilters,
  typeFilters,
  transcriptFilters,
  dateRangeFilters,
  sortOptions,
}: BuildActiveFilterChipsArgs): HomeFilterChip[] {
  const chips: HomeFilterChip[] = [];

  if (filters.archive !== 'active') {
    chips.push({
      key: `archive:${filters.archive}`,
      label:
        homeFilters.find(filter => filter.key === filters.archive)?.label ??
        filters.archive,
    });
  }

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

const HOME_REVISIT_MIN_AGE_MS = 6 * 60 * 60 * 1000;

function getHomeRevisitTitle(dream: Dream, copy: DreamCopy) {
  return dream.title?.trim() || copy.untitled;
}

function getHomeResurfacingWindowLabel(
  window: DreamResurfacingWindow,
  copy: DreamCopy,
) {
  switch (window) {
    case 'week':
      return copy.homeSpotlightRevisitTimeWeek;
    case 'month':
      return copy.homeSpotlightRevisitTimeMonth;
    case 'quarter':
      return copy.homeSpotlightRevisitTimeQuarter;
    case 'half-year':
      return copy.homeSpotlightRevisitTimeHalfYear;
    case 'year':
      return copy.homeSpotlightRevisitTimeYear;
  }
}

export function getHomeRevisitCue(
  dreams: Dream[],
  copy: DreamCopy,
  now = Date.now(),
): HomeRevisitCue | null {
  const candidates = dreams
    .filter(dream => now - dream.createdAt >= HOME_REVISIT_MIN_AGE_MS)
    .map(dream => {
      const relatedCount = getRelatedDreams(dream, dreams).length;
      const hasAnalysis = Boolean(dream.analysis?.summary?.trim());
      const hasTranscript = Boolean(dream.transcript?.trim());
      const resurfacingMatch = getDreamResurfacingMatch(dream, now);
      const hasSignal = Boolean(
        dream.tags.length || dream.wakeEmotions?.length || dream.sleepContext?.preSleepEmotions?.length,
      );
      const score =
        (typeof dream.starredAt === 'number' ? 40 : 0) +
        relatedCount * 10 +
        (hasAnalysis ? 7 : 0) +
        (hasTranscript ? 5 : 0) +
        (resurfacingMatch?.score ?? 0) +
        (hasSignal ? 3 : 0);

      let reason = copy.homeSpotlightRevisitReasonSignal;
      let contextLabel = copy.homeSpotlightRevisitContextSignal;
      let actionLabel = copy.homeSpotlightRevisitAction;
      let icon = 'flash-outline';

      if (relatedCount > 0) {
        reason = `${copy.homeSpotlightRevisitReasonThreadPrefix}${relatedCount}${copy.homeSpotlightRevisitReasonThreadSuffix}`;
        contextLabel = copy.homeSpotlightRevisitContextThread;
        actionLabel = copy.homeSpotlightRevisitActionThread;
        icon = 'git-compare-outline';
      } else if (hasAnalysis) {
        reason = copy.homeSpotlightRevisitReasonAnalysis;
        contextLabel = copy.homeSpotlightRevisitContextAnalysis;
        actionLabel = copy.homeSpotlightRevisitActionAnalysis;
        icon = 'sparkles-outline';
      } else if (hasTranscript) {
        reason = copy.homeSpotlightRevisitReasonTranscript;
        contextLabel = copy.homeSpotlightRevisitContextTranscript;
        actionLabel = copy.homeSpotlightRevisitActionTranscript;
        icon = 'document-text-outline';
      } else if (resurfacingMatch) {
        reason = `${copy.homeSpotlightRevisitReasonTimePrefix}${getHomeResurfacingWindowLabel(
          resurfacingMatch.window,
          copy,
        )}${copy.homeSpotlightRevisitReasonTimeSuffix}`;
        contextLabel = copy.homeSpotlightRevisitContextTime;
        actionLabel = copy.homeSpotlightRevisitActionTime;
        icon = 'time-outline';
      }

      return {
        dream,
        score,
        reason,
        contextLabel,
        actionLabel,
        icon,
      };
    })
    .filter(candidate => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.dream.createdAt - left.dream.createdAt;
    });

  const topCandidate = candidates[0];
  if (!topCandidate) {
    return null;
  }

  return {
    dreamId: topCandidate.dream.id,
    title: getHomeRevisitTitle(topCandidate.dream, copy),
    reason: topCandidate.reason,
    contextLabel: topCandidate.contextLabel,
    actionLabel: topCandidate.actionLabel,
    icon: topCandidate.icon,
  };
}
