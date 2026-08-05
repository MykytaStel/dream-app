import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import {
  getDream,
  updateDreamTranscriptState,
} from '../repository/dreamsRepository';
import { initWhisper, WhisperNativeContext } from './whisperNative';
import {
  listTranscriptionModelFilenames,
  selectTranscriptionModel,
  type WhisperModel,
} from '../model/transcriptionModel';
import { getStoredLocale } from '../../../i18n/localeStore';

const DREAM_TRANSCRIPTION_MODEL_DIRECTORY = 'whisper-models';

/** Read on every operation so a language change is respected without restart. */
function getActiveTranscriptionModel(): WhisperModel {
  return selectTranscriptionModel(getStoredLocale());
}

export type DreamTranscriptionProgressPhase =
  'preparing-model' | 'transcribing';
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
/** Which model the cached context was built from, so a language change is seen. */
let loadedModelFilename: string | null = null;

function getDreamTranscriptionModelDirectoryPath() {
  return `${RNFS.DocumentDirectoryPath}/${DREAM_TRANSCRIPTION_MODEL_DIRECTORY}`;
}

function getModelFilePath(model: WhisperModel) {
  return `${getDreamTranscriptionModelDirectoryPath()}/${model.filename}`;
}

export function getDreamTranscriptionModelFilePath() {
  return getModelFilePath(getActiveTranscriptionModel());
}

/**
 * Removes models the app is no longer going to use.
 *
 * The replacement must already exist before this runs. Keeping the known legacy
 * filenames in the model policy lets an upgraded app remove the previous
 * Ukrainian base model without touching unrelated files in the directory.
 */
export async function pruneUnusedTranscriptionModels(
  activeModel: WhisperModel = getActiveTranscriptionModel(),
): Promise<string[]> {
  const directoryPath = getDreamTranscriptionModelDirectoryPath();
  if (!(await RNFS.exists(directoryPath))) {
    return [];
  }

  const keep = activeModel.filename;
  const known = new Set(listTranscriptionModelFilenames());
  const removed: string[] = [];

  for (const entry of await RNFS.readDir(directoryPath)) {
    if (entry.name === keep || !known.has(entry.name)) {
      continue;
    }

    await RNFS.unlink(entry.path).catch(() => undefined);
    removed.push(entry.name);
  }

  return removed;
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
  loadedModelFilename = null;
}

async function ensureDreamTranscriptionModel(
  model: WhisperModel,
  onProgress?: (progress: DreamTranscriptionProgress) => void,
) {
  const directoryPath = getDreamTranscriptionModelDirectoryPath();
  const filePath = getModelFilePath(model);

  await RNFS.mkdir(directoryPath);

  if (await RNFS.exists(filePath)) {
    return filePath;
  }

  onProgress?.({
    phase: 'preparing-model',
    progress: 0,
  });

  const download = RNFS.downloadFile({
    fromUrl: model.url,
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

    await pruneUnusedTranscriptionModels(model).catch(() => undefined);

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
  const model = getActiveTranscriptionModel();
  const filePath = await ensureDreamTranscriptionModel(model, onProgress);
  const installed = await RNFS.exists(filePath);
  let sizeBytes: number | null = null;

  if (installed) {
    try {
      const stat = await RNFS.stat(filePath);
      sizeBytes = Number(stat.size);
    } catch {
      sizeBytes = null;
    }
  }

  return {
    filePath,
    status: {
      installed,
      filePath,
      sizeBytes,
    },
  };
}

async function getWhisperContext(
  model: WhisperModel,
  onProgress?: (progress: DreamTranscriptionProgress) => void,
) {
  if (loadedModelFilename && loadedModelFilename !== model.filename) {
    whisperContextPromise = null;
  }

  if (!whisperContextPromise) {
    loadedModelFilename = model.filename;
    whisperContextPromise = ensureDreamTranscriptionModel(model, onProgress)
      .then(filePath =>
        initWhisper({
          filePath,
          useGpu: Platform.OS === 'ios',
          useCoreMLIos: Platform.OS === 'ios',
        }),
      )
      .catch(error => {
        whisperContextPromise = null;
        loadedModelFilename = null;
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

  const model = getActiveTranscriptionModel();
  const startedAt = Date.now();
  updateDreamTranscriptState(dreamId, {
    transcriptStatus: 'processing',
    transcriptUpdatedAt: startedAt,
  });

  try {
    const whisperContext = await getWhisperContext(model, onProgress);
    const { promise } = whisperContext.transcribe(dream.audioUri, {
      language: model.language,
      ...model.decoding,
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
      transcriptSource: 'generated',
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
  loadedModelFilename = null;
}
