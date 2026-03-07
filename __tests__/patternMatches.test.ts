import { Dream } from '../src/features/dreams/model/dream';
import { getPatternDreamMatches } from '../src/features/stats/model/patternMatches';

describe('patternMatches', () => {
  test('matches repeating words across title, notes, and transcript', () => {
    const dreams: Dream[] = [
      {
        id: 'a',
        createdAt: 30,
        title: 'Ocean staircase',
        text: 'The ocean stayed quiet below me.',
        tags: [],
      },
      {
        id: 'b',
        createdAt: 20,
        transcript: 'I kept hearing the ocean from another room.',
        tags: [],
      },
      {
        id: 'c',
        createdAt: 10,
        text: 'Mountains and birds.',
        tags: [],
      },
    ];

    expect(getPatternDreamMatches(dreams, 'ocean', 'word')).toEqual([
      expect.objectContaining({
        dream: dreams[0],
        sources: ['title', 'text'],
      }),
      expect.objectContaining({
        dream: dreams[1],
        sources: ['transcript'],
      }),
    ]);
  });

  test('matches recurring themes through formatted tags', () => {
    const dreams: Dream[] = [
      {
        id: 'a',
        createdAt: 20,
        tags: ['old-house'],
      },
      {
        id: 'b',
        createdAt: 10,
        transcript: 'I was walking through the same old house again.',
        tags: [],
      },
    ];

    expect(getPatternDreamMatches(dreams, 'old house', 'theme')).toEqual([
      expect.objectContaining({
        dream: dreams[0],
        sources: ['tag'],
      }),
    ]);
  });

  test('matches recurring themes through transcript tokens', () => {
    const dreams: Dream[] = [
      {
        id: 'a',
        createdAt: 10,
        transcript: 'I was walking through the same mirror hallway again.',
        tags: [],
      },
    ];

    expect(getPatternDreamMatches(dreams, 'mirror', 'theme')).toEqual([
      expect.objectContaining({
        dream: dreams[0],
        sources: ['transcript'],
      }),
    ]);
  });
});
