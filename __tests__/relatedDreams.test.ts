import { Dream } from '../src/features/dreams/model/dream';
import { getRelatedDreams } from '../src/features/dreams/model/relatedDreams';

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
});
