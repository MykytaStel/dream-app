import {
  getDreamCopy,
  getDreamMoodLabels,
} from '../../../constants/copy/dreams';
import { getMoodValence } from './dreamAnalytics';
import { Theme } from '../../../theme/theme';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import type { DreamTranscriptionProgress } from '../services/dreamTranscriptionService';
import type { Dream } from './dream';
import { countDreamWords } from './dreamAnalytics';
import { getRelatedSignalSummaries, type RelatedDream } from './relatedDreams';
import {
  getDreamResurfacingMatch,
  type DreamResurfacingWindow,
} from './resurfacingCue';

export type DreamDetailCopy = ReturnType<typeof getDreamCopy>;
export type DreamMoodLabels = ReturnType<typeof getDreamMoodLabels>;

export type DreamDetailSectionsState = {
  reflection: boolean;
  written: boolean;
  emotions: boolean;
  transcript: boolean;
  tags: boolean;
  related: boolean;
  analysis: boolean;
  context: boolean;
  audio: boolean;
};

export type DreamDetailGlanceCard = {
  key: string;
  icon: string;
  label: string;
  value: string;
};

export type DreamDetailReflectionPrompt = {
  key: string;
  icon: string;
  title: string;
  body: string;
  actionLabel: string;
  actionKind: 'edit' | 'related' | 'analysis' | 'transcript';
};

export type DreamDetailViewModel = {
  archived: boolean;
  starred: boolean;
  relatedCount: number;
  moodLabel?: string;
  heroSubtitle: string;
  heroPreview: string | null;
  strongestSignal: string | null;
  hasContext: boolean;
  hasEmotions: boolean;
  hasTranscriptSurface: boolean;
  transcriptStatus: Dream['transcriptStatus'] | 'idle';
  transcriptSourceLabel: string;
  transcriptSyncHint: string | null;
  audioSyncHint: string | null;
  analysisProviderLabel: string;
  analysisStatusLabel: string;
  analysisStateText: string;
  tagCountLabel?: string;
  notesMetaLabel?: string;
  transcriptMetaLabel?: string;
  relatedMetaLabel?: string;
  analysisMetaLabel?: string;
  stateMetaLabel?: string;
  followUpPrompt: DreamDetailReflectionPrompt | null;
  reflectionPrompts: DreamDetailReflectionPrompt[];
  glanceCards: DreamDetailGlanceCard[];
};

export function moodColor(theme: Theme, mood?: Dream['mood']) {
  if (!mood) {
    return theme.colors.primary;
  }

  const valence = getMoodValence(mood);
  if (valence === 'positive') {
    return theme.colors.accent;
  }

  if (valence === 'negative') {
    return theme.colors.primaryAlt;
  }

  return theme.colors.primary;
}

export function formatMetaDate(value: number | string) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMetaTimestamp(value: number) {
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMetaTime(value: number) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function hasSleepContext(dream: Dream) {
  const context = dream.sleepContext;
  if (!context) {
    return false;
  }

  return (
    typeof context.stressLevel === 'number' ||
    typeof context.alcoholTaken === 'boolean' ||
    typeof context.caffeineLate === 'boolean' ||
    Boolean(context.medications) ||
    Boolean(context.importantEvents) ||
    Boolean(context.healthNotes)
  );
}

export function hasEmotionSnapshot(dream: Dream) {
  return Boolean(dream.wakeEmotions?.length || dream.sleepContext?.preSleepEmotions?.length);
}

export function createEmptyDetailSectionsState(): DreamDetailSectionsState {
  return {
    reflection: false,
    written: false,
    emotions: false,
    transcript: false,
    tags: false,
    related: false,
    analysis: false,
    context: false,
    audio: false,
  };
}

export function createDefaultExpandedSections(dream: Dream): DreamDetailSectionsState {
  const hasRawText = Boolean(dream.text?.trim());
  const hasTranscriptSurface = Boolean(
    dream.audioUri || dream.transcript || dream.transcriptStatus === 'error',
  );
  const hasTranscriptContent = Boolean(
    dream.transcript ||
      dream.transcriptStatus === 'processing' ||
      dream.transcriptStatus === 'error',
  );

  return {
    reflection: true,
    written: true,
    emotions: false,
    transcript: hasTranscriptSurface && hasTranscriptContent && !hasRawText,
    tags: false,
    related: false,
    analysis: false,
    context: false,
    audio: Boolean(dream.audioUri && !hasRawText && !hasTranscriptContent),
  };
}

export function getHeroPreview(dream: Dream, copy: DreamDetailCopy) {
  const text = dream.text?.trim();
  if (text) {
    if (text.length < 18 || !/\s/.test(text)) {
      return null;
    }

    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    if (transcript.length < 18 || !/\s/.test(transcript)) {
      return null;
    }

    const visible = transcript.length > 136 ? `${transcript.slice(0, 133)}...` : transcript;
    return `${copy.transcriptPreviewPrefix}: ${visible}`;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return null;
}

export function getCaptureModeLabel(dream: Dream, copy: DreamDetailCopy) {
  if (dream.audioUri && dream.text?.trim()) {
    return copy.detailCaptureModeMixed;
  }

  if (dream.audioUri) {
    return copy.detailCaptureModeVoice;
  }

  return copy.detailCaptureModeText;
}

export function getTranscriptSummaryLabel(
  dream: Dream,
  isTranscribingAudio: boolean,
  copy: DreamDetailCopy,
) {
  if (isTranscribingAudio || dream.transcriptStatus === 'processing') {
    return copy.detailTranscriptSummaryProcessing;
  }

  if (dream.transcriptStatus === 'error') {
    return copy.detailTranscriptSummaryError;
  }

  if (dream.transcriptSource === 'edited') {
    return copy.detailTranscriptSummaryEdited;
  }

  if (dream.transcript) {
    return copy.detailTranscriptSummaryReady;
  }

  return copy.detailTranscriptSummaryIdle;
}

export function getAnalysisSummaryLabel(
  dream: Dream,
  analysisSettings: DreamAnalysisSettings,
  copy: DreamDetailCopy,
) {
  if (!analysisSettings.enabled) {
    return copy.detailAnalysisSummaryDisabled;
  }

  if (analysisSettings.provider === 'openai' && !dream.analysis) {
    return copy.detailAnalysisSummaryPlanned;
  }

  if (dream.analysis?.status === 'ready') {
    return copy.detailAnalysisSummaryReady;
  }

  if (dream.analysis?.status === 'error') {
    return copy.detailAnalysisStatusError;
  }

  return copy.detailAnalysisSummaryIdle;
}

export function getRelatedMatchesLabel(count: number, copy: DreamDetailCopy) {
  if (!count) {
    return copy.detailRelatedSummaryEmpty;
  }

  return count === 1 ? '1' : String(count);
}

export function countSleepSignals(dream: Dream) {
  let count = 0;

  count += dream.wakeEmotions?.length ?? 0;
  count += dream.sleepContext?.preSleepEmotions?.length ?? 0;

  if (typeof dream.sleepContext?.stressLevel === 'number') {
    count += 1;
  }

  if (typeof dream.sleepContext?.alcoholTaken === 'boolean') {
    count += 1;
  }

  if (typeof dream.sleepContext?.caffeineLate === 'boolean') {
    count += 1;
  }

  if (dream.sleepContext?.medications) {
    count += 1;
  }

  if (dream.sleepContext?.importantEvents) {
    count += 1;
  }

  if (dream.sleepContext?.healthNotes) {
    count += 1;
  }

  return count;
}

export function formatTranscriptionProgress(
  progress: DreamTranscriptionProgress | null,
  copy: DreamDetailCopy,
) {
  if (!progress) {
    return null;
  }

  const baseLabel =
    progress.phase === 'preparing-model'
      ? copy.detailTranscribePreparingModel
      : copy.detailTranscribeInProgress;

  if (typeof progress.progress !== 'number') {
    return baseLabel;
  }

  return `${baseLabel} ${progress.progress}%`;
}

function getTranscriptSyncHint(dream: Dream, copy: DreamDetailCopy) {
  if (!dream.transcript?.trim()) {
    return null;
  }

  const transcriptTimestamp =
    dream.transcriptUpdatedAt ?? dream.updatedAt ?? dream.createdAt;
  const lastSyncedAt = dream.lastSyncedAt ?? 0;
  const newerThanCloud = transcriptTimestamp > lastSyncedAt;

  if (dream.syncStatus === 'error' && newerThanCloud) {
    return copy.detailTranscriptSyncError;
  }

  if (dream.syncStatus === 'syncing' && newerThanCloud) {
    return copy.detailTranscriptSyncing;
  }

  if (dream.syncStatus !== 'synced' || newerThanCloud) {
    return copy.detailTranscriptSyncLocal;
  }

  return null;
}

function getAudioSyncHint(dream: Dream, copy: DreamDetailCopy) {
  if (!dream.audioUri?.trim() || dream.audioRemotePath?.trim()) {
    return null;
  }

  if (dream.syncStatus === 'error') {
    return copy.detailAudioSyncError;
  }

  if (dream.syncStatus === 'syncing') {
    return copy.detailAudioSyncing;
  }

  return copy.detailAudioSyncLocal;
}

function truncateReflectionSummary(summary: string) {
  const normalized = summary.trim().replace(/\s+/g, ' ');
  if (normalized.length <= 110) {
    return normalized;
  }

  return `${normalized.slice(0, 107)}...`;
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
  } else if (dream.wakeEmotions?.length || dream.sleepContext?.preSleepEmotions?.length) {
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

export function getDreamDetailViewModel({
  dream,
  copy,
  moodLabels,
  analysisSettings,
  relatedDreams,
  isTranscribingAudio,
  now,
}: {
  dream: Dream;
  copy: DreamDetailCopy;
  moodLabels: DreamMoodLabels;
  analysisSettings: DreamAnalysisSettings;
  relatedDreams: RelatedDream[];
  isTranscribingAudio: boolean;
  now?: number;
}): DreamDetailViewModel {
  const archived = typeof dream.archivedAt === 'number';
  const starred = typeof dream.starredAt === 'number';
  const moodLabel = dream.mood ? moodLabels[dream.mood] : undefined;
  const hasContext = hasSleepContext(dream);
  const hasEmotions = hasEmotionSnapshot(dream);
  const transcriptStatus = dream.transcriptStatus ?? (dream.transcript ? 'ready' : 'idle');
  const transcriptSourceLabel =
    dream.transcriptSource === 'edited'
      ? copy.detailGeneratedTranscriptSourceEdited
      : copy.detailGeneratedTranscriptSourceGenerated;
  const analysisProviderLabel =
    dream.analysis?.provider === 'openai'
      ? copy.detailAnalysisProviderOpenAi
      : copy.detailAnalysisProviderManual;
  const transcriptSyncHint = getTranscriptSyncHint(dream, copy);
  const audioSyncHint = getAudioSyncHint(dream, copy);
  const analysisStatusLabel =
    dream.analysis?.status === 'ready'
      ? copy.detailAnalysisStatusReady
      : dream.analysis?.status === 'error'
        ? copy.detailAnalysisStatusError
        : copy.detailAnalysisStatusIdle;
  const analysisStateText = !analysisSettings.enabled
    ? copy.detailAnalysisStateDisabled
    : analysisSettings.provider === 'openai'
      ? copy.detailAnalysisStateOpenAiPlanned
      : dream.analysis?.status === 'ready'
        ? copy.detailAnalysisStateLocalReady
        : copy.detailAnalysisStateManual;
  const strongestSignal =
    getRelatedSignalSummaries(relatedDreams, 1)[0]?.label ??
    dream.tags[0] ??
    dream.wakeEmotions?.[0] ??
    null;
  const heroPreview = getHeroPreview(dream, copy);
  const heroSubtitle = `${dream.sleepDate ? formatMetaDate(dream.sleepDate) : formatMetaDate(dream.createdAt)} · ${formatMetaTime(dream.createdAt)}`;
  const hasTranscriptSurface = Boolean(
    dream.audioUri || dream.transcript || transcriptStatus === 'error',
  );
  const stateSignalsCount = countSleepSignals(dream);
  const wordsCount = countDreamWords(dream.text);
  const tagCountLabel = dream.tags.length ? String(dream.tags.length) : undefined;
  const notesMetaLabel = wordsCount ? String(wordsCount) : undefined;
  const transcriptMetaLabel = hasTranscriptSurface
    ? getTranscriptSummaryLabel(dream, isTranscribingAudio, copy)
    : undefined;
  const relatedMetaLabel = relatedDreams.length ? String(relatedDreams.length) : undefined;
  const analysisMetaLabel =
    dream.analysis?.status === 'ready'
      ? copy.detailAnalysisStatusReady
      : dream.analysis?.status === 'error'
        ? copy.detailAnalysisStatusError
        : !analysisSettings.enabled
          ? copy.detailAnalysisSummaryDisabled
          : analysisSettings.provider === 'openai'
            ? copy.detailAnalysisSummaryPlanned
            : undefined;
  const stateMetaLabel = stateSignalsCount ? String(stateSignalsCount) : undefined;
  const followUpPrompt = getDreamDetailFollowUpPrompt({
    dream,
    copy,
    now,
  });
  const reflectionPrompts = getDreamDetailReflectionPrompts({
    dream,
    copy,
    moodLabel,
    strongestSignal,
    relatedDreams,
    includeCaptureFallback: followUpPrompt?.key !== 'follow-up-refine',
  });

  const glanceCards: DreamDetailGlanceCard[] = [
    {
      key: 'capture',
      icon: dream.audioUri && dream.text?.trim()
        ? 'layers-outline'
        : dream.audioUri
          ? 'mic-outline'
          : 'document-text-outline',
      label: copy.detailGlanceCaptureLabel,
      value: getCaptureModeLabel(dream, copy),
    },
    {
      key: 'transcript',
      icon: dream.transcript ? 'chatbubble-ellipses-outline' : 'sparkles-outline',
      label: copy.detailGlanceTranscriptLabel,
      value: getTranscriptSummaryLabel(dream, isTranscribingAudio, copy),
    },
    {
      key: 'analysis',
      icon: 'sparkles-outline',
      label: copy.detailGlanceAnalysisLabel,
      value: getAnalysisSummaryLabel(dream, analysisSettings, copy),
    },
    {
      key: 'related',
      icon: 'git-compare-outline',
      label: copy.detailGlanceRelatedLabel,
      value: getRelatedMatchesLabel(relatedDreams.length, copy),
    },
  ];

  return {
    archived,
    starred,
    relatedCount: relatedDreams.length,
    moodLabel,
    heroSubtitle,
    heroPreview,
    strongestSignal,
    hasContext,
    hasEmotions,
    hasTranscriptSurface,
    transcriptStatus,
    transcriptSourceLabel,
    transcriptSyncHint,
    audioSyncHint,
    analysisProviderLabel,
    analysisStatusLabel,
    analysisStateText,
    tagCountLabel,
    notesMetaLabel,
    transcriptMetaLabel,
    relatedMetaLabel,
    analysisMetaLabel,
    stateMetaLabel,
    followUpPrompt,
    reflectionPrompts,
    glanceCards,
  };
}
