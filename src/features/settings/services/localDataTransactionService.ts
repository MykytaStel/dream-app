import { getStoredLocale, saveLocale } from '../../../i18n/localeStore';
import { observability } from '../../../services/observability';
import { reportActionError } from '../../../services/observability/errorReporting';
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
import { exportDreamDataSnapshot } from './dataExportService';

export type LocalDataTransactionCheckpointPolicy =
  'required' | 'best-effort' | 'none';

type LocalDataTransactionOptions = {
  label: string;
  checkpointPolicy?: LocalDataTransactionCheckpointPolicy;
};

export type LocalDataTransactionResult<T> = {
  value: T;
  checkpointFilePath: string | null;
};

type StoredValue =
  | { type: 'missing' }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean };

type LocalDataSnapshot = {
  fixedValues: Map<string, StoredValue>;
  editDraftValues: Map<string, StoredValue>;
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

let transactionTail: Promise<void> = Promise.resolve();

export class LocalDataTransactionError extends Error {
  readonly operationError: unknown;
  readonly rollbackError: unknown;
  readonly checkpointFilePath: string | null;

  constructor(
    operationError: unknown,
    rollbackError?: unknown,
    checkpointFilePath: string | null = null,
  ) {
    super(
      rollbackError
        ? 'The operation failed and local data rollback was incomplete.'
        : 'The operation failed. Local data was restored to its previous state.',
    );
    this.name = 'LocalDataTransactionError';
    this.operationError = operationError;
    this.rollbackError = rollbackError;
    this.checkpointFilePath = checkpointFilePath;
  }
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
  const values = new Map<string, StoredValue>();
  for (const key of kv.getAllKeys()) {
    if (key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX)) {
      values.set(key, readStoredValue(key));
    }
  }
  return values;
}

function captureSnapshot(): LocalDataSnapshot {
  const fixedValues = new Map(
    FIXED_TRANSACTION_KEYS.map(key => [key, readStoredValue(key)] as const),
  );

  return {
    fixedValues,
    editDraftValues: readEditDraftValues(),
    dreamsReadable: isReadableJson(
      fixedValues.get(DREAMS_STORAGE_KEY),
      Array.isArray,
    ),
    tombstonesReadable: isReadableJson(
      fixedValues.get(DREAM_DELETION_TOMBSTONES_STORAGE_KEY),
      Array.isArray,
    ),
    draftReadable: isReadableJson(
      fixedValues.get(DREAM_DRAFT_STORAGE_KEY),
      parsed =>
        Boolean(parsed) && typeof parsed === 'object' && !Array.isArray(parsed),
    ),
    locale: getStoredLocale(),
    analysisSettings: getDreamAnalysisSettings(),
    reminderSettings: getDreamReminderSettings(),
    practiceReminderSettings: getDreamPracticeReminderSettings(),
  };
}

function restoreRawValues(snapshot: LocalDataSnapshot) {
  for (const key of kv.getAllKeys()) {
    if (key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX)) {
      kv.remove(key);
    }
  }

  for (const [key, value] of snapshot.fixedValues) {
    writeStoredValue(key, value);
  }
  for (const [key, value] of snapshot.editDraftValues) {
    writeStoredValue(key, value);
  }
}

async function restoreSnapshot(snapshot: LocalDataSnapshot) {
  // Restore bytes before any semantic call so repository caches observe the
  // previous archive, not the failed operation's temporary state.
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

  // These calls restore platform side effects: locale consumers, analysis
  // settings, scheduled notifications and practice reminders. They may
  // normalize their own MMKV values, so the exact raw snapshot is applied once
  // more afterwards.
  saveLocale(snapshot.locale);
  saveDreamAnalysisSettings(snapshot.analysisSettings);
  await applyDreamReminderSettings(snapshot.reminderSettings);
  await applyDreamPracticeReminderSettings(snapshot.practiceReminderSettings);

  if (snapshot.dreamsReadable && snapshot.draftReadable) {
    scheduleDreamWidgetSync();
  }

  restoreRawValues(snapshot);
}

async function createCheckpoint(
  policy: LocalDataTransactionCheckpointPolicy,
  label: string,
) {
  if (policy === 'none') {
    return null;
  }

  try {
    const result = await exportDreamDataSnapshot();
    return result.filePath;
  } catch (error) {
    reportActionError('local_data_transaction.checkpoint', error, {
      transaction_label: label,
      checkpoint_policy: policy,
    });
    if (policy === 'required') {
      throw error;
    }
    return null;
  }
}

async function performTransaction<T>(
  options: LocalDataTransactionOptions,
  operation: () => Promise<T> | T,
): Promise<LocalDataTransactionResult<T>> {
  const checkpointPolicy = options.checkpointPolicy ?? 'required';
  const snapshot = captureSnapshot();
  const checkpointFilePath = await createCheckpoint(
    checkpointPolicy,
    options.label,
  );

  observability.trackEvent('local_data_transaction_started', {
    transaction_label: options.label,
    checkpoint_created: Boolean(checkpointFilePath),
  });

  try {
    const value = await operation();
    observability.trackEvent('local_data_transaction_completed', {
      transaction_label: options.label,
      checkpoint_created: Boolean(checkpointFilePath),
    });
    return { value, checkpointFilePath };
  } catch (operationError) {
    let rollbackError: unknown;
    try {
      await restoreSnapshot(snapshot);
    } catch (error) {
      rollbackError = error;
      reportActionError('local_data_transaction.rollback', error, {
        transaction_label: options.label,
      });
    }

    reportActionError('local_data_transaction.operation', operationError, {
      transaction_label: options.label,
      rollback_completed: !rollbackError,
    });
    observability.trackEvent('local_data_transaction_failed', {
      transaction_label: options.label,
      rollback_completed: !rollbackError,
      checkpoint_created: Boolean(checkpointFilePath),
    });
    throw new LocalDataTransactionError(
      operationError,
      rollbackError,
      checkpointFilePath,
    );
  }
}

/**
 * Serializes every archive-wide mutation. Restore, merge and repair may touch
 * overlapping MMKV keys and derived caches, so they must never interleave.
 */
export function runLocalDataTransaction<T>(
  options: LocalDataTransactionOptions,
  operation: () => Promise<T> | T,
): Promise<LocalDataTransactionResult<T>> {
  const queued = transactionTail.then(
    () => performTransaction(options, operation),
    () => performTransaction(options, operation),
  );
  transactionTail = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

export function __unsafeResetLocalDataTransactionQueueForTests() {
  transactionTail = Promise.resolve();
}
