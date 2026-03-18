import { getStatsCopy } from '../../../constants/copy/stats';
import { type AppLocale } from '../../../i18n/types';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import type { Dream } from '../../dreams/model/dream';
import { getMonthlyReportData } from './monthlyReport';
import { getPatternDreamMatches } from './patternMatches';
import {
  countDreamWords,
  getDreamDate,
} from '../../dreams/model/dreamAnalytics';
import {
  getDreamResurfacingMatch,
  type DreamResurfacingWindow,
} from '../../dreams/model/resurfacingCue';
import type { DreamDetailFocusSection, PatternDetailKind } from '../../../app/navigation/routes';
import type { DreamAchievementId } from './achievements';
import type { DreamReflectionSignal, DreamWordSignal } from './dreamReflection';
import type { PatternGroupCardItem } from '../components/PatternGroupCard';

export type InsightRange = 'all' | '30d' | '7d';
export type PatternGroupKey = 'themes' | 'words' | 'symbols';
export type MemoryNudge = {
  dreamId: string;
  dreamTitle: string;
  reason: string;
  badgeLabel: string;
  actionLabel: string;
  focusSection: DreamDetailFocusSection;
  icon: string;
};

export type MemoryWorkQueueItem = {
  dreamId: string;
  dreamTitle: string;
  reason: string;
  badgeLabel: string;
  actionLabel: string;
  focusSection: DreamDetailFocusSection;
  icon: string;
};

export type MemorySavedMonthReviewItem = {
  monthKey: string;
  title: string;
  summary: string;
  meta: string;
  signals: string[];
};

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
    case 'seven-day-streak':
      return {
        title: copy.streakMilestoneSevenDaysTitle,
        description: copy.streakMilestoneSevenDaysSubtitle,
      };
    case 'thirty-day-streak':
      return {
        title: copy.streakMilestoneThirtyDaysTitle,
        description: copy.streakMilestoneThirtyDaysSubtitle,
      };
    case 'ten-dreams':
      return {
        title: copy.milestoneTenDreamsTitle,
        description: copy.milestoneTenDreamsDescription,
      };
    case 'fifty-dreams':
      return {
        title: copy.milestoneFiftyDreamsTitle,
        description: copy.milestoneFiftyDreamsDescription,
      };
    case 'hundred-dreams':
      return {
        title: copy.milestoneHundredDreamsTitle,
        description: copy.milestoneHundredDreamsDescription,
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

function getDreamTitle(dream: Dream) {
  return dream.title?.trim() || 'Untitled';
}

function hasAnalysisContext(dream: Dream) {
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

function getAnalysisMaterialScore(dream: Dream) {
  const textWords = countDreamWords(dream.text);
  const transcriptWords = countDreamWords(dream.transcript);
  const tagScore = dream.tags.length * 8;
  const contextScore = hasAnalysisContext(dream) ? 12 : 0;
  const moodScore = dream.mood ? 6 : 0;

  return textWords + transcriptWords + tagScore + contextScore + moodScore;
}

function getResurfacingWindowLabel(
  window: DreamResurfacingWindow,
  copy: StatsCopy,
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

export function getMemoryNudge(
  dreams: Dream[],
  copy: StatsCopy,
  recurringThemes: DreamReflectionSignal[],
  recurringWords: DreamWordSignal[],
  recurringSymbols: DreamReflectionSignal[],
  now = Date.now(),
): MemoryNudge | null {
  const topTheme = recurringThemes[0];
  if (topTheme) {
    const match = getPatternDreamMatches(dreams, topTheme.label, 'theme')[0];
    if (match) {
      return {
        dreamId: match.dream.id,
        dreamTitle: getDreamTitle(match.dream),
        reason: `${copy.memoryNudgeThemeReasonPrefix}${topTheme.label}${copy.memoryNudgeThemeReasonSuffix}`,
        badgeLabel: copy.memoryNudgeThemeBadge,
        actionLabel: copy.memoryNudgeActionReflection,
        focusSection: 'reflection',
        icon: 'sparkles-outline',
      };
    }
  }

  const topWord = recurringWords[0];
  if (topWord) {
    const match = getPatternDreamMatches(dreams, topWord.label, 'word')[0];
    if (match) {
      return {
        dreamId: match.dream.id,
        dreamTitle: getDreamTitle(match.dream),
        reason: `${copy.memoryNudgeWordReasonPrefix}${topWord.label}${copy.memoryNudgeWordReasonSuffix}`,
        badgeLabel: copy.memoryNudgeWordBadge,
        actionLabel: copy.memoryNudgeActionReflection,
        focusSection: 'reflection',
        icon: 'git-compare-outline',
      };
    }
  }

  const topSymbol = recurringSymbols[0];
  if (topSymbol) {
    const match = getPatternDreamMatches(dreams, topSymbol.label, 'symbol')[0];
    if (match) {
      return {
        dreamId: match.dream.id,
        dreamTitle: getDreamTitle(match.dream),
        reason: `${copy.memoryNudgeSymbolReasonPrefix}${topSymbol.label}${copy.memoryNudgeSymbolReasonSuffix}`,
        badgeLabel: copy.memoryNudgeSymbolBadge,
        actionLabel: copy.memoryNudgeActionReflection,
        focusSection: 'reflection',
        icon: 'shapes-outline',
      };
    }
  }

  const resurfacingCandidate = dreams
    .map(dream => ({
      dream,
      match: getDreamResurfacingMatch(dream, now),
    }))
    .filter(
      (candidate): candidate is { dream: Dream; match: NonNullable<ReturnType<typeof getDreamResurfacingMatch>> } =>
        candidate.match !== null,
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
  if (resurfacingCandidate) {
    return {
      dreamId: resurfacingCandidate.dream.id,
      dreamTitle: getDreamTitle(resurfacingCandidate.dream),
      reason: `${copy.memoryNudgeTimeReasonPrefix}${getResurfacingWindowLabel(
        resurfacingCandidate.match.window,
        copy,
      )}${copy.memoryNudgeTimeReasonSuffix}`,
      badgeLabel: copy.memoryNudgeTimeBadge,
      actionLabel: copy.memoryNudgeActionTime,
      focusSection: 'written',
      icon: 'time-outline',
    };
  }

  const transcriptCandidate = dreams
    .filter(dream => dream.audioUri && !dream.transcript?.trim() && !dream.text?.trim())
    .sort((left, right) => right.createdAt - left.createdAt)[0];
  if (transcriptCandidate) {
    return {
      dreamId: transcriptCandidate.id,
      dreamTitle: getDreamTitle(transcriptCandidate),
      reason: copy.memoryNudgeTranscriptReason,
      badgeLabel: copy.memoryNudgeTranscriptBadge,
      actionLabel: copy.memoryNudgeActionTranscript,
      focusSection: 'transcript',
      icon: 'document-text-outline',
    };
  }

  return null;
}

export function getMemoryWorkQueue(
  dreams: Dream[],
  copy: StatsCopy,
  analysisSettings: DreamAnalysisSettings,
): MemoryWorkQueueItem[] {
  const queue: MemoryWorkQueueItem[] = [];
  const usedDreamIds = new Set<string>();

  const push = (item: MemoryWorkQueueItem | null) => {
    if (!item || usedDreamIds.has(item.dreamId)) {
      return;
    }

    usedDreamIds.add(item.dreamId);
    queue.push(item);
  };

  const transcriptGenerateCandidate = dreams
    .filter(dream => dream.audioUri && !dream.transcript?.trim() && dream.transcriptStatus !== 'processing')
    .sort((left, right) => {
      const rightUpdatedAt = right.transcriptUpdatedAt ?? right.updatedAt ?? right.createdAt;
      const leftUpdatedAt = left.transcriptUpdatedAt ?? left.updatedAt ?? left.createdAt;
      return rightUpdatedAt - leftUpdatedAt;
    })[0];
  push(
    transcriptGenerateCandidate
      ? {
          dreamId: transcriptGenerateCandidate.id,
          dreamTitle: getDreamTitle(transcriptGenerateCandidate),
          reason:
            transcriptGenerateCandidate.transcriptStatus === 'error'
              ? copy.workQueueTranscriptRetryReason
              : copy.workQueueTranscriptGenerateReason,
          badgeLabel: copy.memoryNudgeTranscriptBadge,
          actionLabel:
            transcriptGenerateCandidate.transcriptStatus === 'error'
              ? copy.workQueueTranscriptActionRetry
              : copy.workQueueTranscriptActionGenerate,
          focusSection: 'transcript',
          icon: 'document-text-outline',
        }
      : null,
  );

  const transcriptEditCandidate = dreams
    .filter(dream => dream.audioUri && dream.transcript?.trim() && dream.transcriptSource !== 'edited')
    .sort((left, right) => {
      const rightUpdatedAt = right.transcriptUpdatedAt ?? right.updatedAt ?? right.createdAt;
      const leftUpdatedAt = left.transcriptUpdatedAt ?? left.updatedAt ?? left.createdAt;
      return rightUpdatedAt - leftUpdatedAt;
    })[0];
  push(
    transcriptEditCandidate
      ? {
          dreamId: transcriptEditCandidate.id,
          dreamTitle: getDreamTitle(transcriptEditCandidate),
          reason: copy.workQueueTranscriptEditReason,
          badgeLabel: copy.memoryNudgeTranscriptBadge,
          actionLabel: copy.workQueueTranscriptActionEdit,
          focusSection: 'transcript',
          icon: 'create-outline',
        }
      : null,
  );

  if (analysisSettings.enabled && analysisSettings.provider === 'manual') {
    const analysisCandidate = dreams
      .filter(dream => {
        if (dream.analysis?.status === 'ready') {
          return false;
        }

        if (dream.audioUri && !dream.transcript?.trim()) {
          return false;
        }

        return getAnalysisMaterialScore(dream) >= 20;
      })
      .sort((left, right) => {
        const leftStatusScore = left.analysis?.status === 'error' ? 1 : 0;
        const rightStatusScore = right.analysis?.status === 'error' ? 1 : 0;
        if (rightStatusScore !== leftStatusScore) {
          return rightStatusScore - leftStatusScore;
        }

        const scoreDiff = getAnalysisMaterialScore(right) - getAnalysisMaterialScore(left);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        const rightUpdatedAt =
          right.analysis?.generatedAt ?? right.updatedAt ?? right.transcriptUpdatedAt ?? right.createdAt;
        const leftUpdatedAt =
          left.analysis?.generatedAt ?? left.updatedAt ?? left.transcriptUpdatedAt ?? left.createdAt;
        return rightUpdatedAt - leftUpdatedAt;
      })[0];

    push(
      analysisCandidate
        ? {
            dreamId: analysisCandidate.id,
            dreamTitle: getDreamTitle(analysisCandidate),
            reason:
              analysisCandidate.analysis?.status === 'error'
                ? copy.workQueueAnalysisRetryReason
                : copy.workQueueAnalysisReason,
            badgeLabel: copy.workQueueAnalysisBadge,
            actionLabel:
              analysisCandidate.analysis?.status === 'error'
                ? copy.workQueueAnalysisActionRetry
                : copy.workQueueAnalysisActionGenerate,
            focusSection: 'analysis',
            icon: 'sparkles-outline',
          }
        : null,
    );
  }

  return queue;
}

export function buildSavedMonthlyReviewItems(input: {
  savedMonthKeys: string[];
  dreams: Dream[];
  locale: AppLocale;
  copy: Pick<StatsCopy, 'monthlyReportNoSignal' | 'monthlyReportWordsLabel'>;
  wakeEmotionLabels: Record<string, string>;
}): MemorySavedMonthReviewItem[] {
  const { savedMonthKeys, dreams, locale, copy, wakeEmotionLabels } = input;

  return savedMonthKeys
    .map(monthKey => {
      const report = getMonthlyReportData(dreams, monthKey);
      if (!report || !report.entryCount) {
        return null;
      }

      const signals = [
        report.topTheme?.label,
        report.topSymbol?.label,
        report.topWakeEmotion ? wakeEmotionLabels[report.topWakeEmotion.emotion] : null,
      ].filter((value): value is string => Boolean(value));

      return {
        monthKey,
        title: formatMonthTitle(report.month.year, report.month.month, locale),
        summary: signals[0] ?? copy.monthlyReportNoSignal,
        meta: `${formatEntryCountLabel(report.entryCount, locale)} · ${report.totalWords} ${copy.monthlyReportWordsLabel.toLowerCase()}`,
        signals,
      };
    })
    .filter((item): item is MemorySavedMonthReviewItem => Boolean(item));
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
    signalKind: 'word',
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
    signalKind: kind,
    onPress: () => onOpenPatternDetail(signal.label, kind),
  }));
}
