import { Dream } from '../src/features/dreams/model/dream';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getAvailableTimelineTags,
  getDreamEntryType,
  hasActiveTimelineRefinements,
} from '../src/features/dreams/model/homeTimeline';

describe('homeTimeline', () => {
  const dreams: Dream[] = [
    {
      id: 'dream-1',
      createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-06',
      title: 'Blue room',
      text: 'I found a blue door near the ocean.',
      tags: ['ocean', 'door'],
      mood: 'positive',
    },
    {
      id: 'dream-2',
      createdAt: new Date('2026-03-05T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-05',
      title: 'Voice note only',
      audioUri: 'file:///voice.m4a',
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
  ];

  test('detects entry type from available content', () => {
    expect(getDreamEntryType(dreams[0])).toBe('text');
    expect(getDreamEntryType(dreams[1])).toBe('audio');
    expect(getDreamEntryType(dreams[2])).toBe('mixed');
  });

  test('filters timeline by archive, mood, tags, type, and search query', () => {
    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        archive: 'active',
      }).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2']);

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
  });

  test('filters timeline by date range relative to provided current date', () => {
    const moreDreams: Dream[] = [
      ...dreams,
      {
        id: 'dream-4',
        createdAt: new Date('2026-02-20T08:00:00.000Z').getTime(),
        sleepDate: '2026-02-20',
        title: 'Older window',
        tags: [],
      },
      {
        id: 'dream-5',
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
    ).toEqual(['dream-1', 'dream-2', 'dream-3']);

    expect(
      applyHomeTimelineFilters(
        moreDreams,
        {
          ...DEFAULT_HOME_TIMELINE_FILTERS,
          dateRange: '30d',
        },
        new Date('2026-03-06T12:00:00.000Z'),
      ).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-3', 'dream-4']);

    expect(
      applyHomeTimelineFilters(
        moreDreams,
        {
          ...DEFAULT_HOME_TIMELINE_FILTERS,
          dateRange: '90d',
        },
        new Date('2026-03-06T12:00:00.000Z'),
      ).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-3', 'dream-4', 'dream-5']);
  });

  test('sorts timeline newest first by default and can switch to oldest first', () => {
    expect(
      applyHomeTimelineFilters(dreams, DEFAULT_HOME_TIMELINE_FILTERS).map(dream => dream.id),
    ).toEqual(['dream-1', 'dream-2', 'dream-3']);

    expect(
      applyHomeTimelineFilters(dreams, {
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        sortOrder: 'oldest',
      }).map(dream => dream.id),
    ).toEqual(['dream-3', 'dream-2', 'dream-1']);
  });

  test('returns sorted unique tags and detects active refinements', () => {
    expect(getAvailableTimelineTags(dreams)).toEqual(['door', 'ocean', 'stairs', 'train']);
    expect(hasActiveTimelineRefinements(DEFAULT_HOME_TIMELINE_FILTERS)).toBe(false);
    expect(
      hasActiveTimelineRefinements({
        ...DEFAULT_HOME_TIMELINE_FILTERS,
        dateRange: '7d',
      }),
    ).toBe(true);
  });
});
