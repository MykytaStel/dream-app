import { getStatsCopy } from '../../../constants/copy/stats';
import { type AppLocale } from '../../../i18n/types';
import type { Dream } from '../../dreams/model/dream';
import {
  countDreamWords,
  getDreamDate,
} from '../../dreams/model/dreamAnalytics';
import type { PatternDetailKind } from '../../../app/navigation/routes';
import type { DreamAchievementId } from './achievements';
import type { DreamReflectionSignal, DreamWordSignal } from './dreamReflection';
import type { PatternGroupCardItem } from '../components/PatternGroupCard';

export type InsightRange = 'all' | '30d' | '7d';
export type PatternGroupKey = 'themes' | 'words' | 'symbols' | 'pre-sleep';

type StatsCopy = ReturnType<typeof getStatsCopy>;

export function getAchievementContent(id: DreamAchievementId, copy: StatsCopy) {
  switch (id) {
    case 'first-dream':
      return {
        title: copy.milestoneFirstDreamTitle,
        description: copy.milestoneFirstDreamDescription,
      };
    case 'three-day-streak':
      return {
        title: copy.milestoneThreeDayStreakTitle,
        description: copy.milestoneThreeDayStreakDescription,
      };
    case 'ten-dreams':
      return {
        title: copy.milestoneTenDreamsTitle,
        description: copy.milestoneTenDreamsDescription,
      };
    case 'first-voice-dream':
      return {
        title: copy.milestoneFirstVoiceDreamTitle,
        description: copy.milestoneFirstVoiceDreamDescription,
      };
  }
}

export function filterDreamsByRange(dreams: Dream[], range: InsightRange) {
  if (range === 'all') {
    return dreams;
  }

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (range === '7d' ? 6 : 29));

  return dreams.filter(dream => getDreamDate(dream) >= cutoff);
}

export function getPreviousRangeDreams(dreams: Dream[], range: InsightRange) {
  if (range === 'all') {
    return [] as Dream[];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periodLength = range === '7d' ? 7 : 30;
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - (periodLength - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  previousStart.setHours(0, 0, 0, 0);
  previousStart.setDate(previousStart.getDate() - (periodLength - 1));

  return dreams.filter(dream => {
    const dreamDate = getDreamDate(dream);
    return dreamDate >= previousStart && dreamDate <= previousEnd;
  });
}

export function summarizeScopedDreams(scopedDreams: Dream[]) {
  let totalWords = 0;
  let voiceNotes = 0;
  let transcribedDreams = 0;
  let taggedEntries = 0;
  let moodEntries = 0;

  scopedDreams.forEach(dream => {
    totalWords += countDreamWords(dream.text);

    if (dream.audioUri) {
      voiceNotes += 1;
    }

    if (dream.transcript?.trim()) {
      transcribedDreams += 1;
    }

    if (dream.tags.length > 0) {
      taggedEntries += 1;
    }

    if (dream.mood) {
      moodEntries += 1;
    }
  });

  return {
    totalWords,
    voiceNotes,
    transcribedDreams,
    taggedEntries,
    moodEntries,
  };
}

function toLocalDateKey(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function buildRecentActivityBars(dreams: Dream[], range: InsightRange, locale: AppLocale) {
  const totalDays = range === '7d' ? 7 : 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();

  dreams.forEach(dream => {
    const dateKey = toLocalDateKey(getDreamDate(dream));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  });

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (totalDays - index - 1));
    const dateKey = toLocalDateKey(date);

    return {
      key: dateKey,
      label: date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
        weekday: 'narrow',
      }),
      count: counts.get(dateKey) ?? 0,
    };
  });
}

export function formatCoverageValue(value: number, total: number) {
  return `${value}/${Math.max(total, 0)}`;
}

function formatCountUnit(
  count: number,
  locale: AppLocale,
  forms: {
    en: { one: string; other: string };
    uk: { one: string; few: string; many: string };
  },
) {
  if (locale === 'uk') {
    const absolute = Math.abs(count);
    const lastTwo = absolute % 100;
    const last = absolute % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
      return forms.uk.many;
    }

    if (last === 1) {
      return forms.uk.one;
    }

    if (last >= 2 && last <= 4) {
      return forms.uk.few;
    }

    return forms.uk.many;
  }

  return Math.abs(count) === 1 ? forms.en.one : forms.en.other;
}

export function formatDreamCountLabel(count: number, locale: AppLocale) {
  return `${count} ${formatCountUnit(count, locale, {
    en: { one: 'dream', other: 'dreams' },
    uk: { one: 'сон', few: 'сни', many: 'снів' },
  })}`;
}

export function formatEntryCountLabel(count: number, locale: AppLocale) {
  return `${count} ${formatCountUnit(count, locale, {
    en: { one: 'entry', other: 'entries' },
    uk: { one: 'запис', few: 'записи', many: 'записів' },
  })}`;
}

export function formatSignedDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

export function formatMonthTitle(year: number, month: number, locale: AppLocale) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getReflectionSourceLabel(source: DreamReflectionSignal['source'], copy: StatsCopy) {
  switch (source) {
    case 'tag':
      return copy.reflectionSourceTag;
    case 'mixed':
      return copy.reflectionSourceMixed;
    case 'transcript':
    default:
      return copy.reflectionSourceTranscript;
  }
}

export function createWordPatternItems(
  values: DreamWordSignal[],
  locale: AppLocale,
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void,
): PatternGroupCardItem[] {
  return values.map(signal => ({
    key: signal.label,
    label: signal.label,
    countLabel: formatDreamCountLabel(signal.dreamCount, locale),
    countBadge: String(signal.dreamCount),
    onPress: () => onOpenPatternDetail(signal.label, 'word'),
  }));
}

export function createReflectionPatternItems(
  values: DreamReflectionSignal[],
  locale: AppLocale,
  kind: Extract<PatternDetailKind, 'theme' | 'symbol'>,
  copy: StatsCopy,
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void,
): PatternGroupCardItem[] {
  return values.map(signal => ({
    key: signal.label,
    label: signal.label,
    countLabel: formatDreamCountLabel(signal.dreamCount, locale),
    countBadge: String(signal.dreamCount),
    sourceLabel: getReflectionSourceLabel(signal.source, copy),
    onPress: () => onOpenPatternDetail(signal.label, kind),
  }));
}
