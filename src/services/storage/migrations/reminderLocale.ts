import { AppLocale } from '../../../i18n/types';
import {
  APP_LOCALE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  REMINDER_SETTINGS_KEY,
} from '../keys';
import { kv } from '../mmkv';

type LegacyRecord = Record<string, unknown>;

type ReminderSettingsRecord = {
  enabled: boolean;
  hour: number;
  minute: number;
  style: 'balanced' | 'gentle' | 'direct';
};

const DEFAULT_REMINDER_SETTINGS: ReminderSettingsRecord = {
  enabled: false,
  hour: 7,
  minute: 30,
  style: 'balanced',
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

function parseHourMinute(
  raw: unknown,
): { hour: number; minute: number } | undefined {
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
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!raw) {
    return 'en';
  }

  if (raw.startsWith('uk') || raw.startsWith('ua')) {
    return 'uk';
  }

  return 'en';
}

export function migrateReminderSettingsToV2() {
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
      style:
        parsed.style === 'gentle' || parsed.style === 'direct'
          ? parsed.style
          : 'balanced',
    };

    kv.set(REMINDER_SETTINGS_KEY, JSON.stringify(migrated));
  } catch {
    kv.set(REMINDER_SETTINGS_KEY, JSON.stringify(DEFAULT_REMINDER_SETTINGS));
  }
}

export function migrateLocaleToV2() {
  const raw = kv.getString(APP_LOCALE_KEY);
  if (!raw) {
    return;
  }

  kv.set(APP_LOCALE_KEY, normalizeLocale(raw));
}

export function migrateAnalysisSettingsToV5() {
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
