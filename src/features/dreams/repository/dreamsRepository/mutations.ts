import {
  Dream,
  DreamTranscriptSource,
  DreamTranscriptStatus,
} from '../../model/dream';
import { DreamAnalysisRecord } from '../../../analysis/model/dreamAnalysis';
import {
  listDreams,
  markDreamAsLocalChange,
  persistDreams,
  updateDreamById,
} from './core';

export function archiveDream(id: string) {
  const next = listDreams().map(dream =>
    dream.id === id
      ? markDreamAsLocalChange({
          ...dream,
          archivedAt: Date.now(),
        })
      : dream,
  );
  persistDreams(next);
  return next.find(dream => dream.id === id);
}

export function starDream(id: string) {
  return updateDreamById(id, dream => ({
    ...dream,
    starredAt: Date.now(),
  }));
}

export function unstarDream(id: string) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = { ...dream, starredAt: undefined };
    delete nextDream.starredAt;
    return nextDream;
  });
}

export function unarchiveDream(id: string) {
  const next = listDreams().map(dream => {
    if (dream.id !== id) {
      return dream;
    }

    const nextDream: Dream = { ...dream, archivedAt: undefined };
    delete nextDream.archivedAt;
    return nextDream;
  });
  persistDreams(next);
  return next.find(dream => dream.id === id);
}

export function updateDreamTranscriptState(
  id: string,
  input: {
    transcriptStatus: DreamTranscriptStatus;
    transcript?: string;
    transcriptSource?: DreamTranscriptSource;
    transcriptUpdatedAt?: number;
  },
) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = {
      ...dream,
      transcriptStatus: input.transcriptStatus,
      transcriptUpdatedAt: input.transcriptUpdatedAt ?? Date.now(),
    };

    if (typeof input.transcript === 'string') {
      nextDream.transcript = input.transcript;
    }

    if (input.transcriptSource) {
      nextDream.transcriptSource = input.transcriptSource;
    }

    return nextDream;
  });
}

export function saveDreamTranscriptEdit(id: string, transcript: string) {
  return updateDreamById(id, dream => ({
    ...dream,
    transcript,
    transcriptStatus: 'ready',
    transcriptSource: 'edited',
    transcriptUpdatedAt: Date.now(),
  }));
}

export function clearDreamTranscript(id: string) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = {
      ...dream,
      transcript: undefined,
      transcriptSource: undefined,
      transcriptUpdatedAt: undefined,
      transcriptStatus: dream.audioUri?.trim() ? 'idle' : undefined,
    };

    delete nextDream.transcript;
    delete nextDream.transcriptSource;
    delete nextDream.transcriptUpdatedAt;

    if (!nextDream.transcriptStatus) {
      delete nextDream.transcriptStatus;
    }

    return nextDream;
  });
}

export function setDreamAudioUri(id: string, audioUri: string) {
  return updateDreamById(id, dream => ({
    ...dream,
    audioUri,
  }));
}

export function saveDreamAnalysis(id: string, analysis: DreamAnalysisRecord) {
  return updateDreamById(id, dream => ({
    ...dream,
    analysis,
  }));
}

export function clearDreamAnalysis(id: string) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = {
      ...dream,
      analysis: undefined,
    };

    delete nextDream.analysis;
    return nextDream;
  });
}
