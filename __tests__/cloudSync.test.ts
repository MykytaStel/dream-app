import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import {
  deleteDream,
  markDreamSynced,
  saveDream,
  getDream,
  getDreamsMeta,
  listDreamListItems,
} from '../src/features/dreams/repository/dreamsRepository';
import { getDreamDeletionTombstone } from '../src/features/dreams/repository/dreamDeletionTombstonesRepository';
import {
  getCloudSyncSnapshot,
  maybeRunCloudSyncOnLaunch,
  runCloudSync,
} from '../src/services/cloud/sync';
import { getSupabaseClient } from '../src/services/api/supabase/client';
import { syncCloudSessionFromAuth } from '../src/services/auth/cloudAuth';
import {
  saveCloudSession,
  setCloudSyncEnabled,
} from '../src/services/auth/session';
import type { DreamSyncBundle } from '../src/services/api/contracts/dreamSync';

jest.mock('../src/services/api/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('../src/services/auth/cloudAuth', () => ({
  syncCloudSessionFromAuth: jest.fn(),
}));

function createMockSupabaseClient(options?: {
  dreamEntryError?: Error | null;
  tagInsertError?: Error | null;
  uploadError?: Error | null;
  remoteBundles?: DreamSyncBundle[];
  tombstoneUpsertError?: Error | null;
  remoteDeletionTombstones?: Array<{
    dream_id: string;
    user_id: string;
    deleted_at: string;
  }>;
}) {
  const remoteBundles = options?.remoteBundles ?? [];
  const remoteDeletionTombstones = options?.remoteDeletionTombstones ?? [];
  const remoteDreamRows = remoteBundles.map(bundle => bundle.dream);
  const remoteTags = remoteBundles.flatMap(bundle => bundle.tags);
  const remoteWakeEmotions = remoteBundles.flatMap(
    bundle => bundle.wakeEmotions,
  );
  const remotePreSleepEmotions = remoteBundles.flatMap(
    bundle => bundle.preSleepEmotions,
  );
  const remoteSleepContexts = remoteBundles.flatMap(bundle =>
    bundle.sleepContext ? [bundle.sleepContext] : [],
  );
  const dreamEntriesUpsert = jest.fn(async () => ({
    error: options?.dreamEntryError ?? null,
  }));
  const dreamEntriesDeleteEqUser = jest.fn(async () => ({ error: null }));
  const dreamEntriesDeleteEqId = jest.fn(() => ({
    eq: dreamEntriesDeleteEqUser,
  }));
  const dreamEntriesSelectOrder = jest.fn(async () => ({
    data: remoteDreamRows,
    error: null,
  }));
  const dreamEntriesSelectEq = jest.fn(() => ({
    order: dreamEntriesSelectOrder,
  }));
  const dreamEntriesSelect = jest.fn(() => ({
    eq: dreamEntriesSelectEq,
  }));
  const makeDeleteChain = (error: Error | null = null) => ({
    eq: jest.fn(async () => ({ error })),
  });
  const makeSelectInChain = (rows: unknown[]) => ({
    in: jest.fn(async () => ({
      data: rows,
      error: null,
    })),
  });
  const tagsDelete = jest.fn(() => makeDeleteChain());
  const tagsInsert = jest.fn(async () => ({
    error: options?.tagInsertError ?? null,
  }));
  const tagsSelect = jest.fn(() => makeSelectInChain(remoteTags));
  const wakeDelete = jest.fn(() => makeDeleteChain());
  const wakeInsert = jest.fn(async () => ({ error: null }));
  const wakeSelect = jest.fn(() => makeSelectInChain(remoteWakeEmotions));
  const preSleepDelete = jest.fn(() => makeDeleteChain());
  const preSleepInsert = jest.fn(async () => ({ error: null }));
  const preSleepSelect = jest.fn(() =>
    makeSelectInChain(remotePreSleepEmotions),
  );
  const sleepDelete = jest.fn(() => makeDeleteChain());
  const sleepUpsert = jest.fn(async () => ({ error: null }));
  const sleepSelect = jest.fn(() => makeSelectInChain(remoteSleepContexts));
  const tombstonesUpsert = jest.fn(async () => ({
    error: options?.tombstoneUpsertError ?? null,
  }));
  const tombstonesSelectOrder = jest.fn(async () => ({
    data: remoteDeletionTombstones,
    error: null,
  }));
  const tombstonesSelectEq = jest.fn(() => ({
    order: tombstonesSelectOrder,
  }));
  const tombstonesSelect = jest.fn(() => ({
    eq: tombstonesSelectEq,
  }));
  const upload = jest.fn(async () => ({ error: options?.uploadError ?? null }));

  const client = {
    from: jest.fn((table: string) => {
      switch (table) {
        case 'dream_entries':
          return {
            delete: jest.fn(() => ({
              eq: dreamEntriesDeleteEqId,
            })),
            select: dreamEntriesSelect,
            upsert: dreamEntriesUpsert,
          };
        case 'dream_tags':
          return {
            delete: tagsDelete,
            insert: tagsInsert,
            select: tagsSelect,
          };
        case 'dream_wake_emotions':
          return {
            delete: wakeDelete,
            insert: wakeInsert,
            select: wakeSelect,
          };
        case 'dream_pre_sleep_emotions':
          return {
            delete: preSleepDelete,
            insert: preSleepInsert,
            select: preSleepSelect,
          };
        case 'dream_sleep_contexts':
          return {
            delete: sleepDelete,
            upsert: sleepUpsert,
            select: sleepSelect,
          };
        case 'dream_entry_tombstones':
          return {
            select: tombstonesSelect,
            upsert: tombstonesUpsert,
          };
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    }),
    storage: {
      from: jest.fn(() => ({
        upload,
      })),
    },
  };

  return {
    client,
    dreamEntriesUpsert,
    tagsInsert,
    tombstonesUpsert,
    upload,
  };
}

describe('cloud sync service', () => {
  const mockedGetSupabaseClient = getSupabaseClient as jest.MockedFunction<
    typeof getSupabaseClient
  >;
  const mockedSyncCloudSessionFromAuth =
    syncCloudSessionFromAuth as jest.MockedFunction<
      typeof syncCloudSessionFromAuth
    >;

  beforeEach(() => {
    kv.clearAll();
    mockedGetSupabaseClient.mockReset();
    mockedSyncCloudSessionFromAuth.mockReset();
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.readFile as jest.Mock).mockResolvedValue('');
  });

  test('uploads pending dreams and marks them synced', async () => {
    const { client, dreamEntriesUpsert, tagsInsert, upload } =
      createMockSupabaseClient();
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    (RNFS.readFile as jest.Mock).mockResolvedValue('YQ==');

    saveDream({
      id: 'sync-1',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Sync me',
      audioUri: 'file:///documents/voice-note.m4a',
      tags: ['lucid'],
      wakeEmotions: ['curious'],
      sleepContext: {
        stressLevel: 1,
        preSleepEmotions: ['hopeful'],
      },
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(getDream('sync-1')).toMatchObject({
      syncStatus: 'synced',
      audioRemotePath: 'user-1/sync-1/voice-note.m4a',
    });
    expect(upload).toHaveBeenCalledWith(
      'user-1/sync-1/voice-note.m4a',
      expect.any(Uint8Array),
      expect.objectContaining({ upsert: true }),
    );
    expect(dreamEntriesUpsert).toHaveBeenCalledTimes(1);
    expect(tagsInsert).toHaveBeenCalledWith([
      {
        dream_id: 'sync-1',
        position: 0,
        tag: 'lucid',
      },
    ]);
    expect(getCloudSyncSnapshot().status).toBe('success');
  });

  test('hydrates newer remote dreams into local storage after upload phase', async () => {
    const remoteBundle: DreamSyncBundle = {
      dream: {
        id: 'remote-newer',
        user_id: 'user-1',
        created_at: '2026-03-06T08:00:00.000Z',
        updated_at: '2026-03-06T10:30:00.000Z',
        sleep_date: '2026-03-06',
        title: 'Remote title',
        raw_text: 'Remote truth',
        audio_storage_path: null,
        transcript: null,
        transcript_status: null,
        transcript_source: null,
        transcript_updated_at: null,
        mood: 'positive',
        lucidity: 2,
        archived_at: null,
        starred_at: null,
        analysis_provider: null,
        analysis_status: null,
        analysis_summary: null,
        analysis_themes: [],
        analysis_generated_at: null,
        analysis_error_message: null,
      },
      tags: [{ dream_id: 'remote-newer', tag: 'ocean', position: 0 }],
      wakeEmotions: [],
      preSleepEmotions: [],
      sleepContext: null,
    };
    const { client } = createMockSupabaseClient({
      remoteBundles: [remoteBundle],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveDream({
      id: 'remote-newer',
      createdAt: 1772784000000,
      updatedAt: 1772787600000,
      sleepDate: '2026-03-06',
      text: 'Old local copy',
      tags: [],
    });
    markDreamSynced('remote-newer', {
      syncedAt: 1772787600000,
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.pulledCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(getDream('remote-newer')).toMatchObject({
      text: 'Remote truth',
      title: 'Remote title',
      tags: ['ocean'],
      syncStatus: 'synced',
    });
  });

  test('records partial sync failures without throwing away local changes', async () => {
    const { client } = createMockSupabaseClient({
      dreamEntryError: new Error('dream-upsert-failed'),
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-2',
      isAnonymous: true,
    });

    saveDream({
      id: 'sync-2',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Fails to sync',
      tags: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('error');
    expect(result.failedCount).toBe(1);
    expect(getDream('sync-2')).toMatchObject({
      syncStatus: 'error',
      syncError: 'dream-upsert-failed',
    });
    expect(getCloudSyncSnapshot()).toMatchObject({
      status: 'error',
      failedCount: 1,
      errorMessage: 'dream-upsert-failed',
    });
  });

  test('uploads local deletion tombstones and keeps them synced', async () => {
    const { client, tombstonesUpsert } = createMockSupabaseClient();
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-4',
      isAnonymous: true,
    });

    saveDream({
      id: 'delete-me',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Delete me',
      tags: [],
    });
    deleteDream('delete-me');

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(tombstonesUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        dream_id: 'delete-me',
        user_id: 'user-4',
      }),
      expect.objectContaining({ onConflict: 'dream_id' }),
    );
    expect(getDreamDeletionTombstone('delete-me')).toMatchObject({
      dreamId: 'delete-me',
      syncStatus: 'synced',
    });
  });

  test('applies newer remote deletion tombstones and removes local dream', async () => {
    const { client } = createMockSupabaseClient({
      remoteDeletionTombstones: [
        {
          dream_id: 'remote-delete',
          user_id: 'user-5',
          deleted_at: '2026-03-06T10:00:00.000Z',
        },
      ],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-5',
      isAnonymous: true,
    });

    saveDream({
      id: 'remote-delete',
      createdAt: 1772784000000,
      updatedAt: 1772787000000,
      sleepDate: '2026-03-06',
      text: 'Locally stale copy',
      tags: [],
    });
    markDreamSynced('remote-delete', {
      syncedAt: 1772787000000,
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.pulledCount).toBe(1);
    expect(result.conflictsResolvedCount).toBe(0);
    expect(getDream('remote-delete')).toBeUndefined();
    expect(listDreamListItems().some(item => item.id === 'remote-delete')).toBe(false);
    expect(getDreamsMeta().totalCount).toBe(0);
    expect(getDreamDeletionTombstone('remote-delete')).toMatchObject({
      dreamId: 'remote-delete',
      syncStatus: 'synced',
    });
  });

  test('keeps a newer local pending edit when a stale remote tombstone arrives', async () => {
    const { client } = createMockSupabaseClient({
      remoteDeletionTombstones: [
        {
          dream_id: 'local-wins-delete',
          user_id: 'user-6',
          deleted_at: '2026-03-06T10:00:00.000Z',
        },
      ],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-6',
      isAnonymous: true,
    });

    saveDream({
      id: 'local-wins-delete',
      createdAt: 1772784000000,
      updatedAt: 1772792400000,
      sleepDate: '2026-03-06',
      text: 'Fresh local edit',
      tags: ['latest'],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.skippedCount).toBe(1);
    expect(result.conflictsResolvedCount).toBe(1);
    expect(result.localWinsCount).toBe(1);
    expect(result.remoteWinsCount).toBe(0);
    expect(getDream('local-wins-delete')).toMatchObject({
      text: 'Fresh local edit',
      syncStatus: 'synced',
    });
  });

  test('applies a newer remote tombstone over a stale pending local edit', async () => {
    const { client } = createMockSupabaseClient({
      remoteDeletionTombstones: [
        {
          dream_id: 'remote-wins-delete',
          user_id: 'user-7',
          deleted_at: '2026-03-06T10:30:00.000Z',
        },
      ],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-7',
      isAnonymous: true,
    });

    saveDream({
      id: 'remote-wins-delete',
      createdAt: 1772784000000,
      updatedAt: 1772788200000,
      sleepDate: '2026-03-06',
      text: 'Older pending local edit',
      tags: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.pulledCount).toBe(1);
    expect(result.conflictsResolvedCount).toBe(1);
    expect(result.localWinsCount).toBe(0);
    expect(result.remoteWinsCount).toBe(1);
    expect(getDream('remote-wins-delete')).toBeUndefined();
    expect(getDreamDeletionTombstone('remote-wins-delete')).toMatchObject({
      dreamId: 'remote-wins-delete',
      syncStatus: 'synced',
    });
  });

  test('skips remote hydration when local unsynced version is newer', async () => {
    const remoteBundle: DreamSyncBundle = {
      dream: {
        id: 'skip-remote',
        user_id: 'user-2',
        created_at: '2026-03-06T08:00:00.000Z',
        updated_at: '2026-03-06T08:10:00.000Z',
        sleep_date: '2026-03-06',
        title: 'Old remote title',
        raw_text: 'Old remote copy',
        audio_storage_path: null,
        transcript: null,
        transcript_status: null,
        transcript_source: null,
        transcript_updated_at: null,
        mood: 'neutral',
        lucidity: 1,
        archived_at: null,
        starred_at: null,
        analysis_provider: null,
        analysis_status: null,
        analysis_summary: null,
        analysis_themes: [],
        analysis_generated_at: null,
        analysis_error_message: null,
      },
      tags: [{ dream_id: 'skip-remote', tag: 'old-tag', position: 0 }],
      wakeEmotions: [],
      preSleepEmotions: [],
      sleepContext: null,
    };
    const { client } = createMockSupabaseClient({
      remoteBundles: [remoteBundle],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-2',
      isAnonymous: true,
    });

    saveDream({
      id: 'skip-remote',
      createdAt: 1772784000000,
      updatedAt: 1772791200000,
      sleepDate: '2026-03-06',
      text: 'New local pending copy',
      tags: ['new-tag'],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.skippedCount).toBe(1);
    expect(result.conflictsResolvedCount).toBe(1);
    expect(result.localWinsCount).toBe(1);
    expect(result.remoteWinsCount).toBe(0);
    expect(getDream('skip-remote')).toMatchObject({
      text: 'New local pending copy',
      tags: ['new-tag'],
      syncStatus: 'synced',
    });
  });

  test('launch sync exits when auto sync is disabled', async () => {
    const { client } = createMockSupabaseClient();
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-3',
      isAnonymous: true,
    });

    saveCloudSession({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-3',
      isAnonymous: true,
    });
    setCloudSyncEnabled(false);

    await expect(maybeRunCloudSyncOnLaunch()).resolves.toBeNull();
    expect(getCloudSyncSnapshot().status).toBe('idle');
  });
});
