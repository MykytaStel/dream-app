import {
  DeviceEventEmitter,
  NativeEventEmitter,
  Platform,
  TurboModuleRegistry,
  type EmitterSubscription,
} from 'react-native';

type WhisperNativeProgressOptions = {
  onProgress?: (progress: number) => void;
  language?: string;
  translate?: boolean;
  maxThreads?: number;
  nProcessors?: number;
  maxContext?: number;
  maxLen?: number;
  tokenTimestamps?: boolean;
  temperature?: number;
  temperatureInc?: number;
  beamSize?: number;
  bestOf?: number;
  prompt?: string;
};

type WhisperNativeResult = {
  result: string;
  language: string;
  segments: Array<{ text: string; t0: number; t1: number }>;
  isAborted: boolean;
};

export type WhisperNativeContext = {
  transcribe: (
    filePath: string,
    options?: WhisperNativeProgressOptions,
  ) => {
    stop: () => Promise<void>;
    promise: Promise<WhisperNativeResult>;
  };
};

type WhisperNativeModule = {
  initContext: (options: {
    filePath: string;
    isBundleAsset: boolean;
    useGpu?: boolean;
    useCoreMLIos?: boolean;
  }) => Promise<{ contextId: number }>;
  transcribeFile: (
    contextId: number,
    jobId: number,
    filePath: string,
    options: Record<string, unknown>,
  ) => Promise<WhisperNativeResult>;
  abortTranscribe: (contextId: number, jobId: number) => Promise<void>;
};

// Resolve the codegen TurboModule by its registered native name instead of
// importing a private package file. whisper.rn@0.5.5 does not expose
// `whisper.rn/NativeRNWhisper` as a Metro-resolvable subpath, while the module is
// still registered as `RNWhisper` in both architectures.
//
// This also avoids the package root, whose optional ArrayBuffer JSI installer
// asks for the legacy Catalyst bridge and emits "Bridge not available" in
// bridgeless React Native. Dream transcription only needs initContext,
// transcribeFile and abortTranscribe.
const RNWhisper = TurboModuleRegistry.getEnforcing(
  'RNWhisper',
) as WhisperNativeModule;

const EVENT_ON_TRANSCRIBE_PROGRESS = '@RNWhisper_onTranscribeProgress';
let nextJobId = 1;

function stripFileScheme(filePath: string) {
  return filePath.startsWith('file://') ? filePath.slice(7) : filePath;
}

function createProgressEmitter() {
  return Platform.OS === 'ios'
    ? new NativeEventEmitter(RNWhisper as never)
    : DeviceEventEmitter;
}

export async function initWhisper(options: {
  filePath: string;
  useGpu?: boolean;
  useCoreMLIos?: boolean;
}): Promise<WhisperNativeContext> {
  const nativeContext = await RNWhisper.initContext({
    filePath: stripFileScheme(options.filePath),
    isBundleAsset: false,
    useGpu: options.useGpu,
    useCoreMLIos: options.useCoreMLIos,
  });

  return {
    transcribe(filePath, transcribeOptions = {}) {
      const jobId = nextJobId;
      nextJobId += 1;

      const { onProgress, ...nativeOptions } = transcribeOptions;
      let lastProgress = 0;
      let progressSubscription: EmitterSubscription | null = null;

      if (onProgress) {
        progressSubscription = createProgressEmitter().addListener(
          EVENT_ON_TRANSCRIBE_PROGRESS,
          (event: { contextId: number; jobId: number; progress: number }) => {
            if (
              event.contextId !== nativeContext.contextId ||
              event.jobId !== jobId
            ) {
              return;
            }

            lastProgress = Math.min(100, event.progress);
            onProgress(lastProgress);
          },
        );
      }

      const removeProgressListener = () => {
        progressSubscription?.remove();
        progressSubscription = null;
      };

      const promise = RNWhisper.transcribeFile(
        nativeContext.contextId,
        jobId,
        stripFileScheme(filePath),
        {
          ...nativeOptions,
          onProgress: Boolean(onProgress),
          onNewSegments: false,
        },
      )
        .then(result => {
          if (!result.isAborted && onProgress && lastProgress !== 100) {
            onProgress(100);
          }
          return result;
        })
        .finally(removeProgressListener);

      return {
        stop: async () => {
          try {
            await RNWhisper.abortTranscribe(nativeContext.contextId, jobId);
          } finally {
            removeProgressListener();
          }
        },
        promise,
      };
    },
  };
}
