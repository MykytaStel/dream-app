import { Dream } from '../../dreams/model/dream';
import { resolveDreamSleepDate } from '../../dreams/model/dreamRules';

type DreamAchievementSource = Pick<Dream, 'createdAt' | 'sleepDate'> & {
  audioUri?: string;
  hasAudio?: boolean;
};

export type DreamAchievementId =
  | 'first-dream'
  | 'three-day-streak'
  | 'seven-day-streak'
  | 'fourteen-day-streak'
  | 'thirty-day-streak'
  | 'ten-dreams'
  | 'fifty-dreams'
  | 'hundred-dreams'
  | 'first-voice-dream';

export type StreakMilestoneToast = {
  milestoneId: DreamAchievementId;
  title: string;
  subtitle: string;
};

/**
 * The single description of a streak milestone.
 *
 * Both the celebration toast and the achievement list are derived from this, so
 * the two cannot drift apart. They previously did: 14 days was celebrated but
 * had no achievement, and its toast reported the seven-day identifier.
 */
export const STREAK_MILESTONES = [
  { days: 3, id: 'three-day-streak', copyKey: 'ThreeDays' },
  { days: 7, id: 'seven-day-streak', copyKey: 'SevenDays' },
  { days: 14, id: 'fourteen-day-streak', copyKey: 'FourteenDays' },
  { days: 30, id: 'thirty-day-streak', copyKey: 'ThirtyDays' },
] as const satisfies ReadonlyArray<{
  days: number;
  id: DreamAchievementId;
  copyKey: string;
}>;

export type DreamAchievementProgress = {
  id: DreamAchievementId;
  current: number;
  target: number;
  unlocked: boolean;
};

export type DreamAchievementSummary = {
  unlockedCount: number;
  totalCount: number;
  highlightedId: DreamAchievementId | null;
};

function toUtcDayValue(value: string) {
  return Date.parse(`${value}T00:00:00.000Z`);
}

export function getLongestRecordedStreak(dreams: DreamAchievementSource[]) {
  const uniqueDays = Array.from(
    new Set(
      dreams.map(dream =>
        resolveDreamSleepDate(dream.sleepDate, dream.createdAt),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  if (!uniqueDays.length) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previousDay = toUtcDayValue(uniqueDays[index - 1]);
    const currentDay = toUtcDayValue(uniqueDays[index]);
    const differenceInDays = (currentDay - previousDay) / 86_400_000;

    if (differenceInDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 1;
  }

  return longest;
}

export function getDreamAchievements(
  dreams: DreamAchievementSource[],
): DreamAchievementProgress[] {
  const totalDreams = dreams.length;
  const voiceDreams = dreams.filter(
    dream => dream.hasAudio || Boolean(dream.audioUri?.trim()),
  ).length;
  const longestStreak = getLongestRecordedStreak(dreams);

  return [
    {
      id: 'first-dream',
      current: totalDreams,
      target: 1,
      unlocked: totalDreams >= 1,
    },
    // Derived so a new milestone appears here and in the toast together.
    ...STREAK_MILESTONES.map(milestone => ({
      id: milestone.id,
      current: longestStreak,
      target: milestone.days,
      unlocked: longestStreak >= milestone.days,
    })),
    {
      id: 'ten-dreams',
      current: totalDreams,
      target: 10,
      unlocked: totalDreams >= 10,
    },
    {
      id: 'fifty-dreams',
      current: totalDreams,
      target: 50,
      unlocked: totalDreams >= 50,
    },
    {
      id: 'hundred-dreams',
      current: totalDreams,
      target: 100,
      unlocked: totalDreams >= 100,
    },
    {
      id: 'first-voice-dream',
      current: voiceDreams,
      target: 1,
      unlocked: voiceDreams >= 1,
    },
  ];
}

type StreakToastCopy = {
  streakMilestoneThreeDaysTitle: string;
  streakMilestoneThreeDaysSubtitle: string;
  streakMilestoneSevenDaysTitle: string;
  streakMilestoneSevenDaysSubtitle: string;
  streakMilestoneFourteenDaysTitle: string;
  streakMilestoneFourteenDaysSubtitle: string;
  streakMilestoneThirtyDaysTitle: string;
  streakMilestoneThirtyDaysSubtitle: string;
};

export function getStreakMilestoneToast(
  currentStreak: number,
  lastCelebrated: number,
  copy: StreakToastCopy,
): StreakMilestoneToast | null {
  // The highest milestone crossed that has not been celebrated yet.
  const crossed = [...STREAK_MILESTONES]
    .reverse()
    .find(
      milestone =>
        currentStreak >= milestone.days && lastCelebrated < milestone.days,
    );

  if (!crossed) {
    return null;
  }

  return {
    milestoneId: crossed.id,
    title: copy[`streakMilestone${crossed.copyKey}Title`],
    subtitle: copy[`streakMilestone${crossed.copyKey}Subtitle`],
  };
}

export function getDreamAchievementSummary(
  achievements: DreamAchievementProgress[],
): DreamAchievementSummary {
  const unlocked = achievements.filter(achievement => achievement.unlocked);
  const locked = achievements.filter(achievement => !achievement.unlocked);
  const highlighted =
    locked
      .slice()
      .sort((a, b) => b.current / b.target - a.current / a.target)[0]?.id ??
    unlocked.at(-1)?.id ??
    achievements
      .slice()
      .sort((a, b) => b.current / b.target - a.current / a.target)[0]?.id ??
    null;

  return {
    unlockedCount: unlocked.length,
    totalCount: achievements.length,
    highlightedId: highlighted,
  };
}
