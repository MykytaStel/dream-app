jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
  reportStorageReadFailure: jest.fn(),
  reportError: jest.fn(),
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

import {
  APP_LOCALE_KEY,
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAMS_STORAGE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY,
  PINNED_DREAM_THREADS_STORAGE_KEY,
  REMINDER_SETTINGS_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import { runLocalDataTransaction } from '../src/features/settings/services/localDataTransactionService';
import { runStorageMigrationsTransactionally } from '../src/services/storage/storageMigrationService';

const mockedTransaction = jest.mocked(runLocalDataTransaction);

describe('legacy storage migration flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    mockedTransaction.mockImplementation(
      async (_options, operation) =>
        ({
          value: await operation(),
          checkpointFilePath: null,
        }) as never,
    );
  });

  test('preserves legacy dream content and settings while reaching schema v12', async () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 1);
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy-dream',
          createdAt: 100,
          title: 'Old title',
          text: 'Old text',
          audioPath: 'file:///legacy-audio.m4a',
          mood: 'peaceful',
          tags: ['oneiric'],
        },
      ]),
    );
    kv.set(
      REMINDER_SETTINGS_KEY,
      JSON.stringify({ enabled: true, time: '06:45', style: 'gentle' }),
    );
    kv.set(APP_LOCALE_KEY, 'ua');
    kv.set(
      DREAM_ANALYSIS_SETTINGS_KEY,
      JSON.stringify({ enabled: true, provider: 'openai', allowNetwork: true }),
    );
    kv.set(
      MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY,
      JSON.stringify([{ monthKey: '2026-07', savedAt: 20 }]),
    );
    kv.set(
      PINNED_DREAM_THREADS_STORAGE_KEY,
      JSON.stringify([{ signal: 'ocean', kind: 'symbol', savedAt: 30 }]),
    );

    await expect(runStorageMigrationsTransactionally()).resolves.toEqual({
      status: 'completed',
      fromVersion: 1,
      toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    });

    expect(kv.getNumber(STORAGE_SCHEMA_VERSION_KEY)).toBe(
      CURRENT_STORAGE_SCHEMA_VERSION,
    );
    expect(JSON.parse(kv.getString(DREAMS_STORAGE_KEY) as string)).toEqual([
      expect.objectContaining({
        id: 'legacy-dream',
        title: 'Old title',
        text: 'Old text',
        audioUri: 'file:///legacy-audio.m4a',
        mood: 'peaceful',
        tags: ['oneiric'],
      }),
    ]);
    expect(JSON.parse(kv.getString(REMINDER_SETTINGS_KEY) as string)).toEqual({
      enabled: true,
      hour: 6,
      minute: 45,
      style: 'gentle',
    });
    expect(kv.getString(APP_LOCALE_KEY)).toBe('uk');
    expect(
      JSON.parse(kv.getString(DREAM_ANALYSIS_SETTINGS_KEY) as string),
    ).toEqual({ enabled: true, provider: 'openai', allowNetwork: true });
    expect(
      JSON.parse(kv.getString(REVIEW_SAVED_STATE_STORAGE_KEY) as string),
    ).toMatchObject({
      savedMonths: [{ monthKey: '2026-07', savedAt: 20 }],
      savedThreads: [{ signal: 'ocean', kind: 'symbol', savedAt: 30 }],
      syncStatus: 'local',
    });
  });
});
