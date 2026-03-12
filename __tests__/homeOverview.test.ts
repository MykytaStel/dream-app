import { getDreamCopy } from '../src/constants/copy/dreams';
import { getHomeRevisitCue } from '../src/features/dreams/model/homeOverview';
import type { Dream } from '../src/features/dreams/model/dream';

describe('homeOverview', () => {
  const copy = getDreamCopy('en');

  test('prefers an older threaded dream as the revisit cue', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'recent',
        createdAt: now - 60 * 60 * 1000,
        title: 'Recent dream',
        text: 'Too fresh to revisit',
        tags: ['river'],
      },
      {
        id: 'threaded',
        createdAt: now - 24 * 60 * 60 * 1000,
        title: 'Bridge again',
        text: 'Crossing the bridge over water',
        tags: ['bridge', 'water'],
      },
      {
        id: 'older-match',
        createdAt: now - 48 * 60 * 60 * 1000,
        title: 'Old water dream',
        text: 'Bridge and water returned',
        tags: ['bridge'],
      },
    ];

    expect(getHomeRevisitCue(dreams, copy, now)).toEqual({
      dreamId: 'threaded',
      title: 'Bridge again',
      reason: 'Thread with 1 nearby dreams',
      contextLabel: copy.homeSpotlightRevisitContextThread,
      actionLabel: copy.homeSpotlightRevisitActionThread,
      icon: 'git-compare-outline',
    });
  });

  test('falls back to analysis or transcript when no thread exists', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'analysis-dream',
        createdAt: now - 24 * 60 * 60 * 1000,
        title: 'Mirror room',
        text: 'A mirror room dream',
        analysis: {
          provider: 'manual',
          status: 'ready',
          summary: 'A dream about reflection.',
        },
        tags: [],
      },
    ];

    expect(getHomeRevisitCue(dreams, copy, now)).toEqual({
      dreamId: 'analysis-dream',
      title: 'Mirror room',
      reason: copy.homeSpotlightRevisitReasonAnalysis,
      contextLabel: copy.homeSpotlightRevisitContextAnalysis,
      actionLabel: copy.homeSpotlightRevisitActionAnalysis,
      icon: 'sparkles-outline',
    });
  });

  test('surfaces a time-based memory cue when a dream lines up with a revisit window', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'time-capsule',
        createdAt: new Date('2026-02-10T08:00:00Z').getTime(),
        title: 'Station platform',
        text: 'Waiting for a train under red lights',
        tags: [],
      },
    ];

    expect(getHomeRevisitCue(dreams, copy, now)).toEqual({
      dreamId: 'time-capsule',
      title: 'Station platform',
      reason: `${copy.homeSpotlightRevisitReasonTimePrefix}${copy.homeSpotlightRevisitTimeMonth}${copy.homeSpotlightRevisitReasonTimeSuffix}`,
      contextLabel: copy.homeSpotlightRevisitContextTime,
      actionLabel: copy.homeSpotlightRevisitActionTime,
      icon: 'time-outline',
    });
  });
});
