import {
  getDreamCopy,
  getDreamMoodLabels,
} from '../../../../constants/copy/dreams';
import type { Dream } from '../dream';

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
  lucidityLabel?: string;
  hasLucidity: boolean;
  showLucidityHeroChip: boolean;
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
