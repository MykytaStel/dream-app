import { getStoredLocale, saveLocale } from '../../../i18n/localeStore';
import {
  APP_LOCALE_KEY,
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  DREAM_PRACTICE_REMINDER_SETTINGS_KEY,
  REMINDER_SETTINGS_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import {
  getDreamAnalysisSettings,
  saveDreamAnalysisSettings,
} from '../../analysis/services/dreamAnalysisSettingsService';
import { listDreamDeletionTombstones } from '../../dreams/repository/dreamDeletionTombstonesRepository';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { getDreamDraft } from '../../dreams/services/dreamDraftService';
import {
  applyDreamReminderSettings,
  getDreamReminderSettings,
} from '../../reminders/services/dreamReminderService';
import {
  applyDreamPracticeReminderSettings,
  getDreamPracticeReminderSettings,
} from '../../reminders/services/dreamPracticeReminderService';
import { scheduleDreamWidgetSync } from '../../widgets/services/dreamWidgetSyncService';

export type StoredValue =
  | { type: 'missing' }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean };

export type LocalDataSnapshotEntry = {
  key: string;
  value: StoredValue;
};

export type LocalDataSnapshot = {
  fixedValues: LocalDataSnapshotEntry[];
  editDraftValues: LocalDataSnapshotEntry[];
  dreamsReadable: boolean;
  tombstonesReadable: boolean;
  draftReadable: boolean;
  locale: ReturnType<typeof getStoredLocale>;
  analysisSettings: ReturnType<typeof getDreamAnalysisSettings>;
  reminderSettings: ReturnType<typeof getDreamReminderSettings>;
  practiceReminderSettings: ReturnType<typeof getDreamPracticeReminderSettings>;
};

const FIXED_TRANSACTION_KEYS = [
  DREAMS_STORAGE_KEY,
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  APP_LOCALE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  REMINDER_SETTINGS_KEY,
  DREAM_PRACTICE_REMINDER_SETTINGS_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
] as const;

const FIXED_TRANSACTION_KEY_SET = new Set<string>(FIXED_TRANSACTION_KEYS);

type RecordShape = Record<string, unknown>;

function isRecord(value: unknown): value is RecordShape {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readStoredValue(key: string): StoredValue {
  const stringValue = kv.getString(key);
  if (stringValue !== undefined) {
    return { type: 'string', value: stringValue };
  }

  const numberValue = kv.getNumber(key);
  if (numberValue !== undefined) {
    return { type: 'number', value: numberValue };
  }

  const booleanValue = kv.getBoolean(key);
  if (booleanValue !== undefined) {
    return { type: 'boolean', value: booleanValue };
  }

  return { type: 'missing' };
}

function writeStoredValue(key: string, value: StoredValue) {
  if (value.type === 'missing') {
    kv.remove(key);
    return;
  }

  kv.set(key, value.value);
}

function isReadableJson(
  value: StoredValue | undefined,
  predicate: (parsed: unknown) => boolean,
) {
  if (!value || value.type === 'missing') {
    return true;
  }
  if (value.type !== 'string') {
    return false;
  }

  try {
    return predicate(JSON.parse(value.value));
  } catch {
    return false;
  }
}

function readEditDraftValues() {
  return kv
    .getAllKeys()
    .filter(key => key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX))
    .sort()
    .map(key => ({ key, value: readStoredValue(key) }));
}

export function captureLocalDataSnapshot(): LocalDataSnapshot {
  const fixedValues = FIXED_TRANSACTION_KEYS.map(key => ({
    key,
    value: readStoredValue(key),
  }));
  const fixedByKey = new Map(
    fixedValues.map(entry => [entry.key, entry.value] as const),
  );

  return {
    fixedValues,
    editDraftValues: readEditDraftValues(),
    dreamsReadable: isReadableJson(
      fixedByKey.get(DREAMS_STORAGE_KEY),
      Array.isArray,
    ),
    tombstonesReadable: isReadableJson(
      fixedByKey.get(DREAM_DELETION_TOMBSTONES_STORAGE_KEY),
      Array.isArray,
    ),
    draftReadable: isReadableJson(
      fixedByKey.get(DREAM_DRAFT_STORAGE_KEY),
      parsed =>
        Boolean(parsed) && typeof parsed === 'object' && !Array.isArray(parsed),
    ),
    locale: getStoredLocale(),
    analysisSettings: getDreamAnalysisSettings(),
    reminderSettings: getDreamReminderSettings(),
    practiceReminderSettings: getDreamPracticeReminderSettings(),
  };
}

function parseStoredValue(value: unknown): StoredValue {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new Error('Local data snapshot contains an invalid stored value.');
  }

  if (value.type === 'missing') {
    return { type: 'missing' };
  }
  if (value.type === 'string' && typeof value.value === 'string') {
    return { type: 'string', value: value.value };
  }
  if (
    value.type === 'number' &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value)
  ) {
    return { type: 'number', value: value.value };
  }
  if (value.type === 'boolean' && typeof value.value === 'boolean') {
    return { type: 'boolean', value: value.value };
  }

  throw new Error('Local data snapshot contains a mismatched stored value.');
}

function parseEntries(
  value: unknown,
  validateKey: (key: string) => boolean,
  kind: string,
) {
  if (!Array.isArray(value)) {
    throw new Error(`Local data snapshot ${kind} entries are missing.`);
  }

  const seen = new Set<string>();
  return value.map(entry => {
    if (!isRecord(entry) || typeof entry.key !== 'string') {
      throw new Error(`Local data snapshot contains an invalid ${kind} entry.`);
    }
    if (!validateKey(entry.key) || seen.has(entry.key)) {
      throw new Error(`Local data snapshot contains an unsafe ${kind} key.`);
    }
    seen.add(entry.key);
    return { key: entry.key, value: parseStoredValue(entry.value) };
  });
}

export function parseLocalDataSnapshot(value: unknown): LocalDataSnapshot {
  if (!isRecord(value)) {
    throw new Error('Local data snapshot is not a valid object.');
  }

  const fixedValues = parseEntries(
    value.fixedValues,
    key => FIXED_TRANSACTION_KEY_SET.has(key),
    'fixed',
  );
  if (
    fixedValues.length !== FIXED_TRANSACTION_KEYS.length ||
    FIXED_TRANSACTION_KEYS.some(
      key => !fixedValues.some(entry => entry.key === key),
    )
  ) {
    throw new Error('Local data snapshot does not cover every fixed key.');
  }

  const editDraftValues = parseEntries(
    value.editDraftValues,
    key => key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX),
    'edit draft',
  );

  if (
    typeof value.dreamsReadable !== 'boolean' ||
    typeof value.tombstonesReadable !== 'boolean' ||
    typeof value.draftReadable !== 'boolean'
  ) {
    throw new Error('Local data snapshot readability metadata is invalid.');
  }

  if (value.locale !== 'en' && value.locale !== 'uk') {
    throw new Error('Local data snapshot locale is invalid.');
  }
  if (
    !isRecord(value.analysisSettings) ||
    !isRecord(value.reminderSettings) ||
    !isRecord(value.practiceReminderSettings)
  ) {
    throw new Error('Local data snapshot settings metadata is invalid.');
  }

  return {
    fixedValues,
    editDraftValues,
    dreamsReadable: value.dreamsReadable,
    tombstonesReadable: value.tombstonesReadable,
    draftReadable: value.draftReadable,
    locale: value.locale,
    analysisSettings:
      value.analysisSettings as LocalDataSnapshot['analysisSettings'],
    reminderSettings:
      value.reminderSettings as LocalDataSnapshot['reminderSettings'],
    practiceReminderSettings:
      value.practiceReminderSettings as LocalDataSnapshot['practiceReminderSettings'],
  };
}

function restoreRawValues(snapshot: LocalDataSnapshot) {
  for (const key of kv.getAllKeys()) {
    if (key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX)) {
      kv.remove(key);
    }
  }

  for (const entry of snapshot.fixedValues) {
    writeStoredValue(entry.key, entry.value);
  }
  for (const entry of snapshot.editDraftValues) {
    writeStoredValue(entry.key, entry.value);
  }
}

/**
 * Restores exact MMKV values first, refreshes semantic/platform side effects,
 * then reapplies the exact values because those APIs may normalize storage.
 */
export async function restoreLocalDataSnapshot(snapshot: LocalDataSnapshot) {
  restoreRawValues(snapshot);

  if (snapshot.dreamsReadable) {
    listDreams();
  }
  if (snapshot.tombstonesReadable) {
    listDreamDeletionTombstones();
  }
  if (snapshot.draftReadable) {
    getDreamDraft();
  }

  saveLocale(snapshot.locale);
  saveDreamAnalysisSettings(snapshot.analysisSettings);
  await applyDreamReminderSettings(snapshot.reminderSettings);
  await applyDreamPracticeReminderSettings(snapshot.practiceReminderSettings);

  if (snapshot.dreamsReadable && snapshot.draftReadable) {
    scheduleDreamWidgetSync();
  }

  restoreRawValues(snapshot);
}
