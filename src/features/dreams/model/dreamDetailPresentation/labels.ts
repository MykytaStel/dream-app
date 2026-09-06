import type { DreamAnalysisSettings } from '../../../analysis/model/dreamAnalysis';
import type { Dream } from '../dream';
import { getDreamLucidityLevel } from '../dreamAnalytics';
import { truncateChars } from '../../../../utils/text';
import type { DreamDetailCopy } from './types';

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
  return Boolean(
    dream.wakeEmotions?.length || dream.sleepContext?.preSleepEmotions?.length,
  );
}

export function getLucidityLabel(level: 0 | 1 | 2 | 3, copy: DreamDetailCopy) {
  switch (level) {
    case 0:
      return copy.lucidityNoneLabel;
    case 1:
      return copy.lucidityBriefLabel;
    case 2:
      return copy.lucidityAwareLabel;
    case 3:
      return copy.lucidityControlLabel;
  }
}

export function getHeroPreview(dream: Dream, copy: DreamDetailCopy) {
  const text = dream.text?.trim();
  if (text) {
    if (text.length < 18 || !/\s/.test(text)) {
      return null;
    }

    return truncateChars(text, 160, '...');
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    if (transcript.length < 18 || !/\s/.test(transcript)) {
      return null;
    }

    const visible = truncateChars(transcript, 136, '...');
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

  if (typeof getDreamLucidityLevel(dream) === 'number') {
    count += 1;
  }

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

export function getTranscriptSyncHint(dream: Dream, copy: DreamDetailCopy) {
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

export function getAudioSyncHint(dream: Dream, copy: DreamDetailCopy) {
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
