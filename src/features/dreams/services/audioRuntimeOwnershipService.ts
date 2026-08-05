import { reportActionError } from '../../../services/observability/errorReporting';

export type AudioRuntimeOwnershipSnapshot = {
  recordingActive: boolean;
  activeRecordingUri: string | null;
  pendingRecordingUri: string | null;
};

type AudioRuntimeOwnershipListener = (
  snapshot: AudioRuntimeOwnershipSnapshot,
) => void;

const EMPTY_AUDIO_RUNTIME_OWNERSHIP: AudioRuntimeOwnershipSnapshot = {
  recordingActive: false,
  activeRecordingUri: null,
  pendingRecordingUri: null,
};

let snapshot: AudioRuntimeOwnershipSnapshot = {
  ...EMPTY_AUDIO_RUNTIME_OWNERSHIP,
};
const listeners = new Set<AudioRuntimeOwnershipListener>();

function publish(next: AudioRuntimeOwnershipSnapshot) {
  snapshot = next;
  const current = getAudioRuntimeOwnershipSnapshot();
  for (const listener of listeners) {
    try {
      listener(current);
    } catch (error) {
      // Recording state is more important than a maintenance observer. A
      // listener failure must never make a successful native start/stop look
      // failed to the composer after the microphone has already changed state.
      reportActionError('audio_runtime_ownership.listener', error);
    }
  }
}

export function getAudioRuntimeOwnershipSnapshot(): AudioRuntimeOwnershipSnapshot {
  return { ...snapshot };
}

export function subscribeToAudioRuntimeOwnership(
  listener: AudioRuntimeOwnershipListener,
): { remove: () => void } {
  listeners.add(listener);
  return {
    remove: () => listeners.delete(listener),
  };
}

/** Blocks maintenance while permission/native startup is still in flight. */
export function markAudioRecordingStarting() {
  publish({
    ...snapshot,
    recordingActive: true,
    activeRecordingUri: null,
  });
}

export function markAudioRecordingStarted(uri: string) {
  publish({
    ...snapshot,
    recordingActive: true,
    activeRecordingUri: uri || null,
  });
}

/**
 * A completed file is protected conservatively for the rest of the session,
 * unless a caller explicitly confirms the same URI has durable ownership or
 * was deliberately discarded. This closes the gap between native stop and a
 * debounced draft write without guessing whether that write succeeded.
 */
export function markAudioRecordingStopped(uri?: string | null) {
  publish({
    recordingActive: false,
    activeRecordingUri: null,
    pendingRecordingUri: uri || snapshot.pendingRecordingUri,
  });
}

export function markAudioRecordingFailed() {
  publish({
    ...snapshot,
    recordingActive: false,
    activeRecordingUri: null,
  });
}

export function markAudioRecordingInterrupted(uri?: string | null) {
  publish({
    recordingActive: false,
    activeRecordingUri: null,
    pendingRecordingUri: uri || snapshot.pendingRecordingUri,
  });
}

function clearMatchingPendingUri(uri: string | null | undefined) {
  if (!uri || snapshot.pendingRecordingUri !== uri) {
    return;
  }

  publish({
    ...snapshot,
    pendingRecordingUri: null,
  });
}

/** The exact URI is now protected by persisted draft/dream ownership. */
export function acknowledgePersistedAudioOwnership(
  uri: string | null | undefined,
) {
  clearMatchingPendingUri(uri);
}

/** The exact URI was deliberately discarded, so runtime retention can end. */
export function releasePendingAudioOwnership(uri: string | null | undefined) {
  clearMatchingPendingUri(uri);
}

export function __unsafeResetAudioRuntimeOwnershipForTests() {
  snapshot = { ...EMPTY_AUDIO_RUNTIME_OWNERSHIP };
  listeners.clear();
}
