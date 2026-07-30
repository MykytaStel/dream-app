import {
  STREAK_MILESTONES,
  getDreamAchievements,
  getStreakMilestoneToast,
} from '../src/features/stats/model/achievements';
import { getStatsCopy } from '../src/constants/copy/stats';
import { getAchievementContent } from '../src/features/stats/model/statsScreenModel';

/**
 * Two lists describe the same thing: the streaks we celebrate with a toast and
 * the streaks that appear as achievements. They were maintained separately and
 * drifted — 14 days was celebrated but had no achievement, and its toast
 * claimed the seven-day identifier.
 *
 * These tests assert they agree, so the next entry cannot be added to one list
 * alone.
 */

const copy = getStatsCopy('en');

function streakAchievementIds() {
  // A streak achievement is one whose target matches a milestone threshold.
  const thresholds = new Set<number>(STREAK_MILESTONES.map(m => m.days));
  return getDreamAchievements([])
    .filter(a => thresholds.has(a.target))
    .map(a => a.id);
}

describe('streak milestones and achievements agree', () => {
  test('every celebrated milestone exists as an achievement', () => {
    const achievementIds = new Set(getDreamAchievements([]).map(a => a.id));
    const missing = STREAK_MILESTONES.filter(m => !achievementIds.has(m.id));

    expect(missing).toEqual([]);
  });

  test('every milestone reports its own identifier', () => {
    const seen = STREAK_MILESTONES.map(milestone => {
      const toast = getStreakMilestoneToast(milestone.days, 0, copy);
      return { days: milestone.days, id: toast?.milestoneId };
    });

    expect(seen).toEqual(
      STREAK_MILESTONES.map(m => ({ days: m.days, id: m.id })),
    );
  });

  test('no two milestones share an identifier', () => {
    const ids = STREAK_MILESTONES.map(m => m.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('the streak achievements are exactly the milestone thresholds', () => {
    expect(streakAchievementIds()).toEqual(STREAK_MILESTONES.map(m => m.id));
  });

  test('crossing several milestones at once celebrates the highest', () => {
    const toast = getStreakMilestoneToast(30, 0, copy);

    expect(toast?.milestoneId).toBe('thirty-day-streak');
  });

  test('an already celebrated milestone is not repeated', () => {
    expect(getStreakMilestoneToast(7, 7, copy)).toBeNull();
  });

  test('every milestone has copy in both languages', () => {
    for (const locale of ['en', 'uk'] as const) {
      const localeCopy = getStatsCopy(locale);
      for (const milestone of STREAK_MILESTONES) {
        const toast = getStreakMilestoneToast(milestone.days, 0, localeCopy);

        expect(toast?.title ?? '').not.toBe('');
        expect(toast?.subtitle ?? '').not.toBe('');
      }
    }
  });
});

describe('every achievement has content to render', () => {
  test.each(['en', 'uk'] as const)(
    'no achievement renders blank in %s',
    locale => {
      const localeCopy = getStatsCopy(locale);

      const blank = getDreamAchievements([])
        .map(achievement => ({
          id: achievement.id,
          content: getAchievementContent(achievement.id, localeCopy),
        }))
        .filter(
          entry =>
            !entry.content?.title?.trim() ||
            !entry.content?.description?.trim(),
        )
        .map(entry => entry.id);

      expect(blank).toEqual([]);
    },
  );
});
