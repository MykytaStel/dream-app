import type { Dream } from '../dream';
import type { DreamDetailSectionsState } from './types';

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

export function createDefaultExpandedSections(
  dream: Dream,
): DreamDetailSectionsState {
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
