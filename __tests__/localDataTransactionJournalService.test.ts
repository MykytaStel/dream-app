jest.mock('../src/features/settings/services/localDataSnapshotService', () => ({
  parseLocalDataSnapshot: jest.fn((value: unknown) => value),
  restoreLocalDataSnapshot: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import { kv } from '../src/services/storage/mmkv';
import {
  LOCAL_DATA_RECOVERY_HISTORY_STORAGE_KEY,
  LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY,
  LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY,
} from '../src/services/storage/keys';
import { verifyDreamBackupIntegrity } from '../src/features/settings/services/dreamBackupIntegrityService';
import { restoreLocalDataSnapshot } from '../src/features/settings/services/localDataSnapshotService';
import {
  beginLocalDataTransactionJournal,
  clearLocalDataTransactionJournal,
  getLocalDataRecoveryHistory,
  markLocalDataTransactionCommitted,
  quarantineInterruptedLocalDataTransaction,
  recoverInterruptedLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionJournalService';

const mockedRestore = jest.mocked(restoreLocalDataSnapshot);

const snapshot = {
  fixedValues: [
    {
      key: 'dreams',
      value: { type: 'string' as const, value: '[{"id":"dream-1"}]' },
    },
  ],
  editDraftValues: [],
  dreamsReadable: true,
  tombstonesReadable: true,
  draftReadable: true,
  locale: 'uk' as const,
  analysisSettings: { enabled: false },
  reminderSettings: { enabled: false },
  practiceReminderSettings: { enabled: false },
};

describe('local data transaction journal service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    mockedRestore.mockResolvedValue(undefined);
  });

  test('persists a signed prepared journal before mutation', () => {
    const journal = beginLocalDataTransactionJournal({
      label: 'archive-health-repair',
      checkpointFilePath: '/exports/checkpoint.json',
      snapshot: snapshot as never,
      now: 1_800_000_000_000,
    });

    expect(journal).toMatchObject({
      version: 1,
      label: 'archive-health-repair',
      phase: 'prepared',
      checkpointFilePath: '/exports/checkpoint.json',
      integrity: {
        algorithm: 'sha256',
        digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    });

    const raw = kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);
    expect(raw).toBeDefined();
    expect(
      verifyDreamBackupIntegrity(JSON.parse(raw as string), { required: true }),
    ).toBe('verified');
  });

  test('restores a prepared snapshot after an interrupted process', async () => {
    beginLocalDataTransactionJournal({
      label: 'dream-import-replace',
      checkpointFilePath: '/exports/checkpoint.json',
      snapshot: snapshot as never,
    });

    await expect(recoverInterruptedLocalDataTransaction()).resolves.toEqual({
      status: 'recovered',
      transactionLabel: 'dream-import-replace',
      checkpointCreated: true,
    });

    expect(mockedRestore).toHaveBeenCalledWith(snapshot);
    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeUndefined();
    expect(getLocalDataRecoveryHistory()[0]).toMatchObject({
      status: 'recovered',
      transactionLabel: 'dream-import-replace',
      checkpointCreated: true,
    });
  });

  test('clears a committed marker without rolling a successful operation back', async () => {
    const journal = beginLocalDataTransactionJournal({
      label: 'archive-health-repair',
      checkpointFilePath: null,
      snapshot: snapshot as never,
    });
    markLocalDataTransactionCommitted(journal.transactionId);

    await expect(recoverInterruptedLocalDataTransaction()).resolves.toEqual({
      status: 'committed-cleared',
      transactionLabel: 'archive-health-repair',
      checkpointCreated: false,
    });

    expect(mockedRestore).not.toHaveBeenCalled();
    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeUndefined();
  });

  test('blocks and preserves a journal whose signed payload was changed', async () => {
    const journal = beginLocalDataTransactionJournal({
      label: 'dream-import-merge',
      checkpointFilePath: null,
      snapshot: snapshot as never,
    });
    const raw = JSON.parse(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY) as string,
    );
    raw.label = 'changed-after-signing';
    kv.set(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY, JSON.stringify(raw));

    await expect(recoverInterruptedLocalDataTransaction()).resolves.toEqual({
      status: 'blocked',
      reason: 'journal-invalid',
      transactionLabel: null,
      checkpointCreated: false,
    });

    expect(() =>
      clearLocalDataTransactionJournal(journal.transactionId),
    ).toThrow(/invalid transaction journal/);
    expect(mockedRestore).not.toHaveBeenCalled();
    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeDefined();
    expect(getLocalDataRecoveryHistory()[0]).toMatchObject({
      status: 'blocked',
      transactionLabel: null,
      checkpointCreated: false,
    });
  });

  test('keeps a prepared journal when platform restoration fails', async () => {
    beginLocalDataTransactionJournal({
      label: 'archive-health-repair',
      checkpointFilePath: null,
      snapshot: snapshot as never,
    });
    mockedRestore.mockRejectedValueOnce(new Error('notification failure'));

    await expect(recoverInterruptedLocalDataTransaction()).resolves.toEqual({
      status: 'blocked',
      reason: 'restore-failed',
      transactionLabel: 'archive-health-repair',
      checkpointCreated: false,
    });

    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeDefined();
  });

  test('quarantines the exact raw journal before allowing startup to continue', () => {
    beginLocalDataTransactionJournal({
      label: 'dream-import-replace',
      checkpointFilePath: '/exports/checkpoint.json',
      snapshot: snapshot as never,
    });
    const raw = kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);

    expect(quarantineInterruptedLocalDataTransaction()).toBe(true);
    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeUndefined();

    const quarantine = JSON.parse(
      kv.getString(LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY) as string,
    );
    expect(quarantine.journalRaw).toBe(raw);
    expect(getLocalDataRecoveryHistory()[0]).toMatchObject({
      status: 'quarantined',
      transactionLabel: 'dream-import-replace',
    });
  });

  test('refuses to overwrite an unresolved active journal', () => {
    const first = beginLocalDataTransactionJournal({
      label: 'first',
      checkpointFilePath: null,
      snapshot: snapshot as never,
    });

    expect(() =>
      beginLocalDataTransactionJournal({
        label: 'second',
        checkpointFilePath: null,
        snapshot: snapshot as never,
      }),
    ).toThrow(/still requires recovery/);

    clearLocalDataTransactionJournal(first.transactionId);
    expect(
      kv.getString(LOCAL_DATA_RECOVERY_HISTORY_STORAGE_KEY),
    ).toBeUndefined();
  });
});
