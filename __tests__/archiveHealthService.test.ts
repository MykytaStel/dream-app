jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  listDreams: jest.fn(),
  replaceAllDreams: jest.fn(),
}));

jest.mock('../src/features/settings/services/dataExportService', () => ({
  exportDreamDataSnapshot: jest.fn(),
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import {
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
} from '../src/services/storage/keys';
import type { Dream } from '../src/features/dreams/model/dream';
import {
  listDreams,
  replaceAllDreams,
} from '../src/features/dreams/repository/dreamsRepository';
import { exportDreamDataSnapshot } from '../src/features/settings/services/dataExportService';
import {
  readArchiveHealth,
  repairArchiveHealth,
} from '../src/features/settings/services/archiveHealthService';

const mockedExists = RNFS.exists as jest.MockedFunction<typeof RNFS.exists>;
const mockedListDreams = jest.mocked(listDreams);
const mockedReplaceAllDreams = jest.mocked(replaceAllDreams);
const mockedExport = jest.mocked(exportDreamDataSnapshot);

function dream(overrides: Partial<Dream> = {}): Dream {
  return {
    id: 'dream-1',
    createdAt: 1_800_000_000_000,
    text: 'A dream',
    tags: [],
    ...overrides,
  };
}

function writeArchive(dreams: Dream[]) {
  kv.set(DREAMS_STORAGE_KEY, JSON.stringify(dreams));
  kv.set(DREAMS_INDEX_STORAGE_KEY, JSON.stringify([]));
  kv.set(DREAMS_META_STORAGE_KEY, JSON.stringify({ totalCount: dreams.length }));
}

describe('archive health service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of kv.getAllKeys()) {
      kv.remove(key);
    }
    mockedExists.mockResolvedValue(true);
    mockedExport.mockResolvedValue({
      filePath: '/exports/restore.json',
      payload: {} as never,
    });
  });

  test('reports a healthy readable archive without exposing record content', async () => {
    writeArchive([
      dream({ audioUri: 'file:///audio/kept.m4a', transcriptStatus: 'ready' }),
    ]);

    const result = await readArchiveHealth(1_900_000_000_000);

    expect(result).toMatchObject({
      status: 'healthy',
      archiveReadable: true,
      dreamCount: 1,
      audioReferenceCount: 1,
      checkedAudioCount: 1,
      issues: [],
      repairActions: [],
      checkedAt: 1_900_000_000_000,
    });
    expect(mockedExists).toHaveBeenCalledWith('/audio/kept.m4a');
    expect(JSON.stringify(result)).not.toContain('A dream');
  });

  test('groups missing audio, invalid derived data and orphan drafts', async () => {
    const missing = dream({
      audioUri: 'file:///audio/missing.m4a',
    });
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([missing]));
    kv.set(DREAMS_INDEX_STORAGE_KEY, '{broken');
    kv.set(DREAMS_META_STORAGE_KEY, '[]');
    kv.set(
      `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}deleted-dream`,
      JSON.stringify({ text: 'unfinished' }),
    );
    mockedExists.mockResolvedValue(false);

    const result = await readArchiveHealth();

    expect(result.status).toBe('attention');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'missing-audio-file', count: 1 }),
        expect.objectContaining({ code: 'derived-index-invalid', count: 1 }),
        expect.objectContaining({ code: 'derived-meta-invalid', count: 1 }),
        expect.objectContaining({ code: 'orphan-edit-draft', count: 1 }),
      ]),
    );
    expect(result.repairActions).toEqual(
      expect.arrayContaining([
        'detach-missing-audio',
        'rebuild-derived-data',
        'remove-orphan-edit-drafts',
      ]),
    );
  });

  test('blocks writes for an unreadable main archive', async () => {
    kv.set(DREAMS_STORAGE_KEY, '{not-json');

    const before = await readArchiveHealth();
    const result = await repairArchiveHealth(before);

    expect(before.status).toBe('blocked');
    expect(before.issues).toContainEqual(
      expect.objectContaining({ code: 'archive-unreadable', blocksRepair: true }),
    );
    expect(result).toMatchObject({
      status: 'blocked',
      reason: 'archive-unreadable',
    });
    expect(mockedExport).not.toHaveBeenCalled();
    expect(mockedReplaceAllDreams).not.toHaveBeenCalled();
  });

  test('creates a restore backup before deterministic repairs', async () => {
    const missing = dream({
      audioUri: 'file:///audio/missing.m4a',
      transcript: 'Kept transcript',
      transcriptStatus: 'ready',
      transcriptSource: 'generated',
    });
    writeArchive([missing]);
    kv.set(
      `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}deleted-dream`,
      JSON.stringify({ text: 'orphan' }),
    );
    mockedExists.mockResolvedValue(false);
    mockedListDreams.mockReturnValue([missing]);
    mockedReplaceAllDreams.mockImplementation(next => {
      writeArchive(next);
    });

    const before = await readArchiveHealth();
    const result = await repairArchiveHealth(before);

    expect(mockedExport).toHaveBeenCalledTimes(1);
    expect(mockedReplaceAllDreams).toHaveBeenCalledTimes(1);
    const repaired = mockedReplaceAllDreams.mock.calls[0][0][0];
    expect(repaired.audioUri).toBeUndefined();
    expect(repaired.transcript).toBe('Kept transcript');
    expect(repaired.transcriptStatus).toBe('ready');
    expect(
      kv.getString(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}deleted-dream`),
    ).toBeUndefined();
    expect(result).toMatchObject({
      status: 'completed',
      backupFilePath: '/exports/restore.json',
      detachedAudioCount: 1,
      removedDraftCount: 1,
    });
  });

  test('refuses repair when archive changed after the audit', async () => {
    writeArchive([dream()]);
    const before = await readArchiveHealth();
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([dream(), dream({ id: 'dream-2' })]));

    const result = await repairArchiveHealth(before);

    expect(result).toMatchObject({ status: 'blocked', reason: 'archive-changed' });
    expect(mockedExport).not.toHaveBeenCalled();
    expect(mockedReplaceAllDreams).not.toHaveBeenCalled();
  });
});
