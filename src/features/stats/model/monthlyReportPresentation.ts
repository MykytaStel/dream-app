import type { Dream } from '../../dreams/model/dream';
import {
  getDreamResurfacingMatch,
  type DreamResurfacingWindow,
} from '../../dreams/model/resurfacingCue';
import type { MonthlyReportData } from './monthlyReport';

export type MonthlyReportCopyShape = {
  monthlyReportBackButton: string;
  monthlyReportEyebrow: string;
  monthlyReportTitle: string;
  monthlyReportSubtitle: string;
  monthlyReportMonthStripLabel: string;
  monthlyReportSaveAction: string;
  monthlyReportSavedAction: string;
  monthlyReportShareAction: string;
  monthlyReportCoverTitle: string;
  monthlyReportHighlightsTitle: string;
  monthlyReportHighlightsDescription: string;
  monthlyReportSignalsTitle: string;
  monthlyReportSignalsDescription: string;
  monthlyReportGentleTitle: string;
  monthlyReportGentleDescription: string;
  monthlyReportVoiceLabel: string;
  monthlyReportTranscriptLabel: string;
  monthlyReportTagsLabel: string;
  monthlyReportContextLabel: string;
  averageWordsShort: string;
  voiceNotes: string;
  monthlyReportNoSignal: string;
  monthlyReportCoverEmpty: string;
  monthlyReportWordLabel: string;
  entries: string;
  monthlyReportShareTitle: string;
  monthlyReportEntriesLabel: string;
  monthlyReportWordsLabel: string;
  monthlyReportThemeLabel: string;
  monthlyReportSymbolLabel: string;
  monthlyReportWakeLabel: string;
  monthlyReportPreSleepLabel: string;
  monthlyReportRevisitTitle: string;
  monthlyReportRevisitDescription: string;
  memoryNudgeTimeReasonPrefix: string;
  memoryNudgeTimeReasonSuffix: string;
  memoryNudgeTimeBadge: string;
  memoryNudgeTimeWeek: string;
  memoryNudgeTimeMonth: string;
  memoryNudgeTimeQuarter: string;
  memoryNudgeTimeHalfYear: string;
  memoryNudgeTimeYear: string;
  memoryNudgeActionTime: string;
};

export type MonthlyReportSignalView = {
  label: string;
  value: string;
  meta: string;
};

export type MonthlyReportMetricView = {
  label: string;
  value: number;
  hint: string;
};

export type MonthlyReportCalmTileView = {
  label: string;
  value: number;
};

export type MonthlyReportRevisitCueView = {
  dreamId: string;
  dreamTitle: string;
  badgeLabel: string;
  reason: string;
  actionLabel: string;
};

export type MonthlyReportViewModel = {
  monthTitle: string;
  coverText: string;
  heroMetaChips: string[];
  isSavedForLater: boolean;
  metricTiles: MonthlyReportMetricView[];
  leadMetric: MonthlyReportMetricView;
  secondaryMetrics: MonthlyReportMetricView[];
  recurringSignals: MonthlyReportSignalView[];
  leadSignal: MonthlyReportSignalView;
  secondarySignals: MonthlyReportSignalView[];
  calmTiles: MonthlyReportCalmTileView[];
  revisitCue: MonthlyReportRevisitCueView | null;
};

export function formatMonthTitle(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

export function getMonthlyReportCoverSignals(input: {
  report: MonthlyReportData;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
}) {
  const { report, wakeEmotionLabels, preSleepEmotionLabels } = input;

  return [
    report.topTheme?.label,
    report.topSymbol?.label,
    report.topWakeEmotion ? wakeEmotionLabels[report.topWakeEmotion.emotion] : null,
    report.topPreSleepEmotion
      ? preSleepEmotionLabels[report.topPreSleepEmotion.emotion]
      : null,
  ].filter((value): value is string => Boolean(value));
}

export function buildMonthlyReportShareLines(input: {
  report: MonthlyReportData;
  monthTitle: string;
  coverText: string;
  copy: MonthlyReportCopyShape;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
}) {
  const { report, monthTitle, coverText, copy, wakeEmotionLabels, preSleepEmotionLabels } = input;

  return [
    `${copy.monthlyReportShareTitle} · ${monthTitle}`,
    coverText,
    `${copy.monthlyReportEntriesLabel}: ${report.entryCount}`,
    `${copy.monthlyReportWordsLabel}: ${report.totalWords}`,
    report.topTheme ? `${copy.monthlyReportThemeLabel}: ${report.topTheme.label}` : null,
    report.topSymbol ? `${copy.monthlyReportSymbolLabel}: ${report.topSymbol.label}` : null,
    report.topWakeEmotion
      ? `${copy.monthlyReportWakeLabel}: ${wakeEmotionLabels[report.topWakeEmotion.emotion]}`
      : null,
    report.topPreSleepEmotion
      ? `${copy.monthlyReportPreSleepLabel}: ${preSleepEmotionLabels[report.topPreSleepEmotion.emotion]}`
      : null,
  ].filter((value): value is string => Boolean(value));
}

function getMonthlyReportDreamTitle(dream: Dream, copy: MonthlyReportCopyShape) {
  const title = dream.title?.trim();
  if (title) {
    return title;
  }

  const firstLine = dream.text
    ?.split('\n')
    .map(line => line.trim())
    .find(Boolean);
  if (firstLine) {
    return firstLine.length <= 42 ? firstLine : `${firstLine.slice(0, 39)}...`;
  }

  return copy.monthlyReportTitle;
}

function getResurfacingWindowLabel(
  window: DreamResurfacingWindow,
  copy: MonthlyReportCopyShape,
) {
  switch (window) {
    case 'week':
      return copy.memoryNudgeTimeWeek;
    case 'month':
      return copy.memoryNudgeTimeMonth;
    case 'quarter':
      return copy.memoryNudgeTimeQuarter;
    case 'half-year':
      return copy.memoryNudgeTimeHalfYear;
    case 'year':
      return copy.memoryNudgeTimeYear;
  }
}

export function getMonthlyReportRevisitCue(
  report: MonthlyReportData,
  copy: MonthlyReportCopyShape,
  now = Date.now(),
): MonthlyReportRevisitCueView | null {
  const candidate = report.dreams
    .map(dream => ({
      dream,
      match: getDreamResurfacingMatch(dream, now),
    }))
    .filter(
      (
        value,
      ): value is {
        dream: Dream;
        match: NonNullable<ReturnType<typeof getDreamResurfacingMatch>>;
      } => value.match !== null,
    )
    .sort((left, right) => {
      if (right.match.score !== left.match.score) {
        return right.match.score - left.match.score;
      }

      if (left.match.distance !== right.match.distance) {
        return left.match.distance - right.match.distance;
      }

      return right.dream.createdAt - left.dream.createdAt;
    })[0];

  if (!candidate) {
    return null;
  }

  return {
    dreamId: candidate.dream.id,
    dreamTitle: getMonthlyReportDreamTitle(candidate.dream, copy),
    badgeLabel: copy.memoryNudgeTimeBadge,
    reason: `${copy.memoryNudgeTimeReasonPrefix}${getResurfacingWindowLabel(
      candidate.match.window,
      copy,
    )}${copy.memoryNudgeTimeReasonSuffix}`,
    actionLabel: copy.memoryNudgeActionTime,
  };
}

export function getMonthlyReportViewModel(input: {
  report: MonthlyReportData;
  locale: string;
  copy: MonthlyReportCopyShape;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
  isSavedForLater: boolean;
  now?: number;
}) : MonthlyReportViewModel {
  const {
    report,
    locale,
    copy,
    wakeEmotionLabels,
    preSleepEmotionLabels,
    isSavedForLater,
    now,
  } = input;
  const monthTitle = formatMonthTitle(report.month.year, report.month.month, locale);
  const coverSignals = getMonthlyReportCoverSignals({
    report,
    wakeEmotionLabels,
    preSleepEmotionLabels,
  });
  const coverText = coverSignals.length
    ? coverSignals.slice(0, 3).join(' • ')
    : copy.monthlyReportCoverEmpty;
  const heroMetaChips = [
    `${report.entryCount} ${copy.monthlyReportEntriesLabel.toLowerCase()}`,
    `${report.totalWords} ${copy.monthlyReportWordsLabel.toLowerCase()}`,
    `${report.voiceCount} ${copy.monthlyReportVoiceLabel.toLowerCase()}`,
  ];
  const metricTiles: MonthlyReportMetricView[] = [
    {
      label: copy.monthlyReportEntriesLabel,
      value: report.entryCount,
      hint: `${report.averageWords} ${copy.averageWordsShort.toLowerCase()}`,
    },
    {
      label: copy.monthlyReportWordsLabel,
      value: report.totalWords,
      hint: `${report.averageWords} ${copy.averageWordsShort.toLowerCase()}`,
    },
    {
      label: copy.monthlyReportVoiceLabel,
      value: report.voiceCount,
      hint: copy.voiceNotes,
    },
  ];
  const recurringSignals: MonthlyReportSignalView[] = [
    {
      label: copy.monthlyReportThemeLabel,
      value: report.topTheme?.label ?? copy.monthlyReportNoSignal,
      meta: report.topTheme
        ? `${report.topTheme.dreamCount} ${copy.entries.toLowerCase()}`
        : copy.monthlyReportCoverEmpty,
    },
    {
      label: copy.monthlyReportSymbolLabel,
      value: report.topSymbol?.label ?? copy.monthlyReportNoSignal,
      meta: report.topSymbol
        ? `${report.topSymbol.dreamCount} ${copy.entries.toLowerCase()}`
        : copy.monthlyReportCoverEmpty,
    },
    {
      label: copy.monthlyReportWakeLabel,
      value: report.topWakeEmotion
        ? wakeEmotionLabels[report.topWakeEmotion.emotion]
        : copy.monthlyReportNoSignal,
      meta: report.topWakeEmotion
        ? `${report.topWakeEmotion.count} ${copy.entries.toLowerCase()}`
        : copy.monthlyReportCoverEmpty,
    },
    {
      label: copy.monthlyReportPreSleepLabel,
      value: report.topPreSleepEmotion
        ? preSleepEmotionLabels[report.topPreSleepEmotion.emotion]
        : copy.monthlyReportNoSignal,
      meta: report.topPreSleepEmotion
        ? `${report.topPreSleepEmotion.count} ${copy.entries.toLowerCase()}`
        : copy.monthlyReportCoverEmpty,
    },
  ];
  const leadMetric = metricTiles[0];
  const secondaryMetrics = metricTiles.slice(1);
  const leadSignal =
    recurringSignals.find(signal => signal.value !== copy.monthlyReportNoSignal) ??
    recurringSignals[0];
  const secondarySignals = recurringSignals.filter(signal => signal.label !== leadSignal.label);
  const calmTiles: MonthlyReportCalmTileView[] = [
    {
      label: copy.monthlyReportTranscriptLabel,
      value: report.transcriptCount,
    },
    {
      label: copy.monthlyReportTagsLabel,
      value: report.taggedCount,
    },
    {
      label: copy.monthlyReportContextLabel,
      value: report.contextCount,
    },
  ];
  const revisitCue = getMonthlyReportRevisitCue(report, copy, now);

  return {
    monthTitle,
    coverText,
    heroMetaChips,
    isSavedForLater,
    metricTiles,
    leadMetric,
    secondaryMetrics,
    recurringSignals,
    leadSignal,
    secondarySignals,
    calmTiles,
    revisitCue,
  };
}
