import { Dream } from '../../dreams/model/dream';
import { resolveDreamSleepDate } from '../../dreams/model/dreamRules';

export type DreamAchievementId =
  | 'first-dream'
  | 'three-day-streak'
  | 'ten-dreams'
  | 'first-voice-dream';

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

export function getLongestRecordedStreak(dreams: Dream[]) {
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

export function getDreamAchievements(dreams: Dream[]): DreamAchievementProgress[] {
  const totalDreams = dreams.length;
  const voiceDreams = dreams.filter(dream => Boolean(dream.audioUri?.trim())).length;
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
      id: 'ten-dreams',
      current: totalDreams,
      target: 10,
      unlocked: totalDreams >= 10,
    },
    {
      id: 'first-voice-dream',
      current: voiceDreams,
      target: 1,
      unlocked: voiceDreams >= 1,
    },
  ];
}

export function getDreamAchievementSummary(
  achievements: DreamAchievementProgress[],
): DreamAchievementSummary {
  const unlocked = achievements.filter(achievement => achievement.unlocked);
  const highlighted =
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
