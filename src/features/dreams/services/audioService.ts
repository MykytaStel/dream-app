import NativeAudioRecorder from '../../../specs/NativeAudioRecorder';
import { ensureRecordAudioPermission } from './audioPermissions';
import {
  markAudioRecordingFailed,
  markAudioRecordingInterrupted,
  markAudioRecordingStarted,
  markAudioRecordingStarting,
  markAudioRecordingStopped,
} from './audioRuntimeOwnershipService';

export type AudioPermissionCode =
  'audio-permission-denied' | 'audio-permission-unavailable';

// Carries the reason on the error itself so callers can pick the right message
// without parsing text. Callers read `.code`, which stays a plain string field.
export class AudioPermissionError extends Error {
  readonly code: AudioPermissionCode;

  constructor(message: string, code: AudioPermissionCode) {
    super(message);
    this.name = 'AudioPermissionError';
    this.code = code;
  }
}

/**
 * The native module rejects with this when iOS refuses the microphone.
 *
 * Android asks before recording and never reaches the native call; iOS can only
 * ask through AVFoundation, which happens inside `startRecording`. Two routes to
 * one situation, translated here so callers see a single error type.
 */
const NATIVE_PERMISSION_DENIED = 'audio_permission_denied';

function normalizeUriForStorage(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.startsWith('file://') ? value : `file://${value}`;
}

export async function startRecording(): Promise<string> {
  // The permission prompt and native startup are part of the recording
  // critical section. Cleanup must defer before a file URI is available too.
  markAudioRecordingStarting();

  try {
    const permission = await ensureRecordAudioPermission();
    if (permission !== 'granted') {
      throw new AudioPermissionError(
        'Audio recording permission is required.',
        permission === 'denied'
          ? 'audio-permission-denied'
          : 'audio-permission-unavailable',
      );
    }

    const uri = normalizeUriForStorage(
      await NativeAudioRecorder.startRecording(),
    );
    markAudioRecordingStarted(uri);
    return uri;
  } catch (error) {
    markAudioRecordingFailed();

    if ((error as { code?: string })?.code === NATIVE_PERMISSION_DENIED) {
      throw new AudioPermissionError(
        'Audio recording permission is required.',
        'audio-permission-denied',
      );
    }

    throw error;
  }
}

export async function stopRecording(): Promise<string> {
  try {
    const uri = normalizeUriForStorage(
      (await NativeAudioRecorder.stopRecording()) ?? '',
    );
    markAudioRecordingStopped(uri);
    return uri;
  } catch (error) {
    markAudioRecordingFailed();
    throw error;
  }
}

/**
 * Notifies when the system ended a recording that was still in progress.
 *
 * Subscribe for as long as a recording is running. The uri is the audio as far
 * as it got — empty when the partial file could not be kept, which is still
 * worth hearing about, because the screen has to stop claiming it is recording
 * either way.
 */
export function onRecordingInterrupted(listener: (uri: string) => void): {
  remove: () => void;
} {
  return NativeAudioRecorder.onRecordingInterrupted(({ uri }) => {
    const normalizedUri = normalizeUriForStorage(uri);
    markAudioRecordingInterrupted(normalizedUri);
    listener(normalizedUri);
  });
}

type PlayCallbacks = {
  onFinished?: () => void;
  onProgress?: (positionMs: number, durationMs: number) => void;
};

/**
 * Subscriptions for the playback in progress.
 *
 * Held at module scope because `stop()` is a separate call from `play()` and has
 * to be able to tear them down. One playback at a time is the whole model — the
 * native modules stop whatever is running before starting anything new — so a
 * single slot is enough, and a map keyed by anything would only invite the
 * question of what a second entry would mean.
 */
let subscriptions: Array<{ remove: () => void }> = [];

function clearSubscriptions() {
  for (const subscription of subscriptions) {
    subscription.remove();
  }
  subscriptions = [];
}

export async function play(uri: string, callbacks?: PlayCallbacks) {
  clearSubscriptions();

  if (callbacks?.onProgress) {
    subscriptions.push(
      NativeAudioRecorder.onPlaybackProgress(({ positionMs, durationMs }) => {
        callbacks.onProgress!(positionMs, durationMs);
      }),
    );
  }

  subscriptions.push(
    NativeAudioRecorder.onPlaybackFinished(() => {
      clearSubscriptions();
      callbacks?.onFinished?.();
    }),
  );

  try {
    await NativeAudioRecorder.play(uri);
  } catch (error) {
    clearSubscriptions();
    throw error;
  }
}

export async function stop() {
  clearSubscriptions();
  await NativeAudioRecorder.stop();
}

/**
 * How long a recording is, in milliseconds, without playing it.
 *
 * Zero means unknown — a file that is gone, or a container that never recorded
 * its own duration. Callers show `--:--` for it rather than a wrong number.
 */
export async function getDuration(uri: string): Promise<number> {
  try {
    return await NativeAudioRecorder.getDuration(uri);
  } catch {
    // The native side already answers 0 for anything it cannot read, so
    // reaching here means the call itself failed. A label is not worth
    // propagating that to the screen.
    return 0;
  }
}

/**
 * Deletes only old app-owned recordings absent from the caller's ownership
 * snapshot. The caller must fail closed and skip this function when that
 * snapshot is incomplete.
 */
export async function cleanupOrphanedAudioFiles(
  maxAgeDays: number,
  protectedUris: readonly string[],
): Promise<number> {
  return NativeAudioRecorder.cleanupOrphanedAudioFiles(
    maxAgeDays,
    protectedUris,
  );
}
