import { clearDreamEditDraft } from '../../services/dreamDraftService';
import {
  applyRemoteDreamDeletionTombstone,
  clearDreamDeletionTombstone,
} from '../dreamDeletionTombstonesRepository';
import {
  DreamSyncBundle,
  hydrateDreamFromSyncBundle,
} from '../../../../services/api/contracts/dreamSync';
import {
  listDreams,
  persistDreams,
  removeUndefinedSyncError,
  updateDreamById,
} from './core';

export function applyRemoteDreamDeletion(id: string, deletedAt: number) {
  persistDreams(listDreams().filter(dream => dream.id !== id));
  clearDreamEditDraft(id);
  return applyRemoteDreamDeletionTombstone(id, deletedAt);
}

export function markDreamSyncing(id: string) {
  return updateDreamById(
    id,
    dream =>
      removeUndefinedSyncError({
        ...dream,
        syncStatus: 'syncing',
        syncError: undefined,
      }),
    { markLocalChange: false },
  );
}

export function markDreamSynced(
  id: string,
  input: { audioRemotePath?: string; syncedAt?: number } = {},
) {
  const syncedAt = input.syncedAt ?? Date.now();

  return updateDreamById(
    id,
    dream =>
      removeUndefinedSyncError({
        ...dream,
        audioRemotePath: input.audioRemotePath ?? dream.audioRemotePath,
        syncStatus: 'synced',
        lastSyncedAt: syncedAt,
        syncError: undefined,
      }),
    { markLocalChange: false },
  );
}

export function markDreamSyncError(id: string, errorMessage?: string) {
  return updateDreamById(
    id,
    dream => ({
      ...dream,
      syncStatus: 'error',
      syncError: errorMessage?.trim() || 'sync-error',
    }),
    { markLocalChange: false },
  );
}

/**
 * Re-queues every "synced" dream for upload and clears `audioRemotePath`. Used
 * when the cloud copy turns out empty (the encryption migration discarded the
 * server's plaintext + audio). Clearing the remote path matters: upload skips
 * any dream that has one, so it would never re-send the recording. `updatedAt`
 * is left alone so other devices do not see every dream as freshly edited.
 */
export function markAllDreamsPendingUpload() {
  const all = listDreams();
  const pending = all.map(dream =>
    dream.syncStatus === 'synced'
      ? {
          ...dream,
          syncStatus: 'local' as const,
          audioRemotePath: undefined,
        }
      : { ...dream, audioRemotePath: undefined },
  );

  persistDreams(pending);
  return pending.length;
}

export function upsertDreamFromSyncBundle(bundle: DreamSyncBundle) {
  const nextDream = hydrateDreamFromSyncBundle(bundle);
  const all = listDreams();
  const idx = all.findIndex(dream => dream.id === nextDream.id);

  if (idx >= 0) {
    all[idx] = nextDream;
  } else {
    all.unshift(nextDream);
  }

  persistDreams(all);
  clearDreamDeletionTombstone(nextDream.id);
  return nextDream;
}
