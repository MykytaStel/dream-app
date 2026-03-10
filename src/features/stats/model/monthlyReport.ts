import { Dream, PreSleepEmotion, WakeEmotion } from '../../dreams/model/dream';
import {
  countDreamWords,
  getDreamDate,
  getTopPreSleepEmotionSignals,
  getTopWakeEmotionSignals,
} from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from './dreamReflection';

export type MonthlyReportMonth = {
  key: string;
  label: string;
  year: number;
  month: number;
};

export type MonthlyReportData = {
  month: MonthlyReportMonth;
  dreams: Dream[];
  entryCount: number;
  totalWords: number;
  averageWords: number;
  voiceCount: number;
  transcriptCount: number;
  taggedCount: number;
  contextCount: number;
  topTheme?: {
    label: string;
    dreamCount: number;
  };
  topSymbol?: {
    label: string;
    dreamCount: number;
  };
  topWord?: {
    label: string;
    dreamCount: number;
  };
  topWakeEmotion?: {
    emotion: WakeEmotion;
    count: number;
  };
  topPreSleepEmotion?: {
    emotion: PreSleepEmotion;
    count: number;
  };
};

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseMonthKey(value: string) {
  const [yearRaw, monthRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export function getMonthlyReportMonths(dreams: Dream[], locale: string): MonthlyReportMonth[] {
  const seen = new Set<string>();

  dreams.forEach(dream => {
    seen.add(toMonthKey(getDreamDate(dream)));
  });

  return Array.from(seen)
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const parsed = parseMonthKey(key);
      if (!parsed) {
        return null;
      }

      const date = new Date(parsed.year, parsed.month - 1, 1);
      return {
        key,
        label: date.toLocaleDateString(locale, {
          month: 'short',
        }),
        year: parsed.year,
        month: parsed.month,
      };
    })
    .filter((value): value is MonthlyReportMonth => value !== null);
}

export function getMonthlyReportData(
  dreams: Dream[],
  monthKey: string | undefined,
): MonthlyReportData | null {
  const months = getMonthlyReportMonths(dreams, 'en-US');
  const fallbackMonth = monthKey ?? months[0]?.key;
  const parsed = fallbackMonth ? parseMonthKey(fallbackMonth) : null;

  if (!parsed) {
    return null;
  }

  const monthDreams = dreams.filter(dream => {
    const date = getDreamDate(dream);
    return date.getFullYear() === parsed.year && date.getMonth() + 1 === parsed.month;
  });

  const voiceCount = monthDreams.filter(dream => Boolean(dream.audioUri?.trim())).length;
  const transcriptStats = getTranscriptArchiveStats(monthDreams);
  const taggedCount = monthDreams.filter(dream => dream.tags.length > 0).length;
  const contextCount = monthDreams.filter(dream => Boolean(dream.sleepContext)).length;
  const totalWords = monthDreams.reduce((sum, dream) => sum + countDreamWords(dream.text), 0);
  const recurringThemes = getRecurringReflectionSignals(monthDreams, { limit: 1 });
  const recurringSymbols = getRecurringReflectionSignals(monthDreams, {
    limit: 1,
    transcriptOnly: true,
  });
  const recurringWords = getRecurringWordSignals(monthDreams, 1);
  const wakeEmotions = getTopWakeEmotionSignals(monthDreams, 1);
  const preSleepEmotions = getTopPreSleepEmotionSignals(monthDreams, 1);

  return {
    month: {
      key: fallbackMonth,
      label: new Date(parsed.year, parsed.month - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
      }),
      year: parsed.year,
      month: parsed.month,
    },
    dreams: monthDreams,
    entryCount: monthDreams.length,
    totalWords,
    averageWords: monthDreams.length ? Math.round(totalWords / monthDreams.length) : 0,
    voiceCount,
    transcriptCount: transcriptStats.withTranscript,
    taggedCount,
    contextCount,
    topTheme: recurringThemes[0]
      ? { label: recurringThemes[0].label, dreamCount: recurringThemes[0].dreamCount }
      : undefined,
    topSymbol: recurringSymbols[0]
      ? { label: recurringSymbols[0].label, dreamCount: recurringSymbols[0].dreamCount }
      : undefined,
    topWord: recurringWords[0]
      ? { label: recurringWords[0].label, dreamCount: recurringWords[0].dreamCount }
      : undefined,
    topWakeEmotion: wakeEmotions[0],
    topPreSleepEmotion: preSleepEmotions[0],
  };
}
