import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { getDream, updateDreamTranscriptState } from '../repository/dreamsRepository';
import { initWhisper, WhisperNativeContext } from './whisperNative';

const DREAM_TRANSCRIPTION_MODEL_DIRECTORY = 'whisper-models';
const DREAM_TRANSCRIPTION_MODEL_FILENAME = 'ggml-tiny.en.bin';
const DREAM_TRANSCRIPTION_MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin';

export type DreamTranscriptionProgressPhase = 'preparing-model' | 'transcribing';
export type DreamTranscriptionProgress = {
  phase: DreamTranscriptionProgressPhase;
  progress: number | null;
};
export type DreamTranscriptionModelStatus = {
  installed: boolean;
  filePath: string;
  sizeBytes: number | null;
};

let whisperContextPromise: Promise<WhisperNativeContext> | null = null;

function getDreamTranscriptionModelDirectoryPath() {
  return `${RNFS.DocumentDirectoryPath}/${DREAM_TRANSCRIPTION_MODEL_DIRECTORY}`;
}

export function getDreamTranscriptionModelFilePath() {
  return `${getDreamTranscriptionModelDirectoryPath()}/${DREAM_TRANSCRIPTION_MODEL_FILENAME}`;
}

export async function getDreamTranscriptionModelStatus(): Promise<DreamTranscriptionModelStatus> {
  const filePath = getDreamTranscriptionModelFilePath();
  const installed = await RNFS.exists(filePath);
  if (!installed) {
    return {
      installed: false,
      filePath,
      sizeBytes: null,
    };
  }

  try {
    const stat = await RNFS.stat(filePath);
    return {
      installed: true,
      filePath,
      sizeBytes: Number(stat.size),
    };
  } catch {
    return {
      installed: true,
      filePath,
      sizeBytes: null,
    };
  }
}

export async function deleteDreamTranscriptionModel() {
  const filePath = getDreamTranscriptionModelFilePath();
  const installed = await RNFS.exists(filePath);
  if (installed) {
    await RNFS.unlink(filePath);
  }
  whisperContextPromise = null;
}

async function ensureDreamTranscriptionModel(
  onProgress?: (progress: DreamTranscriptionProgress) => void,
) {
  const directoryPath = getDreamTranscriptionModelDirectoryPath();
  const filePath = getDreamTranscriptionModelFilePath();

  await RNFS.mkdir(directoryPath);

  if (await RNFS.exists(filePath)) {
    return filePath;
  }

  onProgress?.({
    phase: 'preparing-model',
    progress: 0,
  });

  const download = RNFS.downloadFile({
    fromUrl: DREAM_TRANSCRIPTION_MODEL_URL,
    toFile: filePath,
    discretionary: true,
    progressInterval: 250,
    progress: event => {
      if (!event.contentLength) {
        onProgress?.({
          phase: 'preparing-model',
          progress: null,
        });
        return;
      }

      onProgress?.({
        phase: 'preparing-model',
        progress: Math.min(
          100,
          Math.round((event.bytesWritten / event.contentLength) * 100),
        ),
      });
    },
  });

  try {
    const result = await download.promise;
    if (result.statusCode >= 400) {
      throw new Error(`model-download-failed:${result.statusCode}`);
    }
    return filePath;
  } catch (error) {
    if (await RNFS.exists(filePath)) {
      await RNFS.unlink(filePath).catch(() => undefined);
    }
    throw error;
  }
}

export async function ensureDreamTranscriptionModelInstalled(
  onProgress?: (progress: DreamTranscriptionProgress) => void,
) {
  const filePath = await ensureDreamTranscriptionModel(onProgress);
  return {
    filePath,
    status: await getDreamTranscriptionModelStatus(),
  };
}

async function getWhisperContext(
  onProgress?: (progress: DreamTranscriptionProgress) => void,
) {
  if (!whisperContextPromise) {
    whisperContextPromise = ensureDreamTranscriptionModel(onProgress)
      .then(filePath =>
        initWhisper({
          filePath,
          useGpu: Platform.OS === 'ios',
          useCoreMLIos: Platform.OS === 'ios',
        }),
      )
      .catch(error => {
        whisperContextPromise = null;
        throw error;
      });
  }

  return whisperContextPromise;
}

export async function transcribeDreamAudio(
  dreamId: string,
  onProgress?: (progress: DreamTranscriptionProgress) => void,
) {
  const dream = getDream(dreamId);
  if (!dream?.audioUri) {
    throw new Error('dream-audio-missing');
  }

  const startedAt = Date.now();
  updateDreamTranscriptState(dreamId, {
    transcriptStatus: 'processing',
    transcriptUpdatedAt: startedAt,
  });

  try {
    const whisperContext = await getWhisperContext(onProgress);
    const { promise } = whisperContext.transcribe(dream.audioUri, {
      language: 'en',
      onProgress: (progress: number) => {
        onProgress?.({
          phase: 'transcribing',
          progress: Math.round(progress),
        });
      },
    });
    const result = await promise;
    const transcript = result.result.trim();

    if (!transcript) {
      throw new Error('dream-transcript-empty');
    }

    return updateDreamTranscriptState(dreamId, {
      transcript,
      transcriptStatus: 'ready',
      transcriptUpdatedAt: Date.now(),
    });
  } catch (error) {
    updateDreamTranscriptState(dreamId, {
      transcriptStatus: 'error',
      transcriptUpdatedAt: Date.now(),
    });
    throw error;
  }
}

export function __unsafeResetDreamTranscriptionContextForTests() {
  whisperContextPromise = null;
}
