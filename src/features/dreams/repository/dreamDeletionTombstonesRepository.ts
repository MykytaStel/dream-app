import { kv } from '../../../services/storage/mmkv';
import { DREAM_DELETION_TOMBSTONES_STORAGE_KEY } from '../../../services/storage/keys';
import { reportStorageReadFailure } from '../../../services/observability/errorReporting';

export type DreamDeletionTombstoneSyncStatus =
  'local' | 'syncing' | 'synced' | 'error';

export type DreamDeletionTombstone = {
  dreamId: string;
  deletedAt: number;
  syncStatus: DreamDeletionTombstoneSyncStatus;
  lastSyncedAt?: number;
  syncError?: string;
};

let tombstoneCache: DreamDeletionTombstone[] | null = null;
let tombstoneCacheRaw: string | null = null;

function normalizeTombstone(
  input: Partial<DreamDeletionTombstone> &
    Pick<DreamDeletionTombstone, 'dreamId' | 'deletedAt'>,
): DreamDeletionTombstone {
  return {
    dreamId: input.dreamId,
    deletedAt: input.deletedAt,
    syncStatus:
      input.syncStatus === 'syncing' ||
      input.syncStatus === 'synced' ||
      input.syncStatus === 'error'
        ? input.syncStatus
        : 'local',
    lastSyncedAt:
      typeof input.lastSyncedAt === 'number' ? input.lastSyncedAt : undefined,
    syncError: input.syncError?.trim() || undefined,
  };
}

/**
 * Keeps duplicate identities visible to health diagnostics. Within one identity
 * the oldest record comes first, so `new Map(list.map(...))` retains the newest
 * value while still allowing the caller to count how many duplicates existed.
 */
function normalizeTombstonesForRead(tombstones: DreamDeletionTombstone[]) {
  return tombstones.map(normalizeTombstone).sort((left, right) => {
    if (left.dreamId === right.dreamId) {
      return left.deletedAt - right.deletedAt;
    }
    return right.deletedAt - left.deletedAt;
  });
}

/** Every write collapses duplicates and preserves the newest deletion. */
function normalizeTombstonesForPersist(tombstones: DreamDeletionTombstone[]) {
  const newestFirst = tombstones
    .map(normalizeTombstone)
    .sort((left, right) => right.deletedAt - left.deletedAt);
  const seen = new Set<string>();

  return newestFirst.filter(tombstone => {
    if (seen.has(tombstone.dreamId)) {
      return false;
    }
    seen.add(tombstone.dreamId);
    return true;
  });
}

function findNewestTombstoneIndex(
  tombstones: DreamDeletionTombstone[],
  dreamId: string,
) {
  let newestIndex = -1;
  for (let index = 0; index < tombstones.length; index += 1) {
    if (tombstones[index].dreamId !== dreamId) {
      continue;
    }
    if (
      newestIndex < 0 ||
      tombstones[index].deletedAt > tombstones[newestIndex].deletedAt
    ) {
      newestIndex = index;
    }
  }
  return newestIndex;
}

function persistTombstones(tombstones: DreamDeletionTombstone[]) {
  const normalized = normalizeTombstonesForPersist(tombstones);
  const raw = JSON.stringify(normalized);
  kv.set(DREAM_DELETION_TOMBSTONES_STORAGE_KEY, raw);
  tombstoneCache = normalized;
  tombstoneCacheRaw = raw;
}

export function listDreamDeletionTombstones() {
  const raw = kv.getString(DREAM_DELETION_TOMBSTONES_STORAGE_KEY);
  if (!raw) {
    tombstoneCache = [];
    tombstoneCacheRaw = null;
    return [] as DreamDeletionTombstone[];
  }

  if (tombstoneCache && tombstoneCacheRaw === raw) {
    return tombstoneCache;
  }

  try {
    const parsed = JSON.parse(raw) as DreamDeletionTombstone[];
    const normalized = normalizeTombstonesForRead(
      parsed.filter(
        tombstone =>
          tombstone &&
          typeof tombstone.dreamId === 'string' &&
          typeof tombstone.deletedAt === 'number',
      ),
    );
    tombstoneCache = normalized;
    tombstoneCacheRaw = raw;
    return normalized;
  } catch (error) {
    reportStorageReadFailure(DREAM_DELETION_TOMBSTONES_STORAGE_KEY, error);
    tombstoneCache = [];
    tombstoneCacheRaw = raw;
    return [];
  }
}

export function getDreamDeletionTombstone(dreamId: string) {
  const all = listDreamDeletionTombstones();
  const index = findNewestTombstoneIndex(all, dreamId);
  return index >= 0 ? all[index] : undefined;
}

export function saveDreamDeletionTombstone(
  dreamId: string,
  deletedAt = Date.now(),
) {
  const all = listDreamDeletionTombstones();
  const idx = findNewestTombstoneIndex(all, dreamId);
  const nextTombstone = normalizeTombstone({
    dreamId,
    deletedAt,
    syncStatus: 'local',
  });

  if (idx >= 0) {
    all[idx] = nextTombstone;
  } else {
    all.unshift(nextTombstone);
  }

  persistTombstones(all);
  return nextTombstone;
}

export function applyRemoteDreamDeletionTombstone(
  dreamId: string,
  deletedAt: number,
) {
  const all = listDreamDeletionTombstones();
  const idx = findNewestTombstoneIndex(all, dreamId);
  const nextTombstone = normalizeTombstone({
    dreamId,
    deletedAt,
    syncStatus: 'synced',
    lastSyncedAt: deletedAt,
  });

  if (idx >= 0) {
    all[idx] = nextTombstone;
  } else {
    all.unshift(nextTombstone);
  }

  persistTombstones(all);
  return nextTombstone;
}

export function markDreamDeletionTombstoneSyncing(dreamId: string) {
  const all = listDreamDeletionTombstones();
  const idx = findNewestTombstoneIndex(all, dreamId);
  if (idx < 0) {
    throw new Error(`Dream deletion tombstone not found: ${dreamId}`);
  }

  all[idx] = normalizeTombstone({
    ...all[idx],
    syncStatus: 'syncing',
    syncError: undefined,
  });
  persistTombstones(all);
  return all[idx];
}

export function markDreamDeletionTombstoneSynced(
  dreamId: string,
  syncedAt = Date.now(),
) {
  const all = listDreamDeletionTombstones();
  const idx = findNewestTombstoneIndex(all, dreamId);
  if (idx < 0) {
    throw new Error(`Dream deletion tombstone not found: ${dreamId}`);
  }

  all[idx] = normalizeTombstone({
    ...all[idx],
    syncStatus: 'synced',
    lastSyncedAt: syncedAt,
    syncError: undefined,
  });
  persistTombstones(all);
  return all[idx];
}

export function markDreamDeletionTombstoneSyncError(
  dreamId: string,
  errorMessage?: string,
) {
  const all = listDreamDeletionTombstones();
  const idx = findNewestTombstoneIndex(all, dreamId);
  if (idx < 0) {
    throw new Error(`Dream deletion tombstone not found: ${dreamId}`);
  }

  all[idx] = normalizeTombstone({
    ...all[idx],
    syncStatus: 'error',
    syncError: errorMessage?.trim() || 'sync-error',
  });
  persistTombstones(all);
  return all[idx];
}

export function clearDreamDeletionTombstone(dreamId: string) {
  persistTombstones(
    listDreamDeletionTombstones().filter(
      tombstone => tombstone.dreamId !== dreamId,
    ),
  );
}

export function clearDreamDeletionTombstonesForDreamIds(dreamIds: string[]) {
  const ids = new Set(dreamIds);
  persistTombstones(
    listDreamDeletionTombstones().filter(
      tombstone => !ids.has(tombstone.dreamId),
    ),
  );
}

/**
 * Replaces the complete tombstone collection through the same normalization
 * and cache boundary as normal sync writes. Duplicate identities collapse to
 * the newest deletion timestamp before persistence.
 */
export function replaceAllDreamDeletionTombstones(
  tombstones: DreamDeletionTombstone[],
) {
  persistTombstones(tombstones);
}

export function clearAllDreamDeletionTombstones() {
  kv.remove(DREAM_DELETION_TOMBSTONES_STORAGE_KEY);
  tombstoneCache = [];
  tombstoneCacheRaw = null;
}
