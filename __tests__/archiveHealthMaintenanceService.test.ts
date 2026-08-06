jest.mock('../src/features/settings/services/archiveHealthService', () => ({
  readArchiveHealth: jest.fn(),
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import { kv } from '../src/services/storage/mmkv';
import {
  ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY,
  ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY,
} from '../src/services/storage/keys';
import { readArchiveHealth } from '../src/features/settings/services/archiveHealthService';
import {
  ARCHIVE_HEALTH_INTERVAL_MS,
  __unsafeResetArchiveHealthMaintenanceForTests,
  getArchiveHealthSummary,
  runArchiveHealthMaintenance,
} from '../src/features/settings/services/archiveHealthMaintenanceService';

const mockedReadHealth = jest.mocked(readArchiveHealth);

const snapshot = {
  status: 'attention' as const,
  archiveReadable: true,
  dreamCount: 12,
  audioReferenceCount: 4,
  checkedAudioCount: 4,
  issues: [
    {
      code: 'missing-audio-file' as const,
      severity: 'warning' as const,
      count: 2,
      repairAction: 'detach-missing-audio' as const,
    },
  ],
  repairActions: ['detach-missing-audio' as const],
  fingerprint: '10:abc',
  checkedAt: 1_900_000_000_000,
};

describe('archive health maintenance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __unsafeResetArchiveHealthMaintenanceForTests();
    kv.remove(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY);
    kv.remove(ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY);
    mockedReadHealth.mockResolvedValue(snapshot);
  });

  test('runs a due read-only check and persists aggregate summary only', async () => {
    await expect(
      runArchiveHealthMaintenance(snapshot.checkedAt),
    ).resolves.toEqual({
      status: 'completed',
      summary: {
        status: 'attention',
        dreamCount: 12,
        audioReferenceCount: 4,
        checkedAt: snapshot.checkedAt,
        issueCount: 2,
        repairActionCount: 1,
      },
    });

    expect(kv.getNumber(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY)).toBe(
      snapshot.checkedAt,
    );
    const raw = kv.getString(ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY) ?? '';
    expect(raw).not.toContain('missing-audio-file');
    expect(raw).not.toContain('audioUri');
    expect(getArchiveHealthSummary()).toMatchObject({
      status: 'attention',
      issueCount: 2,
    });
  });

  test('uses the seven-day persisted cadence across sessions', async () => {
    kv.set(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY, snapshot.checkedAt);
    kv.set(
      ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY,
      JSON.stringify({
        status: 'healthy',
        dreamCount: 10,
        audioReferenceCount: 2,
        checkedAt: snapshot.checkedAt,
        issueCount: 0,
        repairActionCount: 0,
      }),
    );

    const now = snapshot.checkedAt + 1_000;
    await expect(runArchiveHealthMaintenance(now)).resolves.toMatchObject({
      status: 'not-due',
      nextEligibleAt: snapshot.checkedAt + ARCHIVE_HEALTH_INTERVAL_MS,
      summary: { status: 'healthy' },
    });
    expect(mockedReadHealth).not.toHaveBeenCalled();
  });

  test('deduplicates concurrent startup and foreground opportunities', async () => {
    let resolveCheck: ((value: typeof snapshot) => void) | null = null;
    mockedReadHealth.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCheck = resolve;
        }),
    );

    const first = runArchiveHealthMaintenance(snapshot.checkedAt);
    const second = runArchiveHealthMaintenance(snapshot.checkedAt + 1);

    expect(first).toBe(second);
    expect(mockedReadHealth).toHaveBeenCalledTimes(1);
    resolveCheck?.(snapshot);
    await first;
  });
});
