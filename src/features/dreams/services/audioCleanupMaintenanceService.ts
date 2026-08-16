import { observability } from '../../../services/observability';
import { DIAG_EVENTS } from '../../../services/observability/events';
import {
  reportActionError,
  reportStorageReadFailure,
} from '../../../services/observability/errorReporting';
import { AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import {
  runAudioCleanup,
  type AudioCleanupResult,
} from './audioCleanupService';
import { getAudioRuntimeOwnershipSnapshot } from './audioRuntimeOwnershipService';

export const AUDIO_CLEANUP_MAINTENANCE_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type AudioCleanupMaintenanceTrigger =
  'startup' | 'foreground' | 'recording-ended';

export type AudioCleanupMaintenanceResult =
  | {
      status: 'not-due';
      trigger: AudioCleanupMaintenanceTrigger;
      lastAttemptAt: number;
      nextEligibleAt: number;
    }
  | {
      status: 'deferred';
      trigger: AudioCleanupMaintenanceTrigger;
      reason: 'recording-active';
    }
  | {
      status: 'attempted';
      trigger: AudioCleanupMaintenanceTrigger;
      attemptedAt: number;
      cleanup: AudioCleanupResult;
    }
  | {
      status: 'failed';
      trigger: AudioCleanupMaintenanceTrigger;
      attemptedAt: number;
      reason: 'maintenance-failed';
    };

type AudioCleanupMaintenanceOptions = {
  trigger: AudioCleanupMaintenanceTrigger;
  now?: number;
  maxAgeDays?: number;
};

let inFlight: Promise<AudioCleanupMaintenanceResult> | null = null;
let sessionLastAttemptAt: number | undefined;

function reportMaintenanceResult(result: AudioCleanupMaintenanceResult) {
  observability.trackEvent(DIAG_EVENTS.AudioCleanupMaintenance, {
    trigger: result.trigger,
    status: result.status,
    reason:
      result.status === 'deferred' || result.status === 'failed'
        ? result.reason
        : result.status === 'attempted'
          ? result.cleanup.status === 'completed'
            ? 'completed'
            : result.cleanup.reason
          : undefined,
    deleted_count:
      result.status === 'attempted' && result.cleanup.status === 'completed'
        ? result.cleanup.deletedCount
        : undefined,
    protected_uri_count:
      result.status === 'attempted'
        ? result.cleanup.protectedUriCount
        : undefined,
  });
}

function readLastAttemptAt(): number | undefined {
  if (sessionLastAttemptAt !== undefined) {
    return sessionLastAttemptAt;
  }

  try {
    const stored = kv.getNumber(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY);
    if (stored === undefined) {
      return undefined;
    }

    if (!Number.isFinite(stored) || stored < 0) {
      reportStorageReadFailure(
        AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY,
        new Error('Audio cleanup maintenance timestamp is invalid.'),
      );
      return undefined;
    }

    return stored;
  } catch (error) {
    reportStorageReadFailure(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY, error);
    return undefined;
  }
}

function persistLastAttemptAt(attemptedAt: number) {
  // Memory is updated first so a storage write failure cannot cause a tight
  // retry loop during the same application session.
  sessionLastAttemptAt = attemptedAt;

  try {
    kv.set(AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY, attemptedAt);
  } catch (error) {
    reportActionError('audio_cleanup_maintenance.persist', error, {
      attempted_at: attemptedAt,
    });
  }
}

async function performAudioCleanupMaintenance(
  options: AudioCleanupMaintenanceOptions,
): Promise<AudioCleanupMaintenanceResult> {
  const now = options.now ?? Date.now();
  const lastAttemptAt = readLastAttemptAt();

  if (lastAttemptAt !== undefined) {
    // A clock moved far backwards, or a corrupt value looks like the future.
    // It must not disable cleanup indefinitely.
    if (lastAttemptAt > now + AUDIO_CLEANUP_MAINTENANCE_INTERVAL_MS) {
      reportStorageReadFailure(
        AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY,
        new Error('Audio cleanup maintenance timestamp is in the future.'),
      );
    } else {
      const nextEligibleAt =
        lastAttemptAt + AUDIO_CLEANUP_MAINTENANCE_INTERVAL_MS;
      if (now < nextEligibleAt) {
        const result: AudioCleanupMaintenanceResult = {
          status: 'not-due',
          trigger: options.trigger,
          lastAttemptAt,
          nextEligibleAt,
        };
        reportMaintenanceResult(result);
        return result;
      }
    }
  }

  const runtime = getAudioRuntimeOwnershipSnapshot();
  if (runtime.recordingActive) {
    const result: AudioCleanupMaintenanceResult = {
      status: 'deferred',
      trigger: options.trigger,
      reason: 'recording-active',
    };
    reportMaintenanceResult(result);
    return result;
  }

  try {
    const cleanup = await runAudioCleanup({
      maxAgeDays: options.maxAgeDays,
      activeRecordingUri: runtime.activeRecordingUri,
      pendingRecordingUri: runtime.pendingRecordingUri,
    });

    // The request may have waited behind an explicit cleanup. If recording
    // began while queued, the shared cleanup boundary skips before native
    // deletion. This is a deferral, not an attempted maintenance window, so it
    // must not suppress the recording-ended retry for 24 hours.
    if (cleanup.status === 'skipped' && cleanup.reason === 'recording-active') {
      const result: AudioCleanupMaintenanceResult = {
        status: 'deferred',
        trigger: options.trigger,
        reason: 'recording-active',
      };
      reportMaintenanceResult(result);
      return result;
    }

    persistLastAttemptAt(now);

    const result: AudioCleanupMaintenanceResult = {
      status: 'attempted',
      trigger: options.trigger,
      attemptedAt: now,
      cleanup,
    };
    reportMaintenanceResult(result);
    return result;
  } catch (error) {
    // runAudioCleanup already converts expected native/storage outcomes into a
    // result. This catches only a programming or integration failure so app
    // startup still cannot be taken down by housekeeping.
    reportActionError('audio_cleanup_maintenance.run', error, {
      trigger: options.trigger,
    });
    persistLastAttemptAt(now);

    const result: AudioCleanupMaintenanceResult = {
      status: 'failed',
      trigger: options.trigger,
      attemptedAt: now,
      reason: 'maintenance-failed',
    };
    reportMaintenanceResult(result);
    return result;
  }
}

/**
 * Runs at most one maintenance operation at a time and at most once per 24-hour
 * persisted window. Concurrent startup/foreground/recording-ended triggers all
 * receive the same in-flight promise.
 */
export function runAudioCleanupMaintenance(
  options: AudioCleanupMaintenanceOptions,
): Promise<AudioCleanupMaintenanceResult> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = performAudioCleanupMaintenance(options).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function __unsafeResetAudioCleanupMaintenanceForTests() {
  inFlight = null;
  sessionLastAttemptAt = undefined;
}
