import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import type { PatternDetailKind } from '../../../app/navigation/routes';
import type { Mood } from '../../dreams/model/dream';
import { getDreamDate } from '../../dreams/model/dreamAnalytics';
import {
  getPatternDreamMatches,
  normalizePatternSignal,
  type PatternMatchKind,
  type PatternMatchSource,
  type PatternDreamMatch,
} from './patternMatches';
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
        matchesLabel: `${matches.length} ${
          matches.length === 1
            ? statsCopy.patternDetailMatchesSingle
            : statsCopy.patternDetailMatchesPlural
        }`,
      };
    })
    .filter((item): item is SavedDreamThreadShelfItem => Boolean(item));
}
