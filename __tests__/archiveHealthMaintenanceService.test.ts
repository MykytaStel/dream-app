jest.mock('../src/features/settings/services/archiveHealthService', () => ({
  scanArchiveHealth: jest.fn(),
  getArchiveHealthHistory: jest.fn(),
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
  reportStorageReadFailure: jest.fn(),
}));

import { kv } from '../src/services/storage/mmkv';
import { ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY } from '../src/services/storage/keys';
import {
  getArchiveHealthHistory,
  scanArchiveHealth,
} from '../src/features/settings/services/archiveHealthService';
import {
  ARCHIVE_HEALTH_MAINTENANCE_INTERVAL_MS,
  __unsafeResetArchiveHealthMaintenanceForTests,
  getLatestArchiveHealthStatus,
  runArchiveHealthMaintenance,
} from '../src/features/settings/services/archiveHealthMaintenanceService';

const mockedScan = jest.mocked(scanArchiveHealth);
const mockedHistory = jest.mocked(getArchiveHealthHistory);

const checkedAt = 1_900_000_000_000;
const snapshot = {
  status: 'attention' as const,
  scannedAt: checkedAt,
  dreamCount: 12,
  draftCount: 1,
  editDraftCount: 2,
  tombstoneCount: 3,
  derivedIndexStatus: 'current' as const,
  derivedMetaStatus: 'current' as const,
  issueCount: 4,
  repairableIssueCount: 3,
  criticalCount: 0,
  warningCount: 3,
  infoCount: 1,
  issues: [],
};

describe('archive health maintenance service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    __unsafeResetArchiveHealthMaintenanceForTests();
    mockedScan.mockResolvedValue(snapshot);
    mockedHistory.mockReturnValue([]);
  });

  test('runs one due read-only scan and persists the seven-day cadence', async () => {
    await expect(
      runArchiveHealthMaintenance({ trigger: 'startup', now: checkedAt }),
    ).resolves.toEqual({
      status: 'attempted',
      trigger: 'startup',
      checkedAt,
      healthStatus: 'attention',
      issueCount: 4,
    });

    expect(mockedScan).toHaveBeenCalledWith({ record: true });
    expect(kv.getNumber(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY)).toBe(checkedAt);
  });

  test('uses persisted cadence and returns the newest aggregate health status', async () => {
    kv.set(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY, checkedAt);
    mockedHistory.mockReturnValue([
      {
        id: 'repair-failed',
        kind: 'repair',
        at: checkedAt + 10,
        status: 'failed',
        issueCount: 5,
        repairedIssueCount: 0,
        checkpointCreated: true,
      },
      {
        id: 'scan-attention',
        kind: 'scan',
        at: checkedAt,
        status: 'attention',
        issueCount: 4,
        repairedIssueCount: 0,
        checkpointCreated: false,
      },
    ]);

    await expect(
      runArchiveHealthMaintenance({
        trigger: 'foreground',
        now: checkedAt + 1_000,
      }),
    ).resolves.toEqual({
      status: 'not-due',
      trigger: 'foreground',
      lastCheckAt: checkedAt,
      nextEligibleAt: checkedAt + ARCHIVE_HEALTH_MAINTENANCE_INTERVAL_MS,
      latest: {
        status: 'attention',
        checkedAt,
        issueCount: 4,
      },
    });

    expect(mockedScan).not.toHaveBeenCalled();
    expect(getLatestArchiveHealthStatus()).toEqual({
      status: 'attention',
      checkedAt,
      issueCount: 4,
    });
  });

  test('deduplicates concurrent startup and foreground triggers', async () => {
    const resolveScan: { current: ((value: typeof snapshot) => void) | null } =
      { current: null };
    mockedScan.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveScan.current = resolve;
        }),
    );

    const first = runArchiveHealthMaintenance({
      trigger: 'startup',
      now: checkedAt,
    });
    const second = runArchiveHealthMaintenance({
      trigger: 'foreground',
      now: checkedAt + 1,
    });

    expect(first).toBe(second);
    expect(mockedScan).toHaveBeenCalledTimes(1);

    resolveScan.current?.(snapshot);
    await expect(first).resolves.toMatchObject({ status: 'attempted' });
  });

  test('recovers from a far-future stored timestamp', async () => {
    kv.set(
      ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY,
      checkedAt + ARCHIVE_HEALTH_MAINTENANCE_INTERVAL_MS * 3,
    );

    await expect(
      runArchiveHealthMaintenance({ trigger: 'startup', now: checkedAt }),
    ).resolves.toMatchObject({ status: 'attempted' });

    expect(mockedScan).toHaveBeenCalledTimes(1);
  });

  test('contains failures and consumes the window to avoid retry loops', async () => {
    mockedScan.mockRejectedValueOnce(new Error('scan failed'));

    await expect(
      runArchiveHealthMaintenance({ trigger: 'startup', now: checkedAt }),
    ).resolves.toEqual({
      status: 'failed',
      trigger: 'startup',
      attemptedAt: checkedAt,
      reason: 'health-check-failed',
      latest: null,
    });

    expect(kv.getNumber(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY)).toBe(checkedAt);

    await expect(
      runArchiveHealthMaintenance({
        trigger: 'foreground',
        now: checkedAt + 1,
      }),
    ).resolves.toMatchObject({ status: 'not-due' });
    expect(mockedScan).toHaveBeenCalledTimes(1);
  });
});
