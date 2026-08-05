import {
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  DREAMS_STORAGE_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import { readStoredAudioOwnership } from '../src/features/dreams/services/audioOwnershipStorageService';

function storedDream(id: string, createdAt: number, audioUri?: string) {
  return {
    id,
    createdAt,
    audioUri,
    tags: [],
  };
}

describe('stored audio ownership', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('collects every current storage owner and runtime recording', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        storedDream('dream-b', 200, 'file:///saved-b.m4a'),
        storedDream('dream-a', 100, 'file:///shared.m4a'),
      ]),
    );
    kv.set(
      DREAM_DRAFT_STORAGE_KEY,
      JSON.stringify({ audioUri: 'file:///shared.m4a' }),
    );
    kv.set(
      `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-b`,
      JSON.stringify({ audioUri: 'file:///edit-b.m4a' }),
    );
    kv.set(
      `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}deleted-dream`,
      JSON.stringify({ audioUri: 'file:///stale-edit.m4a' }),
    );

    const result = readStoredAudioOwnership({
      activeRecordingUri: 'file:///active.m4a',
      pendingRecordingUri: 'file:///pending.m4a',
    });

    expect(result).toEqual({
      protectedUris: [
        'file:///saved-b.m4a',
        'file:///shared.m4a',
        'file:///edit-b.m4a',
        'file:///active.m4a',
        'file:///pending.m4a',
      ],
      isComplete: true,
      unreadableStorageKeys: [],
    });
  });

  test('reads current edit drafts in deterministic dream-id order', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        storedDream('dream-z', 200),
        storedDream('dream-a', 100),
      ]),
    );
    kv.set(
      `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-z`,
      JSON.stringify({ audioUri: 'file:///edit-z.m4a' }),
    );
    kv.set(
      `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-a`,
      JSON.stringify({ audioUri: 'file:///edit-a.m4a' }),
    );

    expect(readStoredAudioOwnership().protectedUris).toEqual([
      'file:///edit-a.m4a',
      'file:///edit-z.m4a',
    ]);
  });

  test('marks a corrupt create draft as unsafe for cleanup', () => {
    kv.set(DREAM_DRAFT_STORAGE_KEY, '{"audioUri":"file:///half');

    expect(
      readStoredAudioOwnership({
        activeRecordingUri: 'file:///active.m4a',
      }),
    ).toEqual({
      protectedUris: ['file:///active.m4a'],
      isComplete: false,
      unreadableStorageKeys: [DREAM_DRAFT_STORAGE_KEY],
    });
  });

  test('marks a corrupt edit draft for a current dream as unsafe', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([storedDream('dream-1', 100, 'file:///saved.m4a')]),
    );
    const editDraftKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`;
    kv.set(editDraftKey, 'not-json');

    expect(readStoredAudioOwnership()).toEqual({
      protectedUris: ['file:///saved.m4a'],
      isComplete: false,
      unreadableStorageKeys: [editDraftKey],
    });
  });

  test('ignores a corrupt edit draft whose dream no longer exists', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([storedDream('dream-1', 100, 'file:///saved.m4a')]),
    );
    kv.set(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}deleted-dream`, 'not-json');

    expect(readStoredAudioOwnership()).toEqual({
      protectedUris: ['file:///saved.m4a'],
      isComplete: true,
      unreadableStorageKeys: [],
    });
  });

  test('fails closed when the saved dream store is unreadable', () => {
    kv.set(DREAMS_STORAGE_KEY, '[{"id":"dream-1"');
    kv.set(
      DREAM_DRAFT_STORAGE_KEY,
      JSON.stringify({ audioUri: 'file:///draft.m4a' }),
    );

    expect(
      readStoredAudioOwnership({
        pendingRecordingUri: 'file:///pending.m4a',
      }),
    ).toEqual({
      protectedUris: ['file:///draft.m4a', 'file:///pending.m4a'],
      isComplete: false,
      unreadableStorageKeys: [DREAMS_STORAGE_KEY],
    });
  });
});
