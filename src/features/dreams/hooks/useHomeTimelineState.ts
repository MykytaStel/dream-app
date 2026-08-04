import React from 'react';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';
import {
  formatHeroDateLabel,
  formatLastViewedDreamMeta,
  formatResultCount,
  getContextGreeting,
  getHomeRevisitCue,
} from '../model/homeOverview';
import { getCurrentStreak } from '../model/dreamAnalytics';
import { type Dream } from '../model/dream';
import { isDreamArchived, sortDreamsNewestFirst } from '../model/dreamList';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../../stats/model/dreamReflection';

const HOME_RECENT_LIMIT = 12;

type UseHomeTimelineStateArgs = {
  dreams: Dream[];
  copy: DreamCopy;
  locale: AppLocale;
  lastViewedDream: Dream | null;
};

export function useHomeTimelineState({
  dreams,
  copy,
  locale,
  lastViewedDream,
}: UseHomeTimelineStateArgs) {
  const activeDreams = React.useMemo(
    () =>
      sortDreamsNewestFirst(dreams.filter(dream => !isDreamArchived(dream))),
    [dreams],
  );
  const displayedDreams = React.useMemo(
    () => activeDreams.slice(0, HOME_RECENT_LIMIT),
    [activeDreams],
  );

  // Deferred analytics keep the recent-dream list responsive on large journals.
  const deferredActiveDreams = React.useDeferredValue(activeDreams);

  const streak = React.useMemo(
    () => getCurrentStreak(activeDreams),
    [activeDreams],
  );
  const spotlightWord = React.useMemo(
    () => getRecurringWordSignals(deferredActiveDreams, 1)[0],
    [deferredActiveDreams],
  );
  const spotlightTheme = React.useMemo(
    () => getRecurringReflectionSignals(deferredActiveDreams, { limit: 1 })[0],
    [deferredActiveDreams],
  );
  const transcriptArchiveStats = React.useMemo(
    () => getTranscriptArchiveStats(deferredActiveDreams),
    [deferredActiveDreams],
  );
  const moodBacklogCount = React.useMemo(
    () => deferredActiveDreams.filter(dream => !dream.mood).length,
    [deferredActiveDreams],
  );

  const heroGreeting = React.useMemo(() => getContextGreeting(copy), [copy]);
  const heroDateLabel = React.useMemo(
    () => formatHeroDateLabel(locale),
    [locale],
  );
  const revisitCue = React.useMemo(
    () => getHomeRevisitCue(deferredActiveDreams, copy),
    [copy, deferredActiveDreams],
  );
  const lastViewedDreamMeta = React.useMemo(
    () => formatLastViewedDreamMeta(lastViewedDream, copy, locale),
    [copy, lastViewedDream, locale],
  );

  const spotlightPattern =
    spotlightWord?.label ??
    spotlightTheme?.label ??
    copy.homeSpotlightNoPattern;
  const spotlightPatternKind: PatternDetailKind | null = spotlightWord
    ? 'word'
    : spotlightTheme
      ? 'theme'
      : null;
  const spotlightCountLabel = React.useMemo(
    () =>
      formatResultCount(
        (spotlightWord?.dreamCount ?? spotlightTheme?.dreamCount) || 0,
        copy,
      ),
    [copy, spotlightTheme?.dreamCount, spotlightWord?.dreamCount],
  );
  const attentionValue =
    transcriptArchiveStats.audioOnly > 0
      ? transcriptArchiveStats.audioOnly === 1
        ? copy.homeSpotlightAttentionAudioSingle
        : `${transcriptArchiveStats.audioOnly} ${copy.homeSpotlightAttentionAudioPlural}`
      : moodBacklogCount > 0
        ? moodBacklogCount === 1
          ? copy.homeSpotlightAttentionMoodSingle
          : `${moodBacklogCount} ${copy.homeSpotlightAttentionMoodPlural}`
        : copy.homeSpotlightAttentionClear;
  const attentionHint =
    transcriptArchiveStats.audioOnly > 0
      ? copy.homeSpotlightAttentionAudioHint
      : moodBacklogCount > 0
        ? copy.homeSpotlightAttentionMoodHint
        : copy.homeSpotlightAttentionClearHint;

  return {
    activeDreamCount: activeDreams.length,
    displayedDreams,
    heroGreeting,
    heroDateLabel,
    revisitCue,
    lastViewedDreamMeta,
    streak,
    spotlightPattern,
    spotlightPatternKind,
    spotlightCountLabel,
    attentionValue,
    attentionHint,
  };
}
