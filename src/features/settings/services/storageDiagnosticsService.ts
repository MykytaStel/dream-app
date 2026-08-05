import RNFS from 'react-native-fs';
import { observability } from '../../../services/observability';
import { reportActionError } from '../../../services/observability/errorReporting';
import { kv } from '../../../services/storage/mmkv';
import {
  deleteDreamTranscriptionModel,
  getDreamTranscriptionModelStatus,
} from '../../dreams/services/dreamTranscriptionService';
import {
  readStoredAudioOwnership,
  type StoredAudioOwnershipResult,
} from '../../dreams/services/audioOwnershipStorageService';
import {
  runAudioCleanup,
  type AudioCleanupResult,
} from '../../dreams/services/audioCleanupService';
import { getAudioRuntimeOwnershipSnapshot } from '../../dreams/services/audioRuntimeOwnershipService';
import { getExportDirectoryPath } from './dataExportService';

const AUDIO_DIRECTORY_NAME = 'audio';
const SCHEDULED_AUDIO_CLEANUP_MAX_AGE_DAYS = 7;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export type StorageBucketDiagnostics = {
  fileCount: number | null;
  sizeBytes: number | null;
  isComplete: boolean;
};

export type AudioStorageDiagnostics = StorageBucketDiagnostics & {
  ownershipComplete: boolean;
  protectedFileCount: number | null;
  protectedSizeBytes: number | null;
  unlinkedFileCount: number | null;
  unlinkedSizeBytes: number | null;
  maintenanceEligibleFileCount: number | null;
  maintenanceEligibleSizeBytes: number | null;
  unreadableStorageKeyCount: number;
};

export type LocalDataDiagnostics = {
  keyCount: number | null;
  estimatedSizeBytes: number | null;
  isComplete: boolean;
};

export type StorageDiagnosticsSnapshot = {
  audio: AudioStorageDiagnostics;
  transcriptionModel: {
    installed: boolean;
    sizeBytes: number | null;
    isComplete: boolean;
  };
  exports: StorageBucketDiagnostics;
  localData: LocalDataDiagnostics;
  totalKnownBytes: number;
  isComplete: boolean;
  refreshedAt: number;
};

export type ManualAudioCleanupResult =
  | AudioCleanupResult
  | {
      status: 'deferred';
      reason: 'recording-active';
      protectedUriCount: number;
      maxAgeDays: 0;
    };

export type ExportCleanupResult = {
  deletedCount: number;
  deletedSizeBytes: number;
  failedCount: number;
};

type CountedFile = {
  path: string;
  sizeBytes: number;
  modifiedAt: number | null;
};

function normalizeProtectedPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const rawPath = trimmed.startsWith('file://')
    ? trimmed.slice('file://'.length)
    : trimmed;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

async function readDirectFiles(directoryPath: string): Promise<CountedFile[]> {
  if (!(await RNFS.exists(directoryPath))) {
    return [];
  }

  const entries = await RNFS.readDir(directoryPath);
  return entries
    .filter(entry => entry.isFile())
    .map(entry => ({
      // `entry.path` is already the path RNFS expects for unlink. Decoding it
      // would turn a legitimate percent sequence in a filename into another
      // path and could make the destructive action target the wrong file.
      path: entry.path,
      sizeBytes: Math.max(0, Number(entry.size) || 0),
      modifiedAt:
        entry.mtime instanceof Date && Number.isFinite(entry.mtime.getTime())
          ? entry.mtime.getTime()
          : null,
    }));
}

function sumFileBytes(files: readonly CountedFile[]) {
  return files.reduce((total, file) => total + file.sizeBytes, 0);
}

function emptyAudioDiagnostics(
  ownership: StoredAudioOwnershipResult,
): AudioStorageDiagnostics {
  return {
    fileCount: null,
    sizeBytes: null,
    isComplete: false,
    ownershipComplete: ownership.isComplete,
    protectedFileCount: null,
    protectedSizeBytes: null,
    unlinkedFileCount: null,
    unlinkedSizeBytes: null,
    maintenanceEligibleFileCount: null,
    maintenanceEligibleSizeBytes: null,
    unreadableStorageKeyCount: ownership.unreadableStorageKeys.length,
  };
}

async function readAudioDiagnostics(
  now: number,
): Promise<AudioStorageDiagnostics> {
  const runtime = getAudioRuntimeOwnershipSnapshot();
  const ownership = readStoredAudioOwnership({
    activeRecordingUri: runtime.activeRecordingUri,
    pendingRecordingUri: runtime.pendingRecordingUri,
  });

  try {
    const directoryPath = `${RNFS.DocumentDirectoryPath}/${AUDIO_DIRECTORY_NAME}`;
    const files = await readDirectFiles(directoryPath);
    const totalSizeBytes = sumFileBytes(files);

    if (!ownership.isComplete) {
      return {
        fileCount: files.length,
        sizeBytes: totalSizeBytes,
        isComplete: true,
        ownershipComplete: false,
        protectedFileCount: null,
        protectedSizeBytes: null,
        unlinkedFileCount: null,
        unlinkedSizeBytes: null,
        maintenanceEligibleFileCount: null,
        maintenanceEligibleSizeBytes: null,
        unreadableStorageKeyCount: ownership.unreadableStorageKeys.length,
      };
    }

    const protectedPaths = new Set(
      ownership.protectedUris.map(normalizeProtectedPath).filter(Boolean),
    );
    const protectedFiles = files.filter(file => protectedPaths.has(file.path));
    const unlinkedFiles = files.filter(file => !protectedPaths.has(file.path));
    const cutoff = now - SCHEDULED_AUDIO_CLEANUP_MAX_AGE_DAYS * MILLIS_PER_DAY;
    const maintenanceEligibleFiles = unlinkedFiles.filter(
      file => file.modifiedAt !== null && file.modifiedAt < cutoff,
    );

    return {
      fileCount: files.length,
      sizeBytes: totalSizeBytes,
      isComplete: true,
      ownershipComplete: true,
      protectedFileCount: protectedFiles.length,
      protectedSizeBytes: sumFileBytes(protectedFiles),
      unlinkedFileCount: unlinkedFiles.length,
      unlinkedSizeBytes: sumFileBytes(unlinkedFiles),
      maintenanceEligibleFileCount: maintenanceEligibleFiles.length,
      maintenanceEligibleSizeBytes: sumFileBytes(maintenanceEligibleFiles),
      unreadableStorageKeyCount: 0,
    };
  } catch (error) {
    reportActionError('storage_diagnostics.audio', error);
    return emptyAudioDiagnostics(ownership);
  }
}

async function readExportDiagnostics(): Promise<StorageBucketDiagnostics> {
  try {
    const files = await readDirectFiles(getExportDirectoryPath());
    return {
      fileCount: files.length,
      sizeBytes: sumFileBytes(files),
      isComplete: true,
    };
  } catch (error) {
    reportActionError('storage_diagnostics.exports', error);
    return {
      fileCount: null,
      sizeBytes: null,
      isComplete: false,
    };
  }
}

function utf8ByteLength(value: string) {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function readLocalDataDiagnostics(): LocalDataDiagnostics {
  try {
    const keys = kv.getAllKeys();
    let estimatedSizeBytes = 0;

    for (const key of keys) {
      estimatedSizeBytes += utf8ByteLength(key);

      const stringValue = kv.getString(key);
      if (stringValue !== undefined) {
        estimatedSizeBytes += utf8ByteLength(stringValue);
        continue;
      }

      const numberValue = kv.getNumber(key);
      if (numberValue !== undefined) {
        estimatedSizeBytes += utf8ByteLength(String(numberValue));
        continue;
      }

      const booleanValue = kv.getBoolean(key);
      if (booleanValue !== undefined) {
        estimatedSizeBytes += booleanValue ? 4 : 5;
      }
    }

    return {
      keyCount: keys.length,
      estimatedSizeBytes,
      isComplete: true,
    };
  } catch (error) {
    reportActionError('storage_diagnostics.local_data', error);
    return {
      keyCount: null,
      estimatedSizeBytes: null,
      isComplete: false,
    };
  }
}

export async function readStorageDiagnostics(
  now: number = Date.now(),
): Promise<StorageDiagnosticsSnapshot> {
  const [audio, transcriptionStatus, exports] = await Promise.all([
    readAudioDiagnostics(now),
    getDreamTranscriptionModelStatus().catch(error => {
      reportActionError('storage_diagnostics.transcription_model', error);
      return null;
    }),
    readExportDiagnostics(),
  ]);
  const localData = readLocalDataDiagnostics();
  const transcriptionModel = transcriptionStatus
    ? {
        installed: transcriptionStatus.installed,
        sizeBytes: transcriptionStatus.sizeBytes,
        isComplete:
          !transcriptionStatus.installed ||
          transcriptionStatus.sizeBytes !== null,
      }
    : {
        installed: false,
        sizeBytes: null,
        isComplete: false,
      };

  const totalKnownBytes =
    (audio.sizeBytes ?? 0) +
    (transcriptionModel.sizeBytes ?? 0) +
    (exports.sizeBytes ?? 0) +
    (localData.estimatedSizeBytes ?? 0);
  const isComplete =
    audio.isComplete &&
    transcriptionModel.isComplete &&
    exports.isComplete &&
    localData.isComplete;

  observability.trackEvent('storage_diagnostics_read', {
    complete: isComplete,
    audio_file_count: audio.fileCount ?? undefined,
    audio_unlinked_file_count: audio.unlinkedFileCount ?? undefined,
    export_file_count: exports.fileCount ?? undefined,
    transcription_model_installed: transcriptionModel.installed,
    local_key_count: localData.keyCount ?? undefined,
  });

  return {
    audio,
    transcriptionModel,
    exports,
    localData,
    totalKnownBytes,
    isComplete,
    refreshedAt: now,
  };
}

export async function cleanupUnlinkedAudioNow(): Promise<ManualAudioCleanupResult> {
  const runtime = getAudioRuntimeOwnershipSnapshot();

  if (runtime.recordingActive) {
    const deferred: ManualAudioCleanupResult = {
      status: 'deferred',
      reason: 'recording-active',
      protectedUriCount: 0,
      maxAgeDays: 0,
    };
    observability.trackEvent('storage_audio_cleanup_requested', {
      status: deferred.status,
      reason: deferred.reason,
    });
    return deferred;
  }

  const result = await runAudioCleanup({
    maxAgeDays: 0,
    activeRecordingUri: runtime.activeRecordingUri,
    pendingRecordingUri: runtime.pendingRecordingUri,
  });

  observability.trackEvent('storage_audio_cleanup_requested', {
    status: result.status,
    reason: result.status === 'completed' ? undefined : result.reason,
    deleted_count:
      result.status === 'completed' ? result.deletedCount : undefined,
    protected_uri_count: result.protectedUriCount,
  });

  return result;
}

export async function deleteGeneratedExports(): Promise<ExportCleanupResult> {
  const directoryPath = getExportDirectoryPath();
  let files: CountedFile[] = [];

  try {
    files = await readDirectFiles(directoryPath);
  } catch (error) {
    reportActionError('storage_diagnostics.delete_exports.read', error);
    throw error;
  }

  let deletedCount = 0;
  let deletedSizeBytes = 0;
  let failedCount = 0;

  for (const file of files) {
    try {
      await RNFS.unlink(file.path);
      deletedCount += 1;
      deletedSizeBytes += file.sizeBytes;
    } catch (error) {
      failedCount += 1;
      reportActionError('storage_diagnostics.delete_exports.file', error, {
        file_size_bytes: file.sizeBytes,
      });
    }
  }

  observability.trackEvent('storage_exports_deleted', {
    deleted_count: deletedCount,
    deleted_size_bytes: deletedSizeBytes,
    failed_count: failedCount,
  });

  return { deletedCount, deletedSizeBytes, failedCount };
}

export async function deleteStoredTranscriptionModel() {
  await deleteDreamTranscriptionModel();
  observability.trackEvent('storage_transcription_model_deleted');
}
