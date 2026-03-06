import { Dream } from '../src/features/dreams/model/dream';
import {
  getDreamAchievements,
  getDreamAchievementSummary,
  getLongestRecordedStreak,
} from '../src/features/stats/model/achievements';

describe('achievements', () => {
  test('computes longest recorded streak from unique sleep dates', () => {
    const dreams: Dream[] = [
      { id: '1', createdAt: 1, sleepDate: '2026-03-01', tags: [] },
      { id: '2', createdAt: 2, sleepDate: '2026-03-02', tags: [] },
      { id: '3', createdAt: 3, sleepDate: '2026-03-03', tags: [] },
      { id: '4', createdAt: 4, sleepDate: '2026-03-05', tags: [] },
      { id: '5', createdAt: 5, sleepDate: '2026-03-05', tags: [] },
    ];

    expect(getLongestRecordedStreak(dreams)).toBe(3);
  });

  test('tracks milestone progress for first dream, streak, total dreams, and voice capture', () => {
    const dreams: Dream[] = [
      { id: '1', createdAt: 1, sleepDate: '2026-03-01', tags: [] },
      { id: '2', createdAt: 2, sleepDate: '2026-03-02', tags: [], audioUri: 'file:///a.m4a' },
      { id: '3', createdAt: 3, sleepDate: '2026-03-03', tags: [] },
      { id: '4', createdAt: 4, sleepDate: '2026-03-10', tags: [] },
    ];

    expect(getDreamAchievements(dreams)).toEqual([
      { id: 'first-dream', current: 4, target: 1, unlocked: true },
      { id: 'three-day-streak', current: 3, target: 3, unlocked: true },
      { id: 'ten-dreams', current: 4, target: 10, unlocked: false },
      { id: 'first-voice-dream', current: 1, target: 1, unlocked: true },
    ]);
  });

  test('builds celebration summary from achievement progress', () => {
    const summary = getDreamAchievementSummary([
      { id: 'first-dream', current: 2, target: 1, unlocked: true },
      { id: 'three-day-streak', current: 2, target: 3, unlocked: false },
      { id: 'ten-dreams', current: 2, target: 10, unlocked: false },
      { id: 'first-voice-dream', current: 1, target: 1, unlocked: true },
    ]);

    expect(summary).toEqual({
      unlockedCount: 2,
      totalCount: 4,
      highlightedId: 'first-voice-dream',
    });
  });
});
