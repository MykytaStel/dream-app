jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
  reportStorageReadFailure: jest.fn(),
}));

jest.mock('../src/services/storage/mmkv', () => ({
  kv: {
    getNumber: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../src/features/dreams/services/audioCleanupService', () => ({
  runAudioCleanup: jest.fn(),
}));

jest.mock(
  '../src/features/dreams/services/audioRuntimeOwnershipService',
  () => ({
    getAudioRuntimeOwnershipSnapshot: jest.fn(),
  }),
);

import { kv } from '../src/services/storage/mmkv';
import { runAudioCleanup } from '../src/features/dreams/services/audioCleanupService';
import { getAudioRuntimeOwnershipSnapshot } from '../src/features/dreams/services/audioRuntimeOwnershipService';
import {
  __unsafeResetAudioCleanupMaintenanceForTests,
  runAudioCleanupMaintenance,
} from '../src/features/dreams/services/audioCleanupMaintenanceService';

const mockedCleanup = jest.mocked(runAudioCleanup);
const mockedRuntime = jest.mocked(getAudioRuntimeOwnershipSnapshot);

describe('audio cleanup maintenance queued deferral', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __unsafeResetAudioCleanupMaintenanceForTests();
    (kv.getNumber as jest.Mock).mockReturnValue(undefined);
    mockedRuntime.mockReturnValue({
      recordingActive: false,
      activeRecordingUri: null,
      pendingRecordingUri: null,
    });
  });

  test('does not consume the daily window when recording begins inside the shared cleanup queue', async () => {
    mockedCleanup.mockResolvedValue({
      status: 'skipped',
      reason: 'recording-active',
      protectedUriCount: 0,
      unreadableStorageKeys: [],
      maxAgeDays: 7,
    });

    await expect(
      runAudioCleanupMaintenance({
        trigger: 'foreground',
        now: 1_800_000_000_000,
        maxAgeDays: 7,
      }),
    ).resolves.toEqual({
      status: 'deferred',
      trigger: 'foreground',
      reason: 'recording-active',
    });

    expect(kv.set).not.toHaveBeenCalled();
  });
});
