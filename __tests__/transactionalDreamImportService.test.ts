import {
  createDreamImportPreviewFromPayload,
  readDreamImportPayload,
  restoreDreamImportPayload,
} from '../src/features/settings/services/dataImportService';
import { DreamBackupIntegrityError } from '../src/features/settings/services/dreamBackupIntegrityService';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionService';
import {
  __unsafeResetDreamImportPreviewGuardsForTests,
  loadValidatedDreamImportPreview,
  restoreDreamImportTransactionally,
} from '../src/features/settings/services/transactionalDreamImportService';

jest.mock('../src/features/settings/services/dataImportService', () => ({
  createDreamImportPreviewFromPayload: jest.fn(),
  readDreamImportPayload: jest.fn(),
  restoreDreamImportPayload: jest.fn(),
}));

jest.mock(
  '../src/features/settings/services/localDataTransactionService',
  () => {
    class MockLocalDataTransactionError extends Error {
      operationError: unknown;
      rollbackError: unknown;
      checkpointFilePath: string | null;

      constructor(operationError: unknown) {
        super('transaction-failed');
        this.operationError = operationError;
        this.rollbackError = undefined;
        this.checkpointFilePath = null;
      }
    }

    return {
      runLocalDataTransaction: jest.fn(),
      LocalDataTransactionError: MockLocalDataTransactionError,
    };
  },
);

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

const mockedCreatePreview = jest.mocked(createDreamImportPreviewFromPayload);
const mockedReadPayload = jest.mocked(readDreamImportPayload);
const mockedRestorePayload = jest.mocked(restoreDreamImportPayload);
const mockedTransaction = jest.mocked(runLocalDataTransaction);

const sourceDigest = 'a'.repeat(64);
const changedSourceDigest = 'b'.repeat(64);

const basePreview = {
  fileName: 'backup.json',
  filePath: '/exports/backup.json',
  exportedAt: '2026-08-06T00:00:00.000Z',
  appVersion: '1.0.0',
  locale: 'uk' as const,
  storageSchemaVersion: 12,
  version: 9,
  mode: 'replace' as const,
  settingsAction: 'replace' as const,
  draftAction: 'replace' as const,
  integrityStatus: 'verified' as const,
  integrityAlgorithm: 'sha256' as const,
  sourceDigest,
  summary: {
    dreamCount: 1,
    archivedDreamCount: 0,
    audioDreamCount: 0,
    transcribedDreamCount: 0,
    editedTranscriptCount: 0,
    analyzedDreamCount: 0,
    starredDreamCount: 0,
    draftIncluded: false,
  },
  diff: {
    currentDreamCount: 0,
    importDreamCount: 1,
    overlappingDreamCount: 0,
    newDreamCount: 1,
    resultingDreamCount: 1,
  },
};

const validDream = {
  id: 'dream-1',
  createdAt: 1_800_000_000_000,
  updatedAt: 1_800_000_000_000,
  title: 'Dream',
  text: 'A valid dream.',
  sleepDate: '2027-01-15',
  tags: [] as string[],
};

const canonicalPayload = {
  version: 9,
  exportedAt: '2026-08-06T00:00:00.000Z',
  appVersion: '1.0.0',
  platform: 'ios' as const,
  locale: 'uk' as const,
  storageSchemaVersion: 12,
  summary: basePreview.summary,
  dreams: [validDream],
  draft: null,
  reminderSettings: {
    enabled: false,
    hour: 8,
    minute: 0,
    style: 'balanced' as const,
  },
  practiceReminderSettings: {
    morning_capture: { enabled: false, hour: 7, minute: 15 },
    reality_checks: {
      enabled: false,
      startHour: 10,
      endHour: 18,
      intervalHours: 4,
    },
    evening_intention: { enabled: false, hour: 21, minute: 15 },
    wbtb: { enabled: false, hour: 4, minute: 30 },
  },
  analysisSettings: {
    enabled: false,
    provider: 'manual' as const,
    allowNetwork: false,
  },
  reviewState: {
    updatedAt: 0,
    savedMonths: [],
    savedThreads: [],
  },
  integrity: {
    algorithm: 'sha256' as const,
    digest: sourceDigest,
  },
  integrityStatus: 'verified' as const,
  sourceDigest,
};

describe('transactional dream import facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __unsafeResetDreamImportPreviewGuardsForTests();
    mockedCreatePreview.mockReturnValue(basePreview);
    mockedReadPayload.mockResolvedValue(canonicalPayload);
    mockedRestorePayload.mockResolvedValue(basePreview);
    mockedTransaction.mockImplementation(async (_options, operation) => ({
      value: await operation(),
      checkpointFilePath: '/exports/recovery.json',
    }));
  });

  test('builds preview and health from one exact verified payload', async () => {
    const result = await loadValidatedDreamImportPreview(
      '/exports/backup.json',
      'replace',
    );

    expect(mockedReadPayload).toHaveBeenCalledTimes(1);
    expect(mockedCreatePreview).toHaveBeenCalledWith(
      canonicalPayload,
      '/exports/backup.json',
      'replace',
    );
    expect(result).toMatchObject({
      integrityStatus: 'verified',
      sourceDigest,
      health: { canRestore: true, warningCount: 0 },
    });
  });

  test('revalidates and restores the same fingerprint inside the transaction', async () => {
    const result = await restoreDreamImportTransactionally(
      '/exports/backup.json',
      'replace',
    );

    expect(mockedReadPayload).toHaveBeenCalledTimes(2);
    expect(mockedTransaction).toHaveBeenCalledWith(
      {
        label: 'dream-import-replace',
        checkpointPolicy: 'best-effort',
      },
      expect.any(Function),
    );
    expect(mockedRestorePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        integrityStatus: 'verified',
        sourceDigest,
        dreams: [expect.objectContaining({ id: 'dream-1' })],
      }),
      '/exports/backup.json',
      'replace',
    );
    expect(result.recoveryCheckpointFilePath).toBe('/exports/recovery.json');
  });

  test('blocks a file changed after the user reviewed its preview', async () => {
    await loadValidatedDreamImportPreview('/exports/backup.json', 'replace');
    mockedReadPayload.mockResolvedValueOnce({
      ...canonicalPayload,
      sourceDigest: changedSourceDigest,
    });

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toMatchObject({ code: 'integrity-preview-changed' });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedRestorePayload).not.toHaveBeenCalled();
  });

  test('blocks a file changed while waiting in the mutation queue', async () => {
    mockedReadPayload
      .mockResolvedValueOnce(canonicalPayload)
      .mockResolvedValueOnce({
        ...canonicalPayload,
        sourceDigest: changedSourceDigest,
      });

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toMatchObject({ code: 'integrity-preview-changed' });

    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    expect(mockedRestorePayload).not.toHaveBeenCalled();
  });

  test('blocks duplicate identities before the transaction or restore write', async () => {
    mockedReadPayload.mockResolvedValueOnce({
      ...canonicalPayload,
      dreams: [validDream, validDream],
    });

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toMatchObject({ code: 'duplicate-dream-id' });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedRestorePayload).not.toHaveBeenCalled();
  });

  test('blocks integrity failure before creating a transaction checkpoint', async () => {
    const integrityError = new DreamBackupIntegrityError('integrity-mismatch');
    mockedReadPayload.mockRejectedValueOnce(integrityError);

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toBe(integrityError);

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedRestorePayload).not.toHaveBeenCalled();
  });

  test('unwraps an integrity change detected inside the transaction', async () => {
    const integrityError = new DreamBackupIntegrityError(
      'integrity-preview-changed',
    );
    mockedTransaction.mockRejectedValueOnce(
      new LocalDataTransactionError(integrityError),
    );

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toBe(integrityError);
  });
});
