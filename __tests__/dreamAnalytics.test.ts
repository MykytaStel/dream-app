import { Dream } from '../src/features/dreams/model/dream';
import {
  getDreamLucidityLevel,
  getLucidDreamStats,
  getDreamNightmareClassification,
  getNightmareStats,
  getTopPreSleepEmotionSignals,
  getTopWakeEmotionSignals,
} from '../src/features/dreams/model/dreamAnalytics';

describe('dream analytics emotion signals', () => {
  test('counts top wake and pre-sleep emotions separately', () => {
    const dreams: Dream[] = [
      {
        id: 'dream-1',
        createdAt: 1,
        sleepDate: '2026-03-06',
        tags: [],
        wakeEmotions: ['calm', 'curious'],
        sleepContext: {
          preSleepEmotions: ['restless', 'hopeful'],
        },
      },
      {
        id: 'dream-2',
        createdAt: 2,
        sleepDate: '2026-03-05',
        tags: [],
        wakeEmotions: ['calm'],
        sleepContext: {
          preSleepEmotions: ['restless'],
        },
      },
    ];

    expect(getTopWakeEmotionSignals(dreams)).toEqual([
      { emotion: 'calm', count: 2 },
      { emotion: 'curious', count: 1 },
    ]);

    expect(getTopPreSleepEmotionSignals(dreams)).toEqual([
      { emotion: 'restless', count: 2 },
      { emotion: 'hopeful', count: 1 },
    ]);
  });

  test('classifies nightmares from explicit tags or clear distress signals', () => {
    const dreams: Dream[] = [
      {
        id: 'tagged-nightmare',
        createdAt: 1,
        sleepDate: '2026-03-03',
        tags: ['nightmare'],
      },
      {
        id: 'derived-nightmare',
        createdAt: 2,
        sleepDate: '2026-03-04',
        tags: [],
        mood: 'anxious',
        wakeEmotions: ['uneasy'],
      },
      {
        id: 'strong-distress',
        createdAt: 3,
        sleepDate: '2026-03-05',
        tags: [],
        wakeEmotions: ['heavy', 'disoriented'],
      },
      {
        id: 'not-nightmare',
        createdAt: 4,
        sleepDate: '2026-03-06',
        tags: [],
        mood: 'anxious',
        wakeEmotions: ['curious'],
      },
    ];

    expect(getDreamNightmareClassification(dreams[0])).toBe('tagged');
    expect(getDreamNightmareClassification(dreams[1])).toBe('derived');
    expect(getDreamNightmareClassification(dreams[2])).toBe('derived');
    expect(getDreamNightmareClassification(dreams[3])).toBeNull();

    expect(getNightmareStats(dreams)).toMatchObject({
      totalDreams: 4,
      nightmareCount: 3,
      taggedCount: 1,
      derivedCount: 2,
      rate: 75,
    });
    expect(getNightmareStats(dreams).latestNightmareDream?.id).toBe(
      'strong-distress',
    );
  });

  test('derives lucidity from explicit level or legacy lucid tags', () => {
    expect(
      getDreamLucidityLevel({
        tags: [],
        lucidity: 3,
      }),
    ).toBe(3);

    expect(
      getDreamLucidityLevel({
        tags: ['lucid'],
      }),
    ).toBe(2);
  });

  test('builds lucid dream stats from explicit and tagged entries', () => {
    const dreams: Dream[] = [
      {
        id: 'lucid-explicit',
        createdAt: 1,
        sleepDate: '2026-03-01',
        tags: [],
        lucidity: 1,
      },
      {
        id: 'lucid-tagged',
        createdAt: 2,
        sleepDate: '2026-03-03',
        tags: ['lucid-dream'],
      },
      {
        id: 'not-lucid',
        createdAt: 3,
        sleepDate: '2026-03-04',
        tags: [],
        lucidity: 0,
      },
    ];

    expect(getLucidDreamStats(dreams)).toMatchObject({
      totalDreams: 3,
      lucidCount: 2,
      rate: 67,
    });
    expect(getLucidDreamStats(dreams).latestLucidDream?.id).toBe('lucid-tagged');
  });
});
