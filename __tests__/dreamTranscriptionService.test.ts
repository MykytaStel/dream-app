jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  mkdir: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn(async path => path === '/documents/whisper-models/ggml-tiny.en.bin'),
  stat: jest.fn().mockResolvedValue({ size: '0' }),
  unlink: jest.fn().mockResolvedValue(undefined),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

jest.mock('../src/features/dreams/services/whisperNative', () => ({
  initWhisper: jest.fn(async () => ({
    transcribe: jest.fn((_filePath: string, options?: { onProgress?: (progress: number) => void }) => {
      options?.onProgress?.(48);
      options?.onProgress?.(100);
      return {
        stop: jest.fn(),
        promise: Promise.resolve({
          result: 'Glass hallway above the sea',
          language: 'en',
          segments: [],
          isAborted: false,
        }),
      };
    }),
  })),
}));

import RNFS from 'react-native-fs';
import { initWhisper } from '../src/features/dreams/services/whisperNative';
import { kv } from '../src/services/storage/mmkv';
import { saveDream, getDream } from '../src/features/dreams/repository/dreamsRepository';
import {
  __unsafeResetDreamTranscriptionContextForTests,
  deleteDreamTranscriptionModel,
  ensureDreamTranscriptionModelInstalled,
  getDreamTranscriptionModelFilePath,
  getDreamTranscriptionModelStatus,
  transcribeDreamAudio,
} from '../src/features/dreams/services/dreamTranscriptionService';

describe('dreamTranscriptionService', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
    __unsafeResetDreamTranscriptionContextForTests();
  });

  test('transcribes a saved audio dream and persists transcript text', async () => {
    saveDream({
      id: 'dream-audio-1',
      createdAt: 1,
      sleepDate: '2026-03-06',
      audioUri: 'file:///voice.m4a',
      tags: [],
    });

    const progressEvents: string[] = [];
    await transcribeDreamAudio('dream-audio-1', progress => {
      progressEvents.push(`${progress.phase}:${progress.progress ?? 'na'}`);
    });

    expect(initWhisper).toHaveBeenCalledWith({
      filePath: getDreamTranscriptionModelFilePath(),
      useGpu: expect.any(Boolean),
      useCoreMLIos: expect.any(Boolean),
    });
    expect(progressEvents).toEqual(['transcribing:48', 'transcribing:100']);
    expect(getDream('dream-audio-1')).toMatchObject({
      transcript: 'Glass hallway above the sea',
      transcriptStatus: 'ready',
      transcriptSource: 'generated',
    });
  });

  test('downloads the model when it is not available locally', async () => {
    const mockedExists = RNFS.exists as jest.MockedFunction<typeof RNFS.exists>;
    mockedExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    saveDream({
      id: 'dream-audio-2',
      createdAt: 2,
      sleepDate: '2026-03-06',
      audioUri: 'file:///voice-2.m4a',
      tags: [],
    });

    const progressEvents: string[] = [];
    await transcribeDreamAudio('dream-audio-2', progress => {
      progressEvents.push(`${progress.phase}:${progress.progress ?? 'na'}`);
    });

    expect(RNFS.downloadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fromUrl:
          'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
        toFile: '/documents/whisper-models/ggml-tiny.en.bin',
      }),
    );
    expect(progressEvents[0]).toBe('preparing-model:0');
  });

  test('returns model status and supports deleting the local model', async () => {
    const mockedExists = RNFS.exists as jest.MockedFunction<typeof RNFS.exists>;
    const mockedStat = RNFS.stat as jest.MockedFunction<typeof RNFS.stat>;
    mockedExists.mockResolvedValue(true);
    mockedStat.mockResolvedValueOnce({ size: '73400320' } as never);

    const status = await getDreamTranscriptionModelStatus();
    expect(status).toEqual({
      installed: true,
      filePath: '/documents/whisper-models/ggml-tiny.en.bin',
      sizeBytes: 73400320,
    });

    await deleteDreamTranscriptionModel();
    expect(RNFS.unlink).toHaveBeenCalledWith('/documents/whisper-models/ggml-tiny.en.bin');
  });

  test('installs the model without starting transcription', async () => {
    const mockedExists = RNFS.exists as jest.MockedFunction<typeof RNFS.exists>;
    const mockedStat = RNFS.stat as jest.MockedFunction<typeof RNFS.stat>;
    mockedExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    mockedStat.mockResolvedValueOnce({ size: '73400320' } as never);

    const progressEvents: string[] = [];
    const result = await ensureDreamTranscriptionModelInstalled(progress => {
      progressEvents.push(`${progress.phase}:${progress.progress ?? 'na'}`);
    });

    expect(RNFS.downloadFile).toHaveBeenCalled();
    expect(result.status.installed).toBe(true);
    expect(progressEvents[0]).toBe('preparing-model:0');
    expect(initWhisper).not.toHaveBeenCalled();
  });

  test('marks the dream as error when transcription fails', async () => {
    (initWhisper as jest.Mock).mockResolvedValueOnce({
      transcribe: jest.fn(() => ({
        stop: jest.fn(),
        promise: Promise.reject(new Error('native-failure')),
      })),
    });

    saveDream({
      id: 'dream-audio-3',
      createdAt: 3,
      sleepDate: '2026-03-06',
      audioUri: 'file:///voice-3.m4a',
      tags: [],
    });

    await expect(transcribeDreamAudio('dream-audio-3')).rejects.toThrow('native-failure');
    expect(getDream('dream-audio-3')).toMatchObject({
      transcriptStatus: 'error',
    });
  });
});
