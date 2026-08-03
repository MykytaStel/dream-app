import RNFS from 'react-native-fs';
import {
  __unsafeResetDreamTranscriptionContextForTests,
  ensureDreamTranscriptionModelInstalled,
  transcribeDreamAudio,
} from '../src/features/dreams/services/dreamTranscriptionService';
import {
  getDream,
  updateDreamTranscriptState,
} from '../src/features/dreams/repository/dreamsRepository';

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    DocumentDirectoryPath: '/documents',
    mkdir: jest.fn(),
    exists: jest.fn(),
    downloadFile: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
    readDir: jest.fn(),
  },
}));

jest.mock('../src/features/dreams/services/whisperNative', () => ({
  initWhisper: jest.fn(),
}));

jest.mock('../src/i18n/localeStore', () => ({
  getStoredLocale: jest.fn(() => 'en'),
}));

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  getDream: jest.fn(),
  updateDreamTranscriptState: jest.fn((_dreamId, patch) => patch),
}));

type MockFs = {
  mkdir: jest.Mock;
  exists: jest.Mock;
  downloadFile: jest.Mock;
  unlink: jest.Mock;
  stat: jest.Mock;
  readDir: jest.Mock;
};

const fs = RNFS as unknown as MockFs;

function failModelDownload(statusCode = 503) {
  fs.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  fs.downloadFile.mockReturnValue({
    promise: Promise.resolve({ statusCode }),
  });
}

describe('transcription is not on the capture critical path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __unsafeResetDreamTranscriptionContextForTests();
    fs.mkdir.mockResolvedValue(undefined);
    fs.unlink.mockResolvedValue(undefined);
    fs.readDir.mockResolvedValue([]);
  });

  test('an interrupted model download removes the partial file', async () => {
    failModelDownload();

    await expect(ensureDreamTranscriptionModelInstalled()).rejects.toThrow(
      'model-download-failed:503',
    );

    expect(fs.unlink).toHaveBeenCalledWith(
      expect.stringContaining('/whisper-models/'),
    );
  });

  test('a transcription failure marks only the transcript as failed', async () => {
    const dream = {
      id: 'dream-1',
      createdAt: 1_775_000_000_000,
      sleepDate: '2026-08-03',
      audioUri: 'file:///audio/dream-1.m4a',
    };
    (getDream as jest.Mock).mockReturnValue(dream);
    failModelDownload(500);

    await expect(transcribeDreamAudio(dream.id)).rejects.toThrow(
      'model-download-failed:500',
    );

    expect(updateDreamTranscriptState).toHaveBeenNthCalledWith(1, dream.id, {
      transcriptStatus: 'processing',
      transcriptUpdatedAt: expect.any(Number),
    });
    expect(updateDreamTranscriptState).toHaveBeenLastCalledWith(dream.id, {
      transcriptStatus: 'error',
      transcriptUpdatedAt: expect.any(Number),
    });

    // The audio entry was already saved before transcription began. Failure
    // changes transcript state only; it does not delete or replace the dream.
    expect(dream.audioUri).toBe('file:///audio/dream-1.m4a');
  });
});
