import React from 'react';
import { Alert, Platform } from 'react-native';
import {
  onRecordingInterrupted,
  startRecording,
  stopRecording,
} from '../../services/audioService';
import { logActionError } from '../../../../app/errorReporting';
import { hapticImpactMedium } from '../../../../services/haptics/hapticService';
import type {
  DreamComposerCopy,
  DreamComposerMode,
} from '../DreamComposer.types';

/**
 * The microphone, from pressing record to whatever ends the recording. Shares
 * the form's busy flag and error line because record and save compete for
 * them — reporting the two states independently would let one start during the
 * other. The rest of the form reads only `audioUri`.
 */

/** Just the strings this needs, so a caller can be built in a test. */
type RecordingCopy = Pick<
  DreamComposerCopy,
  | 'audioErrorTitle'
  | 'audioInterruptedLost'
  | 'audioInterruptedSaved'
  | 'audioPermissionDenied'
  | 'audioPermissionUnavailable'
  | 'audioSimulatorHint'
>;

type UseRecordingLifecycleArgs = {
  initialAudioUri?: string;
  mode: DreamComposerMode;
  autoStartRecordingKey?: number;
  copy: RecordingCopy;
  isBusy: boolean;
  setIsBusy: (value: boolean) => void;
  setLastActionError: (value: string | null) => void;
};

export function useRecordingLifecycle({
  initialAudioUri,
  mode,
  autoStartRecordingKey,
  copy,
  isBusy,
  setIsBusy,
  setLastActionError,
}: UseRecordingLifecycleArgs) {
  const [recording, setRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const recordingIntervalRef = React.useRef<ReturnType<
    typeof setInterval
  > | null>(null);
  /**
   * When the current recording began, in wall-clock time.
   *
   * The elapsed seconds are derived from this rather than counted up by the
   * interval, because a backgrounded app stops firing timers: a recording that
   * survived a minute in the background used to come back reporting the
   * handful of seconds the timer had managed to tick.
   */
  const recordingStartedAtRef = React.useRef<number | null>(null);
  const [audioUri, setAudioUri] = React.useState<string | undefined>(
    initialAudioUri,
  );
  /**
   * The file a running recording is being written into.
   *
   * Held apart from `audioUri` so the composer does not offer a half-written
   * file for playback, but still written into the draft — if the app is killed
   * outright there is no event to react to, and this is the only thing that
   * points at the audio afterwards.
   */
  const [pendingAudioUri, setPendingAudioUri] = React.useState<
    string | undefined
  >(undefined);
  const lastAutoStartKey = React.useRef<number | undefined>(undefined);

  const stopRecordingTimer = React.useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    recordingStartedAtRef.current = null;
  }, []);

  const onToggleRecord = React.useCallback(async () => {
    setIsBusy(true);
    setLastActionError(null);

    try {
      if (!recording) {
        hapticImpactMedium();
        const startedUri = await startRecording();
        setPendingAudioUri(startedUri || undefined);
        setRecording(true);
        setRecordingDuration(0);
        recordingStartedAtRef.current = Date.now();
        recordingIntervalRef.current = setInterval(() => {
          const startedAt = recordingStartedAtRef.current;
          if (startedAt === null) {
            return;
          }
          setRecordingDuration(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);
        return;
      }

      hapticImpactMedium();
      stopRecordingTimer();
      const uri = await stopRecording();
      setAudioUri(uri || undefined);
      setPendingAudioUri(undefined);
      setRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      stopRecordingTimer();
      setRecordingDuration(0);
      setPendingAudioUri(undefined);
      setRecording(false);
      const code = (error as { code?: string })?.code;
      let message: string;
      if (code === 'audio-permission-denied') {
        message = copy.audioPermissionDenied;
      } else if (code === 'audio-permission-unavailable') {
        message = copy.audioPermissionUnavailable;
      } else {
        const rawMessage =
          error instanceof Error ? error.message : String(error);
        message =
          Platform.OS === 'ios'
            ? `${rawMessage}\n\n${copy.audioSimulatorHint}`
            : rawMessage;
      }
      setLastActionError(message);
      Alert.alert(copy.audioErrorTitle, message);
    } finally {
      setIsBusy(false);
    }
  }, [
    copy.audioErrorTitle,
    copy.audioPermissionDenied,
    copy.audioPermissionUnavailable,
    copy.audioSimulatorHint,
    recording,
    setIsBusy,
    setLastActionError,
    stopRecordingTimer,
  ]);

  /**
   * The system ending a recording the person did not end.
   *
   * Subscribed only while recording, because that is the only time the event
   * means anything. Whatever was captured before the interruption is adopted
   * as the recording — it is a real answer to "what did I dream", just a
   * shorter one than intended — and the message says so rather than leaving
   * the person to wonder whether the app lost it.
   */
  React.useEffect(() => {
    if (!recording) {
      return;
    }

    const subscription = onRecordingInterrupted(uri => {
      stopRecordingTimer();
      setRecording(false);
      setRecordingDuration(0);
      setPendingAudioUri(undefined);

      if (uri) {
        setAudioUri(uri);
      }

      setLastActionError(
        uri ? copy.audioInterruptedSaved : copy.audioInterruptedLost,
      );
    });

    return () => subscription.remove();
  }, [
    copy.audioInterruptedLost,
    copy.audioInterruptedSaved,
    recording,
    setLastActionError,
    stopRecordingTimer,
  ]);

  React.useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (mode !== 'create' || !autoStartRecordingKey) {
      return;
    }

    if (lastAutoStartKey.current === autoStartRecordingKey) {
      return;
    }

    if (recording || audioUri) {
      lastAutoStartKey.current = autoStartRecordingKey;
      return;
    }

    if (isBusy) {
      return;
    }

    lastAutoStartKey.current = autoStartRecordingKey;
    onToggleRecord().catch(e =>
      logActionError('useRecordingLifecycle.autoStartRecording', e),
    );
  }, [
    audioUri,
    autoStartRecordingKey,
    isBusy,
    mode,
    onToggleRecord,
    recording,
  ]);

  /** Clears the microphone side of the form after a dream is saved. */
  const resetRecording = React.useCallback(() => {
    setAudioUri(undefined);
    setPendingAudioUri(undefined);
    setRecording(false);
    stopRecordingTimer();
    setRecordingDuration(0);
  }, [stopRecordingTimer]);

  return {
    recording,
    recordingDuration,
    audioUri,
    setAudioUri,
    pendingAudioUri,
    onToggleRecord,
    resetRecording,
  };
}
