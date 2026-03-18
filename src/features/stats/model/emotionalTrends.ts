import { type AppLocale } from '../../../i18n/types';
import { type Dream, type Mood, type WakeEmotion } from '../../dreams/model/dream';
import { getDreamDate, getMoodValence } from '../../dreams/model/dreamAnalytics';
import { type InsightRange } from './statsScreenModel';

export type EmotionalTrendValence = 'positive' | 'neutral' | 'negative';

export type EmotionalTrendEntry = {
  periodKey: string;
  periodLabel: string;
  dominantMood: Mood | null;
  valence: EmotionalTrendValence | null;
  moodCounts: Partial<Record<Mood, number>>;
  entryCount: number;
  topWakeEmotion: WakeEmotion | null;
};

export type SymbolTrendItem = {
  label: string;
  dreamCount: number;
  trendDirection: 'rising' | 'stable';
};

type TrendCopy = {
  emotionalTrendArcPositive: string;
  emotionalTrendArcNeutral: string;
  emotionalTrendArcNegative: string;
  emotionalTrendArcMixed: string;
  emotionalTrendArcEmpty: string;
  emotionalTrendEmptyLabel: string;
};

// Aurora-derived valence colors (static, not theme-dynamic — safe for off-screen capture)
export const TREND_VALENCE_COLOR: Record<EmotionalTrendValence, string> = {
  positive: '#63D9FF', // auroraStart — cyan
  neutral: '#8D7CFF',  // auroraMid — purple
  negative: '#C57EFF', // auroraEnd — magenta
};

function toISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatWeekLabel(periodKey: string, locale: AppLocale): string {
  // periodKey: "2026-W10" → find Monday of that week
  const [yearStr, weekStr] = periodKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(jan4.getTime() - dayOfWeek * 86400000 + (week - 1) * 7 * 86400000);
  return monday.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatMonthLabel(periodKey: string, locale: AppLocale): string {
  const [yearStr, monthStr] = periodKey.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short',
    year: '2-digit',
  });
}

function getDominantMood(moodCounts: Partial<Record<Mood, number>>): Mood | null {
  let dominant: Mood | null = null;
  let max = 0;

  for (const [mood, count] of Object.entries(moodCounts) as [Mood, number][]) {
    if (count > max) {
      max = count;
      dominant = mood;
    }
  }

  return dominant;
}

function getTopWakeEmotion(dreams: Dream[]): WakeEmotion | null {
  const counts = new Map<WakeEmotion, number>();

  dreams.forEach(dream => {
    dream.wakeEmotions?.forEach(emotion => {
      counts.set(emotion, (counts.get(emotion) ?? 0) + 1);
    });
  });

  let top: WakeEmotion | null = null;
  let max = 0;

  counts.forEach((count, emotion) => {
    if (count > max) {
      max = count;
      top = emotion;
    }
  });

  return top;
}

export function buildEmotionalTrendSeries(
  dreams: Dream[],
  range: InsightRange,
  locale: AppLocale,
): EmotionalTrendEntry[] {
  const useMonths = range === 'all';
  const buckets = new Map<string, Dream[]>();

  dreams.forEach(dream => {
    const date = getDreamDate(dream);
    const key = useMonths ? toMonthKey(date) : toISOWeek(date);
    const existing = buckets.get(key) ?? [];
    existing.push(dream);
    buckets.set(key, existing);
  });

  const sortedKeys = Array.from(buckets.keys()).sort();

  return sortedKeys.map(periodKey => {
    const periodDreams = buckets.get(periodKey) ?? [];
    const moodCounts: Partial<Record<Mood, number>> = {};

    periodDreams.forEach(dream => {
      if (dream.mood) {
        moodCounts[dream.mood] = (moodCounts[dream.mood] ?? 0) + 1;
      }
    });

    const dominantMood = getDominantMood(moodCounts);
    const valence = dominantMood ? getMoodValence(dominantMood) : null;

    return {
      periodKey,
      periodLabel: useMonths
        ? formatMonthLabel(periodKey, locale)
        : formatWeekLabel(periodKey, locale),
      dominantMood,
      valence,
      moodCounts,
      entryCount: periodDreams.length,
      topWakeEmotion: getTopWakeEmotion(periodDreams),
    };
  });
}

export function getEmotionalTrendInsight(
  series: EmotionalTrendEntry[],
  copy: TrendCopy,
): string {
  if (series.length === 0) {
    return copy.emotionalTrendEmptyLabel;
  }

  const withMood = series.filter(e => e.valence !== null);
  if (withMood.length === 0) {
    return copy.emotionalTrendEmptyLabel;
  }

  const positiveCount = withMood.filter(e => e.valence === 'positive').length;
  const negativeCount = withMood.filter(e => e.valence === 'negative').length;
  const total = withMood.length;

  const positiveRatio = positiveCount / total;
  const negativeRatio = negativeCount / total;

  if (positiveRatio >= 0.6) {
    return copy.emotionalTrendArcPositive;
  }

  if (negativeRatio >= 0.5) {
    return copy.emotionalTrendArcNegative;
  }

  if (positiveRatio >= 0.4 && negativeRatio < 0.3) {
    return copy.emotionalTrendArcNeutral;
  }

  return copy.emotionalTrendArcMixed;
}

export function getSymbolTrendSummary(
  dreams: Dream[],
  range: InsightRange,
  symbolLabels: string[],
): SymbolTrendItem[] {
  if (!symbolLabels.length || !dreams.length) {
    return [];
  }

  const sorted = [...dreams].sort((a, b) => getDreamDate(a).getTime() - getDreamDate(b).getTime());
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  function countSymbolInDreams(label: string, subset: Dream[]): number {
    const normalized = label.toLowerCase();
    return subset.filter(dream =>
      dream.transcript?.toLowerCase().includes(normalized) ||
      dream.tags.some(tag => tag.toLowerCase() === normalized),
    ).length;
  }

  return symbolLabels.slice(0, 5).map(label => {
    const firstCount = countSymbolInDreams(label, firstHalf);
    const secondCount = countSymbolInDreams(label, secondHalf);
    const trendDirection: SymbolTrendItem['trendDirection'] =
      secondCount > firstCount ? 'rising' : 'stable';

    return {
      label,
      dreamCount: firstCount + secondCount,
      trendDirection,
    };
  });
}
