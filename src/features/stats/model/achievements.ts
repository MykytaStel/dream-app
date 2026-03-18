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

const STREAK_MILESTONES = [3, 7, 14, 30] as const;

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
    new Set(dreams.map(dream => resolveDreamSleepDate(dream.sleepDate, dream.createdAt))),
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
    {
      id: 'three-day-streak',
      current: longestStreak,
      target: 3,
      unlocked: longestStreak >= 3,
    },
    {
      id: 'seven-day-streak',
      current: longestStreak,
      target: 7,
      unlocked: longestStreak >= 7,
    },
    {
      id: 'thirty-day-streak',
      current: longestStreak,
      target: 30,
      unlocked: longestStreak >= 30,
    },
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
  // Find the highest milestone we've crossed that hasn't been celebrated yet
  const crossedMilestone = [...STREAK_MILESTONES]
    .reverse()
    .find(m => currentStreak >= m && lastCelebrated < m);

  if (!crossedMilestone) {
    return null;
  }

  switch (crossedMilestone) {
    case 3:
      return {
        milestoneId: 'three-day-streak',
        title: copy.streakMilestoneThreeDaysTitle,
        subtitle: copy.streakMilestoneThreeDaysSubtitle,
      };
    case 7:
      return {
        milestoneId: 'seven-day-streak',
        title: copy.streakMilestoneSevenDaysTitle,
        subtitle: copy.streakMilestoneSevenDaysSubtitle,
      };
    case 14:
      return {
        milestoneId: 'seven-day-streak',
        title: copy.streakMilestoneFourteenDaysTitle,
        subtitle: copy.streakMilestoneFourteenDaysSubtitle,
      };
    case 30:
      return {
        milestoneId: 'thirty-day-streak',
        title: copy.streakMilestoneThirtyDaysTitle,
        subtitle: copy.streakMilestoneThirtyDaysSubtitle,
      };
  }
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
