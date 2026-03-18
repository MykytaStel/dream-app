import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import type { PatternDetailKind } from '../../../app/navigation/routes';
import type { AppLocale } from '../../../i18n/types';
import type { Mood } from '../../dreams/model/dream';
import { getDreamDate } from '../../dreams/model/dreamAnalytics';
import {
  getPatternDreamMatches,
  normalizePatternSignal,
  type PatternMatchKind,
  type PatternMatchSource,
  type PatternDreamMatch,
} from './patternMatches';
import type { DreamReflectionSignal, DreamWordSignal } from './dreamReflection';
import type { SavedDreamThreadRecord } from '../services/dreamThreadShelfService';

type StatsCopy = ReturnType<typeof getStatsCopy>;
type DreamThreadShelfCopy = Pick<
  StatsCopy,
  | 'patternDetailWordLabel'
  | 'patternDetailThemeLabel'
  | 'patternDetailSymbolLabel'
  | 'patternDetailMatchesSingle'
  | 'patternDetailMatchesPlural'
>;
type DreamCopy = ReturnType<typeof getDreamCopy>;

export type DreamThreadSummaryItem = {
  label: string;
  value: string;
};

export type DreamThreadEntryViewModel = {
  dreamId: string;
  title: string;
  meta: string;
  preview: string;
  sourceLabels: string[];
  markerLabel: string | null;
};

export type DreamThreadViewModel = {
  signal: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  summaryItems: DreamThreadSummaryItem[];
  timelineTitle: string;
  entries: DreamThreadEntryViewModel[];
};

export type SavedDreamThreadShelfItem = {
  signal: string;
  kind: PatternDetailKind;
  kindLabel: string;
  matchesLabel: string;
};

export type RecurringSignalDashboardItem = {
  key: string;
  signal: string;
  kind: PatternDetailKind;
  kindLabel: string;
  rank: number;
  matchesLabel: string;
  sourceLabel: string;
  timelineLabel: string;
  supportingLabel: string | null;
  latestDreamId: string;
  latestDreamTitle: string;
  latestDreamMeta: string;
  latestPreview: string;
  latestSourceLabels: string[];
};

function formatPreview(
  match: PatternDreamMatch,
  dreamCopy: DreamCopy,
) {
  const text = match.dream.text?.trim();
  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  const transcript = match.dream.transcript?.trim();
  if (transcript) {
    const prefix =
      match.dream.transcriptSource === 'edited'
        ? `${dreamCopy.editedTranscriptPreviewPrefix}: `
        : `${dreamCopy.transcriptPreviewPrefix}: `;
    const visible = transcript.length > 96 ? `${transcript.slice(0, 93)}...` : transcript;
    return `${prefix}${visible}`;
  }

  if (match.dream.audioUri) {
    return dreamCopy.audioOnlyPreview;
  }

  return dreamCopy.noDetailsPreview;
}

function formatDateLabel(value: number) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDateLabel(value: number, locale: AppLocale) {
  return new Date(value).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getPatternKindSubtitle(
  kind: PatternMatchKind,
  copy: StatsCopy,
) {
  switch (kind) {
    case 'word':
      return copy.patternDetailWordDescription;
    case 'theme':
      return copy.patternDetailThemeDescription;
    case 'symbol':
      return copy.patternDetailSymbolDescription;
  }
}

function getPatternKindLabel(
  kind: PatternDetailKind,
  copy: DreamThreadShelfCopy,
) {
  switch (kind) {
    case 'word':
      return copy.patternDetailWordLabel;
    case 'theme':
      return copy.patternDetailThemeLabel;
    case 'symbol':
      return copy.patternDetailSymbolLabel;
  }
}

function getSourceLabel(source: PatternMatchSource, copy: StatsCopy) {
  switch (source) {
    case 'tag':
      return copy.patternDetailSourceTag;
    case 'title':
      return copy.patternDetailSourceTitle;
    case 'text':
      return copy.patternDetailSourceText;
    case 'transcript':
      return copy.patternDetailSourceTranscript;
  }
}

function getReflectionSourceLabel(
  source: DreamReflectionSignal['source'],
  copy: Pick<StatsCopy, 'reflectionSourceTag' | 'reflectionSourceTranscript' | 'reflectionSourceMixed'>,
) {
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

function formatRowMeta(
  match: PatternDreamMatch,
  moodLabels: Record<Mood, string>,
) {
  const mood = match.dream.mood ? moodLabels[match.dream.mood] : undefined;
  const dateLabel =
    match.dream.sleepDate ?? getDreamDate(match.dream).toLocaleDateString();
  return mood ? `${mood} · ${dateLabel}` : dateLabel;
}

function getDominantSourceLabel(
  matches: PatternDreamMatch[],
  copy: StatsCopy,
) {
  const counts = new Map<PatternMatchSource, number>();

  matches.forEach(match => {
    match.sources.forEach(source => {
      counts.set(source, (counts.get(source) ?? 0) + 1);
    });
  });

  const dominantSource = Array.from(counts.entries()).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  })[0]?.[0];

  return dominantSource ? getSourceLabel(dominantSource, copy) : copy.noData;
}

function getMatchesLabel(count: number, copy: Pick<StatsCopy, 'patternDetailMatchesSingle' | 'patternDetailMatchesPlural'>) {
  return `${count} ${count === 1 ? copy.patternDetailMatchesSingle : copy.patternDetailMatchesPlural}`;
}

function formatMentionLabel(
  count: number,
  locale: AppLocale,
  copy: Pick<StatsCopy, 'threadDetailMentionSingle' | 'threadDetailMentionPlural' | 'threadDetailMentionPluralUkFew'>,
) {
  if (locale === 'uk') {
    const absolute = Math.abs(count);
    const lastTwo = absolute % 100;
    const last = absolute % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
      return `${count} ${copy.threadDetailMentionPlural}`;
    }

    if (last === 1) {
      return `${count} ${copy.threadDetailMentionSingle}`;
    }

    if (last >= 2 && last <= 4) {
      return `${count} ${copy.threadDetailMentionPluralUkFew}`;
    }

    return `${count} ${copy.threadDetailMentionPlural}`;
  }

  return `${count} ${count === 1 ? copy.threadDetailMentionSingle : copy.threadDetailMentionPlural}`;
}

function buildRecurringSignalDashboardItem(input: {
  signal: DreamReflectionSignal | DreamWordSignal;
  kind: PatternDetailKind;
  rank: number;
  locale: AppLocale;
  getMatches: (signalLabel: string, kind: PatternDetailKind) => PatternDreamMatch[];
  statsCopy: StatsCopy;
  dreamCopy: DreamCopy;
}): RecurringSignalDashboardItem | null {
  const { signal, kind, rank, locale, getMatches, statsCopy, dreamCopy } = input;
  const matches = getMatches(signal.label, kind);

  if (!matches.length) {
    return null;
  }

  const chronologicalMatches = [...matches].sort(
    (left, right) => left.dream.createdAt - right.dream.createdAt,
  );
  const latestMatch = chronologicalMatches[chronologicalMatches.length - 1];
  const hasMentionCount = 'hitCount' in signal;

  return {
    key: `${kind}:${normalizePatternSignal(signal.label)}`,
    signal: signal.label,
    kind,
    kindLabel: getPatternKindLabel(kind, statsCopy),
    rank,
    matchesLabel: getMatchesLabel(matches.length, statsCopy),
    sourceLabel: hasMentionCount
      ? getDominantSourceLabel(matches, statsCopy)
      : getReflectionSourceLabel(signal.source, statsCopy),
    timelineLabel: `${statsCopy.threadDetailFirstSeenLabel} ${formatShortDateLabel(
      signal.firstSeenAt,
      locale,
    )} · ${statsCopy.threadDetailLatestSeenLabel} ${formatShortDateLabel(
      signal.latestSeenAt,
      locale,
    )}`,
    supportingLabel: hasMentionCount
      ? formatMentionLabel(signal.hitCount, locale, statsCopy)
      : null,
    latestDreamId: latestMatch.dream.id,
    latestDreamTitle: latestMatch.dream.title?.trim() || statsCopy.reviewWorkspaceDreamFallbackTitle,
    latestDreamMeta:
      latestMatch.dream.sleepDate ?? formatShortDateLabel(latestMatch.dream.createdAt, locale),
    latestPreview: formatPreview(latestMatch, dreamCopy),
    latestSourceLabels: latestMatch.sources.map(source => getSourceLabel(source, statsCopy)),
  };
}

export function buildReflectionRecurringDashboardItems(input: {
  signals: DreamReflectionSignal[];
  kind: Extract<PatternDetailKind, 'theme' | 'symbol'>;
  locale: AppLocale;
  dreams: Parameters<typeof getPatternDreamMatches>[0];
  statsCopy: StatsCopy;
  dreamCopy: DreamCopy;
}): RecurringSignalDashboardItem[] {
  const { signals, kind, locale, dreams, statsCopy, dreamCopy } = input;
  const matchesCache = new Map<string, PatternDreamMatch[]>();
  const getMatches = (signalLabel: string, signalKind: PatternDetailKind) => {
    const cacheKey = `${signalKind}:${normalizePatternSignal(signalLabel)}`;
    const cached = matchesCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const matches = getPatternDreamMatches(dreams, signalLabel, signalKind);
    matchesCache.set(cacheKey, matches);
    return matches;
  };

  return signals
    .map((signal, index) =>
      buildRecurringSignalDashboardItem({
        signal,
        kind,
        rank: index + 1,
        locale,
        getMatches,
        statsCopy,
        dreamCopy,
      }),
    )
    .filter((item): item is RecurringSignalDashboardItem => Boolean(item));
}

export function buildWordRecurringDashboardItems(input: {
  signals: DreamWordSignal[];
  locale: AppLocale;
  dreams: Parameters<typeof getPatternDreamMatches>[0];
  statsCopy: StatsCopy;
  dreamCopy: DreamCopy;
}): RecurringSignalDashboardItem[] {
  const { signals, locale, dreams, statsCopy, dreamCopy } = input;
  const matchesCache = new Map<string, PatternDreamMatch[]>();
  const getMatches = (signalLabel: string, signalKind: PatternDetailKind) => {
    const cacheKey = `${signalKind}:${normalizePatternSignal(signalLabel)}`;
    const cached = matchesCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const matches = getPatternDreamMatches(dreams, signalLabel, signalKind);
    matchesCache.set(cacheKey, matches);
    return matches;
  };

  return signals
    .map((signal, index) =>
      buildRecurringSignalDashboardItem({
        signal,
        kind: 'word',
        rank: index + 1,
        locale,
        getMatches,
        statsCopy,
        dreamCopy,
      }),
    )
    .filter((item): item is RecurringSignalDashboardItem => Boolean(item));
}

export function buildDreamThreadViewModel(input: {
  signal: string;
  kind: PatternMatchKind;
  matches: PatternDreamMatch[];
  statsCopy: StatsCopy;
  dreamCopy: DreamCopy;
  moodLabels: Record<Mood, string>;
}): DreamThreadViewModel {
  const { signal, kind, matches, statsCopy, dreamCopy, moodLabels } = input;
  const sortedMatches = [...matches].sort(
    (left, right) => left.dream.createdAt - right.dream.createdAt,
  );
  const firstMatch = sortedMatches[0] ?? null;
  const latestMatch = sortedMatches[sortedMatches.length - 1] ?? null;

  return {
    signal,
    eyebrow: statsCopy.threadDetailEyebrow,
    title: signal,
    subtitle: getPatternKindSubtitle(kind, statsCopy),
    summaryItems: sortedMatches.length
      ? [
          {
            label: statsCopy.threadDetailCountLabel,
            value: `${sortedMatches.length} ${
              sortedMatches.length === 1
                ? statsCopy.patternDetailMatchesSingle
                : statsCopy.patternDetailMatchesPlural
            }`,
          },
          {
            label: statsCopy.threadDetailFirstSeenLabel,
            value: formatDateLabel(firstMatch!.dream.createdAt),
          },
          {
            label: statsCopy.threadDetailLatestSeenLabel,
            value: formatDateLabel(latestMatch!.dream.createdAt),
          },
          {
            label: statsCopy.threadDetailSourceLabel,
            value: getDominantSourceLabel(sortedMatches, statsCopy),
          },
        ]
      : [],
    timelineTitle: statsCopy.threadDetailTimelineTitle,
    entries: sortedMatches.map((match, index) => ({
      dreamId: match.dream.id,
      title: match.dream.title?.trim() || dreamCopy.untitled,
      meta: formatRowMeta(match, moodLabels),
      preview: formatPreview(match, dreamCopy),
      sourceLabels: match.sources.map(source => getSourceLabel(source, statsCopy)),
      markerLabel:
        sortedMatches.length === 1
          ? statsCopy.threadDetailEntryOnly
          : index === 0
          ? statsCopy.threadDetailEntryFirst
          : index === sortedMatches.length - 1
          ? statsCopy.threadDetailEntryLatest
          : null,
    })),
  };
}

export function buildSavedDreamThreadShelfItems(input: {
  records: SavedDreamThreadRecord[];
  dreams: Parameters<typeof getPatternDreamMatches>[0];
  statsCopy: DreamThreadShelfCopy;
}): SavedDreamThreadShelfItem[] {
  const { records, dreams, statsCopy } = input;
  const seenKeys = new Set<string>();
  const matchesCache = new Map<string, PatternDreamMatch[]>();

  return records
    .map(record => {
      const normalizedSignal = normalizePatternSignal(record.signal);
      const cacheKey = `${record.kind}:${normalizedSignal}`;

      if (!normalizedSignal || seenKeys.has(cacheKey)) {
        return null;
      }

      seenKeys.add(cacheKey);

      const matches =
        matchesCache.get(cacheKey) ??
        getPatternDreamMatches(dreams, record.signal, record.kind);
      matchesCache.set(cacheKey, matches);

      if (!matches.length) {
        return null;
      }

      return {
        signal: record.signal,
        kind: record.kind,
        kindLabel: getPatternKindLabel(record.kind, statsCopy),
        matchesLabel: getMatchesLabel(matches.length, statsCopy),
      };
    })
    .filter((item): item is SavedDreamThreadShelfItem => Boolean(item));
}
