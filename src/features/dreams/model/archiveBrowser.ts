import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';
import { Dream, Mood } from './dream';
import { getDreamDate } from './dreamAnalytics';
import {
  getDreamSearchMatchReasons,
  getDreamSearchScore,
  isDreamArchived,
  isDreamStarred,
  sortDreamsForTimeline,
  type DreamSearchMatchReason,
} from './homeTimeline';

export type ArchiveFilter = 'all' | 'active' | 'archived' | 'starred';
export type ArchiveViewMode = 'comfortable' | 'compact';

export type ArchiveSection = {
  title: string;
  monthKey: string;
  data: Dream[];
};

export type ArchiveRevisitCue = {
  dreamId: string;
  title: string;
  reason: string;
  contextLabel: string;
  actionLabel: string;
  icon: string;
};

export type ArchiveCalendarCell = {
  key: string;
  date: string | null;
  dayNumber: number | null;
  count: number;
};

export function getArchiveMoodLabel(
  mood: Dream['mood'] | undefined,
  moodLabels: Record<Mood, string>,
) {
  return mood ? moodLabels[mood] : undefined;
}

export function toLocalDateKey(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function getMonthKeyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthKey(dream: Dream) {
  return getMonthKeyForDate(getDreamDate(dream));
}

export function getMonthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function getMonthChipLabel(
  monthKey: string,
  selectedMonthKey: string,
  locale: string,
) {
  const [year, month] = monthKey.split('-').map(Number);
  const [selectedYear] = selectedMonthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthLabel = date.toLocaleDateString(locale, { month: 'short' });

  if (year === selectedYear) {
    return monthLabel;
  }

  return `${monthLabel} ${String(year).slice(-2)}`;
}

export function formatSelectedDate(dateKey: string, locale: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getAvailableMonthKeys(dreams: Dream[]) {
  return Array.from(new Set(dreams.map(getMonthKey))).sort((a, b) => b.localeCompare(a));
}

export function getDistinctDayCount(dreams: Dream[]) {
  return new Set(dreams.map(dream => toLocalDateKey(getDreamDate(dream)))).size;
}

function getCountWord(
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

export function formatArchiveEntryCount(count: number, locale: AppLocale) {
  return `${count} ${getCountWord(count, locale, {
    en: { one: 'entry', other: 'entries' },
    uk: { one: 'запис', few: 'записи', many: 'записів' },
  })}`;
}

export function formatArchiveActiveDaysCount(count: number, locale: AppLocale) {
  return `${count} ${getCountWord(count, locale, {
    en: { one: 'active day', other: 'active days' },
    uk: { one: 'активний день', few: 'активні дні', many: 'активних днів' },
  })}`;
}

export function getArchiveEmptyContent(
  copy: DreamCopy,
  filter: ArchiveFilter,
  hasScopedDreams: boolean,
  hasVisibleDreams: boolean,
) {
  if (!hasScopedDreams) {
    switch (filter) {
      case 'active':
        return {
          title: copy.archiveEmptyCurrentTitle,
          subtitle: copy.archiveEmptyCurrentDescription,
        };
      case 'archived':
        return {
          title: copy.archiveEmptyArchivedTitle,
          subtitle: copy.archiveEmptyArchivedDescription,
        };
      case 'starred':
        return {
          title: copy.archiveEmptyImportantTitle,
          subtitle: copy.archiveEmptyImportantDescription,
        };
      case 'all':
      default:
        return {
          title: copy.archiveEmptyTitle,
          subtitle: copy.archiveEmptyDescription,
        };
    }
  }

  if (!hasVisibleDreams) {
    return {
      title: copy.archiveNoResultsTitle,
      subtitle: copy.archiveNoResultsDescription,
    };
  }

  return null;
}

export function getArchivePills(dream: Dream, copy: DreamCopy, mood?: string) {
  return [
    mood ?? null,
    isDreamStarred(dream) ? copy.starredTag : null,
    dream.transcriptSource === 'edited'
      ? copy.editedTranscriptTag
      : dream.transcript
        ? copy.transcriptTag
        : dream.audioUri
          ? copy.audioTag
          : null,
    ...dream.tags.slice(0, 2),
  ].filter((value): value is string => Boolean(value));
}

export function formatArchivePreview(dream: Dream, copy: DreamCopy) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > 110 ? `${text.slice(0, 107)}...` : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    const prefix =
      dream.transcriptSource === 'edited'
        ? `${copy.editedTranscriptPreviewPrefix}: `
        : `${copy.transcriptPreviewPrefix}: `;
    const visible = transcript.length > 88 ? `${transcript.slice(0, 85)}...` : transcript;
    return `${prefix}${visible}`;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

export function buildCalendarCells(monthKey: string, dreams: Dream[]) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const counts = new Map<string, number>();

  dreams.forEach(dream => {
    const dateKey = toLocalDateKey(getDreamDate(dream));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  });

  const cells: ArchiveCalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      key: `pad-start-${index}`,
      date: null,
      dayNumber: null,
      count: 0,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    cells.push({
      key: dateKey,
      date: dateKey,
      dayNumber: day,
      count: counts.get(dateKey) ?? 0,
    });
  }

  while (cells.length % 7 !== 0) {
    const index = cells.length;
    cells.push({
      key: `pad-end-${index}`,
      date: null,
      dayNumber: null,
      count: 0,
    });
  }

  return cells;
}

export function buildCalendarRows(cells: ArchiveCalendarCell[]) {
  const rows: ArchiveCalendarCell[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
}

export function getQuickJumpMonthKeys(
  monthKeys: string[],
  selectedIndex: number,
  size = 4,
) {
  if (!monthKeys.length) {
    return [];
  }

  if (selectedIndex < 0) {
    return monthKeys.slice(0, size);
  }

  const windowSize = Math.min(size, monthKeys.length);
  const maxStart = Math.max(0, monthKeys.length - windowSize);
  const start = Math.min(maxStart, Math.max(0, selectedIndex - Math.floor(windowSize / 2)));

  return monthKeys.slice(start, start + windowSize);
}

export function buildArchiveSections(
  dreams: Dream[],
  selectedMonthKey: string | null,
  locale: string,
  selectedDate: string | null,
): ArchiveSection[] {
  if (!selectedMonthKey) {
    return [];
  }

  return [
    {
      title: selectedDate
        ? formatSelectedDate(selectedDate, locale)
        : getMonthLabel(selectedMonthKey, locale),
      monthKey: selectedMonthKey,
      data: dreams,
    },
  ];
}

const ARCHIVE_REVISIT_MIN_AGE_MS = 12 * 60 * 60 * 1000;

function getArchiveCueTitle(dream: Dream, copy: DreamCopy) {
  return dream.title?.trim() || copy.untitled;
}

export function getArchiveRevisitCue(
  dreams: Dream[],
  copy: DreamCopy,
  now = Date.now(),
): ArchiveRevisitCue | null {
  const candidates = dreams
    .filter(dream => now - dream.createdAt >= ARCHIVE_REVISIT_MIN_AGE_MS)
    .map(dream => {
      const isImportant = isDreamStarred(dream);
      const hasAnalysis = Boolean(dream.analysis?.summary?.trim());
      const hasTranscript = Boolean(dream.transcript?.trim());
      const isArchived = isDreamArchived(dream);
      const hasSignal = Boolean(
        dream.tags.length || dream.wakeEmotions?.length || dream.sleepContext?.preSleepEmotions?.length,
      );
      const score =
        (isImportant ? 40 : 0) +
        (hasAnalysis ? 18 : 0) +
        (hasTranscript ? 10 : 0) +
        (isArchived ? 6 : 0) +
        (hasSignal ? 4 : 0);

      let reason = copy.archiveRevisitReasonSignal;
      let contextLabel = copy.archiveRevisitContextSignal;
      let actionLabel = copy.archiveRevisitAction;
      let icon = 'flash-outline';
      if (isImportant) {
        reason = copy.archiveRevisitReasonImportant;
        contextLabel = copy.archiveRevisitContextImportant;
        icon = 'star-outline';
      } else if (hasAnalysis) {
        reason = copy.archiveRevisitReasonAnalysis;
        contextLabel = copy.archiveRevisitContextAnalysis;
        actionLabel = copy.archiveRevisitActionAnalysis;
        icon = 'sparkles-outline';
      } else if (hasTranscript) {
        reason = copy.archiveRevisitReasonTranscript;
        contextLabel = copy.archiveRevisitContextTranscript;
        actionLabel = copy.archiveRevisitActionTranscript;
        icon = 'document-text-outline';
      } else if (isArchived) {
        reason = copy.archiveRevisitReasonArchived;
        contextLabel = copy.archiveRevisitContextArchived;
        icon = 'archive-outline';
      }

      return {
        dream,
        score,
        reason,
        contextLabel,
        actionLabel,
        icon,
      };
    })
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.dream.createdAt - left.dream.createdAt;
    });

  const top = candidates[0];
  if (!top) {
    return null;
  }

  return {
    dreamId: top.dream.id,
    title: getArchiveCueTitle(top.dream, copy),
    reason: top.reason,
    contextLabel: top.contextLabel,
    actionLabel: top.actionLabel,
    icon: top.icon,
  };
}

export function getArchiveMatchReasonLabels(
  dream: Dream,
  query: string,
  copy: DreamCopy,
) {
  const labelMap: Record<DreamSearchMatchReason, string> = {
    title: copy.homeSearchMatchTitle,
    notes: copy.homeSearchMatchNotes,
    transcript: copy.homeSearchMatchTranscript,
    tag: copy.homeSearchMatchTag,
    context: copy.homeSearchMatchContext,
  };

  return getDreamSearchMatchReasons(dream, query)
    .slice(0, 3)
    .map(reason => labelMap[reason]);
}

export function applyArchiveStatusFilter(
  dreams: Dream[],
  filter: ArchiveFilter,
) {
  switch (filter) {
    case 'active':
      return dreams.filter(dream => !isDreamArchived(dream));
    case 'archived':
      return dreams.filter(dream => isDreamArchived(dream));
    case 'starred':
      return dreams.filter(dream => isDreamStarred(dream));
    case 'all':
    default:
      return dreams;
  }
}

export function searchArchiveMonthDreams(
  dreams: Dream[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const sortedDreams = sortDreamsForTimeline(dreams, 'newest');

  if (!normalizedQuery) {
    return sortedDreams;
  }

  return sortedDreams
    .map(dream => ({
      dream,
      score: getDreamSearchScore(dream, normalizedQuery),
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.dream);
}
