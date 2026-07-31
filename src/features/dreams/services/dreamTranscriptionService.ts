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

/**
 * Which model this device should be using, right now.
 *
 * Read on every call rather than captured once: the language can change in
 * settings while the app is running, and a transcript produced by the previous
 * language's model would be nonsense with no sign of why.
 */
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

export function getDreamTranscriptionModelFilePath() {
  return `${getDreamTranscriptionModelDirectoryPath()}/${getActiveTranscriptionModel().filename}`;
}

/**
 * Removes models the app is no longer going to use.
 *
 * Switching language changes which file is wanted, and the old one is 74 to
 * 141 MB of a user's storage that nothing will ever read again. Worse, leaving
 * it means the settings screen reports a model as installed while the one
 * actually needed is missing.
 */
export async function pruneUnusedTranscriptionModels(): Promise<string[]> {
  const directoryPath = getDreamTranscriptionModelDirectoryPath();
  if (!(await RNFS.exists(directoryPath))) {
    return [];
  }

  const keep = getActiveTranscriptionModel().filename;
  const known = new Set(listTranscriptionModelFilenames());
  const removed: string[] = [];

  for (const entry of await RNFS.readDir(directoryPath)) {
    // Only files this app is known to have downloaded. Deleting anything else
    // found in the directory would be someone else's data.
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
    fromUrl: getActiveTranscriptionModel().url,
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

    // Only once the replacement is on disk. Pruning first would leave someone
    // who switched language with no model at all if the download then failed.
    await pruneUnusedTranscriptionModels().catch(() => undefined);

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
  const model = getActiveTranscriptionModel();

  // A context built from the English model would keep being reused after the
  // user switched to Ukrainian, and whisper would go on producing English.
  if (loadedModelFilename && loadedModelFilename !== model.filename) {
    whisperContextPromise = null;
  }

  if (!whisperContextPromise) {
    loadedModelFilename = model.filename;
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

  const startedAt = Date.now();
  updateDreamTranscriptState(dreamId, {
    transcriptStatus: 'processing',
    transcriptUpdatedAt: startedAt,
  });

  try {
    const whisperContext = await getWhisperContext(onProgress);
    const { promise } = whisperContext.transcribe(dream.audioUri, {
      // Was hardcoded to 'en'. Ukrainian speech fed to an English model does
      // not fail — it returns confident English nonsense.
      language: getActiveTranscriptionModel().language,
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
