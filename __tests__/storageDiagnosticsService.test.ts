import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import { readStoredAudioOwnership } from '../src/features/dreams/services/audioOwnershipStorageService';
import { runAudioCleanup } from '../src/features/dreams/services/audioCleanupService';
import { getAudioRuntimeOwnershipSnapshot } from '../src/features/dreams/services/audioRuntimeOwnershipService';
import {
  deleteDreamTranscriptionModel,
  getDreamTranscriptionModelStatus,
} from '../src/features/dreams/services/dreamTranscriptionService';
import {
  cleanupUnlinkedAudioNow,
  deleteGeneratedExports,
  deleteStoredTranscriptionModel,
  readStorageDiagnostics,
} from '../src/features/settings/services/storageDiagnosticsService';

jest.mock(
  '../src/features/dreams/services/audioOwnershipStorageService',
  () => ({
    readStoredAudioOwnership: jest.fn(),
  }),
);

jest.mock('../src/features/dreams/services/audioCleanupService', () => ({
  runAudioCleanup: jest.fn(),
}));

jest.mock(
  '../src/features/dreams/services/audioRuntimeOwnershipService',
  () => ({
    getAudioRuntimeOwnershipSnapshot: jest.fn(),
  }),
);

jest.mock('../src/features/dreams/services/dreamTranscriptionService', () => ({
  getDreamTranscriptionModelStatus: jest.fn(),
  deleteDreamTranscriptionModel: jest.fn(),
}));

jest.mock('../src/features/settings/services/dataExportService', () => ({
  getExportDirectoryPath: () => '/exports',
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

const mockedReadOwnership = jest.mocked(readStoredAudioOwnership);
const mockedRunAudioCleanup = jest.mocked(runAudioCleanup);
const mockedRuntimeSnapshot = jest.mocked(getAudioRuntimeOwnershipSnapshot);
const mockedModelStatus = jest.mocked(getDreamTranscriptionModelStatus);
const mockedDeleteModel = jest.mocked(deleteDreamTranscriptionModel);

function fileEntry(path: string, size: number, modifiedAt: number) {
  return {
    name: path.split('/').pop() ?? path,
    path,
    size,
    mtime: new Date(modifiedAt),
    ctime: new Date(modifiedAt),
    isFile: () => true,
    isDirectory: () => false,
  };
}

describe('storageDiagnosticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    (RNFS.exists as jest.Mock).mockReset();
    (RNFS.readDir as jest.Mock).mockReset();
    (RNFS.unlink as jest.Mock).mockReset();
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    mockedRuntimeSnapshot.mockReturnValue({
      recordingActive: false,
      activeRecordingUri: null,
      pendingRecordingUri: null,
    });
    mockedReadOwnership.mockReturnValue({
      protectedUris: ['file:///documents/audio/protected.m4a'],
      isComplete: true,
      unreadableStorageKeys: [],
    });
    mockedModelStatus.mockResolvedValue({
      installed: true,
      filePath: '/documents/whisper-models/model.bin',
      sizeBytes: 500,
    });
  });

  test('counts protected, unlinked and scheduled-cleanup audio separately', async () => {
    const now = 1_800_000_000_000;
    const old = now - 8 * 24 * 60 * 60 * 1000;
    const recent = now - 2 * 24 * 60 * 60 * 1000;

    (RNFS.readDir as jest.Mock).mockImplementation(async (path: string) => {
      if (path === '/documents/audio') {
        return [
          fileEntry('/documents/audio/protected.m4a', 100, old),
          fileEntry('/documents/audio/orphan-old.m4a', 200, old),
          fileEntry('/documents/audio/orphan-new.m4a', 300, recent),
        ];
      }
      if (path === '/exports') {
        return [
          fileEntry('/exports/backup.json', 400, recent),
          fileEntry('/exports/archive.pdf', 600, recent),
        ];
      }
      return [];
    });

    kv.set('dreams', '[{"id":"one"}]');
    kv.set('storage-schema-version', 12);
    kv.set('cloud-sync-enabled', false);

    const result = await readStorageDiagnostics(now);

    expect(result.audio).toMatchObject({
      fileCount: 3,
      sizeBytes: 600,
      ownershipComplete: true,
      protectedFileCount: 1,
      protectedSizeBytes: 100,
      unlinkedFileCount: 2,
      unlinkedSizeBytes: 500,
      maintenanceEligibleFileCount: 1,
      maintenanceEligibleSizeBytes: 200,
    });
    expect(result.exports).toEqual({
      fileCount: 2,
      sizeBytes: 1_000,
      isComplete: true,
    });
    expect(result.transcriptionModel).toEqual({
      installed: true,
      sizeBytes: 500,
      isComplete: true,
    });
    expect(result.localData.keyCount).toBe(3);
    expect(result.localData.estimatedSizeBytes).toBeGreaterThan(0);
    expect(result.totalKnownBytes).toBe(
      600 + 1_000 + 500 + result.localData.estimatedSizeBytes!,
    );
  });

  test('shows total audio but withholds ownership classification when storage is incomplete', async () => {
    mockedReadOwnership.mockReturnValue({
      protectedUris: ['file:///documents/audio/known.m4a'],
      isComplete: false,
      unreadableStorageKeys: ['dreams'],
    });
    (RNFS.readDir as jest.Mock).mockImplementation(async (path: string) =>
      path === '/documents/audio'
        ? [fileEntry('/documents/audio/known.m4a', 321, 1)]
        : [],
    );

    const result = await readStorageDiagnostics(1_800_000_000_000);

    expect(result.audio).toMatchObject({
      fileCount: 1,
      sizeBytes: 321,
      isComplete: true,
      ownershipComplete: false,
      protectedFileCount: null,
      unlinkedFileCount: null,
      maintenanceEligibleFileCount: null,
      unreadableStorageKeyCount: 1,
    });
  });

  test('manual cleanup defers before the orchestrator while recording is active', async () => {
    mockedRuntimeSnapshot.mockReturnValue({
      recordingActive: true,
      activeRecordingUri: 'file:///documents/audio/active.m4a',
      pendingRecordingUri: null,
    });

    await expect(cleanupUnlinkedAudioNow()).resolves.toEqual({
      status: 'deferred',
      reason: 'recording-active',
      protectedUriCount: 0,
      maxAgeDays: 0,
    });
    expect(mockedRunAudioCleanup).not.toHaveBeenCalled();
  });

  test('manual cleanup delegates zero-age deletion to the fail-closed orchestrator', async () => {
    mockedRunAudioCleanup.mockResolvedValue({
      status: 'completed',
      deletedCount: 2,
      protectedUriCount: 4,
      maxAgeDays: 0,
    });

    await expect(cleanupUnlinkedAudioNow()).resolves.toMatchObject({
      status: 'completed',
      deletedCount: 2,
    });
    expect(mockedRunAudioCleanup).toHaveBeenCalledWith({
      maxAgeDays: 0,
      activeRecordingUri: null,
      pendingRecordingUri: null,
    });
  });

  test('export deletion keeps native paths exact and continues after one failure', async () => {
    (RNFS.readDir as jest.Mock).mockResolvedValue([
      fileEntry('/exports/file%20name.pdf', 100, 1),
      fileEntry('/exports/backup.json', 200, 1),
    ]);
    (RNFS.unlink as jest.Mock)
      .mockRejectedValueOnce(new Error('locked'))
      .mockResolvedValueOnce(undefined);

    await expect(deleteGeneratedExports()).resolves.toEqual({
      deletedCount: 1,
      deletedSizeBytes: 200,
      failedCount: 1,
    });
    expect(RNFS.unlink).toHaveBeenNthCalledWith(1, '/exports/file%20name.pdf');
    expect(RNFS.unlink).toHaveBeenNthCalledWith(2, '/exports/backup.json');
  });

  test('model deletion uses the transcription service boundary', async () => {
    mockedDeleteModel.mockResolvedValue(undefined);

    await deleteStoredTranscriptionModel();

    expect(mockedDeleteModel).toHaveBeenCalledTimes(1);
  });
});
