import type {
  Dream,
  Mood,
  PreSleepEmotion,
  SleepContext,
  StressLevel,
  WakeEmotion,
  DreamTranscriptSource,
  DreamTranscriptStatus,
} from '../../../features/dreams/model/dream';
import type {
  DreamAnalysisProvider,
  DreamAnalysisStatus,
} from '../../../features/analysis/model/dreamAnalysis';

export const DREAM_AUDIO_BUCKET = 'dream-audio';
export const DREAM_SYNC_SCHEMA_VERSION = 1;

export type DreamEntryRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  sleep_date: string | null;
  title: string | null;
  raw_text: string | null;
  audio_storage_path: string | null;
  transcript: string | null;
  transcript_status: DreamTranscriptStatus | null;
  transcript_source: DreamTranscriptSource | null;
  transcript_updated_at: string | null;
  mood: Mood | null;
  lucidity: Dream['lucidity'] | null;
  archived_at: string | null;
  starred_at: string | null;
  analysis_provider: DreamAnalysisProvider | null;
  analysis_status: DreamAnalysisStatus | null;
  analysis_summary: string | null;
  analysis_themes: string[];
  analysis_generated_at: string | null;
  analysis_error_message: string | null;
};

export type DreamTagRow = {
  dream_id: string;
  tag: string;
  position: number;
};

export type DreamWakeEmotionRow = {
  dream_id: string;
  emotion: WakeEmotion;
  position: number;
};

export type DreamPreSleepEmotionRow = {
  dream_id: string;
  emotion: PreSleepEmotion;
  position: number;
};

export type DreamSleepContextRow = {
  dream_id: string;
  stress_level: StressLevel | null;
  alcohol_taken: boolean | null;
  caffeine_late: boolean | null;
  medications: string | null;
  important_events: string | null;
  health_notes: string | null;
};

export type DreamSyncBundle = {
  dream: DreamEntryRow;
  tags: DreamTagRow[];
  wakeEmotions: DreamWakeEmotionRow[];
  preSleepEmotions: DreamPreSleepEmotionRow[];
  sleepContext: DreamSleepContextRow | null;
};

export type DreamSyncEnvelope = {
  schemaVersion: typeof DREAM_SYNC_SCHEMA_VERSION;
  exportedAt: string;
  dreams: DreamSyncBundle[];
};

type CreateDreamAudioStoragePathArgs = {
  userId: string;
  dreamId: string;
  filename: string;
};

function normalizeStorageFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export function createDreamAudioStoragePath({
  userId,
  dreamId,
  filename,
}: CreateDreamAudioStoragePathArgs) {
  return `${userId}/${dreamId}/${normalizeStorageFilename(filename)}`;
}

export function createDreamSleepContextRow(
  dreamId: string,
  context?: SleepContext,
): DreamSleepContextRow | null {
  if (!context) {
    return null;
  }

  return {
    dream_id: dreamId,
    stress_level: context.stressLevel ?? null,
    alcohol_taken: context.alcoholTaken ?? null,
    caffeine_late: context.caffeineLate ?? null,
    medications: context.medications ?? null,
    important_events: context.importantEvents ?? null,
    health_notes: context.healthNotes ?? null,
  };
}
