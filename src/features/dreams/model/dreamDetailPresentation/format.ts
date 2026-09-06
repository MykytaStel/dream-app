import { Theme } from '../../../../theme/theme';
import type { Dream } from '../dream';
import { getMoodValence } from '../dreamAnalytics';
import type { DreamTranscriptionProgress } from '../../services/dreamTranscriptionService';
import type { DreamDetailCopy } from './types';

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
  const date =
    typeof value === 'string' ? new Date(`${value}T00:00:00`) : new Date(value);
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
