import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Recording and playback, done natively on both platforms.
 *
 * Android had this from the start; iOS went through
 * `react-native-audio-recorder-player`, and that asymmetry cost more than the
 * duplicated code it saved. The library is the single package pinning
 * `react-native-nitro-modules` below 0.36 and `react-native-mmkv` below 4.3 —
 * it ships nitrogen-generated Kotlin built against an older nitro and calls a
 * method newer versions removed. One unmaintained dependency on the capture
 * path was holding two upgrades hostage.
 *
 * Now that both platforms implement this, the module is genuinely always
 * present, so this uses `getEnforcing`: a null here would mean the module
 * failed to register, which is a bug worth throwing about rather than a
 * platform difference worth branching on.
 */

/**
 * Playback position, emitted while a recording plays.
 *
 * Both fields are milliseconds. `durationMs` is repeated on every event rather
 * than resolved once at the start because the duration of a freshly written
 * AAC file is not reliably known before playback has begun.
 */
export type PlaybackProgress = {
  positionMs: number;
  durationMs: number;
};

export interface Spec extends TurboModule {
  /**
   * Fires while audio is playing. Nothing guarantees the interval — treat it
   * as a progress hint, not a clock.
   */
  readonly onPlaybackProgress: CodegenTypes.EventEmitter<PlaybackProgress>;

  /**
   * Fires when playback reaches the end on its own.
   *
   * Not fired when `stop()` ends it: the caller already knows it stopped, and
   * emitting there would collapse "the recording finished" and "the user
   * pressed stop" into one event the UI has to tell apart anyway.
   */
  readonly onPlaybackFinished: CodegenTypes.EventEmitter<void>;

  startRecording(): Promise<string>;
  /** Null when nothing was recording. */
  stopRecording(): Promise<string | null>;
  play(filePath: string): Promise<void>;
  stop(): Promise<void>;

  /**
   * How long a recording is, in milliseconds, without playing it.
   *
   * The player used to learn the duration only from the progress events, so a
   * saved voice note read `--:--` until it was played through once. Both
   * platforms can answer this from the file's own metadata — a container that
   * did not record its duration is the only case that has to guess.
   *
   * Zero when the file cannot be read or carries no duration, rather than
   * rejecting: a missing timestamp is not a reason to fail the screen it is
   * displayed on.
   */
  getDuration(filePath: string): Promise<number>;
  /** Returns how many files were removed. */
  cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AudioRecorder');
