import { Dream } from '../src/features/dreams/model/dream';
import {
  getRelatedDreams,
  getRelatedSignalSummaries,
} from '../src/features/dreams/model/relatedDreams';

describe('relatedDreams', () => {
  test('ranks dreams by shared tags and repeated words', () => {
    const target: Dream = {
      id: 'target',
      createdAt: 10,
      sleepDate: '2026-03-07',
      title: 'Ocean staircase',
      text: 'I kept walking toward the ocean through a glass hallway.',
      tags: ['ocean', 'stairs'],
      mood: 'positive',
    };

    const dreams: Dream[] = [
      target,
      {
        id: 'strong-match',
        createdAt: 9,
        sleepDate: '2026-03-06',
        text: 'The ocean was quiet and the stairs kept moving.',
        tags: ['ocean', 'bridge'],
        mood: 'positive',
      },
      {
        id: 'word-match',
        createdAt: 8,
        sleepDate: '2026-03-05',
        transcript: 'A hallway of glass opened into another room.',
        tags: ['room'],
      },
      {
        id: 'no-match',
        createdAt: 7,
        sleepDate: '2026-03-04',
        text: 'Mountains and birds all day long.',
        tags: ['birds'],
      },
    ];

    expect(getRelatedDreams(target, dreams)).toEqual([
      expect.objectContaining({
        dream: dreams[1],
        sharedSignals: expect.arrayContaining(['ocean', 'stairs']),
      }),
      expect.objectContaining({
        dream: dreams[2],
        sharedSignals: expect.arrayContaining(['glass', 'hallway']),
      }),
    ]);
  });

  test('uses recurring emotions and analysis themes when building dream threads', () => {
    const target: Dream = {
      id: 'target-memory',
      createdAt: 20,
      sleepDate: '2026-03-10',
      text: 'A station room kept bending around me.',
      tags: ['station'],
      wakeEmotions: ['curious'],
      analysis: {
        provider: 'manual',
        status: 'ready',
        themes: ['threshold'],
      },
    };

    const emotionallyRelated: Dream = {
      id: 'emotion-match',
      createdAt: 19,
      sleepDate: '2026-03-09',
      text: 'I returned to the same station again.',
      tags: ['platform'],
      wakeEmotions: ['curious'],
      analysis: {
        provider: 'manual',
        status: 'ready',
        themes: ['threshold'],
      },
    };

    const threads = getRelatedDreams(target, [target, emotionallyRelated]);

    expect(threads).toEqual([
      expect.objectContaining({
        dream: emotionallyRelated,
        sharedSignals: expect.arrayContaining(['threshold', 'curious', 'station']),
      }),
    ]);
  });

  test('summarizes the strongest recurring thread signals across matches', () => {
    const target: Dream = {
      id: 'target-summary',
      createdAt: 30,
      text: 'Glass water room.',
      tags: ['water'],
    };

    const firstMatch: Dream = {
      id: 'first-match',
      createdAt: 29,
      text: 'Water filled the glass room.',
      tags: ['water'],
    };

    const secondMatch: Dream = {
      id: 'second-match',
      createdAt: 28,
      text: 'Another glass corridor near water.',
      tags: ['corridor'],
    };

    const summary = getRelatedSignalSummaries(
      getRelatedDreams(target, [target, firstMatch, secondMatch], 5),
      3,
    );

    expect(summary[0]).toEqual(
      expect.objectContaining({
        label: 'water',
        count: 2,
      }),
    );
    expect(summary.map(item => item.label)).toContain('glass');
  });
});
