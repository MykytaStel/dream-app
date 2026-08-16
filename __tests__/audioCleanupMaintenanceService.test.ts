jest.mock('../src/features/dreams/services/audioCleanupService', () => ({
  runAudioCleanup: jest.fn(),
}));

jest.mock(
  '../src/features/dreams/services/audioRuntimeOwnershipService',
  () => ({
    getAudioRuntimeOwnershipSnapshot: jest.fn(),
  }),
);

jest.mock('../src/services/observability', () => ({
  observability: {
    trackEvent: jest.fn(),
  },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
  reportStorageReadFailure: jest.fn(),
}));

import { runAudioCleanup } from '../src/features/dreams/services/audioCleanupService';
import {
  AUDIO_CLEANUP_MAINTENANCE_INTERVAL_MS,
  __unsafeResetAudioCleanupMaintenanceForTests,
  runAudioCleanupMaintenance,
} from '../src/features/dreams/services/audioCleanupMaintenanceService';
import { getAudioRuntimeOwnershipSnapshot } from '../src/features/dreams/services/audioRuntimeOwnershipService';
import { observability } from '../src/services/observability';
import {
  reportActionError,
  reportStorageReadFailure,
} from '../src/services/observability/errorReporting';
import { AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY } from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';

const mockedRunAudioCleanup = runAudioCleanup as jest.MockedFunction<
  typeof runAudioCleanup
>;
const mockedRuntimeSnapshot =
  getAudioRuntimeOwnershipSnapshot as jest.MockedFunction<
    typeof getAudioRuntimeOwnershipSnapshot
  >;

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(nextResolve => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('audioCleanupMaintenanceService', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
    __unsafeResetAudioCleanupMaintenanceForTests();
    mockedRuntimeSnapshot.mockReturnValue({
      recordingActive: false,
      activeRecordingUri: null,
      pendingRecordingUri: 'file:///pending.m4a',
    });
    mockedRunAudioCleanup.mockResolvedValue({
      status: 'completed',
      deletedCount: 2,
      protectedUriCount: 4,
      maxAgeDays: 7,
    });
  });

  test('runs when due, forwards runtime ownership and persists the attempt', async () => {
    const now = 1_800_000_000_000;

    await expect(
      runAudioCleanupMaintenance({ trigger: 'startup', now }),
    ).resolves.toEqual({
      status: 'attempted',
      trigger: 'startup',
      attemptedAt: now,
      cleanup: {
        status: 'completed',
        deletedCount: 2,
        protectedUriCount: 4,
        maxAgeDays: 7,
      },
    });

    expect(mockedRunAudioCleanup).toHaveBeenCalledWith({
      maxAgeDays: undefined,
      activeRecordingUri: null,
      pendingRecordingUri: 'file:///pending.m4a',
    });
    expect(kv.getNumber(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY)).toBe(now);
    expect(observability.trackEvent).toHaveBeenCalledWith(
      'diag.audio_cleanup_maintenance',
      expect.objectContaining({
        trigger: 'startup',
        status: 'attempted',
        reason: 'completed',
        deleted_count: 2,
      }),
    );
  });

  test('does not run twice inside the persisted 24-hour window', async () => {
    const now = 1_800_000_000_000;
    kv.set(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY, now - 1_000);

    await expect(
      runAudioCleanupMaintenance({ trigger: 'foreground', now }),
    ).resolves.toEqual({
      status: 'not-due',
      trigger: 'foreground',
      lastAttemptAt: now - 1_000,
      nextEligibleAt: now - 1_000 + AUDIO_CLEANUP_MAINTENANCE_INTERVAL_MS,
    });

    expect(mockedRunAudioCleanup).not.toHaveBeenCalled();
  });

  test('defers while recording and retries without consuming the daily window', async () => {
    const now = 1_800_000_000_000;
    mockedRuntimeSnapshot.mockReturnValueOnce({
      recordingActive: true,
      activeRecordingUri: 'file:///active.m4a',
      pendingRecordingUri: null,
    });

    await expect(
      runAudioCleanupMaintenance({ trigger: 'startup', now }),
    ).resolves.toEqual({
      status: 'deferred',
      trigger: 'startup',
      reason: 'recording-active',
    });
    expect(
      kv.getNumber(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY),
    ).toBeUndefined();

    await expect(
      runAudioCleanupMaintenance({ trigger: 'recording-ended', now: now + 1 }),
    ).resolves.toMatchObject({
      status: 'attempted',
      trigger: 'recording-ended',
    });
    expect(mockedRunAudioCleanup).toHaveBeenCalledTimes(1);
  });

  test('deduplicates concurrent lifecycle triggers onto one operation', async () => {
    const deferred =
      createDeferred<Awaited<ReturnType<typeof runAudioCleanup>>>();
    mockedRunAudioCleanup.mockImplementation(() => deferred.promise);

    const first = runAudioCleanupMaintenance({
      trigger: 'startup',
      now: 1_800_000_000_000,
    });
    const second = runAudioCleanupMaintenance({
      trigger: 'foreground',
      now: 1_800_000_000_001,
    });

    expect(first).toBe(second);
    expect(mockedRunAudioCleanup).toHaveBeenCalledTimes(1);

    deferred.resolve({
      status: 'completed',
      deletedCount: 1,
      protectedUriCount: 2,
      maxAgeDays: 7,
    });
    await expect(first).resolves.toMatchObject({
      status: 'attempted',
      trigger: 'startup',
    });
  });

  test('a far-future stored timestamp is reported but cannot disable cleanup', async () => {
    const now = 1_800_000_000_000;
    kv.set(
      AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY,
      now + AUDIO_CLEANUP_MAINTENANCE_INTERVAL_MS * 2,
    );

    await expect(
      runAudioCleanupMaintenance({ trigger: 'startup', now }),
    ).resolves.toMatchObject({ status: 'attempted' });

    expect(reportStorageReadFailure).toHaveBeenCalledWith(
      AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY,
      expect.any(Error),
    );
    expect(mockedRunAudioCleanup).toHaveBeenCalledTimes(1);
  });

  test('skipped and failed cleanup outcomes still throttle repeated maintenance', async () => {
    const now = 1_800_000_000_000;
    mockedRunAudioCleanup.mockResolvedValueOnce({
      status: 'skipped',
      reason: 'ownership-incomplete',
      protectedUriCount: 1,
      unreadableStorageKeys: ['dreams'],
      maxAgeDays: 7,
    });

    await runAudioCleanupMaintenance({ trigger: 'startup', now });
    __unsafeResetAudioCleanupMaintenanceForTests();
    await runAudioCleanupMaintenance({ trigger: 'foreground', now: now + 100 });

    expect(mockedRunAudioCleanup).toHaveBeenCalledTimes(1);
  });

  test('unexpected integration errors are reported and do not crash startup', async () => {
    const now = 1_800_000_000_000;
    mockedRunAudioCleanup.mockRejectedValueOnce(new Error('unexpected'));

    await expect(
      runAudioCleanupMaintenance({ trigger: 'startup', now }),
    ).resolves.toEqual({
      status: 'failed',
      trigger: 'startup',
      attemptedAt: now,
      reason: 'maintenance-failed',
    });

    expect(reportActionError).toHaveBeenCalledWith(
      'audio_cleanup_maintenance.run',
      expect.any(Error),
      { trigger: 'startup' },
    );
    expect(kv.getNumber(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY)).toBe(now);
  });
});
