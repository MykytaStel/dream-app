import { AppLocale } from '../../i18n/types';
import {
  Dream,
  PreSleepEmotion,
  SleepContext,
  WakeEmotion,
} from '../../features/dreams/model/dream';
import { sanitizeDream, sortDreamsStable } from '../../features/dreams/model/dreamRules';
import {
  APP_LOCALE_KEY,
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAM_ANALYSIS_SETTINGS_KEY,
  DREAMS_STORAGE_KEY,
  REMINDER_SETTINGS_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from './keys';
import { kv } from './mmkv';

type LegacyRecord = Record<string, unknown>;

type ReminderSettingsRecord = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULT_REMINDER_SETTINGS: ReminderSettingsRecord = {
  enabled: false,
  hour: 7,
  minute: 30,
};

function clampHour(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_REMINDER_SETTINGS.hour;
  }

  return Math.min(23, Math.max(0, Math.floor(value)));
}

function clampMinute(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_REMINDER_SETTINGS.minute;
  }

  return Math.min(59, Math.max(0, Math.floor(value)));
}

function parseHourMinute(raw: unknown): { hour: number; minute: number } | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }

  const match = raw.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return undefined;
  }

  return {
    hour: clampHour(Number(match[1])),
    minute: clampMinute(Number(match[2])),
  };
}

function normalizeLocale(value: unknown): AppLocale {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) {
    return 'en';
  }

  if (raw.startsWith('uk') || raw.startsWith('ua')) {
    return 'uk';
  }

  return 'en';
}

function pickSleepContextFromLegacy(record: LegacyRecord): SleepContext | undefined {
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
    stressLevel = source.stress <= 1 ? 0 : source.stress >= 5 ? 3 : Math.round(source.stress - 1);
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
    healthNotes: typeof source.healthNotes === 'string' ? source.healthNotes : undefined,
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
      typeof record.archivedAt === 'number' && Number.isFinite(record.archivedAt)
        ? record.archivedAt
        : undefined,
    starredAt:
      typeof record.starredAt === 'number' && Number.isFinite(record.starredAt)
        ? record.starredAt
        : undefined,
    sleepDate: typeof record.sleepDate === 'string' ? record.sleepDate : undefined,
    title: typeof record.title === 'string' ? record.title : undefined,
    text: typeof record.text === 'string' ? record.text : undefined,
    audioUri:
      typeof record.audioUri === 'string'
        ? record.audioUri
        : typeof record.audioPath === 'string'
          ? record.audioPath
          : undefined,
    transcript: typeof record.transcript === 'string' ? record.transcript : undefined,
    transcriptStatus:
      record.transcriptStatus === 'idle' ||
      record.transcriptStatus === 'processing' ||
      record.transcriptStatus === 'ready' ||
      record.transcriptStatus === 'error'
        ? record.transcriptStatus
        : undefined,
    transcriptSource:
      record.transcriptSource === 'generated' || record.transcriptSource === 'edited'
        ? record.transcriptSource
        : undefined,
    transcriptUpdatedAt:
      typeof record.transcriptUpdatedAt === 'number' && Number.isFinite(record.transcriptUpdatedAt)
        ? record.transcriptUpdatedAt
        : undefined,
    analysis: analysisRecord
        ? {
            provider: analysisRecord.provider === 'openai' ? 'openai' : 'manual',
            status:
              analysisRecord.status === 'ready'
                ? 'ready'
                : analysisRecord.status === 'error'
                  ? 'error'
                  : 'idle',
            summary: typeof analysisRecord.summary === 'string' ? analysisRecord.summary : undefined,
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
      record.mood === 'positive' || record.mood === 'negative' || record.mood === 'neutral'
        ? record.mood
        : undefined,
    sleepContext: pickSleepContextFromLegacy(record),
    lucidity:
      typeof record.lucidity === 'number'
        ? (Math.max(0, Math.min(3, Math.floor(record.lucidity))) as 0 | 1 | 2 | 3)
        : undefined,
  };
}

function migrateDreamsToV2() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const migrated = parsed
      .map(coerceLegacyDream)
      .filter((dream): dream is Dream => Boolean(dream))
      .map(sanitizeDream);

    kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
  } catch {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
  }
}

function migrateReminderSettingsToV2() {
  const raw = kv.getString(REMINDER_SETTINGS_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as LegacyRecord;
    const parsedTime = parseHourMinute(parsed.time);

    const migrated: ReminderSettingsRecord = {
      enabled: Boolean(parsed.enabled),
      hour: parsedTime ? parsedTime.hour : clampHour(parsed.hour),
      minute: parsedTime ? parsedTime.minute : clampMinute(parsed.minute),
    };

    kv.set(REMINDER_SETTINGS_KEY, JSON.stringify(migrated));
  } catch {
    kv.set(REMINDER_SETTINGS_KEY, JSON.stringify(DEFAULT_REMINDER_SETTINGS));
  }
}

function migrateLocaleToV2() {
  const raw = kv.getString(APP_LOCALE_KEY);
  if (!raw) {
    return;
  }

  kv.set(APP_LOCALE_KEY, normalizeLocale(raw));
}

function migrateToV2() {
  migrateDreamsToV2();
  migrateReminderSettingsToV2();
  migrateLocaleToV2();
}

function migrateDreamsToV3() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const migrated = parsed
      .map(coerceLegacyDream)
      .filter((dream): dream is Dream => Boolean(dream))
      .map(sanitizeDream);

    kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
  } catch {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
  }
}

function migrateDreamsToV4() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const migrated = parsed
      .map(coerceLegacyDream)
      .filter((dream): dream is Dream => Boolean(dream))
      .map(sanitizeDream);

    kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
  } catch {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
  }
}

function migrateDreamsToV5() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const migrated = parsed
      .map(coerceLegacyDream)
      .filter((dream): dream is Dream => Boolean(dream))
      .map(sanitizeDream);

    kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
  } catch {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
  }
}

function migrateDreamsToV6() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const migrated = parsed
      .map(coerceLegacyDream)
      .filter((dream): dream is Dream => Boolean(dream))
      .map(sanitizeDream);

    kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
  } catch {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
  }
}

function migrateDreamsToV7() {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const migrated = parsed
      .map(coerceLegacyDream)
      .filter((dream): dream is Dream => Boolean(dream))
      .map(sanitizeDream);

    kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(migrated)));
  } catch {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));
  }
}

function migrateAnalysisSettingsToV5() {
  const raw = kv.getString(DREAM_ANALYSIS_SETTINGS_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as LegacyRecord;
    kv.set(
      DREAM_ANALYSIS_SETTINGS_KEY,
      JSON.stringify({
        enabled: Boolean(parsed.enabled),
        provider: parsed.provider === 'openai' ? 'openai' : 'manual',
        allowNetwork: Boolean(parsed.allowNetwork),
      }),
    );
  } catch {
    kv.remove(DREAM_ANALYSIS_SETTINGS_KEY);
  }
}

export function runStorageMigrations() {
  const currentVersion = kv.getNumber(STORAGE_SCHEMA_VERSION_KEY) ?? 1;
  if (currentVersion >= CURRENT_STORAGE_SCHEMA_VERSION) {
    return currentVersion;
  }

  let nextVersion = currentVersion;

  if (nextVersion < 2) {
    migrateToV2();
    nextVersion = 2;
  }

  if (nextVersion < 3) {
    migrateDreamsToV3();
    nextVersion = 3;
  }

  if (nextVersion < 4) {
    migrateDreamsToV4();
    nextVersion = 4;
  }

  if (nextVersion < 5) {
    migrateDreamsToV5();
    migrateAnalysisSettingsToV5();
    nextVersion = 5;
  }

  if (nextVersion < 6) {
    migrateDreamsToV6();
    nextVersion = 6;
  }

  if (nextVersion < 7) {
    migrateDreamsToV7();
    nextVersion = 7;
  }

  kv.set(STORAGE_SCHEMA_VERSION_KEY, nextVersion);
  return nextVersion;
}
