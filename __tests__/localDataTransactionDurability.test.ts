jest.mock('../src/features/settings/services/dataExportService', () => ({
  exportDreamDataSnapshot: jest.fn(),
}));

jest.mock('../src/features/settings/services/localDataSnapshotService', () => ({
  captureLocalDataSnapshot: jest.fn(),
  restoreLocalDataSnapshot: jest.fn(),
}));

jest.mock(
  '../src/features/settings/services/localDataTransactionJournalService',
  () => ({
    beginLocalDataTransactionJournal: jest.fn(),
    markLocalDataTransactionCommitted: jest.fn(),
    clearLocalDataTransactionJournal: jest.fn(),
  }),
);

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import { reportActionError } from '../src/services/observability/errorReporting';
import { exportDreamDataSnapshot } from '../src/features/settings/services/dataExportService';
import {
  captureLocalDataSnapshot,
  restoreLocalDataSnapshot,
} from '../src/features/settings/services/localDataSnapshotService';
import {
  beginLocalDataTransactionJournal,
  clearLocalDataTransactionJournal,
  markLocalDataTransactionCommitted,
} from '../src/features/settings/services/localDataTransactionJournalService';
import {
  __unsafeResetLocalDataTransactionQueueForTests,
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionService';

const mockedExport = jest.mocked(exportDreamDataSnapshot);
const mockedCapture = jest.mocked(captureLocalDataSnapshot);
const mockedRestore = jest.mocked(restoreLocalDataSnapshot);
const mockedBegin = jest.mocked(beginLocalDataTransactionJournal);
const mockedCommit = jest.mocked(markLocalDataTransactionCommitted);
const mockedClear = jest.mocked(clearLocalDataTransactionJournal);
const mockedReport = jest.mocked(reportActionError);

const snapshot = {
  fixedValues: [],
  editDraftValues: [],
  dreamsReadable: true,
  tombstonesReadable: true,
  draftReadable: true,
  locale: 'uk' as const,
  analysisSettings: {},
  reminderSettings: {},
  practiceReminderSettings: {},
};

describe('durable local data transaction ordering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __unsafeResetLocalDataTransactionQueueForTests();
    mockedCapture.mockReturnValue(snapshot as never);
    mockedExport.mockResolvedValue({
      filePath: '/exports/checkpoint.json',
      payload: {} as never,
    });
    mockedBegin.mockReturnValue({
      transactionId: 'transaction-1',
    } as never);
    mockedRestore.mockResolvedValue(undefined);
  });

  test('captures after checkpoint, then prepares before mutation and commits before cleanup', async () => {
    const operation = jest.fn(async () => 'done');

    await expect(
      runLocalDataTransaction(
        { label: 'archive-health-repair', checkpointPolicy: 'required' },
        operation,
      ),
    ).resolves.toEqual({
      value: 'done',
      checkpointFilePath: '/exports/checkpoint.json',
    });

    expect(mockedBegin).toHaveBeenCalledWith({
      label: 'archive-health-repair',
      checkpointFilePath: '/exports/checkpoint.json',
      snapshot,
    });
    expect(mockedExport.mock.invocationCallOrder[0]).toBeLessThan(
      mockedCapture.mock.invocationCallOrder[0],
    );
    expect(mockedCapture.mock.invocationCallOrder[0]).toBeLessThan(
      mockedBegin.mock.invocationCallOrder[0],
    );
    expect(mockedBegin.mock.invocationCallOrder[0]).toBeLessThan(
      operation.mock.invocationCallOrder[0],
    );
    expect(operation.mock.invocationCallOrder[0]).toBeLessThan(
      mockedCommit.mock.invocationCallOrder[0],
    );
    expect(mockedCommit.mock.invocationCallOrder[0]).toBeLessThan(
      mockedClear.mock.invocationCallOrder[0],
    );
    expect(mockedCommit).toHaveBeenCalledWith('transaction-1');
    expect(mockedClear).toHaveBeenCalledWith('transaction-1');
  });

  test('rolls back and removes prepared state when the operation fails', async () => {
    const operationError = new Error('late write failed');

    await expect(
      runLocalDataTransaction(
        { label: 'dream-import-replace', checkpointPolicy: 'best-effort' },
        async () => {
          throw operationError;
        },
      ),
    ).rejects.toMatchObject({
      name: 'LocalDataTransactionError',
      operationError,
      rollbackError: undefined,
      checkpointFilePath: '/exports/checkpoint.json',
    });

    expect(mockedCommit).not.toHaveBeenCalled();
    expect(mockedRestore).toHaveBeenCalledWith(snapshot);
    expect(mockedRestore.mock.invocationCallOrder[0]).toBeLessThan(
      mockedClear.mock.invocationCallOrder[0],
    );
  });

  test('treats a failed durable commit marker as a failed transaction', async () => {
    const commitError = new Error('commit marker failed');
    mockedCommit.mockImplementationOnce(() => {
      throw commitError;
    });

    let caught: unknown;
    try {
      await runLocalDataTransaction(
        { label: 'archive-health-repair', checkpointPolicy: 'none' },
        async () => 'operation-result',
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(LocalDataTransactionError);
    expect(caught).toMatchObject({ operationError: commitError });
    expect(mockedRestore).toHaveBeenCalledWith(snapshot);
    expect(mockedClear).toHaveBeenCalledWith('transaction-1');
  });

  test('returns success after a durable commit even if cleanup is deferred', async () => {
    const cleanupError = new Error('journal remove failed');
    mockedClear.mockImplementationOnce(() => {
      throw cleanupError;
    });

    await expect(
      runLocalDataTransaction(
        { label: 'dream-import-merge', checkpointPolicy: 'none' },
        async () => 'merged',
      ),
    ).resolves.toMatchObject({ value: 'merged' });

    expect(mockedRestore).not.toHaveBeenCalled();
    expect(mockedReport).toHaveBeenCalledWith(
      'local_data_transaction.journal_cleanup',
      cleanupError,
      { transaction_label: 'dream-import-merge' },
    );
  });
});
