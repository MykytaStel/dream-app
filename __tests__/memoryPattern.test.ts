import type { Dream } from '../src/features/dreams/model/dream';
import {
  getMemoryPatternCandidates,
  getMemoryPatternCopy,
  getPrimaryMemoryPattern,
} from '../src/features/stats/model/memoryPattern';
import type { MemoryPatternFeedbackRecord } from '../src/features/stats/services/memoryPatternFeedbackService';

jest.mock('../src/services/storage/mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
}));

function dream(
  id: string,
  createdAt: number,
  input: Partial<Dream>,
): Dream {
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    title: `Dream ${id}`,
    text: '',
    transcript: '',
    tags: [],
    ...input,
  } as Dream;
}

const dreams = [
  dream('one', 300, {
    title: 'Train at night',
    text: 'I waited beside a train in the rain.',
    tags: ['journey'],
  }),
  dream('two', 200, {
    title: 'Leaving the city',
    transcript: 'The journey continued and I saw another train.',
    tags: ['journey'],
  }),
  dream('three', 100, {
    title: 'Old platform',
    text: 'A train arrived on an empty platform.',
    tags: ['journey'],
  }),
];

describe('memoryPattern', () => {
  test('builds one candidate with at most three evidence dreams', () => {
    const candidate = getPrimaryMemoryPattern({
      dreams,
      locale: 'en',
      feedback: [],
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.dreamCount).toBe(3);
    expect(candidate?.evidence).toHaveLength(3);
    expect(candidate?.evidence[0].dreamId).toBe('one');
  });

  test('requires at least two matching dreams', () => {
    const candidate = getPrimaryMemoryPattern({
      dreams: [dreams[0]],
      locale: 'en',
      feedback: [],
    });

    expect(candidate).toBeNull();
  });

  test('prioritizes a confirmed candidate', () => {
    const feedback: MemoryPatternFeedbackRecord[] = [
      {
        key: 'word:train',
        signal: 'train',
        kind: 'word',
        status: 'confirmed',
        updatedAt: 1,
      },
    ];

    expect(
      getPrimaryMemoryPattern({ dreams, locale: 'en', feedback })?.signal,
    ).toBe('train');
  });

  test('dismisses one candidate and selects the next', () => {
    const all = getMemoryPatternCandidates({
      dreams,
      locale: 'en',
      feedback: [],
    });
    expect(all.length).toBeGreaterThan(1);

    const first = all[0];
    const feedback: MemoryPatternFeedbackRecord[] = [
      {
        key: first.key,
        signal: first.signal,
        kind: first.kind,
        status: 'dismissed',
        updatedAt: 1,
      },
    ];

    expect(
      getPrimaryMemoryPattern({ dreams, locale: 'en', feedback })?.key,
    ).not.toBe(first.key);
  });

  test('uses a custom title without changing the source signal', () => {
    const feedback: MemoryPatternFeedbackRecord[] = [
      {
        key: 'word:train',
        signal: 'train',
        kind: 'word',
        status: 'confirmed',
        customTitle: 'Journeys and departures',
        updatedAt: 1,
      },
    ];

    const candidate = getPrimaryMemoryPattern({
      dreams,
      locale: 'en',
      feedback,
    });

    expect(candidate).toMatchObject({
      signal: 'train',
      displayTitle: 'Journeys and departures',
      confirmed: true,
    });
  });

  test('provides Ukrainian and English trust copy', () => {
    expect(getMemoryPatternCopy('uk')).toMatchObject({
      confirmAction: 'Підтвердити',
      dismissAction: 'Не пов’язано',
    });
    expect(getMemoryPatternCopy('en')).toMatchObject({
      confirmAction: 'Confirm',
      dismissAction: 'Not related',
    });
  });
});
