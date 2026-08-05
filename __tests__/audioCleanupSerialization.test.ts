jest.mock(
  '../src/features/dreams/services/audioOwnershipStorageService',
  () => ({
    readStoredAudioOwnership: jest.fn(),
  }),
);

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn(),
}));

jest.mock(
  '../src/features/dreams/services/audioRuntimeOwnershipService',
  () => ({
    getAudioRuntimeOwnershipSnapshot: jest.fn(),
  }),
);

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import { cleanupOrphanedAudioFiles } from '../src/features/dreams/services/audioService';
import { readStoredAudioOwnership } from '../src/features/dreams/services/audioOwnershipStorageService';
import { getAudioRuntimeOwnershipSnapshot } from '../src/features/dreams/services/audioRuntimeOwnershipService';
import {
  __unsafeResetAudioCleanupQueueForTests,
  runAudioCleanup,
} from '../src/features/dreams/services/audioCleanupService';

const mockedReadOwnership = jest.mocked(readStoredAudioOwnership);
const mockedCleanup = jest.mocked(cleanupOrphanedAudioFiles);
const mockedRuntimeSnapshot = jest.mocked(getAudioRuntimeOwnershipSnapshot);

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(nextResolve => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('audio cleanup serialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __unsafeResetAudioCleanupQueueForTests();
    mockedRuntimeSnapshot.mockReturnValue({
      recordingActive: false,
      activeRecordingUri: null,
      pendingRecordingUri: null,
    });
    mockedReadOwnership.mockReturnValue({
      protectedUris: [],
      isComplete: true,
      unreadableStorageKeys: [],
    });
  });

  test('queues manual cleanup behind scheduled cleanup instead of overlapping native deletion', async () => {
    const firstDeferred = createDeferred<number>();
    mockedCleanup
      .mockImplementationOnce(() => firstDeferred.promise)
      .mockResolvedValueOnce(3);

    const scheduled = runAudioCleanup({ maxAgeDays: 7 });
    const manual = runAudioCleanup({ maxAgeDays: 0 });

    await Promise.resolve();
    expect(mockedCleanup).toHaveBeenCalledTimes(1);
    expect(mockedCleanup).toHaveBeenNthCalledWith(1, 7, []);

    firstDeferred.resolve(1);
    await scheduled;
    await Promise.resolve();

    expect(mockedCleanup).toHaveBeenCalledTimes(2);
    expect(mockedCleanup).toHaveBeenNthCalledWith(2, 0, []);
    await expect(manual).resolves.toMatchObject({
      status: 'completed',
      deletedCount: 3,
      maxAgeDays: 0,
    });
  });

  test('rechecks runtime state and skips queued deletion when recording starts', async () => {
    const firstDeferred = createDeferred<number>();
    mockedCleanup.mockImplementationOnce(() => firstDeferred.promise);

    const first = runAudioCleanup({ maxAgeDays: 7 });
    const queued = runAudioCleanup({ maxAgeDays: 0 });

    await Promise.resolve();
    expect(mockedCleanup).toHaveBeenCalledTimes(1);

    mockedRuntimeSnapshot.mockReturnValue({
      recordingActive: true,
      activeRecordingUri: 'file:///documents/audio/active.m4a',
      pendingRecordingUri: null,
    });
    firstDeferred.resolve(1);
    await first;

    await expect(queued).resolves.toEqual({
      status: 'skipped',
      reason: 'recording-active',
      protectedUriCount: 0,
      unreadableStorageKeys: [],
      maxAgeDays: 0,
    });
    expect(mockedCleanup).toHaveBeenCalledTimes(1);
    expect(mockedReadOwnership).toHaveBeenCalledTimes(1);
  });
});
