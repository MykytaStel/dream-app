import type { Dream } from '../dream';
import { countDreamWords } from '../dreamAnalytics';
import { truncateChars } from '../../../../utils/text';
import { type RelatedDream } from '../relatedDreams';
import {
  getDreamResurfacingMatch,
  type DreamResurfacingWindow,
} from '../resurfacingCue';
import type { DreamDetailCopy, DreamDetailReflectionPrompt } from './types';

function truncateReflectionSummary(summary: string) {
  const normalized = summary.trim().replace(/\s+/g, ' ');
  return truncateChars(normalized, 110, '...');
}

function getDetailResurfacingWindowLabel(
  window: DreamResurfacingWindow,
  copy: DreamDetailCopy,
) {
  switch (window) {
    case 'week':
      return copy.homeSpotlightRevisitTimeWeek;
    case 'month':
      return copy.homeSpotlightRevisitTimeMonth;
    case 'quarter':
      return copy.homeSpotlightRevisitTimeQuarter;
    case 'half-year':
      return copy.homeSpotlightRevisitTimeHalfYear;
    case 'year':
      return copy.homeSpotlightRevisitTimeYear;
  }
}

export function getDreamDetailFollowUpPrompt({
  dream,
  copy,
  now = Date.now(),
}: {
  dream: Dream;
  copy: DreamDetailCopy;
  now?: number;
}): DreamDetailReflectionPrompt | null {
  const wordCount = countDreamWords(dream.text);
  const hasTranscript = Boolean(dream.transcript?.trim());
  const transcriptPending = dream.transcriptStatus === 'processing';

  if (dream.audioUri && !hasTranscript && !transcriptPending) {
    return {
      key: 'follow-up-transcript',
      icon: 'document-text-outline',
      title: copy.postSaveFollowUpTranscriptTitle,
      body: copy.postSaveFollowUpTranscriptDescription,
      actionLabel:
        dream.transcriptStatus === 'error'
          ? copy.detailTranscribeRetry
          : copy.detailTranscribeAudio,
      actionKind: 'transcript',
    };
  }

  if (dream.audioUri && hasTranscript && dream.transcriptSource !== 'edited') {
    return {
      key: 'follow-up-transcript-edit',
      icon: 'create-outline',
      title: copy.detailReflectionTranscriptTitle,
      body: copy.detailReflectionTranscriptBody,
      actionLabel: copy.detailGeneratedTranscriptEdit,
      actionKind: 'transcript',
    };
  }

  if (!hasTranscript && wordCount > 0 && wordCount < 40) {
    return {
      key: 'follow-up-refine',
      icon: 'create-outline',
      title: copy.postSaveFollowUpRefineTitle,
      body: copy.postSaveFollowUpRefineDescription,
      actionLabel: copy.postSaveFollowUpRefineAction,
      actionKind: 'edit',
    };
  }

  const resurfacingMatch = getDreamResurfacingMatch(dream, now);
  if (resurfacingMatch && (dream.text?.trim() || dream.transcript?.trim())) {
    return {
      key: 'follow-up-resurfacing',
      icon: 'time-outline',
      title: copy.detailReflectionResurfaceTitle,
      body: `${copy.detailReflectionResurfacePrefix}${getDetailResurfacingWindowLabel(
        resurfacingMatch.window,
        copy,
      )}${copy.detailReflectionResurfaceSuffix}`,
      actionLabel: copy.detailReflectionActionEdit,
      actionKind: 'edit',
    };
  }

  return null;
}

export function getDreamDetailReflectionPrompts({
  dream,
  copy,
  moodLabel,
  strongestSignal,
  relatedDreams,
  includeCaptureFallback = true,
}: {
  dream: Dream;
  copy: DreamDetailCopy;
  moodLabel?: string;
  strongestSignal: string | null;
  relatedDreams: RelatedDream[];
  includeCaptureFallback?: boolean;
}): DreamDetailReflectionPrompt[] {
  const prompts: DreamDetailReflectionPrompt[] = [];

  if (strongestSignal) {
    prompts.push({
      key: 'signal',
      icon: 'flash-outline',
      title: copy.detailReflectionSignalTitle,
      body: `${copy.detailReflectionSignalPrefix}${strongestSignal}${copy.detailReflectionSignalSuffix}`,
      actionLabel: copy.detailReflectionActionEdit,
      actionKind: 'edit',
    });
  }

  if (moodLabel) {
    prompts.push({
      key: 'emotion',
      icon: 'heart-outline',
      title: copy.detailReflectionEmotionTitle,
      body: `${copy.detailReflectionEmotionWithMoodPrefix}${moodLabel}${copy.detailReflectionEmotionWithMoodSuffix}`,
      actionLabel: copy.detailReflectionActionEdit,
      actionKind: 'edit',
    });
  } else if (
    dream.wakeEmotions?.length ||
    dream.sleepContext?.preSleepEmotions?.length
  ) {
    prompts.push({
      key: 'emotion',
      icon: 'heart-outline',
      title: copy.detailReflectionEmotionTitle,
      body: copy.detailReflectionEmotionBody,
      actionLabel: copy.detailReflectionActionEdit,
      actionKind: 'edit',
    });
  }

  if (relatedDreams.length) {
    prompts.push({
      key: 'thread',
      icon: 'git-compare-outline',
      title: copy.detailReflectionThreadTitle,
      body: `${copy.detailReflectionThreadPrefix}${relatedDreams.length} ${
        relatedDreams.length === 1
          ? copy.detailRelatedMatchSingular
          : copy.detailRelatedMatchPlural
      }${copy.detailReflectionThreadSuffix}`,
      actionLabel: copy.detailReflectionActionRelated,
      actionKind: 'related',
    });
  }

  if (dream.analysis?.summary?.trim()) {
    prompts.push({
      key: 'analysis',
      icon: 'sparkles-outline',
      title: copy.detailReflectionAnalysisTitle,
      body: `${copy.detailReflectionAnalysisPrefix}${truncateReflectionSummary(
        dream.analysis.summary,
      )}${copy.detailReflectionAnalysisSuffix}`,
      actionLabel: copy.detailReflectionActionAnalysis,
      actionKind: 'analysis',
    });
  }

  if (
    includeCaptureFallback &&
    prompts.length < 3 &&
    (dream.audioUri || countDreamWords(dream.text) < 40)
  ) {
    prompts.push({
      key: 'capture',
      icon: 'create-outline',
      title: copy.detailReflectionCaptureTitle,
      body: copy.detailReflectionCaptureBody,
      actionLabel: copy.detailReflectionActionEdit,
      actionKind: 'edit',
    });
  }

  if (!prompts.length) {
    prompts.push({
      key: 'fallback',
      icon: 'bookmark-outline',
      title: copy.detailReflectionFallbackTitle,
      body: copy.detailReflectionFallbackBody,
      actionLabel: copy.detailReflectionActionEdit,
      actionKind: 'edit',
    });
  }

  return prompts.slice(0, 3);
}
