import RNFS from 'react-native-fs';
import {
  loadDreamImportPreview,
  readDreamImportPayload,
  restoreDreamImportPayload,
} from '../src/features/settings/services/dataImportService';
import { runLocalDataTransaction } from '../src/features/settings/services/localDataTransactionService';
import {
  loadValidatedDreamImportPreview,
  restoreDreamImportTransactionally,
} from '../src/features/settings/services/transactionalDreamImportService';

jest.mock('../src/features/settings/services/dataImportService', () => ({
  loadDreamImportPreview: jest.fn(),
  readDreamImportPayload: jest.fn(),
  restoreDreamImportPayload: jest.fn(),
}));

jest.mock(
  '../src/features/settings/services/localDataTransactionService',
  () => {
    class LocalDataTransactionError extends Error {
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
      LocalDataTransactionError,
    };
  },
);

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

const mockedPreview = jest.mocked(loadDreamImportPreview);
const mockedReadPayload = jest.mocked(readDreamImportPayload);
const mockedRestorePayload = jest.mocked(restoreDreamImportPayload);
const mockedTransaction = jest.mocked(runLocalDataTransaction);

const basePreview = {
  fileName: 'backup.json',
  filePath: '/exports/backup.json',
  exportedAt: '2026-08-06T00:00:00.000Z',
  appVersion: '1.0.0',
  locale: 'uk' as const,
  storageSchemaVersion: 12,
  version: 8,
  mode: 'replace' as const,
  settingsAction: 'replace' as const,
  draftAction: 'replace' as const,
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

const rawPayload = { dreams: [validDream] };
const canonicalPayload = {
  version: 8,
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
};

describe('transactional dream import facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (RNFS.readFile as jest.Mock).mockResolvedValue(JSON.stringify(rawPayload));
    mockedPreview.mockResolvedValue(basePreview);
    mockedReadPayload.mockResolvedValue(canonicalPayload as never);
    mockedRestorePayload.mockResolvedValue(basePreview);
    mockedTransaction.mockImplementation(async (_options, operation) => ({
      value: await operation(),
      checkpointFilePath: '/exports/recovery.json',
    }));
  });

  test('attaches preflight health to restore preview', async () => {
    const result = await loadValidatedDreamImportPreview(
      '/exports/backup.json',
      'replace',
    );

    expect(mockedPreview).toHaveBeenCalledWith(
      '/exports/backup.json',
      'replace',
    );
    expect(result.health).toMatchObject({ canRestore: true, warningCount: 0 });
  });

  test('restores the exact canonical payload prepared inside the transaction', async () => {
    const result = await restoreDreamImportTransactionally(
      '/exports/backup.json',
      'replace',
    );

    expect(RNFS.readFile).toHaveBeenCalledTimes(1);
    expect(mockedReadPayload).toHaveBeenCalledWith('/exports/backup.json');
    expect(mockedTransaction).toHaveBeenCalledWith(
      {
        label: 'dream-import-replace',
        checkpointPolicy: 'best-effort',
      },
      expect.any(Function),
    );
    expect(mockedRestorePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        dreams: [expect.objectContaining({ id: 'dream-1' })],
      }),
      '/exports/backup.json',
      'replace',
    );
    expect(result.recoveryCheckpointFilePath).toBe('/exports/recovery.json');
  });

  test('blocks duplicate identities before the transaction or restore write', async () => {
    (RNFS.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ dreams: [validDream, validDream] }),
    );

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toMatchObject({ code: 'duplicate-dream-id' });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedReadPayload).not.toHaveBeenCalled();
    expect(mockedRestorePayload).not.toHaveBeenCalled();
  });

  test('blocks a canonical payload changed while waiting for the queue', async () => {
    mockedReadPayload.mockResolvedValueOnce({
      ...canonicalPayload,
      dreams: [validDream, validDream],
    } as never);

    await expect(
      restoreDreamImportTransactionally('/exports/backup.json', 'replace'),
    ).rejects.toMatchObject({ code: 'duplicate-dream-id' });

    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    expect(mockedRestorePayload).not.toHaveBeenCalled();
  });
});
