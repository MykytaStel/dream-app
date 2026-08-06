import { DREAM_DELETION_TOMBSTONES_STORAGE_KEY } from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import {
  getDreamDeletionTombstone,
  listDreamDeletionTombstones,
  replaceAllDreamDeletionTombstones,
} from '../src/features/dreams/repository/dreamDeletionTombstonesRepository';

describe('complete tombstone replacement', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('keeps duplicates countable for repair but persists only the newest record', () => {
    kv.set(
      DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
      JSON.stringify([
        {
          dreamId: 'dream-1',
          deletedAt: 100,
          syncStatus: 'local',
        },
        {
          dreamId: 'dream-1',
          deletedAt: 200,
          syncStatus: 'synced',
          lastSyncedAt: 200,
        },
      ]),
    );

    const beforeRepair = listDreamDeletionTombstones();
    expect(beforeRepair.map(item => item.deletedAt)).toEqual([100, 200]);
    expect(getDreamDeletionTombstone('dream-1')?.deletedAt).toBe(200);

    const unique = new Map(
      beforeRepair.map(item => [item.dreamId, item] as const),
    );
    replaceAllDreamDeletionTombstones(Array.from(unique.values()));

    expect(listDreamDeletionTombstones()).toEqual([
      {
        dreamId: 'dream-1',
        deletedAt: 200,
        syncStatus: 'synced',
        lastSyncedAt: 200,
        syncError: undefined,
      },
    ]);
    expect(
      JSON.parse(kv.getString(DREAM_DELETION_TOMBSTONES_STORAGE_KEY) ?? '[]'),
    ).toHaveLength(1);
  });
});
