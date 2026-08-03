import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';
import { Dream } from './dream';
import { getDreamSignalWeights } from './relatedDreams';
import {
  getDreamResurfacingMatch,
  type DreamResurfacingWindow,
} from './resurfacingCue';

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

  return `${copy.homeLastDreamMetaPrefix} ${new Date(
    dream.createdAt,
  ).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
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
  // Pre-compute signal weights once
  const allWeights = new Map<string, Map<string, number>>();
  for (const dream of dreams) {
    allWeights.set(dream.id, getDreamSignalWeights(dream));
  }

  // Build inverted index: signal → dream IDs — reduces related-count lookup from O(n²×s) to O(n×s×k)
  const signalIndex = new Map<string, Set<string>>();
  for (const [dreamId, weights] of allWeights) {
    for (const signal of weights.keys()) {
      let ids = signalIndex.get(signal);
      if (!ids) {
        ids = new Set();
        signalIndex.set(signal, ids);
      }
      ids.add(dreamId);
    }
  }

  // Pre-compute related-dream count for each dream via inverted index
  const relatedCountMap = new Map<string, number>();
  for (const [dreamId, weights] of allWeights) {
    const relatedIds = new Set<string>();
    for (const signal of weights.keys()) {
      const sharingIds = signalIndex.get(signal);
      if (sharingIds) {
        for (const id of sharingIds) {
          if (id !== dreamId) {
            relatedIds.add(id);
          }
        }
      }
    }
    relatedCountMap.set(dreamId, relatedIds.size);
  }

  const candidates = dreams
    .filter(dream => now - dream.createdAt >= HOME_REVISIT_MIN_AGE_MS)
    .map(dream => {
      const relatedCount = relatedCountMap.get(dream.id) ?? 0;
      const hasAnalysis = Boolean(dream.analysis?.summary?.trim());
      const hasTranscript = Boolean(dream.transcript?.trim());
      const resurfacingMatch = getDreamResurfacingMatch(dream, now);
      const hasSignal = Boolean(
        dream.tags.length ||
        dream.wakeEmotions?.length ||
        dream.sleepContext?.preSleepEmotions?.length,
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
