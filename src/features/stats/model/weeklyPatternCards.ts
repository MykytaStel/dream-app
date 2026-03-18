import { type AppLocale } from '../../../i18n/types';
import { getDreamDate, getMoodCounts } from '../../dreams/model/dreamAnalytics';
import { type Dream, type Mood } from '../../dreams/model/dream';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
} from './dreamReflection';

export type WeeklyPatternCard = {
  key: 'rhythm' | 'signal' | 'tone' | 'context' | 'capture' | 'quiet';
  label: string;
  title: string;
  hint: string;
  signal?: string;
  signalKind?: 'theme' | 'word';
  accent?: boolean;
};

type WeeklyPatternCandidate = WeeklyPatternCard & {
  score: number;
  priority: number;
};

type WeeklyPatternCopy = {
  weeklyPatternRhythmLabel: string;
  weeklyPatternSignalLabel: string;
  weeklyPatternToneLabel: string;
  weeklyPatternContextLabel: string;
  weeklyPatternCaptureLabel: string;
  weeklyPatternQuietWeekTitle: string;
  weeklyPatternQuietWeekHint: string;
  weeklyPatternStillFormingTitle: string;
  weeklyPatternStillFormingHint: string;
  weeklyPatternContextTitle: string;
  weeklyPatternVoiceTitle: string;
  weeklyPatternThisWeekSuffix: string;
  weeklyPatternVsPreviousLabel: string;
  weeklyPatternVsPreviousFlat: string;
};

type BuildWeeklyPatternCardsArgs = {
  dreams: Dream[];
  locale: AppLocale;
  copy: WeeklyPatternCopy;
  moodLabels: Record<Mood, string>;
  now?: number;
};

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

function formatEntryCountLabel(count: number, locale: AppLocale) {
  return `${count} ${formatCountUnit(count, locale, {
    en: { one: 'entry', other: 'entries' },
    uk: { one: 'запис', few: 'записи', many: 'записів' },
  })}`;
}

function formatDreamCountLabel(count: number, locale: AppLocale) {
  return `${count} ${formatCountUnit(count, locale, {
    en: { one: 'dream', other: 'dreams' },
    uk: { one: 'сон', few: 'сни', many: 'снів' },
  })}`;
}

function formatSignedDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function startOfToday(now?: number) {
  const date = typeof now === 'number' ? new Date(now) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDreamsFromWindow(
  dreams: Dream[],
  startOffsetDays: number,
  endOffsetDays: number,
  now?: number,
) {
  const today = startOfToday(now);
  const windowStart = new Date(today);
  const windowEnd = new Date(today);
  windowStart.setDate(windowStart.getDate() - startOffsetDays);
  windowEnd.setDate(windowEnd.getDate() - endOffsetDays);
  windowEnd.setHours(23, 59, 59, 999);

  return dreams.filter(dream => {
    const dreamDate = getDreamDate(dream);
    return dreamDate >= windowStart && dreamDate <= windowEnd;
  });
}

function hasMeaningfulSleepContext(dream: Dream) {
  const context = dream.sleepContext;
  if (!context) {
    return false;
  }

  return Boolean(
    context.preSleepEmotions?.length ||
      typeof context.stressLevel === 'number' ||
      typeof context.alcoholTaken === 'boolean' ||
      typeof context.caffeineLate === 'boolean' ||
      context.medications?.trim() ||
      context.importantEvents?.trim() ||
      context.healthNotes?.trim(),
  );
}

function toSentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function toWeeklyPatternCard(
  card: WeeklyPatternCard | WeeklyPatternCandidate,
): WeeklyPatternCard {
  if ('score' in card) {
    const { score: _score, priority: _priority, ...rest } = card;
    return rest;
  }

  return card;
}

export function buildWeeklyPatternCards({
  dreams,
  locale,
  copy,
  moodLabels,
  now,
}: BuildWeeklyPatternCardsArgs): WeeklyPatternCard[] {
  const weeklyDreams = getDreamsFromWindow(dreams, 6, 0, now);
  const previousWeeklyDreams = getDreamsFromWindow(dreams, 13, 7, now);
  const weeklyCount = weeklyDreams.length;
  const weeklyDelta = weeklyCount - previousWeeklyDreams.length;
  const meaningThreshold = weeklyCount <= 1 ? 1 : 2;
  const topTheme = getRecurringReflectionSignals(weeklyDreams, { limit: 1 })[0];
  const topWord = getRecurringWordSignals(weeklyDreams, 1)[0];
  const selectedSignal =
    topTheme && topWord
      ? topTheme.dreamCount >= topWord.dreamCount
        ? {
            label: topTheme.label,
            count: topTheme.dreamCount,
            kind: 'theme' as const,
          }
        : {
            label: topWord.label,
            count: topWord.dreamCount,
            kind: 'word' as const,
          }
      : topTheme
      ? {
          label: topTheme.label,
          count: topTheme.dreamCount,
          kind: 'theme' as const,
        }
      : topWord
      ? {
          label: topWord.label,
          count: topWord.dreamCount,
          kind: 'word' as const,
        }
      : null;
  const moodCounts = getMoodCounts(weeklyDreams);
  const dominantMood = Object.entries(moodCounts)
    .filter((entry): entry is [Mood, number] => entry[1] > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const contextCount = weeklyDreams.filter(hasMeaningfulSleepContext).length;
  const audioCount = weeklyDreams.filter(dream =>
    Boolean(dream.audioUri?.trim()),
  ).length;

  const rhythmCard: WeeklyPatternCard =
    weeklyCount > 0
      ? {
          key: 'rhythm',
          label: copy.weeklyPatternRhythmLabel,
          title: `${formatEntryCountLabel(weeklyCount, locale)} ${
            copy.weeklyPatternThisWeekSuffix
          }`,
          hint:
            weeklyDelta === 0
              ? copy.weeklyPatternVsPreviousFlat
              : `${formatSignedDelta(weeklyDelta)} ${
                  copy.weeklyPatternVsPreviousLabel
                }`,
        }
      : {
          key: 'quiet',
          label: copy.weeklyPatternRhythmLabel,
          title: copy.weeklyPatternQuietWeekTitle,
          hint: copy.weeklyPatternQuietWeekHint,
        };

  const candidates: WeeklyPatternCandidate[] = [];

  if (selectedSignal && selectedSignal.count >= meaningThreshold) {
    candidates.push({
      key: 'signal',
      label: copy.weeklyPatternSignalLabel,
      title: toSentenceCase(selectedSignal.label),
      hint: `${formatDreamCountLabel(selectedSignal.count, locale)} ${
        copy.weeklyPatternThisWeekSuffix
      }`,
      signal: selectedSignal.label,
      signalKind: selectedSignal.kind,
      accent: true,
      score: selectedSignal.count * 3,
      priority: 0,
    });
  }

  if (dominantMood && dominantMood[1] >= meaningThreshold) {
    candidates.push({
      key: 'tone',
      label: copy.weeklyPatternToneLabel,
      title: moodLabels[dominantMood[0]],
      hint: formatEntryCountLabel(dominantMood[1], locale),
      score: dominantMood[1] * 2,
      priority: 1,
    });
  }

  if (contextCount >= meaningThreshold) {
    candidates.push({
      key: 'context',
      label: copy.weeklyPatternContextLabel,
      title: copy.weeklyPatternContextTitle,
      hint: formatEntryCountLabel(contextCount, locale),
      score: contextCount * 1.5,
      priority: 2,
    });
  }

  if (audioCount >= meaningThreshold) {
    candidates.push({
      key: 'capture',
      label: copy.weeklyPatternCaptureLabel,
      title: copy.weeklyPatternVoiceTitle,
      hint: formatEntryCountLabel(audioCount, locale),
      score: audioCount * 1.4,
      priority: 3,
    });
  }

  const leadPatternCard = candidates.sort(
    (a, b) => b.score - a.score || a.priority - b.priority,
  )[0] ?? {
    key: weeklyCount > 0 ? 'signal' : 'quiet',
    label: copy.weeklyPatternSignalLabel,
    title:
      weeklyCount > 0
        ? copy.weeklyPatternStillFormingTitle
        : copy.weeklyPatternQuietWeekTitle,
    hint:
      weeklyCount > 0
        ? copy.weeklyPatternStillFormingHint
        : copy.weeklyPatternQuietWeekHint,
  };

  return [rhythmCard, toWeeklyPatternCard(leadPatternCard)];
}
