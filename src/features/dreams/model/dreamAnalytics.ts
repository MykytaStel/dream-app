import { Dream, Mood, PreSleepEmotion, WakeEmotion } from './dream';

type DreamDateLike = Pick<Dream, 'createdAt' | 'sleepDate'>;

export function getDreamDate(dream: DreamDateLike) {
  const value = dream.sleepDate ?? new Date(dream.createdAt).toISOString().slice(0, 10);
  return new Date(`${value}T00:00:00`);
}

export function countDreamWords(text?: string) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0;
}

export function getCurrentStreak(dreams: DreamDateLike[]) {
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

export function getEntriesLastSevenDays(dreams: DreamDateLike[]) {
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

export type SleepContextStats = {
  withContext: number;
  withStress: number;
  averageStress?: number;
  alcoholTaken: number;
  caffeineLate: number;
  medications: number;
  importantEvents: number;
  healthNotes: number;
};

export type NegativeMoodRate = {
  negativeCount: number;
  total: number;
  rate?: number;
};

export type MoodCorrelationStats = {
  overall: NegativeMoodRate;
  alcoholTaken: NegativeMoodRate;
  noAlcohol: NegativeMoodRate;
  caffeineLate: NegativeMoodRate;
  noLateCaffeine: NegativeMoodRate;
  highStress: NegativeMoodRate;
  lowStress: NegativeMoodRate;
};

export type EmotionSignal<T extends string = string> = {
  emotion: T;
  count: number;
};

function hasText(value?: string) {
  return Boolean(value?.trim());
}

function toNegativeMoodRate(negativeCount: number, total: number): NegativeMoodRate {
  return {
    negativeCount,
    total,
    rate: total > 0 ? Math.round((negativeCount / total) * 100) : undefined,
  };
}

function buildTopEmotionSignals<T extends string>(values: T[], limit: number) {
  const counts = new Map<T, number>();

  values.forEach(value => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([emotion, count]) => ({ emotion, count }));
}

export function getTopWakeEmotionSignals(
  dreams: Dream[],
  limit = 6,
): EmotionSignal<WakeEmotion>[] {
  return buildTopEmotionSignals(
    dreams.flatMap(dream => dream.wakeEmotions ?? []),
    limit,
  );
}

export function getTopPreSleepEmotionSignals(
  dreams: Dream[],
  limit = 6,
): EmotionSignal<PreSleepEmotion>[] {
  return buildTopEmotionSignals(
    dreams.flatMap(dream => dream.sleepContext?.preSleepEmotions ?? []),
    limit,
  );
}

export function getSleepContextStats(dreams: Dream[]): SleepContextStats {
  let withContext = 0;
  let withStress = 0;
  let stressTotal = 0;
  let alcoholTaken = 0;
  let caffeineLate = 0;
  let medications = 0;
  let importantEvents = 0;
  let healthNotes = 0;

  dreams.forEach(dream => {
    const context = dream.sleepContext;
    if (!context) {
      return;
    }

    withContext += 1;

    if (typeof context.stressLevel === 'number') {
      withStress += 1;
      stressTotal += context.stressLevel;
    }

    if (context.alcoholTaken) {
      alcoholTaken += 1;
    }

    if (context.caffeineLate) {
      caffeineLate += 1;
    }

    if (hasText(context.medications)) {
      medications += 1;
    }

    if (hasText(context.importantEvents)) {
      importantEvents += 1;
    }

    if (hasText(context.healthNotes)) {
      healthNotes += 1;
    }
  });

  return {
    withContext,
    withStress,
    averageStress:
      withStress > 0 ? Math.round((stressTotal / withStress) * 10) / 10 : undefined,
    alcoholTaken,
    caffeineLate,
    medications,
    importantEvents,
    healthNotes,
  };
}

export function getMoodCorrelationStats(dreams: Dream[]): MoodCorrelationStats {
  let overallTotal = 0;
  let overallNegative = 0;

  let alcoholYesTotal = 0;
  let alcoholYesNegative = 0;
  let alcoholNoTotal = 0;
  let alcoholNoNegative = 0;

  let caffeineYesTotal = 0;
  let caffeineYesNegative = 0;
  let caffeineNoTotal = 0;
  let caffeineNoNegative = 0;

  let highStressTotal = 0;
  let highStressNegative = 0;
  let lowStressTotal = 0;
  let lowStressNegative = 0;

  dreams.forEach(dream => {
    if (!dream.mood) {
      return;
    }

    const isNegative = dream.mood === 'negative';
    const context = dream.sleepContext;

    overallTotal += 1;
    if (isNegative) {
      overallNegative += 1;
    }

    if (typeof context?.alcoholTaken === 'boolean') {
      if (context.alcoholTaken) {
        alcoholYesTotal += 1;
        if (isNegative) {
          alcoholYesNegative += 1;
        }
      } else {
        alcoholNoTotal += 1;
        if (isNegative) {
          alcoholNoNegative += 1;
        }
      }
    }

    if (typeof context?.caffeineLate === 'boolean') {
      if (context.caffeineLate) {
        caffeineYesTotal += 1;
        if (isNegative) {
          caffeineYesNegative += 1;
        }
      } else {
        caffeineNoTotal += 1;
        if (isNegative) {
          caffeineNoNegative += 1;
        }
      }
    }

    if (typeof context?.stressLevel === 'number') {
      if (context.stressLevel >= 2) {
        highStressTotal += 1;
        if (isNegative) {
          highStressNegative += 1;
        }
      } else {
        lowStressTotal += 1;
        if (isNegative) {
          lowStressNegative += 1;
        }
      }
    }
  });

  return {
    overall: toNegativeMoodRate(overallNegative, overallTotal),
    alcoholTaken: toNegativeMoodRate(alcoholYesNegative, alcoholYesTotal),
    noAlcohol: toNegativeMoodRate(alcoholNoNegative, alcoholNoTotal),
    caffeineLate: toNegativeMoodRate(caffeineYesNegative, caffeineYesTotal),
    noLateCaffeine: toNegativeMoodRate(caffeineNoNegative, caffeineNoTotal),
    highStress: toNegativeMoodRate(highStressNegative, highStressTotal),
    lowStress: toNegativeMoodRate(lowStressNegative, lowStressTotal),
  };
}
