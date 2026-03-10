import {
  getDreamCopy,
  getDreamMoodLabels,
} from '../../../constants/copy/dreams';
import { Theme } from '../../../theme/theme';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import type { DreamTranscriptionProgress } from '../services/dreamTranscriptionService';
import type { Dream } from './dream';
import { countDreamWords } from './dreamAnalytics';
import { getRelatedSignalSummaries, type RelatedDream } from './relatedDreams';

export type DreamDetailCopy = ReturnType<typeof getDreamCopy>;
export type DreamMoodLabels = ReturnType<typeof getDreamMoodLabels>;

export type DreamDetailSectionsState = {
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
  analysisProviderLabel: string;
  analysisStatusLabel: string;
  analysisStateText: string;
  tagCountLabel?: string;
  notesMetaLabel?: string;
  transcriptMetaLabel?: string;
  relatedMetaLabel?: string;
  analysisMetaLabel?: string;
  stateMetaLabel?: string;
  glanceCards: DreamDetailGlanceCard[];
};

export function moodColor(theme: Theme, mood?: Dream['mood']) {
  if (mood === 'positive') {
    return theme.colors.accent;
  }

  if (mood === 'negative') {
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
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
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

  return String(count);
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

export function getDreamDetailViewModel({
  dream,
  copy,
  moodLabels,
  analysisSettings,
  relatedDreams,
  isTranscribingAudio,
}: {
  dream: Dream;
  copy: DreamDetailCopy;
  moodLabels: DreamMoodLabels;
  analysisSettings: DreamAnalysisSettings;
  relatedDreams: RelatedDream[];
  isTranscribingAudio: boolean;
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
    analysisProviderLabel,
    analysisStatusLabel,
    analysisStateText,
    tagCountLabel,
    notesMetaLabel,
    transcriptMetaLabel,
    relatedMetaLabel,
    analysisMetaLabel,
    stateMetaLabel,
    glanceCards,
  };
}
