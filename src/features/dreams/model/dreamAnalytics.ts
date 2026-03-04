import { Dream, Mood } from './dream';

export function getDreamDate(dream: Dream) {
  const value = dream.sleepDate ?? new Date(dream.createdAt).toISOString().slice(0, 10);
  return new Date(`${value}T00:00:00`);
}

export function countDreamWords(text?: string) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0;
}

export function getCurrentStreak(dreams: Dream[]) {
  const uniqueDays = Array.from(
    new Set(dreams.map(dream => getDreamDate(dream).toISOString().slice(0, 10))),
  ).sort((a, b) => b.localeCompare(a));

  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const current = cursor.toISOString().slice(0, 10);
    if (day === current) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      const yesterday = new Date();
      yesterday.setHours(0, 0, 0, 0);
      yesterday.setDate(yesterday.getDate() - 1);
      if (day === yesterday.toISOString().slice(0, 10)) {
        streak += 1;
        cursor = yesterday;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
    break;
  }

  return streak;
}

export function getEntriesLastSevenDays(dreams: Dream[]) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);

  return dreams.filter(dream => getDreamDate(dream) >= cutoff).length;
}

export function getAverageWords(dreams: Dream[]) {
  if (!dreams.length) {
    return 0;
  }

  const totalWords = dreams.reduce((sum, dream) => sum + countDreamWords(dream.text), 0);
  return Math.round(totalWords / dreams.length);
}

export function getMoodCounts(dreams: Dream[]): Record<Mood, number> {
  return dreams.reduce<Record<Mood, number>>(
    (acc, dream) => {
      if (dream.mood) {
        acc[dream.mood] += 1;
      }
      return acc;
    },
    {
      neutral: 0,
      positive: 0,
      negative: 0,
    },
  );
}
