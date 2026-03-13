import type { PatternDetailKind } from '../../../app/navigation/routes';
import type { AppLocale } from '../../../i18n/types';
import type { Dream } from '../../dreams/model/dream';
import { buildSavedDreamThreadShelfItems } from './dreamThread';
import { normalizePatternSignal } from './patternMatches';
import { buildSavedMonthlyReviewItems } from './statsScreenModel';
import { getStatsCopy } from '../../../constants/copy/stats';
import type {
  SavedDreamThreadRecord,
  SavedMonthlyReportRecord,
} from '../services/reviewStateStorageService';

type StatsCopy = ReturnType<typeof getStatsCopy>;

export type ReviewWorkspaceSummaryTile = {
  label: string;
  value: number;
};

export type ReviewWorkspaceImportantDreamItem = {
  dreamId: string;
  title: string;
  meta: string;
};

export type ReviewWorkspaceSavedSetItem = {
  key: string;
  kind: 'month' | 'thread';
  title: string;
  meta: string;
  savedAt: number;
  monthKey?: string;
  signal?: string;
  patternKind?: PatternDetailKind;
  eyebrow: string;
};

export type ReviewWorkspaceViewModel = {
  hasItems: boolean;
  summaryTiles: ReviewWorkspaceSummaryTile[];
};

function formatDreamDate(dream: Dream, locale: AppLocale) {
  if (dream.sleepDate?.trim()) {
    const date = new Date(`${dream.sleepDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return dream.sleepDate;
  }

  return new Date(dream.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getImportantDreamTitle(
  dream: Dream,
  copy: Pick<StatsCopy, 'reviewWorkspaceDreamFallbackTitle'>,
) {
  const title = dream.title?.trim();
  if (title) {
    return title;
  }

  const preview = dream.text?.trim() || dream.transcript?.trim();
  if (preview) {
    return preview.length > 48 ? `${preview.slice(0, 45)}...` : preview;
  }

  return copy.reviewWorkspaceDreamFallbackTitle;
}

export function buildReviewWorkspaceImportantDreamItems(input: {
  dreams: Dream[];
  locale: AppLocale;
  copy: Pick<StatsCopy, 'reviewWorkspaceDreamFallbackTitle'>;
}): ReviewWorkspaceImportantDreamItem[] {
  const { dreams, locale, copy } = input;

  return dreams
    .filter((dream): dream is Dream & { starredAt: number } => typeof dream.starredAt === 'number')
    .sort((left, right) => right.starredAt - left.starredAt)
    .map(dream => ({
      dreamId: dream.id,
      title: getImportantDreamTitle(dream, copy),
      meta: formatDreamDate(dream, locale),
    }));
}

export function buildReviewWorkspaceSavedSetItems(input: {
  savedMonths: SavedMonthlyReportRecord[];
  savedThreads: SavedDreamThreadRecord[];
  dreams: Dream[];
  locale: AppLocale;
  copy: Pick<
    StatsCopy,
    | 'monthlyReportNoSignal'
    | 'monthlyReportWordsLabel'
    | 'patternDetailWordLabel'
    | 'patternDetailThemeLabel'
    | 'patternDetailSymbolLabel'
    | 'patternDetailMatchesSingle'
    | 'patternDetailMatchesPlural'
    | 'reviewShelfSavedMonthEyebrow'
    | 'reviewShelfSavedThreadEyebrow'
  >;
  wakeEmotionLabels: Record<string, string>;
}): ReviewWorkspaceSavedSetItem[] {
  const savedMonthItems = buildSavedMonthlyReviewItems({
    savedMonthKeys: input.savedMonths.map(item => item.monthKey),
    dreams: input.dreams,
    locale: input.locale,
    copy: input.copy,
    wakeEmotionLabels: input.wakeEmotionLabels,
  });
  const savedMonthItemsByKey = new Map(
    savedMonthItems.map(item => [item.monthKey, item] as const),
  );

  const savedThreadItems = buildSavedDreamThreadShelfItems({
    records: input.savedThreads,
    dreams: input.dreams,
    statsCopy: input.copy,
  });
  const savedThreadItemsByKey = new Map(
    savedThreadItems.map(item => [
      `${item.kind}:${normalizePatternSignal(item.signal)}`,
      item,
    ] as const),
  );

  const monthSetItems: ReviewWorkspaceSavedSetItem[] = [];
  input.savedMonths.forEach(record => {
    const item = savedMonthItemsByKey.get(record.monthKey);
    if (!item) {
      return;
    }

    monthSetItems.push({
      key: `month:${record.monthKey}`,
      kind: 'month',
      title: item.title,
      meta: `${item.summary} • ${item.meta}`,
      savedAt: record.savedAt,
      monthKey: record.monthKey,
      eyebrow: input.copy.reviewShelfSavedMonthEyebrow,
    });
  });

  const threadSetItems: ReviewWorkspaceSavedSetItem[] = [];
  input.savedThreads.forEach(record => {
    const item = savedThreadItemsByKey.get(
      `${record.kind}:${normalizePatternSignal(record.signal)}`,
    );
    if (!item) {
      return;
    }

    threadSetItems.push({
      key: `thread:${record.kind}:${normalizePatternSignal(record.signal)}`,
      kind: 'thread',
      title: item.signal,
      meta: `${item.kindLabel} • ${item.matchesLabel}`,
      savedAt: record.savedAt,
      signal: item.signal,
      patternKind: item.kind,
      eyebrow: input.copy.reviewShelfSavedThreadEyebrow,
    });
  });

  return [...monthSetItems, ...threadSetItems].sort(
    (left, right) => right.savedAt - left.savedAt,
  );
}

export function getReviewWorkspaceViewModel(input: {
  workQueueCount: number;
  importantDreamCount: number;
  savedSetCount: number;
  copy: Pick<
    StatsCopy,
    | 'reviewWorkspaceSummaryContinueLabel'
    | 'reviewWorkspaceSummaryImportantLabel'
    | 'reviewWorkspaceSummarySavedSetsLabel'
  >;
}): ReviewWorkspaceViewModel {
  const { workQueueCount, importantDreamCount, savedSetCount, copy } = input;

  return {
    hasItems: workQueueCount > 0 || importantDreamCount > 0 || savedSetCount > 0,
    summaryTiles: [
      {
        label: copy.reviewWorkspaceSummaryContinueLabel,
        value: workQueueCount,
      },
      {
        label: copy.reviewWorkspaceSummaryImportantLabel,
        value: importantDreamCount,
      },
      {
        label: copy.reviewWorkspaceSummarySavedSetsLabel,
        value: savedSetCount,
      },
    ],
  };
}
