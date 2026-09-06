import {
  Dream,
  DreamIntensity,
  DreamSyncStatus,
  Mood,
  PreSleepEmotion,
  SleepContext,
  WakeEmotion,
} from '../../../features/dreams/model/dream';
import {
  sanitizeDream,
  sortDreamsStable,
} from '../../../features/dreams/model/dreamRules';
import { DREAMS_STORAGE_KEY } from '../keys';
import { kv } from '../mmkv';

export type LegacyRecord = Record<string, unknown>;

/**
 * Raised when the stored dreams cannot be read. The archive is the product, so
 * a migration that cannot understand it must stop rather than replace it:
 * unreadable data can still be recovered, overwritten data cannot.
 */
export class UnreadableDreamStoreError extends Error {
  constructor(readonly cause: unknown) {
    super('Stored dreams could not be parsed, so the migration was aborted.');
    this.name = 'UnreadableDreamStoreError';
  }
}

function pickSleepContextFromLegacy(
  record: LegacyRecord,
): SleepContext | undefined {
  const source =
    (record.sleepContext && typeof record.sleepContext === 'object'
      ? (record.sleepContext as LegacyRecord)
      : undefined) ??
    (record.preSleep && typeof record.preSleep === 'object'
      ? (record.preSleep as LegacyRecord)
      : undefined);

  if (!source) {
    return undefined;
  }

  let stressLevel: number | undefined;
  if (typeof source.stressLevel === 'number') {
    stressLevel = source.stressLevel;
  } else if (typeof source.stress === 'number') {
    stressLevel =
      source.stress <= 1
        ? 0
        : source.stress >= 5
          ? 3
          : Math.round(source.stress - 1);
  }

  if (typeof stressLevel === 'number') {
    stressLevel = Math.max(0, Math.min(3, Math.floor(stressLevel)));
  }

  return {
    stressLevel: stressLevel as SleepContext['stressLevel'],
    preSleepEmotions: Array.isArray(source.preSleepEmotions)
      ? source.preSleepEmotions.filter(
          (emotion): emotion is PreSleepEmotion =>
            emotion === 'peaceful' ||
            emotion === 'anxious' ||
            emotion === 'restless' ||
            emotion === 'hopeful' ||
            emotion === 'drained' ||
            emotion === 'lonely',
        )
      : undefined,
    alcoholTaken:
      typeof source.alcoholTaken === 'boolean'
        ? source.alcoholTaken
        : typeof source.alcohol === 'boolean'
          ? source.alcohol
          : undefined,
    caffeineLate:
      typeof source.caffeineLate === 'boolean'
        ? source.caffeineLate
        : typeof source.caffeine === 'boolean'
          ? source.caffeine
          : undefined,
    medications:
      typeof source.medications === 'string'
        ? source.medications
        : typeof source.supplements === 'string'
          ? source.supplements
          : undefined,
    importantEvents:
      typeof source.importantEvents === 'string'
        ? source.importantEvents
        : typeof source.majorEvent === 'string'
          ? source.majorEvent
          : undefined,
    healthNotes:
      typeof source.healthNotes === 'string' ? source.healthNotes : undefined,
  };
}

function coerceLegacyDream(entry: unknown, index: number): Dream | undefined {
  if (!entry || typeof entry !== 'object') {
    return undefined;
  }

  const record = entry as LegacyRecord;
  const analysisRecord =
    record.analysis && typeof record.analysis === 'object'
      ? (record.analysis as LegacyRecord)
      : undefined;
  const createdAt =
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt)
      ? record.createdAt
      : Date.now() + index;

  return {
    id:
      typeof record.id === 'string' && record.id.trim()
        ? record.id
        : `legacy-dream-${index}-${createdAt}`,
    createdAt,
    archivedAt:
      typeof record.archivedAt === 'number' &&
      Number.isFinite(record.archivedAt)
        ? record.archivedAt
        : undefined,
    updatedAt:
      typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
        ? record.updatedAt
        : undefined,
    starredAt:
      typeof record.starredAt === 'number' && Number.isFinite(record.starredAt)
        ? record.starredAt
        : undefined,
    sleepDate:
      typeof record.sleepDate === 'string' ? record.sleepDate : undefined,
    title: typeof record.title === 'string' ? record.title : undefined,
    text: typeof record.text === 'string' ? record.text : undefined,
    audioUri:
      typeof record.audioUri === 'string'
        ? record.audioUri
        : typeof record.audioPath === 'string'
          ? record.audioPath
          : undefined,
    audioRemotePath:
      typeof record.audioRemotePath === 'string'
        ? record.audioRemotePath
        : typeof record.audioStoragePath === 'string'
          ? record.audioStoragePath
          : undefined,
    transcript:
      typeof record.transcript === 'string' ? record.transcript : undefined,
    transcriptStatus:
      record.transcriptStatus === 'idle' ||
      record.transcriptStatus === 'processing' ||
      record.transcriptStatus === 'ready' ||
      record.transcriptStatus === 'error'
        ? record.transcriptStatus
        : undefined,
    transcriptSource:
      record.transcriptSource === 'generated' ||
      record.transcriptSource === 'edited'
        ? record.transcriptSource
        : undefined,
    transcriptUpdatedAt:
      typeof record.transcriptUpdatedAt === 'number' &&
      Number.isFinite(record.transcriptUpdatedAt)
        ? record.transcriptUpdatedAt
        : undefined,
    syncStatus:
      record.syncStatus === 'local' ||
      record.syncStatus === 'syncing' ||
      record.syncStatus === 'synced' ||
      record.syncStatus === 'error'
        ? (record.syncStatus as DreamSyncStatus)
        : undefined,
    lastSyncedAt:
      typeof record.lastSyncedAt === 'number' &&
      Number.isFinite(record.lastSyncedAt)
        ? record.lastSyncedAt
        : undefined,
    syncError:
      typeof record.syncError === 'string' ? record.syncError : undefined,
    analysis: analysisRecord
      ? {
          provider: analysisRecord.provider === 'openai' ? 'openai' : 'manual',
          status:
            analysisRecord.status === 'ready'
              ? 'ready'
              : analysisRecord.status === 'error'
                ? 'error'
                : 'idle',
          summary:
            typeof analysisRecord.summary === 'string'
              ? analysisRecord.summary
              : undefined,
          themes: Array.isArray(analysisRecord.themes)
            ? (analysisRecord.themes as unknown[]).filter(
                (theme): theme is string => typeof theme === 'string',
              )
            : undefined,
          generatedAt:
            typeof analysisRecord.generatedAt === 'number' &&
            Number.isFinite(analysisRecord.generatedAt)
              ? analysisRecord.generatedAt
              : undefined,
          errorMessage:
            typeof analysisRecord.errorMessage === 'string'
              ? analysisRecord.errorMessage
              : undefined,
        }
      : undefined,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    wakeEmotions: Array.isArray(record.wakeEmotions)
      ? record.wakeEmotions.filter(
          (emotion): emotion is WakeEmotion =>
            emotion === 'calm' ||
            emotion === 'uneasy' ||
            emotion === 'curious' ||
            emotion === 'heavy' ||
            emotion === 'inspired' ||
            emotion === 'disoriented',
        )
      : undefined,
    mood:
      record.mood === 'positive' ||
      record.mood === 'negative' ||
      record.mood === 'neutral' ||
      record.mood === 'peaceful' ||
      record.mood === 'joyful' ||
      record.mood === 'mysterious' ||
      record.mood === 'nostalgic' ||
      record.mood === 'melancholic' ||
      record.mood === 'anxious' ||
      record.mood === 'dark' ||
      record.mood === 'surreal'
        ? (record.mood as Mood)
        : undefined,
    dreamIntensity:
      typeof record.dreamIntensity === 'number' &&
      record.dreamIntensity >= 1 &&
      record.dreamIntensity <= 5
        ? (Math.floor(record.dreamIntensity) as DreamIntensity)
        : undefined,
    sleepContext: pickSleepContextFromLegacy(record),
    lucidity:
      typeof record.lucidity === 'number'
        ? (Math.max(0, Math.min(3, Math.floor(record.lucidity))) as
            0 | 1 | 2 | 3)
        : undefined,
  };
}

export function migrateDreamsFromLegacyShape() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new UnreadableDreamStoreError(error);
  }

  if (!Array.isArray(parsed)) {
    throw new UnreadableDreamStoreError(
      `Expected an array, received ${typeof parsed}.`,
    );
  }

  const migrated = parsed
    .map(coerceLegacyDream)
    .filter((dream): dream is Dream => Boolean(dream))
    .map(sanitizeDream);

  kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
}
