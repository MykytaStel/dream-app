jest.mock(
  '../src/features/settings/services/localDataTransactionService',
  () => {
    class LocalDataTransactionError extends Error {
      operationError: unknown;
      rollbackError: unknown;
      checkpointFilePath: string | null;

      constructor(
        operationError: unknown,
        checkpointFilePath: string | null = null,
      ) {
        super('transaction-failed');
        this.operationError = operationError;
        this.rollbackError = undefined;
        this.checkpointFilePath = checkpointFilePath;
      }
    }

    return {
      runLocalDataTransaction: jest.fn(),
      LocalDataTransactionError,
    };
  },
);

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  replaceAllDreams: jest.fn(),
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
  reportStorageReadFailure: jest.fn(),
}));

import RNFS from 'react-native-fs';
import {
  ARCHIVE_HEALTH_HISTORY_STORAGE_KEY,
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import type { Dream } from '../src/features/dreams/model/dream';
import { rebuildDreamDerivedData } from '../src/features/dreams/repository/dreamDerivedDataRepository';
import { replaceAllDreams } from '../src/features/dreams/repository/dreamsRepository';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionService';
import {
  getArchiveHealthHistory,
  repairArchiveHealth,
  scanArchiveHealth,
} from '../src/features/settings/services/archiveHealthService';

const mockedReplaceDreams = jest.mocked(replaceAllDreams);
const mockedTransaction = jest.mocked(runLocalDataTransaction);

function dream(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dream-1',
    createdAt: 1_800_000_000_000,
    updatedAt: 1_800_000_000_000,
    title: 'Dream',
    text: 'Written dream content',
    ...overrides,
  };
}

function writeArchive(dreams: unknown[]) {
  kv.set(DREAMS_STORAGE_KEY, JSON.stringify(dreams));
  kv.set(DREAM_DELETION_TOMBSTONES_STORAGE_KEY, '[]');
  kv.set(STORAGE_SCHEMA_VERSION_KEY, 12);
  rebuildDreamDerivedData(dreams as Dream[]);
}

describe('archive health service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    (RNFS.exists as jest.Mock).mockReset();
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    mockedReplaceDreams.mockImplementation(dreams => {
      kv.set(DREAMS_STORAGE_KEY, JSON.stringify(dreams));
      rebuildDreamDerivedData(dreams);
    });
    mockedTransaction.mockImplementation(async (_options, operation) => ({
      value: await operation(),
      checkpointFilePath: '/exports/recovery.json',
    }));
  });

  test('reports a structurally consistent local archive as healthy', async () => {
    writeArchive([dream()]);

    await expect(scanArchiveHealth()).resolves.toMatchObject({
      status: 'healthy',
      dreamCount: 1,
      derivedIndexStatus: 'current',
      derivedMetaStatus: 'current',
      issueCount: 0,
      repairableIssueCount: 0,
    });
  });

  test('classifies missing optional audio as a safe repair', async () => {
    writeArchive([dream({ audioUri: 'file:///audio/missing.m4a' })]);
    (RNFS.exists as jest.Mock).mockResolvedValue(false);

    const result = await scanArchiveHealth();

    expect(result.status).toBe('attention');
    expect(result.issues).toContainEqual({
      code: 'missing-dream-audio',
      severity: 'warning',
      repair: 'automatic',
      count: 1,
    });
  });

  test('treats title-only content as recoverable when audio is missing', async () => {
    writeArchive([
      dream({
        text: '',
        title: 'Only title remains',
        audioUri: 'file:///missing.m4a',
      }),
    ]);
    (RNFS.exists as jest.Mock).mockResolvedValue(false);

    await expect(scanArchiveHealth()).resolves.toMatchObject({
      status: 'attention',
      criticalCount: 0,
      repairableIssueCount: 1,
    });
  });

  test('blocks automatic repair for an audio-only dream whose file is missing', async () => {
    writeArchive([
      dream({ title: '', text: '', audioUri: 'file:///audio/missing.m4a' }),
    ]);
    (RNFS.exists as jest.Mock).mockResolvedValue(false);

    const scan = await scanArchiveHealth();
    const repair = await repairArchiveHealth();

    expect(scan.status).toBe('critical');
    expect(scan.issues).toContainEqual({
      code: 'missing-audio-only-dream',
      severity: 'critical',
      repair: 'manual',
      count: 1,
    });
    expect(repair).toMatchObject({
      status: 'blocked',
      reason: 'critical-issues',
      repairedIssueCount: 0,
    });
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  test('creates a checkpoint and removes a broken optional audio reference', async () => {
    writeArchive([dream({ audioUri: 'file:///audio/missing.m4a' })]);
    (RNFS.exists as jest.Mock).mockResolvedValue(false);

    const result = await repairArchiveHealth();

    expect(mockedTransaction).toHaveBeenCalledWith(
      {
        label: 'archive-health-repair',
        checkpointPolicy: 'required',
      },
      expect.any(Function),
    );
    expect(mockedReplaceDreams).toHaveBeenCalledWith([
      expect.not.objectContaining({ audioUri: expect.anything() }),
    ]);
    expect(result).toMatchObject({
      status: 'completed',
      repairedIssueCount: 1,
      checkpointFilePath: '/exports/recovery.json',
      snapshot: { status: 'healthy', issueCount: 0 },
    });
    expect(getArchiveHealthHistory()[0]).toMatchObject({
      kind: 'repair',
      repairedIssueCount: 1,
      checkpointCreated: true,
    });
    expect(kv.getString(ARCHIVE_HEALTH_HISTORY_STORAGE_KEY)).toBeDefined();
  });

  test('detects missing derived stores without mutating them during scan', async () => {
    writeArchive([dream()]);
    kv.remove(DREAMS_INDEX_STORAGE_KEY);
    kv.remove(DREAMS_META_STORAGE_KEY);

    const result = await scanArchiveHealth();

    expect(result).toMatchObject({
      status: 'attention',
      derivedIndexStatus: 'missing',
      derivedMetaStatus: 'missing',
      repairableIssueCount: 2,
    });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'dream-index-missing' }),
        expect.objectContaining({ code: 'dream-meta-missing' }),
      ]),
    );
    expect(kv.getString(DREAMS_INDEX_STORAGE_KEY)).toBeUndefined();
    expect(kv.getString(DREAMS_META_STORAGE_KEY)).toBeUndefined();
  });

  test('distinguishes invalid and stale derived stores', async () => {
    writeArchive([dream()]);
    kv.set(DREAMS_INDEX_STORAGE_KEY, '{broken');
    kv.set(
      DREAMS_META_STORAGE_KEY,
      JSON.stringify({
        totalCount: 99,
        activeCount: 99,
        archivedCount: 0,
        starredCount: 0,
        audioOnlyCount: 0,
        monthKeys: [],
      }),
    );

    await expect(scanArchiveHealth()).resolves.toMatchObject({
      derivedIndexStatus: 'invalid',
      derivedMetaStatus: 'stale',
      repairableIssueCount: 2,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'dream-index-invalid' }),
        expect.objectContaining({ code: 'dream-meta-stale' }),
      ]),
    });
  });

  test('rebuilds only derived data after a required checkpoint', async () => {
    const rawArchive = JSON.stringify([dream()], null, 2);
    kv.set(DREAMS_STORAGE_KEY, rawArchive);
    kv.set(DREAM_DELETION_TOMBSTONES_STORAGE_KEY, '[]');
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 12);
    kv.remove(DREAMS_INDEX_STORAGE_KEY);
    kv.set(DREAMS_META_STORAGE_KEY, '{broken');

    const result = await repairArchiveHealth();

    expect(mockedTransaction).toHaveBeenCalledWith(
      {
        label: 'archive-health-repair',
        checkpointPolicy: 'required',
      },
      expect.any(Function),
    );
    expect(mockedReplaceDreams).not.toHaveBeenCalled();
    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(rawArchive);
    expect(
      JSON.parse(kv.getString(DREAMS_INDEX_STORAGE_KEY) ?? ''),
    ).toHaveLength(1);
    expect(
      JSON.parse(kv.getString(DREAMS_META_STORAGE_KEY) ?? ''),
    ).toMatchObject({
      totalCount: 1,
      activeCount: 1,
    });
    expect(result).toMatchObject({
      status: 'completed',
      repairedIssueCount: 2,
      snapshot: {
        status: 'healthy',
        derivedIndexStatus: 'current',
        derivedMetaStatus: 'current',
      },
    });
  });

  test('returns the recovery checkpoint when a transaction fails after creating it', async () => {
    writeArchive([dream({ audioUri: 'file:///audio/missing.m4a' })]);
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    mockedTransaction.mockRejectedValueOnce(
      new LocalDataTransactionError(
        new Error('late write failed'),
        '/exports/recovery.json',
      ),
    );

    await expect(repairArchiveHealth()).resolves.toMatchObject({
      status: 'failed',
      repairedIssueCount: 0,
      checkpointFilePath: '/exports/recovery.json',
    });
    expect(getArchiveHealthHistory()[0]).toMatchObject({
      kind: 'repair',
      status: 'failed',
      checkpointCreated: true,
    });
  });

  test('treats unreadable dream storage as critical without inspecting derived data', async () => {
    kv.set(DREAMS_STORAGE_KEY, '{broken');
    kv.set(DREAM_DELETION_TOMBSTONES_STORAGE_KEY, '[]');
    kv.set(DREAMS_INDEX_STORAGE_KEY, '{also-broken');
    kv.set(DREAMS_META_STORAGE_KEY, '{also-broken');

    const result = await scanArchiveHealth();

    expect(result).toMatchObject({
      status: 'critical',
      dreamCount: null,
      derivedIndexStatus: null,
      derivedMetaStatus: null,
      criticalCount: 1,
    });
    expect(result.issues[0].code).toBe('dream-store-unreadable');
    expect(mockedReplaceDreams).not.toHaveBeenCalled();
  });
});
