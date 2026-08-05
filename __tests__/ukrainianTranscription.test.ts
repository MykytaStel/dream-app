jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  mkdir: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn(async () => true),
  stat: jest.fn().mockResolvedValue({ size: '0' }),
  unlink: jest.fn().mockResolvedValue(undefined),
  readDir: jest.fn().mockResolvedValue([]),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

// A single shared spy, because `initWhisper` is async: reading the transcribe
// mock off `initWhisper.mock.results[0].value` gets the pending promise, not the
// context, and the assertion silently reads undefined.
const mockTranscribe = jest.fn(() => ({
  stop: jest.fn(),
  promise: Promise.resolve({
    result: 'Скляний коридор над морем',
    language: 'uk',
    segments: [],
    isAborted: false,
  }),
}));

jest.mock('../src/features/dreams/services/whisperNative', () => ({
  initWhisper: jest.fn(async () => ({ transcribe: mockTranscribe })),
}));

import RNFS from 'react-native-fs';
import { initWhisper } from '../src/features/dreams/services/whisperNative';
import { kv } from '../src/services/storage/mmkv';
import { saveDream } from '../src/features/dreams/repository/dreamsRepository';
import { saveLocale } from '../src/i18n/localeStore';
import {
  __unsafeResetDreamTranscriptionContextForTests,
  getDreamTranscriptionModelFilePath,
  pruneUnusedTranscriptionModels,
  transcribeDreamAudio,
} from '../src/features/dreams/services/dreamTranscriptionService';
import {
  selectTranscriptionModel,
  listTranscriptionModelFilenames,
} from '../src/features/dreams/model/transcriptionModel';

/**
 * The bug these cover did not look like a bug.
 *
 * An English-only model handed Ukrainian speech does not error and does not
 * return nothing — it returns fluent, confident English that has no relation to
 * what was said. Transcription appeared to work, and was useless to anyone
 * recording in Ukrainian.
 */

function lastTranscribeLanguage(): string | undefined {
  const calls = mockTranscribe.mock.calls as unknown as Array<
    [string, { language?: string }]
  >;
  return calls[calls.length - 1]?.[1]?.language;
}

async function transcribeOnce(id: string) {
  saveDream({
    id,
    createdAt: 1710000000000,
    sleepDate: '2026-03-06',
    audioUri: 'file:///documents/voice.m4a',
    tags: [],
  });
  await transcribeDreamAudio(id);
}

describe('Ukrainian transcription', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
    __unsafeResetDreamTranscriptionContextForTests();
  });

  test('Ukrainian does not use the English-only model', () => {
    saveLocale('uk');

    expect(getDreamTranscriptionModelFilePath()).not.toContain('.en.bin');
  });

  test('English keeps the English-only model, which is better at English', () => {
    saveLocale('en');

    expect(getDreamTranscriptionModelFilePath()).toContain('ggml-tiny.en.bin');
  });

  test('the language handed to whisper follows the app language', async () => {
    saveLocale('uk');

    await transcribeOnce('uk-dream');

    // The line that made the feature useless: this used to be the string 'en',
    // whatever the user had chosen.
    expect(lastTranscribeLanguage()).toBe('uk');
  });

  test('changing language rebuilds the context instead of reusing the old model', async () => {
    saveLocale('en');
    await transcribeOnce('en-dream');
    expect(initWhisper).toHaveBeenCalledTimes(1);

    saveLocale('uk');
    await transcribeOnce('uk-dream');

    // Without this, whisper keeps the English model loaded and goes on
    // producing English no matter what the settings say.
    expect(initWhisper).toHaveBeenCalledTimes(2);
    expect((initWhisper as jest.Mock).mock.calls[1][0].filePath).not.toContain(
      '.en.bin',
    );
  });

  test('the same language does not reload the model on every dream', async () => {
    saveLocale('uk');

    await transcribeOnce('first');
    await transcribeOnce('second');

    expect(initWhisper).toHaveBeenCalledTimes(1);
  });

  test('switching language keeps the active model and deletes superseded models', async () => {
    saveLocale('uk');
    (RNFS.readDir as jest.Mock).mockResolvedValue([
      {
        name: 'ggml-tiny.en.bin',
        path: '/documents/whisper-models/ggml-tiny.en.bin',
      },
      {
        name: 'ggml-base.bin',
        path: '/documents/whisper-models/ggml-base.bin',
      },
      {
        name: 'ggml-small-q5_1.bin',
        path: '/documents/whisper-models/ggml-small-q5_1.bin',
      },
    ]);

    const removed = await pruneUnusedTranscriptionModels();

    // Both the English model and the previous Ukrainian base model are now
    // unused. The active small-q5_1 model must remain available.
    expect(removed).toEqual(['ggml-tiny.en.bin', 'ggml-base.bin']);
    expect(RNFS.unlink).toHaveBeenCalledTimes(2);
    expect(RNFS.unlink).toHaveBeenCalledWith(
      '/documents/whisper-models/ggml-tiny.en.bin',
    );
    expect(RNFS.unlink).toHaveBeenCalledWith(
      '/documents/whisper-models/ggml-base.bin',
    );
    expect(RNFS.unlink).not.toHaveBeenCalledWith(
      '/documents/whisper-models/ggml-small-q5_1.bin',
    );
  });

  test('pruning never touches a file this app did not download', async () => {
    saveLocale('uk');
    (RNFS.readDir as jest.Mock).mockResolvedValue([
      {
        name: 'someone-elses.bin',
        path: '/documents/whisper-models/someone-elses.bin',
      },
    ]);

    expect(await pruneUnusedTranscriptionModels()).toEqual([]);
    expect(RNFS.unlink).not.toHaveBeenCalled();
  });

  test('every locale has a model, so none can silently fall back to English', () => {
    for (const locale of ['en', 'uk'] as const) {
      const model = selectTranscriptionModel(locale);

      expect(model.filename).toBeTruthy();
      expect(model.url).toContain(model.filename);
      expect(model.approxBytes).toBeGreaterThan(0);
    }

    expect(listTranscriptionModelFilenames().length).toBeGreaterThan(1);
  });

  test('an English-only model is never paired with a non-English language', () => {
    // The exact shape of the original bug, as a rule rather than a case.
    for (const locale of ['en', 'uk'] as const) {
      const model = selectTranscriptionModel(locale);
      if (model.filename.includes('.en.')) {
        expect(model.language).toBe('en');
      }
    }
  });
});
