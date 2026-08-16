jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
  reportStorageReadFailure: jest.fn(),
}));

jest.mock('../src/services/storage/migrations', () => ({
  runStorageMigrations: jest.fn(),
}));

jest.mock(
  '../src/features/settings/services/localDataTransactionService',
  () => {
    class LocalDataTransactionError extends Error {
      operationError: unknown;
      rollbackError: unknown;
      checkpointFilePath: string | null;

      constructor(
        operationError: unknown,
        rollbackError?: unknown,
        checkpointFilePath: string | null = null,
      ) {
        super('transaction failed');
        this.name = 'LocalDataTransactionError';
        this.operationError = operationError;
        this.rollbackError = rollbackError;
        this.checkpointFilePath = checkpointFilePath;
      }
    }

    return {
      LocalDataTransactionError,
      runLocalDataTransaction: jest.fn(),
    };
  },
);

import { observability } from '../src/services/observability';
import { reportActionError } from '../src/services/observability/errorReporting';
import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAMS_STORAGE_KEY,
  STORAGE_MIGRATION_HISTORY_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import { runStorageMigrations } from '../src/services/storage/migrations';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionService';
import {
  getStorageMigrationHistory,
  inspectStorageSchemaVersion,
  runStorageMigrationsTransactionally,
} from '../src/services/storage/storageMigrationService';

const mockedMigration = jest.mocked(runStorageMigrations);
const mockedTransaction = jest.mocked(runLocalDataTransaction);
const mockedTrack = jest.mocked(observability.trackEvent);
const mockedReport = jest.mocked(reportActionError);

function installTransactionBoundary() {
  mockedTransaction.mockImplementation(async (_options, operation) => {
    try {
      return {
        value: await operation(),
        checkpointFilePath: null,
      } as never;
    } catch (error) {
      throw new LocalDataTransactionError(error, undefined, null);
    }
  });
}

describe('transactional storage migration service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    installTransactionBoundary();
  });

  test('accepts current numeric and numeric-string schema markers', () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, CURRENT_STORAGE_SCHEMA_VERSION);
    expect(inspectStorageSchemaVersion()).toEqual({
      status: 'current',
      version: CURRENT_STORAGE_SCHEMA_VERSION,
      source: 'number',
    });

    kv.set(STORAGE_SCHEMA_VERSION_KEY, String(CURRENT_STORAGE_SCHEMA_VERSION));
    expect(inspectStorageSchemaVersion()).toEqual({
      status: 'current',
      version: CURRENT_STORAGE_SCHEMA_VERSION,
      source: 'numeric-string',
    });
  });

  test('rejects invalid and newer schema markers without starting a transaction', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 'not-a-version');
    await expect(runStorageMigrationsTransactionally()).resolves.toMatchObject({
      status: 'blocked',
      reason: 'invalid-schema-marker',
      fromVersion: null,
    });

    kv.set(STORAGE_SCHEMA_VERSION_KEY, CURRENT_STORAGE_SCHEMA_VERSION + 1);
    await expect(runStorageMigrationsTransactionally()).resolves.toMatchObject({
      status: 'blocked',
      reason: 'newer-schema',
      fromVersion: CURRENT_STORAGE_SCHEMA_VERSION + 1,
    });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedMigration).not.toHaveBeenCalled();
  });

  test('blocks an unreadable dream store before any migration write', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 1);
    kv.set(DREAMS_STORAGE_KEY, '{broken-json');

    await expect(runStorageMigrationsTransactionally()).resolves.toEqual({
      status: 'blocked',
      reason: 'dream-store-unreadable',
      fromVersion: 1,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedMigration).not.toHaveBeenCalled();
    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe('{broken-json');
  });

  test('migrates a legacy store inside one journaled transaction', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 4);
    kv.set(DREAMS_STORAGE_KEY, '[]');
    mockedMigration.mockImplementation(() => {
      kv.set(STORAGE_SCHEMA_VERSION_KEY, CURRENT_STORAGE_SCHEMA_VERSION);
      return CURRENT_STORAGE_SCHEMA_VERSION;
    });

    await expect(runStorageMigrationsTransactionally()).resolves.toEqual({
      status: 'completed',
      fromVersion: 4,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });

    expect(mockedTransaction).toHaveBeenCalledWith(
      {
        label: `storage-migration-v4-v${CURRENT_STORAGE_SCHEMA_VERSION}`,
        checkpointPolicy: 'none',
      },
      expect.any(Function),
    );
    expect(mockedMigration).toHaveBeenCalledTimes(1);
    expect(kv.getNumber(STORAGE_SCHEMA_VERSION_KEY)).toBe(
      CURRENT_STORAGE_SCHEMA_VERSION,
    );
  });

  test('treats a swallowed or incomplete legacy migration as transaction failure', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 3);
    kv.set(DREAMS_STORAGE_KEY, '[]');
    mockedMigration.mockReturnValue(3);

    await expect(runStorageMigrationsTransactionally()).resolves.toEqual({
      status: 'failed',
      reason: 'migration-incomplete',
      fromVersion: 3,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
      rollbackCompleted: true,
    });
  });

  test('reports incomplete rollback separately from ordinary migration failure', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 2);
    kv.set(DREAMS_STORAGE_KEY, '[]');
    mockedTransaction.mockRejectedValueOnce(
      new LocalDataTransactionError(
        new Error('migration write failed'),
        new Error('rollback failed'),
        null,
      ),
    );

    await expect(runStorageMigrationsTransactionally()).resolves.toEqual({
      status: 'failed',
      reason: 'transaction-failed',
      fromVersion: 2,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
      rollbackCompleted: false,
    });

    expect(mockedReport).toHaveBeenCalledWith(
      'storage_migration.transaction',
      expect.any(LocalDataTransactionError),
      expect.objectContaining({ rollback_completed: false }),
    );
  });

  test('keeps migration history and observability aggregate-only', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 8);
    kv.set(DREAMS_STORAGE_KEY, '[]');
    mockedMigration.mockImplementation(() => {
      kv.set(STORAGE_SCHEMA_VERSION_KEY, CURRENT_STORAGE_SCHEMA_VERSION);
      return CURRENT_STORAGE_SCHEMA_VERSION;
    });

    await runStorageMigrationsTransactionally();

    expect(getStorageMigrationHistory()[0]).toMatchObject({
      status: 'completed',
      fromVersion: 8,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
      reason: null,
    });
    const rawHistory =
      kv.getString(STORAGE_MIGRATION_HISTORY_STORAGE_KEY) ?? '';
    expect(rawHistory).not.toContain('dreams');
    expect(rawHistory).not.toContain('journal');
    expect(rawHistory).not.toContain('checkpointFilePath');
    expect(mockedTrack).toHaveBeenCalledWith(
      'diag.storage_migration_result',
      expect.objectContaining({
        status: 'completed',
        from_version: 8,
        to_version: CURRENT_STORAGE_SCHEMA_VERSION,
      }),
    );
  });
});
