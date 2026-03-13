declare module 'react-native' {
  import type { NativeModulesStatic } from 'react-native';

  interface AudioRecorderNativeModule {
    startRecording(): Promise<string>;
    stopRecording(): Promise<string | null>;
    play(path: string): Promise<void>;
    stop(): Promise<void>;
    cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>;
  }

  interface NativeModulesStatic {
    AudioRecorder?: AudioRecorderNativeModule;
  }
}

