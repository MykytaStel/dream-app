import { getDreamCopy, getDreamMoodLabels } from '../src/constants/copy/dreams';
import { getStatsCopy } from '../src/constants/copy/stats';
import {
  buildReflectionRecurringDashboardItems,
  buildDreamThreadViewModel,
  buildSavedDreamThreadShelfItems,
  buildWordRecurringDashboardItems,
} from '../src/features/stats/model/dreamThread';
import { getPatternDreamMatches } from '../src/features/stats/model/patternMatches';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
} from '../src/features/stats/model/dreamReflection';
import type { Dream } from '../src/features/dreams/model/dream';

describe('dreamThread presentation', () => {
  const statsCopy = getStatsCopy('en');
  const dreamCopy = getDreamCopy('en');
  const moodLabels = getDreamMoodLabels('en');

  test('builds a thread timeline in oldest-to-newest order with summary items', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-3',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Final bridge',
        text: 'The bridge opened over a loud station.',
        tags: ['bridge'],
      },
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 1, 2, 8, 0),
        sleepDate: '2026-02-02',
        title: 'First bridge',
        text: 'I kept returning to the bridge.',
        tags: ['bridge'],
        mood: 'negative',
      },
      {
        id: 'dream-2',
        createdAt: Date.UTC(2026, 1, 20, 8, 0),
        sleepDate: '2026-02-20',
        title: 'Middle bridge',
        transcript: 'The bridge appeared again in the transcript',
        transcriptSource: 'generated',
        tags: [],
      },
    ];

    const matches = getPatternDreamMatches(dreams, 'bridge', 'theme');
    const viewModel = buildDreamThreadViewModel({
      signal: 'bridge',
      kind: 'theme',
      matches,
      statsCopy,
      dreamCopy,
      moodLabels,
    });

    expect(viewModel.summaryItems.map(item => item.label)).toEqual([
      statsCopy.threadDetailCountLabel,
      statsCopy.threadDetailFirstSeenLabel,
      statsCopy.threadDetailLatestSeenLabel,
      statsCopy.threadDetailSourceLabel,
    ]);
    expect(viewModel.entries.map(item => item.dreamId)).toEqual([
      'dream-1',
      'dream-2',
      'dream-3',
    ]);
    expect(viewModel.entries[0].markerLabel).toBe(statsCopy.threadDetailEntryFirst);
    expect(viewModel.entries[2].markerLabel).toBe(statsCopy.threadDetailEntryLatest);
  });

  test('marks a single-dream thread as only match', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Mirror room',
        transcript: 'A mirror kept returning in the hallway transcript',
        transcriptSource: 'generated',
        tags: [],
      },
    ];

    const matches = getPatternDreamMatches(dreams, 'mirror', 'symbol');
    const viewModel = buildDreamThreadViewModel({
      signal: 'mirror',
      kind: 'symbol',
      matches,
      statsCopy,
      dreamCopy,
      moodLabels,
    });

    expect(viewModel.entries).toHaveLength(1);
    expect(viewModel.entries[0].markerLabel).toBe(statsCopy.threadDetailEntryOnly);
  });

  test('builds saved thread shelf items only for threads that still have matches', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Bridge dream',
        text: 'I crossed the bridge again.',
        tags: ['bridge'],
      },
      {
        id: 'dream-2',
        createdAt: Date.UTC(2026, 2, 13, 8, 0),
        sleepDate: '2026-03-13',
        title: 'Mirror dream',
        transcript: 'A mirror flashed in the station hall.',
        transcriptSource: 'generated',
        tags: [],
      },
    ];

    const items = buildSavedDreamThreadShelfItems({
      records: [
        { signal: 'mirror', kind: 'symbol', savedAt: Date.UTC(2026, 2, 14, 10, 0) },
        { signal: 'bridge', kind: 'theme', savedAt: Date.UTC(2026, 2, 14, 9, 0) },
        { signal: 'missing', kind: 'word', savedAt: Date.UTC(2026, 2, 14, 8, 0) },
      ],
      dreams,
      statsCopy,
    });

    expect(items).toEqual([
      {
        signal: 'mirror',
        kind: 'symbol',
        kindLabel: statsCopy.patternDetailSymbolLabel,
        matchesLabel: `1 ${statsCopy.patternDetailMatchesSingle}`,
      },
      {
        signal: 'bridge',
        kind: 'theme',
        kindLabel: statsCopy.patternDetailThemeLabel,
        matchesLabel: `1 ${statsCopy.patternDetailMatchesSingle}`,
      },
    ]);
  });

  test('deduplicates saved shelf items that normalize to the same thread key', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Hello world',
        transcript: 'hello world returned again in the hall',
        transcriptSource: 'generated',
        tags: ['hello-world'],
      },
    ];

    const items = buildSavedDreamThreadShelfItems({
      records: [
        { signal: 'Hello-World', kind: 'theme', savedAt: Date.UTC(2026, 2, 14, 10, 0) },
        { signal: 'hello world', kind: 'theme', savedAt: Date.UTC(2026, 2, 14, 9, 0) },
      ],
      dreams,
      statsCopy,
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      signal: 'Hello-World',
      kind: 'theme',
    });
  });

  test('builds recurring reflection dashboard items with latest dream context', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 1, 2, 8, 0),
        sleepDate: '2026-02-02',
        title: 'First bridge',
        transcript: 'The bridge opened beside a station.',
        transcriptSource: 'generated',
        tags: ['bridge'],
      },
      {
        id: 'dream-2',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Bridge returns',
        text: 'I was back on the same bridge at sunrise.',
        transcript: 'The bridge returned above the station.',
        transcriptSource: 'edited',
        tags: ['bridge'],
      },
    ];

    const signals = getRecurringReflectionSignals(dreams);
    const items = buildReflectionRecurringDashboardItems({
      signals,
      kind: 'theme',
      locale: 'en',
      dreams,
      statsCopy,
      dreamCopy,
    });

    expect(items[0]).toMatchObject({
      signal: 'bridge',
      kind: 'theme',
      rank: 1,
      kindLabel: statsCopy.patternDetailThemeLabel,
      matchesLabel: `2 ${statsCopy.patternDetailMatchesPlural}`,
      sourceLabel: statsCopy.reflectionSourceMixed,
      latestDreamId: 'dream-2',
      latestDreamTitle: 'Bridge returns',
      latestDreamMeta: '2026-03-12',
      latestSourceLabels: [
        statsCopy.patternDetailSourceTag,
        statsCopy.patternDetailSourceTranscript,
      ],
    });
    expect(items[0].timelineLabel).toContain(statsCopy.threadDetailFirstSeenLabel);
    expect(items[0].timelineLabel).toContain(statsCopy.threadDetailLatestSeenLabel);
  });

  test('builds recurring word dashboard items with mention counts', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 1, 2, 8, 0),
        sleepDate: '2026-02-02',
        title: 'Lantern dock',
        text: 'Lantern light moved across the water.',
        transcript: 'Lantern beside the bridge.',
        transcriptSource: 'generated',
        tags: [],
      },
      {
        id: 'dream-2',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Lantern room',
        text: 'A lantern kept burning in the room.',
        tags: [],
      },
    ];

    const signals = getRecurringWordSignals(dreams);
    const items = buildWordRecurringDashboardItems({
      signals,
      locale: 'en',
      dreams,
      statsCopy,
      dreamCopy,
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      signal: 'lantern',
      kind: 'word',
      rank: 1,
      kindLabel: statsCopy.patternDetailWordLabel,
      matchesLabel: `2 ${statsCopy.patternDetailMatchesPlural}`,
      sourceLabel: statsCopy.patternDetailSourceText,
      supportingLabel: '3 mentions',
      latestDreamId: 'dream-2',
      latestDreamTitle: 'Lantern room',
    });
  });
});
