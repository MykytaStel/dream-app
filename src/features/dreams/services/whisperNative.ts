type WhisperNativeProgressOptions = {
  onProgress?: (progress: number) => void;
  language?: string;
};

export type WhisperNativeContext = {
  transcribe: (
    filePath: string,
    options?: WhisperNativeProgressOptions,
  ) => {
    stop: () => Promise<void>;
    promise: Promise<{
      result: string;
      language: string;
      segments: Array<{ text: string; t0: number; t1: number }>;
      isAborted: boolean;
    }>;
  };
};

type WhisperNativeModule = {
  initWhisper: (options: {
    filePath: string;
    useGpu?: boolean;
    useCoreMLIos?: boolean;
  }) => Promise<WhisperNativeContext>;
};

// The package does not resolve cleanly through TypeScript/Jest in this repo,
// so the native module stays behind a local adapter boundary.
const whisperNative = require('whisper.rn') as WhisperNativeModule;

export const { initWhisper } = whisperNative;
