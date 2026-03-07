import { Dream } from '../src/features/dreams/model/dream';
import {
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
});
