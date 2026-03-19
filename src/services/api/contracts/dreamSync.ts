import type {
  Dream,
  Mood,
  PreSleepEmotion,
  SleepContext,
  StressLevel,
  WakeEmotion,
  DreamTranscriptSource,
  DreamTranscriptStatus,
  LucidPractice,
  NightmareSupport,
} from '../../../features/dreams/model/dream';
import type {
  DreamAnalysisProvider,
  DreamAnalysisStatus,
} from '../../../features/analysis/model/dreamAnalysis';
import { sanitizeDream } from '../../../features/dreams/model/dreamRules';

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
  lucid_practice?: LucidPractice | null;
  nightmare?: NightmareSupport | null;
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

function toIsoString(epoch: number) {
  return new Date(epoch).toISOString();
}

function fromIsoString(value: string) {
  return new Date(value).getTime();
}

export function createDreamEntryRow(dream: Dream, userId: string): DreamEntryRow {
  return {
    id: dream.id,
    user_id: userId,
    created_at: toIsoString(dream.createdAt),
    updated_at: toIsoString(dream.updatedAt ?? dream.createdAt),
    sleep_date: dream.sleepDate ?? null,
    title: dream.title ?? null,
    raw_text: dream.text ?? null,
    audio_storage_path: dream.audioRemotePath ?? null,
    transcript: dream.transcript ?? null,
    transcript_status: dream.transcriptStatus ?? null,
    transcript_source: dream.transcriptSource ?? null,
    transcript_updated_at: dream.transcriptUpdatedAt ? toIsoString(dream.transcriptUpdatedAt) : null,
    mood: dream.mood ?? null,
    lucidity: dream.lucidity ?? null,
    lucid_practice: dream.lucidPractice ?? null,
    nightmare: dream.nightmare ?? null,
    archived_at: dream.archivedAt ? toIsoString(dream.archivedAt) : null,
    starred_at: dream.starredAt ? toIsoString(dream.starredAt) : null,
    analysis_provider: dream.analysis?.provider ?? null,
    analysis_status: dream.analysis?.status ?? null,
    analysis_summary: dream.analysis?.summary ?? null,
    analysis_themes: dream.analysis?.themes ?? [],
    analysis_generated_at: dream.analysis?.generatedAt
      ? toIsoString(dream.analysis.generatedAt)
      : null,
    analysis_error_message: dream.analysis?.errorMessage ?? null,
  };
}

export function createDreamSyncBundle(dream: Dream, userId: string): DreamSyncBundle {
  return {
    dream: createDreamEntryRow(dream, userId),
    tags: dream.tags.map((tag, position) => ({
      dream_id: dream.id,
      tag,
      position,
    })),
    wakeEmotions: (dream.wakeEmotions ?? []).map((emotion, position) => ({
      dream_id: dream.id,
      emotion,
      position,
    })),
    preSleepEmotions: (dream.sleepContext?.preSleepEmotions ?? []).map((emotion, position) => ({
      dream_id: dream.id,
      emotion,
      position,
    })),
    sleepContext: createDreamSleepContextRow(dream.id, dream.sleepContext),
  };
}

export function hydrateDreamFromSyncBundle(bundle: DreamSyncBundle): Dream {
  const row = bundle.dream;

  return sanitizeDream({
    id: row.id,
    createdAt: fromIsoString(row.created_at),
    updatedAt: fromIsoString(row.updated_at),
    archivedAt: row.archived_at ? fromIsoString(row.archived_at) : undefined,
    starredAt: row.starred_at ? fromIsoString(row.starred_at) : undefined,
    sleepDate: row.sleep_date ?? undefined,
    title: row.title ?? undefined,
    text: row.raw_text ?? undefined,
    audioRemotePath: row.audio_storage_path ?? undefined,
    transcript: row.transcript ?? undefined,
    transcriptStatus: row.transcript_status ?? undefined,
    transcriptSource: row.transcript_source ?? undefined,
    transcriptUpdatedAt: row.transcript_updated_at
      ? fromIsoString(row.transcript_updated_at)
      : undefined,
    syncStatus: 'synced',
    lastSyncedAt: fromIsoString(row.updated_at),
    analysis:
      row.analysis_provider && row.analysis_status
        ? {
            provider: row.analysis_provider,
            status: row.analysis_status,
            summary: row.analysis_summary ?? undefined,
            themes: row.analysis_themes.length ? row.analysis_themes : undefined,
            generatedAt: row.analysis_generated_at
              ? fromIsoString(row.analysis_generated_at)
              : undefined,
            errorMessage: row.analysis_error_message ?? undefined,
          }
        : undefined,
    tags: bundle.tags
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(item => item.tag),
    mood: row.mood ?? undefined,
    lucidPractice: row.lucid_practice ?? undefined,
    nightmare: row.nightmare ?? undefined,
    wakeEmotions: bundle.wakeEmotions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(item => item.emotion),
    sleepContext: bundle.sleepContext
      ? {
          stressLevel: bundle.sleepContext.stress_level ?? undefined,
          alcoholTaken: bundle.sleepContext.alcohol_taken ?? undefined,
          caffeineLate: bundle.sleepContext.caffeine_late ?? undefined,
          medications: bundle.sleepContext.medications ?? undefined,
          importantEvents: bundle.sleepContext.important_events ?? undefined,
          healthNotes: bundle.sleepContext.health_notes ?? undefined,
          preSleepEmotions: bundle.preSleepEmotions
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(item => item.emotion),
        }
      : undefined,
    lucidity: row.lucidity ?? undefined,
  });
}
