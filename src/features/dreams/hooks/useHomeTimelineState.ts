import React from 'react';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';
import {
  formatHeroDateLabel,
  getContextGreeting,
  getHomeRevisitCue,
} from '../model/homeOverview';
import { getCurrentStreak } from '../model/dreamAnalytics';
import { type Dream } from '../model/dream';
import { getHomeFeedState } from '../model/homeFeed';

type UseHomeTimelineStateArgs = {
  dreams: Dream[];
  copy: DreamCopy;
  locale: AppLocale;
};

export function useHomeTimelineState({
  dreams,
  copy,
  locale,
}: UseHomeTimelineStateArgs) {
  const feed = React.useMemo(() => getHomeFeedState(dreams), [dreams]);
  const deferredActiveDreams = React.useDeferredValue(feed.activeItems);

  const streak = React.useMemo(
    () => getCurrentStreak(feed.activeItems),
    [feed.activeItems],
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

  return {
    activeDreamCount: feed.activeCount,
    displayedDreams: feed.recentItems,
    heroGreeting,
    heroDateLabel,
    revisitCue,
    streak,
  };
}
