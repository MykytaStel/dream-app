import 'react-native';

declare module 'react-native' {
  interface AudioRecorderNativeModule {
    startRecording(): Promise<string>;
    stopRecording(): Promise<string | null>;
    play(path: string): Promise<void>;
    stop(): Promise<void>;
    cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>;
  }

  interface AudioUploadNativeModule {
    upload(options: {
      uploadUrl: string;
      localPath: string;
      mimeType: string;
      anonKey: string;
      accessToken?: string | null;
    }): Promise<void>;
  }

  interface NativeModulesStatic {
    AudioRecorder?: AudioRecorderNativeModule;
    AudioUpload?: AudioUploadNativeModule;
  }
}
