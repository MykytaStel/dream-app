import React from 'react';
import { AppState } from 'react-native';
import { runAudioCleanupMaintenance } from '../services/audioCleanupMaintenanceService';
import {
  getAudioRuntimeOwnershipSnapshot,
  subscribeToAudioRuntimeOwnership,
} from '../services/audioRuntimeOwnershipService';

/**
 * Non-visual application maintenance.
 *
 * Mounted inside AppLockGate so encrypted/private state is not inspected before
 * the user has unlocked the application. Startup is never blocked: the first
 * attempt waits until initial interactions have completed and every call is
 * fire-and-forget.
 */
export function AudioCleanupMaintenance(): null {
  React.useEffect(() => {
    let disposed = false;
    let previousRecordingActive =
      getAudioRuntimeOwnershipSnapshot().recordingActive;

    const trigger = (source: 'startup' | 'foreground' | 'recording-ended') => {
      if (disposed) {
        return;
      }

      runAudioCleanupMaintenance({ trigger: source });
    };

    const startupTaskHandle = requestIdleCallback(() => {
      trigger('startup');
    });

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        trigger('foreground');
      }
    });

    const runtimeSubscription = subscribeToAudioRuntimeOwnership(next => {
      const recordingEnded = previousRecordingActive && !next.recordingActive;
      previousRecordingActive = next.recordingActive;

      // A due attempt deliberately deferred while the microphone was active.
      // Retry as soon as native recording ends; the persisted cadence prevents
      // this from doing work when an earlier attempt already completed.
      if (recordingEnded) {
        trigger('recording-ended');
      }
    });

    return () => {
      disposed = true;
      cancelIdleCallback(startupTaskHandle);
      appStateSubscription.remove();
      runtimeSubscription.remove();
    };
  }, []);

  return null;
}
