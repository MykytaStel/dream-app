import { Dream } from '../src/features/dreams/model/dream';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../src/features/stats/model/dreamReflection';

describe('dreamReflection', () => {
  const dreams: Dream[] = [
    {
      id: 'dream-1',
      createdAt: 1,
      sleepDate: '2026-03-07',
      audioUri: 'file:///one.m4a',
      transcript: 'Lantern hallway over water and mirrors',
      transcriptSource: 'generated',
      tags: ['water', 'lantern'],
    },
    {
      id: 'dream-2',
      createdAt: 2,
      sleepDate: '2026-03-06',
      text: 'Lantern light near the bridge and quiet water',
      audioUri: 'file:///two.m4a',
      transcript: 'Lantern room with water below the bridge',
      transcriptSource: 'edited',
      tags: ['bridge', 'water'],
    },
    {
      id: 'dream-3',
      createdAt: 3,
      sleepDate: '2026-03-05',
      audioUri: 'file:///three.m4a',
      tags: ['forest'],
    },
  ];

  test('builds transcript archive stats for generated, edited, and audio-only dreams', () => {
    expect(getTranscriptArchiveStats(dreams)).toEqual({
      withTranscript: 2,
      editedTranscript: 1,
      generatedTranscript: 1,
      audioOnly: 1,
    });
  });

  test('returns recurring local reflection signals from tags and transcripts', () => {
    expect(getRecurringReflectionSignals(dreams)).toEqual([
      {
        label: 'water',
        dreamCount: 2,
        tagHits: 2,
        transcriptHits: 2,
        source: 'mixed',
        firstSeenAt: 1,
        latestSeenAt: 2,
      },
      {
        label: 'lantern',
        dreamCount: 2,
        tagHits: 1,
        transcriptHits: 2,
        source: 'mixed',
        firstSeenAt: 1,
        latestSeenAt: 2,
      },
    ]);
  });

  test('can focus on transcript-derived recurring symbols only', () => {
    expect(getRecurringReflectionSignals(dreams, { transcriptOnly: true })).toEqual([
      {
        label: 'lantern',
        dreamCount: 2,
        tagHits: 0,
        transcriptHits: 2,
        source: 'transcript',
        firstSeenAt: 1,
        latestSeenAt: 2,
      },
      {
        label: 'water',
        dreamCount: 2,
        tagHits: 0,
        transcriptHits: 2,
        source: 'transcript',
        firstSeenAt: 1,
        latestSeenAt: 2,
      },
    ]);
  });

  test('returns recurring words across text and transcript', () => {
    expect(getRecurringWordSignals(dreams)).toEqual([
      {
        label: 'lantern',
        dreamCount: 2,
        hitCount: 3,
        firstSeenAt: 1,
        latestSeenAt: 2,
      },
      {
        label: 'water',
        dreamCount: 2,
        hitCount: 3,
        firstSeenAt: 1,
        latestSeenAt: 2,
      },
    ]);
  });
});
