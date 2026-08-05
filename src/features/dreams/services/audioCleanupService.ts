import { reportActionError } from '../../../services/observability/errorReporting';
import { cleanupOrphanedAudioFiles } from './audioService';
import {
  readStoredAudioOwnership,
  type RuntimeAudioOwnership,
} from './audioOwnershipStorageService';

export const DEFAULT_AUDIO_CLEANUP_MAX_AGE_DAYS = 7;

export type AudioCleanupRequest = RuntimeAudioOwnership & {
  maxAgeDays?: number;
};

export type AudioCleanupResult =
  | {
      status: 'completed';
      deletedCount: number;
      protectedUriCount: number;
      maxAgeDays: number;
    }
  | {
      status: 'skipped';
      reason: 'ownership-incomplete';
      protectedUriCount: number;
      unreadableStorageKeys: string[];
      maxAgeDays: number;
    }
  | {
      status: 'failed';
      reason: 'invalid-max-age' | 'native-cleanup-failed';
      protectedUriCount: number;
      maxAgeDays: number;
    };

function isValidMaxAgeDays(value: number) {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Builds one complete ownership snapshot before allowing native deletion.
 *
 * This is the only application-level entry point that should call the native
 * cleanup primitive. Storage uncertainty is treated as ownership uncertainty:
 * known URIs remain protected, but no deletion is attempted until every current
 * owner can be read.
 *
 * Scheduling belongs above this function. The caller decides when a maintenance
 * window runs; this function decides whether that window is safe to execute.
 */
export async function runAudioCleanup(
  request: AudioCleanupRequest = {},
): Promise<AudioCleanupResult> {
  const maxAgeDays = request.maxAgeDays ?? DEFAULT_AUDIO_CLEANUP_MAX_AGE_DAYS;

  if (!isValidMaxAgeDays(maxAgeDays)) {
    const error = new Error(
      'Audio cleanup age must be finite and non-negative.',
    );
    reportActionError('audio_cleanup', error, {
      reason: 'invalid_max_age',
      max_age_days: maxAgeDays,
    });

    return {
      status: 'failed',
      reason: 'invalid-max-age',
      protectedUriCount: 0,
      maxAgeDays,
    };
  }

  const ownership = readStoredAudioOwnership({
    activeRecordingUri: request.activeRecordingUri,
    pendingRecordingUri: request.pendingRecordingUri,
  });

  if (!ownership.isComplete) {
    return {
      status: 'skipped',
      reason: 'ownership-incomplete',
      protectedUriCount: ownership.protectedUris.length,
      unreadableStorageKeys: [...ownership.unreadableStorageKeys],
      maxAgeDays,
    };
  }

  try {
    const deletedCount = await cleanupOrphanedAudioFiles(
      maxAgeDays,
      ownership.protectedUris,
    );

    return {
      status: 'completed',
      deletedCount,
      protectedUriCount: ownership.protectedUris.length,
      maxAgeDays,
    };
  } catch (error) {
    reportActionError('audio_cleanup', error, {
      reason: 'native_cleanup_failed',
      max_age_days: maxAgeDays,
      protected_uri_count: ownership.protectedUris.length,
    });

    return {
      status: 'failed',
      reason: 'native-cleanup-failed',
      protectedUriCount: ownership.protectedUris.length,
      maxAgeDays,
    };
  }
}
