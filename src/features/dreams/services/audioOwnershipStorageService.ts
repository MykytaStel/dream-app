import {
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  DREAMS_STORAGE_KEY,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import { listDreams } from '../repository/dreamsRepository';
import { collectProtectedAudioUris } from './audioOwnershipService';
import {
  DreamDraft,
  getDreamDraft,
  getDreamEditDraft,
} from './dreamDraftService';

export type RuntimeAudioOwnership = {
  activeRecordingUri?: string | null;
  pendingRecordingUri?: string | null;
};

export type StoredAudioOwnershipResult = {
  protectedUris: string[];
  isComplete: boolean;
  unreadableStorageKeys: string[];
};

function isJsonContainer(raw: string, kind: 'array' | 'object') {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return kind === 'array'
      ? Array.isArray(parsed)
      : typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

function readSavedDreamOwners(unreadableStorageKeys: string[]) {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  if (!isJsonContainer(raw, 'array')) {
    unreadableStorageKeys.push(DREAMS_STORAGE_KEY);
    return [];
  }

  const storedItems = JSON.parse(raw) as unknown[];
  const dreams = listDreams();

  // listDreams deliberately falls back to [] when sanitization cannot safely
  // read the store. Cleanup must be able to distinguish that failure from a
  // genuinely empty archive, otherwise every saved audio file looks orphaned.
  if (dreams.length !== storedItems.length) {
    unreadableStorageKeys.push(DREAMS_STORAGE_KEY);
  }

  return dreams;
}

function readDraftOwner(
  storageKey: string,
  readDraft: () => DreamDraft | null,
  unreadableStorageKeys: string[],
) {
  const raw = kv.getString(storageKey);
  if (!raw) {
    return null;
  }

  if (!isJsonContainer(raw, 'object')) {
    unreadableStorageKeys.push(storageKey);
    return null;
  }

  const draft = readDraft();
  if (!draft) {
    unreadableStorageKeys.push(storageKey);
  }

  return draft;
}

function readCurrentEditDraftOwners(
  currentDreamIds: ReadonlySet<string>,
  unreadableStorageKeys: string[],
) {
  let storageKeys: string[];
  try {
    storageKeys = kv.getAllKeys();
  } catch {
    unreadableStorageKeys.push(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}*`);
    return [];
  }

  const currentEditDraftIds = storageKeys
    .filter(key => key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX))
    .map(key => key.slice(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX.length))
    .filter(dreamId => dreamId && currentDreamIds.has(dreamId))
    .sort((left, right) => left.localeCompare(right));

  return currentEditDraftIds
    .map(dreamId => {
      const storageKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}${dreamId}`;
      return readDraftOwner(
        storageKey,
        () => getDreamEditDraft(dreamId),
        unreadableStorageKeys,
      );
    })
    .filter((draft): draft is DreamDraft => Boolean(draft));
}

export function readStoredAudioOwnership(
  runtime: RuntimeAudioOwnership = {},
): StoredAudioOwnershipResult {
  const unreadableStorageKeys: string[] = [];
  const savedDreams = readSavedDreamOwners(unreadableStorageKeys);
  const currentDreamIds = new Set(savedDreams.map(dream => dream.id));
  const createDraft = readDraftOwner(
    DREAM_DRAFT_STORAGE_KEY,
    getDreamDraft,
    unreadableStorageKeys,
  );
  const editDrafts = readCurrentEditDraftOwners(
    currentDreamIds,
    unreadableStorageKeys,
  );
  const uniqueUnreadableStorageKeys = Array.from(
    new Set(unreadableStorageKeys),
  ).sort((left, right) => left.localeCompare(right));

  return {
    protectedUris: collectProtectedAudioUris({
      dreams: savedDreams,
      createDraft,
      editDrafts,
      activeAudioUri: runtime.activeRecordingUri,
      pendingAudioUri: runtime.pendingRecordingUri,
    }),
    isComplete: uniqueUnreadableStorageKeys.length === 0,
    unreadableStorageKeys: uniqueUnreadableStorageKeys,
  };
}
