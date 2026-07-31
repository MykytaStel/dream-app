import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Recording and playback done natively, on Android only.
 *
 * iOS records through `react-native-audio-recorder-player` instead, so there is
 * no iOS implementation and this uses `get` rather than `getEnforcing`: the
 * module is legitimately absent on one platform, and null is the honest answer.
 * That is the distinction the old `NativeModules.AudioRecorder` could not
 * express — an absent module and a misspelled one both came back undefined.
 */
export interface Spec extends TurboModule {
  startRecording(): Promise<string>;
  /** Null when nothing was recording. */
  stopRecording(): Promise<string | null>;
  play(filePath: string): Promise<void>;
  stop(): Promise<void>;
  /** Returns how many files were removed. */
  cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>('AudioRecorder');
