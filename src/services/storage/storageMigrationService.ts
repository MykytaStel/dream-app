import { observability } from '../observability';
import { DIAG_EVENTS } from '../observability/events';
import {
  reportActionError,
  reportStorageReadFailure,
} from '../observability/errorReporting';
import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAMS_STORAGE_KEY,
  STORAGE_MIGRATION_HISTORY_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from './keys';
import { kv } from './mmkv';
import { runStorageMigrations } from './migrations';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../../features/settings/services/localDataTransactionService';

const STORAGE_MIGRATION_HISTORY_LIMIT = 20;

type StorageSchemaSource = 'missing' | 'number' | 'numeric-string';

export type StorageSchemaInspection =
  | {
      status: 'legacy' | 'current' | 'newer';
      version: number;
      source: StorageSchemaSource;
    }
  | {
      status: 'invalid';
      version: null;
      source: 'number' | 'string' | 'boolean' | 'unknown';
    };

export type StorageMigrationBlockReason =
  'invalid-schema-marker' | 'newer-schema' | 'dream-store-unreadable';

export type StorageMigrationFailureReason =
  | 'migration-incomplete'
  | 'migration-postflight-invalid'
  | 'transaction-failed';

type StorageMigrationHistoryReason =
  StorageMigrationBlockReason | StorageMigrationFailureReason;

export type StorageMigrationResult =
  | {
      status: 'current';
      fromVersion: number;
      toVersion: number;
    }
  | {
      status: 'completed';
      fromVersion: number;
      toVersion: number;
    }
  | {
      status: 'blocked';
      reason: StorageMigrationBlockReason;
      fromVersion: number | null;
      toVersion: number;
    }
  | {
      status: 'failed';
      reason: StorageMigrationFailureReason;
      fromVersion: number;
      toVersion: number;
      rollbackCompleted: boolean | null;
    };

export type StorageMigrationHistoryEntry = {
  id: string;
  at: number;
  status: 'completed' | 'failed';
  fromVersion: number;
  toVersion: number;
  reason: StorageMigrationFailureReason | null;
  rollbackCompleted: boolean | null;
};

class StorageMigrationContractError extends Error {
  constructor(
    readonly code: 'migration-incomplete' | 'migration-postflight-invalid',
  ) {
    super(code);
    this.name = 'StorageMigrationContractError';
  }
}

function isMigrationReason(
  value: unknown,
): value is StorageMigrationHistoryReason {
  return (
    value === 'invalid-schema-marker' ||
    value === 'newer-schema' ||
    value === 'dream-store-unreadable' ||
    value === 'migration-incomplete' ||
    value === 'migration-postflight-invalid' ||
    value === 'transaction-failed'
  );
}

function readTypedSchemaValue() {
  const numberValue = kv.getNumber(STORAGE_SCHEMA_VERSION_KEY);
  if (numberValue !== undefined) {
    return { type: 'number' as const, value: numberValue };
  }

  const stringValue = kv.getString(STORAGE_SCHEMA_VERSION_KEY);
  if (stringValue !== undefined) {
    return { type: 'string' as const, value: stringValue };
  }

  const booleanValue = kv.getBoolean(STORAGE_SCHEMA_VERSION_KEY);
  if (booleanValue !== undefined) {
    return { type: 'boolean' as const, value: booleanValue };
  }

  return { type: 'missing' as const };
}

function classifyVersion(version: number, source: StorageSchemaSource) {
  if (version > CURRENT_STORAGE_SCHEMA_VERSION) {
    return { status: 'newer' as const, version, source };
  }
  if (version === CURRENT_STORAGE_SCHEMA_VERSION) {
    return { status: 'current' as const, version, source };
  }
  return { status: 'legacy' as const, version, source };
}

export function inspectStorageSchemaVersion(): StorageSchemaInspection {
  const stored = readTypedSchemaValue();
  if (stored.type === 'missing') {
    return classifyVersion(1, 'missing');
  }

  if (stored.type === 'number') {
    if (
      Number.isFinite(stored.value) &&
      Number.isInteger(stored.value) &&
      stored.value >= 1
    ) {
      return classifyVersion(stored.value, 'number');
    }
    return { status: 'invalid', version: null, source: 'number' };
  }

  if (stored.type === 'string') {
    const trimmed = stored.value.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number(trimmed);
      if (Number.isSafeInteger(parsed) && parsed >= 1) {
        return classifyVersion(parsed, 'numeric-string');
      }
    }
    return { status: 'invalid', version: null, source: 'string' };
  }

  return { status: 'invalid', version: null, source: 'boolean' };
}

function isDreamStoreReadable() {
  const hasKey = kv.getAllKeys().includes(DREAMS_STORAGE_KEY);
  if (!hasKey) {
    return true;
  }

  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (raw === undefined) {
    return false;
  }

  try {
    return Array.isArray(JSON.parse(raw) as unknown);
  } catch (error) {
    reportStorageReadFailure(DREAMS_STORAGE_KEY, error);
    return false;
  }
}

function readHistory(): StorageMigrationHistoryEntry[] {
  const raw = kv.getString(STORAGE_MIGRATION_HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry): entry is StorageMigrationHistoryEntry => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          return false;
        }
        const record = entry as Record<string, unknown>;
        return (
          typeof record.id === 'string' &&
          typeof record.at === 'number' &&
          Number.isFinite(record.at) &&
          (record.status === 'completed' || record.status === 'failed') &&
          typeof record.fromVersion === 'number' &&
          Number.isInteger(record.fromVersion) &&
          typeof record.toVersion === 'number' &&
          Number.isInteger(record.toVersion) &&
          (record.reason === null ||
            (isMigrationReason(record.reason) &&
              record.reason !== 'invalid-schema-marker' &&
              record.reason !== 'newer-schema' &&
              record.reason !== 'dream-store-unreadable')) &&
          (record.rollbackCompleted === null ||
            typeof record.rollbackCompleted === 'boolean')
        );
      })
      .slice(0, STORAGE_MIGRATION_HISTORY_LIMIT);
  } catch (error) {
    reportStorageReadFailure(STORAGE_MIGRATION_HISTORY_STORAGE_KEY, error);
    return [];
  }
}

function recordHistory(entry: Omit<StorageMigrationHistoryEntry, 'id' | 'at'>) {
  const at = Date.now();
  const next = [
    {
      ...entry,
      at,
      id: `${entry.status}:${at}:${Math.random().toString(36).slice(2, 8)}`,
    },
    ...readHistory(),
  ].slice(0, STORAGE_MIGRATION_HISTORY_LIMIT);

  try {
    kv.set(STORAGE_MIGRATION_HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    reportActionError('storage_migration.history', error);
  }
}

function trackResult(result: StorageMigrationResult) {
  try {
    observability.trackEvent(DIAG_EVENTS.StorageMigrationResult, {
      status: result.status,
      from_version: result.fromVersion,
      to_version: result.toVersion,
      reason:
        result.status === 'blocked' || result.status === 'failed'
          ? result.reason
          : null,
      rollback_completed:
        result.status === 'failed' ? result.rollbackCompleted : null,
    });
  } catch (error) {
    reportActionError('storage_migration.observability', error);
  }
}

function completeResult(result: StorageMigrationResult) {
  if (result.status === 'completed') {
    recordHistory({
      status: 'completed',
      fromVersion: result.fromVersion,
      toVersion: result.toVersion,
      reason: null,
      rollbackCompleted: null,
    });
  } else if (result.status === 'failed') {
    recordHistory({
      status: 'failed',
      fromVersion: result.fromVersion,
      toVersion: result.toVersion,
      reason: result.reason,
      rollbackCompleted: result.rollbackCompleted,
    });
  }
  trackResult(result);
  return result;
}

export function getStorageMigrationHistory() {
  return readHistory();
}

export async function runStorageMigrationsTransactionally(): Promise<StorageMigrationResult> {
  const inspection = inspectStorageSchemaVersion();

  if (inspection.status === 'invalid') {
    return completeResult({
      status: 'blocked',
      reason: 'invalid-schema-marker',
      fromVersion: null,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });
  }

  if (inspection.status === 'newer') {
    return completeResult({
      status: 'blocked',
      reason: 'newer-schema',
      fromVersion: inspection.version,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });
  }

  if (inspection.status === 'current') {
    return completeResult({
      status: 'current',
      fromVersion: inspection.version,
      toVersion: inspection.version,
    });
  }

  if (!isDreamStoreReadable()) {
    return completeResult({
      status: 'blocked',
      reason: 'dream-store-unreadable',
      fromVersion: inspection.version,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });
  }

  const fromVersion = inspection.version;
  try {
    await runLocalDataTransaction(
      {
        label: `storage-migration-v${fromVersion}-v${CURRENT_STORAGE_SCHEMA_VERSION}`,
        // A legacy archive may not be exportable by the current backup schema.
        // The signed exact journal is the authoritative crash rollback here.
        checkpointPolicy: 'none',
      },
      () => {
        const migratedVersion = runStorageMigrations();
        const after = inspectStorageSchemaVersion();

        if (
          migratedVersion !== CURRENT_STORAGE_SCHEMA_VERSION ||
          after.status !== 'current'
        ) {
          throw new StorageMigrationContractError('migration-incomplete');
        }

        if (!isDreamStoreReadable()) {
          throw new StorageMigrationContractError(
            'migration-postflight-invalid',
          );
        }

        return migratedVersion;
      },
    );

    return completeResult({
      status: 'completed',
      fromVersion,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });
  } catch (error) {
    const operationError =
      error instanceof LocalDataTransactionError ? error.operationError : error;
    const reason =
      operationError instanceof StorageMigrationContractError
        ? operationError.code
        : 'transaction-failed';
    const rollbackCompleted =
      error instanceof LocalDataTransactionError ? !error.rollbackError : null;

    reportActionError('storage_migration.transaction', error, {
      from_version: fromVersion,
      to_version: CURRENT_STORAGE_SCHEMA_VERSION,
      reason,
      rollback_completed: rollbackCompleted,
    });

    return completeResult({
      status: 'failed',
      reason,
      fromVersion,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
      rollbackCompleted,
    });
  }
}
