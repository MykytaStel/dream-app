import type { DreamAnalysisSettings } from '../../../analysis/model/dreamAnalysis';
import type { Dream } from '../dream';
import { countDreamWords, getDreamLucidityLevel } from '../dreamAnalytics';
import { getRelatedSignalSummaries, type RelatedDream } from '../relatedDreams';
import { formatMetaDate, formatMetaTime } from './format';
import {
  countSleepSignals,
  getAnalysisSummaryLabel,
  getAudioSyncHint,
  getCaptureModeLabel,
  getHeroPreview,
  getLucidityLabel,
  getRelatedMatchesLabel,
  getTranscriptSummaryLabel,
  getTranscriptSyncHint,
  hasEmotionSnapshot,
  hasSleepContext,
} from './labels';
import {
  getDreamDetailFollowUpPrompt,
  getDreamDetailReflectionPrompts,
} from './prompts';
import type {
  DreamDetailCopy,
  DreamDetailGlanceCard,
  DreamDetailViewModel,
  DreamMoodLabels,
} from './types';

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
  const lucidityLevel = getDreamLucidityLevel(dream);
  const lucidityLabel =
    typeof lucidityLevel === 'number'
      ? getLucidityLabel(lucidityLevel, copy)
      : undefined;
  const hasContext = hasSleepContext(dream);
  const hasEmotions = hasEmotionSnapshot(dream);
  const transcriptStatus =
    dream.transcriptStatus ?? (dream.transcript ? 'ready' : 'idle');
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
  const tagCountLabel = dream.tags.length
    ? String(dream.tags.length)
    : undefined;
  const notesMetaLabel = wordsCount ? String(wordsCount) : undefined;
  const transcriptMetaLabel = hasTranscriptSurface
    ? getTranscriptSummaryLabel(dream, isTranscribingAudio, copy)
    : undefined;
  const relatedMetaLabel = relatedDreams.length
    ? String(relatedDreams.length)
    : undefined;
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
  const stateMetaLabel = stateSignalsCount
    ? String(stateSignalsCount)
    : undefined;
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
      icon:
        dream.audioUri && dream.text?.trim()
          ? 'layers-outline'
          : dream.audioUri
            ? 'mic-outline'
            : 'document-text-outline',
      label: copy.detailGlanceCaptureLabel,
      value: getCaptureModeLabel(dream, copy),
    },
    {
      key: 'transcript',
      icon: dream.transcript
        ? 'chatbubble-ellipses-outline'
        : 'sparkles-outline',
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
    lucidityLabel,
    hasLucidity: typeof lucidityLevel === 'number',
    showLucidityHeroChip: (lucidityLevel ?? 0) > 0,
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
