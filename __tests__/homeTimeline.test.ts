import { Dream } from '../src/features/dreams/model/dream';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getAvailableTimelineTags,
  getDreamEntryType,
  getDreamSearchMatchReasons,
  getDreamSearchScore,
  hasActiveTimelineFilters,
  hasActiveTimelineRefinements,
  isDreamStarred,
  matchesDreamSearch,
  matchesDreamTranscriptFilter,
} from '../src/features/dreams/model/homeTimeline';

describe('homeTimeline', () => {
  const dreams: Dream[] = [
    {
      id: 'dream-1',
      createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-06',
      title: 'Blue room',
      text: 'I found a blue door near the ocean.',
      starredAt: new Date('2026-03-06T09:00:00.000Z').getTime(),
      tags: ['ocean', 'door'],
      mood: 'positive',
    },
    {
      id: 'dream-2',
      createdAt: new Date('2026-03-05T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-05',
      title: 'Voice note only',
      audioUri: 'file:///voice.m4a',
      transcript: 'A silver staircase opened above the street.',
      transcriptSource: 'generated',
      tags: ['stairs'],
      mood: 'neutral',
    },
    {
      id: 'dream-3',
      createdAt: new Date('2026-03-04T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-04',
      title: 'Night train',
      text: 'A train station flooded after midnight.',
      audioUri: 'file:///mixed.m4a',
      tags: ['train', 'ocean'],
      mood: 'negative',
      archivedAt: new Date('2026-03-10T08:00:00.000Z').getTime(),
    },
    {
      id: 'dream-4',
      createdAt: new Date('2026-03-03T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-03',
      title: 'Edited voice dream',
      audioUri: 'file:///edited.m4a',
      transcript: 'I kept repeating lantern over water.',
      transcriptSource: 'edited',
      tags: ['lantern'],
      mood: 'neutral',
    },
    {
      id: 'dream-5',
      createdAt: new Date('2026-03-02T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-02',
      title: 'Raw audio only',
      audioUri: 'file:///raw.m4a',
      tags: ['raw'],
      mood: 'neutral',
    },
  ];

  test('detects entry type from available content', () => {
    expect(getDreamEntryType(dreams[0])).toBe('text');
    expect(getDreamEntryType(dreams[1])).toBe('audio');
    expect(getDreamEntryType(dreams[2])).toBe('mixed');
    expect(isDreamStarred(dreams[0])).toBe(true);
    expect(isDreamStarred(dreams[1])).toBe(false);
  });

  test('matches transcript-aware filters', () => {
    expect(matchesDreamTranscriptFilter(dreams[0], 'with-transcript')).toBe(false);
    expect(matchesDreamTranscriptFilter(dreams[1], 'with-transcript')).toBe(true);
    expect(matchesDreamTranscriptFilter(dreams[1], 'audio-only')).toBe(false);
    expect(matchesDreamTranscriptFilter(dreams[3], 'edited-transcript')).toBe(true);
    expect(matchesDreamTranscriptFilter(dreams[4], 'audio-only')).toBe(true);
  });

  test('filters timeline by archive, mood, tags, type, and search query', () => {
    expect(matchesDreamSearch(dreams[0], '')).toBe(true);
    expect(getDreamSearchMatchReasons(dreams[0], '')).toEqual([]);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        archive: 'active',
      }).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-4', 'dream-5']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        starredOnly: true,
      }).map(dream => dream.id),
    ).toEqual(['dream-1']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        archive: 'archived',
        mood: 'negative',
        tags: ['ocean', 'train'],
        entryType: 'mixed',
        searchQuery: 'train',
      }).map(dream => dream.id),
    ).toEqual(['dream-3']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        searchQuery: 'silver staircase',
      }).map(dream => dream.id),
    ).toEqual(['dream-2']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        transcript: 'edited-transcript',
      }).map(dream => dream.id),
    ).toEqual(['dream-4']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        transcript: 'audio-only',
      }).map(dream => dream.id),
    ).toEqual(['dream-5']);
  });

  test('filters timeline by date range relative to provided current date', () => {
    const moreDreams: Dream[] = [
      ...dreams,
      {
        id: 'dream-6',
        createdAt: new Date('2026-02-20T08:00:00.000Z').getTime(),
        sleepDate: '2026-02-20',
        title: 'Older window',
        tags: [],
      },
      {
        id: 'dream-7',
        createdAt: new Date('2025-12-20T08:00:00.000Z').getTime(),
        sleepDate: '2025-12-20',
        title: 'Very old',
        tags: [],
      },
    ];

    expect(
      applyHomeTimelineFilters(
        moreDreams,
        {
          ...DEFAULT_HOME_TIMELINE_FILTERS,
          dateRange: '7d',
        },
        new Date('2026-03-06T12:00:00.000Z'),
      ).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-4', 'dream-5']);

    expect(
      applyHomeTimelineFilters(
        moreDreams,
        {
          ...DEFAULT_HOME_TIMELINE_FILTERS,
          dateRange: '30d',
        },
        new Date('2026-03-06T12:00:00.000Z'),
      ).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-4', 'dream-5', 'dream-6']);

    expect(
      applyHomeTimelineFilters(
        moreDreams,
        {
          ...DEFAULT_HOME_TIMELINE_FILTERS,
          dateRange: '90d',
        },
        new Date('2026-03-06T12:00:00.000Z'),
      ).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-4', 'dream-5', 'dream-6', 'dream-7']);
  });

  test('sorts timeline newest first by default and can switch to oldest first', () => {
    expect(
      applyHomeTimelineFilters(dreams, DEFAULT_HOME_TIMELINE_FILTERS).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-4', 'dream-5']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        sortOrder: 'oldest',
      }).map(dream => dream.id),
    ).toEqual(['dream-5', 'dream-4', 'dream-2', 'dream-1']);
  });

  test('boosts more relevant search matches before chronological order', () => {
    const scoredDreams: Dream[] = [
      {
        id: 'title-hit',
        createdAt: new Date('2026-03-05T08:00:00.000Z').getTime(),
        sleepDate: '2026-03-05',
        title: 'Lantern room',
        tags: [],
      },
      {
        id: 'tag-hit',
        createdAt: new Date('2026-03-07T08:00:00.000Z').getTime(),
        sleepDate: '2026-03-07',
        title: 'Ocean room',
        tags: ['lantern'],
      },
      {
        id: 'transcript-hit',
        createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
        sleepDate: '2026-03-06',
        transcript: 'Lantern lantern over water',
        transcriptSource: 'generated',
        tags: [],
      },
    ];

    expect(getDreamSearchScore(scoredDreams[0], 'lantern')).toBeGreaterThan(0);
    expect(getDreamSearchScore(scoredDreams[1], 'lantern')).toBeGreaterThan(
      getDreamSearchScore(scoredDreams[0], 'lantern'),
    );
    expect(getDreamSearchScore(scoredDreams[0], 'lantern')).toBeGreaterThan(
      getDreamSearchScore(scoredDreams[2], 'lantern'),
    );
    expect(
      applyHomeTimelineFilters(scoredDreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        searchQuery: 'lantern',
      }).map(dream => dream.id),
    ).toEqual(['tag-hit', 'title-hit', 'transcript-hit']);
  });

  test('returns sorted unique tags and detects active refinements', () => {
    expect(getAvailableTimelineTags(dreams)).toEqual([
      'door',
      'lantern',
      'ocean',
      'raw',
      'stairs',
      'train',
    ]);
    expect(hasActiveTimelineRefinements(DEFAULT_HOME_TIMELINE_FILTERS)).toBe(false);
    expect(hasActiveTimelineFilters(DEFAULT_HOME_TIMELINE_FILTERS)).toBe(false);
    expect(
      hasActiveTimelineRefinements({
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        starredOnly: true,
        transcript: 'with-transcript',
        dateRange: '7d',
      }),
    ).toBe(true);
    expect(
      hasActiveTimelineRefinements({
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        sortOrder: 'oldest',
      }),
    ).toBe(false);
  });
});
