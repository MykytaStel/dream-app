jest.mock(
  '../src/features/dreams/services/audioOwnershipStorageService',
  () => ({
    readStoredAudioOwnership: jest.fn(),
  }),
);

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn(),
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import { cleanupOrphanedAudioFiles } from '../src/features/dreams/services/audioService';
import { readStoredAudioOwnership } from '../src/features/dreams/services/audioOwnershipStorageService';
import {
  DEFAULT_AUDIO_CLEANUP_MAX_AGE_DAYS,
  runAudioCleanup,
} from '../src/features/dreams/services/audioCleanupService';
import { reportActionError } from '../src/services/observability/errorReporting';

const mockedReadOwnership = readStoredAudioOwnership as jest.MockedFunction<
  typeof readStoredAudioOwnership
>;
const mockedCleanup = cleanupOrphanedAudioFiles as jest.MockedFunction<
  typeof cleanupOrphanedAudioFiles
>;
const mockedReportActionError = reportActionError as jest.MockedFunction<
  typeof reportActionError
>;

describe('audio cleanup orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('forwards every protected URI only after a complete ownership read', async () => {
    mockedReadOwnership.mockReturnValue({
      protectedUris: [
        'file:///audio/saved.m4a',
        'file:///audio/draft.m4a',
        'file:///audio/pending.m4a',
      ],
      isComplete: true,
      unreadableStorageKeys: [],
    });
    mockedCleanup.mockResolvedValue(2);

    const result = await runAudioCleanup({
      maxAgeDays: 14,
      activeRecordingUri: 'file:///audio/active.m4a',
      pendingRecordingUri: 'file:///audio/pending.m4a',
    });

    expect(mockedReadOwnership).toHaveBeenCalledWith({
      activeRecordingUri: 'file:///audio/active.m4a',
      pendingRecordingUri: 'file:///audio/pending.m4a',
    });
    expect(mockedCleanup).toHaveBeenCalledWith(14, [
      'file:///audio/saved.m4a',
      'file:///audio/draft.m4a',
      'file:///audio/pending.m4a',
    ]);
    expect(result).toEqual({
      status: 'completed',
      deletedCount: 2,
      protectedUriCount: 3,
      maxAgeDays: 14,
    });
    expect(mockedReportActionError).not.toHaveBeenCalled();
  });

  test('skips native deletion when any current owner cannot be read', async () => {
    mockedReadOwnership.mockReturnValue({
      protectedUris: ['file:///audio/known-draft.m4a'],
      isComplete: false,
      unreadableStorageKeys: ['dreamDraft', 'dreams'],
    });

    const result = await runAudioCleanup({ maxAgeDays: 7 });

    expect(mockedCleanup).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'skipped',
      reason: 'ownership-incomplete',
      protectedUriCount: 1,
      unreadableStorageKeys: ['dreamDraft', 'dreams'],
      maxAgeDays: 7,
    });
    expect(mockedReportActionError).not.toHaveBeenCalled();
  });

  test('returns and reports a native cleanup failure without crashing maintenance', async () => {
    const nativeError = new Error('cleanup_failed');
    mockedReadOwnership.mockReturnValue({
      protectedUris: ['file:///audio/saved.m4a'],
      isComplete: true,
      unreadableStorageKeys: [],
    });
    mockedCleanup.mockRejectedValue(nativeError);

    const result = await runAudioCleanup({ maxAgeDays: 30 });

    expect(mockedReportActionError).toHaveBeenCalledWith(
      'audio_cleanup',
      nativeError,
      {
        reason: 'native_cleanup_failed',
        max_age_days: 30,
        protected_uri_count: 1,
      },
    );
    expect(result).toEqual({
      status: 'failed',
      reason: 'native-cleanup-failed',
      protectedUriCount: 1,
      maxAgeDays: 30,
    });
  });

  test.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid age %s before reading storage or calling native cleanup',
    async maxAgeDays => {
      const result = await runAudioCleanup({ maxAgeDays });

      expect(mockedReadOwnership).not.toHaveBeenCalled();
      expect(mockedCleanup).not.toHaveBeenCalled();
      expect(mockedReportActionError).toHaveBeenCalledWith(
        'audio_cleanup',
        expect.any(Error),
        {
          reason: 'invalid_max_age',
          max_age_days: maxAgeDays,
        },
      );
      expect(result).toEqual({
        status: 'failed',
        reason: 'invalid-max-age',
        protectedUriCount: 0,
        maxAgeDays,
      });
    },
  );

  test('uses the conservative default age when the caller omits it', async () => {
    mockedReadOwnership.mockReturnValue({
      protectedUris: [],
      isComplete: true,
      unreadableStorageKeys: [],
    });
    mockedCleanup.mockResolvedValue(0);

    const result = await runAudioCleanup();

    expect(mockedCleanup).toHaveBeenCalledWith(
      DEFAULT_AUDIO_CLEANUP_MAX_AGE_DAYS,
      [],
    );
    expect(result).toEqual({
      status: 'completed',
      deletedCount: 0,
      protectedUriCount: 0,
      maxAgeDays: DEFAULT_AUDIO_CLEANUP_MAX_AGE_DAYS,
    });
  });
});
