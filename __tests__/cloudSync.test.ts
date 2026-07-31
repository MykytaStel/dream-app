import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import {
  deleteDream,
  markDreamSynced,
  saveDream,
  getDream,
  getDreamsMeta,
  listDreamListItems,
  replaceAllDreams,
} from '../src/features/dreams/repository/dreamsRepository';
import {
  getSavedMonthlyReportMonths,
  toggleSavedMonthlyReportMonth,
} from '../src/features/stats/services/monthlyReportShelfService';
import {
  getStoredReviewStateSnapshot,
  saveSavedReviewStateSnapshot,
} from '../src/features/stats/services/reviewStateStorageService';
import {
  getDreamDeletionTombstone,
  saveDreamDeletionTombstone,
} from '../src/features/dreams/repository/dreamDeletionTombstonesRepository';
import {
  getCloudSyncEvents,
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
import {
  createMockSupabaseClient,
  installTestArchiveKey,
  mockSignedInCloudSession,
} from './helpers/cloudSyncTestUtils';

jest.mock('../src/services/api/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('../src/services/auth/cloudAuth', () => ({
  syncCloudSessionFromAuth: jest.fn(),
}));

describe('cloud sync service', () => {
  const mockedGetSupabaseClient = getSupabaseClient as jest.MockedFunction<
    typeof getSupabaseClient
  >;
  const mockedSyncCloudSessionFromAuth =
    syncCloudSessionFromAuth as jest.MockedFunction<
      typeof syncCloudSessionFromAuth
    >;

  beforeEach(async () => {
    kv.clearAll();
    mockedGetSupabaseClient.mockReset();
    mockedSyncCloudSessionFromAuth.mockReset();
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.readFile as jest.Mock).mockResolvedValue('');
    // The device already holds the archive key, as it would after the first
    // sync or a restore. Suites that need a device without it say so.
    await installTestArchiveKey();
  });

  test('uploads pending dreams and marks them synced', async () => {
    const { client, dreamEntriesUpsert, upload } = createMockSupabaseClient();
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
    // The tag rode inside the blob rather than into a `dream_tags` row, so the
    // word itself must not appear anywhere in what was sent.
    const uploadedRow = dreamEntriesUpsert.mock.calls[0][0];
    expect(JSON.stringify(uploadedRow)).not.toContain('lucid');
    expect(JSON.stringify(uploadedRow)).not.toContain('Sync me');
    expect(uploadedRow).toMatchObject({
      id: 'sync-1',
      user_id: 'user-1',
      cipher_version: 1,
    });
    expect(getCloudSyncSnapshot().status).toBe('success');
    expect(getCloudSyncEvents()[0]).toMatchObject({
      status: 'success',
      reason: 'manual',
      uploadedCount: 1,
      failedCount: 0,
    });
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

  test('does not upload an older restored local dream over a newer remote revision', async () => {
    const remoteBundle: DreamSyncBundle = {
      dream: {
        id: 'restore-sync-conflict',
        user_id: 'user-restore',
        created_at: '2026-03-06T08:00:00.000Z',
        updated_at: '2026-03-06T10:30:00.000Z',
        sleep_date: '2026-03-06',
        title: 'Remote newest title',
        raw_text: 'Remote newest copy',
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
      tags: [{ dream_id: 'restore-sync-conflict', tag: 'remote', position: 0 }],
      wakeEmotions: [],
      preSleepEmotions: [],
      sleepContext: null,
    };
    const { client, dreamEntriesUpsert } = createMockSupabaseClient({
      remoteBundles: [remoteBundle],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-restore',
      isAnonymous: true,
    });

    replaceAllDreams([
      {
        id: 'restore-sync-conflict',
        createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
        updatedAt: new Date('2026-03-06T09:00:00.000Z').getTime(),
        sleepDate: '2026-03-06',
        text: 'Older restored local copy',
        tags: ['local'],
      },
    ]);

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(0);
    expect(result.pulledCount).toBe(1);
    expect(result.remoteWinsCount).toBe(1);
    expect(dreamEntriesUpsert).not.toHaveBeenCalled();
    expect(getDream('restore-sync-conflict')).toMatchObject({
      text: 'Remote newest copy',
      title: 'Remote newest title',
      tags: ['remote'],
      syncStatus: 'synced',
    });
  });

  test('retries upload when remote revision matches a local pending dream', async () => {
    const { client, dreamEntriesUpsert } = createMockSupabaseClient({
      remoteBundles: [
        {
          dream: {
            id: 'equal-pending-retry',
            user_id: 'user-1',
            created_at: '2026-03-06T08:00:00.000Z',
            updated_at: '2026-03-06T10:30:00.000Z',
            sleep_date: '2026-03-06',
            title: null,
            raw_text: 'Keep this dream synced',
            audio_storage_path: null,
            transcript: null,
            transcript_status: null,
            transcript_source: null,
            transcript_updated_at: null,
            mood: null,
            lucidity: null,
            archived_at: null,
            starred_at: null,
            analysis_provider: null,
            analysis_status: null,
            analysis_summary: null,
            analysis_themes: [],
            analysis_generated_at: null,
            analysis_error_message: null,
          },
          tags: [],
          wakeEmotions: [],
          preSleepEmotions: [],
          sleepContext: null,
        },
      ],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveDream({
      id: 'equal-pending-retry',
      createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
      updatedAt: new Date('2026-03-06T10:30:00.000Z').getTime(),
      sleepDate: '2026-03-06',
      text: 'Keep this dream synced',
      tags: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(1);
    expect(dreamEntriesUpsert).toHaveBeenCalledTimes(1);
    expect(getDream('equal-pending-retry')).toMatchObject({
      syncStatus: 'synced',
      text: 'Keep this dream synced',
    });
  });

  test('uploads pending saved review state snapshots', async () => {
    const { client, reviewSavedStateUpsert } = createMockSupabaseClient();
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveDream({
      id: 'review-sync',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Bridge dream',
      tags: ['bridge'],
    });
    toggleSavedMonthlyReportMonth('2026-03');

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(reviewSavedStateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        saved_months: [{ monthKey: '2026-03', savedAt: expect.any(Number) }],
        saved_threads: [],
      }),
      expect.objectContaining({
        onConflict: 'user_id',
      }),
    );
  });

  test('marks review state synced without re-upload when remote revision already matches local content', async () => {
    const { client, reviewSavedStateUpsert } = createMockSupabaseClient({
      remoteSavedReviewState: {
        user_id: 'user-1',
        updated_at: '2026-03-06T10:00:00.000Z',
        saved_months: [],
        saved_threads: [],
      },
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveSavedReviewStateSnapshot({
      updatedAt: new Date('2026-03-06T10:00:00.000Z').getTime(),
      savedMonths: [],
      savedThreads: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(reviewSavedStateUpsert).not.toHaveBeenCalled();
    expect(getStoredReviewStateSnapshot()).toMatchObject({
      syncStatus: 'synced',
      lastSyncedAt: new Date('2026-03-06T10:00:00.000Z').getTime(),
    });
  });

  test('uploads an empty newer local review snapshot to clear older remote saved state', async () => {
    const { client, reviewSavedStateUpsert } = createMockSupabaseClient({
      remoteSavedReviewState: {
        user_id: 'user-1',
        updated_at: '2026-03-06T08:00:00.000Z',
        saved_months: [{ monthKey: '2026-03', savedAt: 10 }],
        saved_threads: null,
      },
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveSavedReviewStateSnapshot({
      updatedAt: new Date('2026-03-06T10:00:00.000Z').getTime(),
      savedMonths: [],
      savedThreads: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(1);
    expect(reviewSavedStateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        saved_months: [],
        saved_threads: [],
      }),
      expect.objectContaining({
        onConflict: 'user_id',
      }),
    );
    expect(getStoredReviewStateSnapshot()).toMatchObject({
      savedMonths: [],
      savedThreads: [],
      syncStatus: 'synced',
    });
  });

  test('uploads an empty pending local review snapshot even when no remote snapshot exists', async () => {
    const { client, reviewSavedStateUpsert } = createMockSupabaseClient();
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveSavedReviewStateSnapshot({
      updatedAt: new Date('2026-03-06T10:00:00.000Z').getTime(),
      savedMonths: [],
      savedThreads: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(1);
    expect(reviewSavedStateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        saved_months: [],
        saved_threads: [],
      }),
      expect.objectContaining({
        onConflict: 'user_id',
      }),
    );
    expect(getStoredReviewStateSnapshot()).toMatchObject({
      syncStatus: 'synced',
      savedMonths: [],
      savedThreads: [],
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
    expect(getCloudSyncEvents()[0]).toMatchObject({
      status: 'error',
      reason: 'manual',
      failedCount: 1,
      errorMessage: 'dream-upsert-failed',
    });
  });

  test('keeps pending review-state diagnostics when review snapshot upload fails', async () => {
    const { client } = createMockSupabaseClient({
      reviewSavedStateUpsertError: new Error('review-state-sync-failed'),
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-review',
      isAnonymous: true,
    });

    saveSavedReviewStateSnapshot({
      updatedAt: new Date('2026-03-06T10:00:00.000Z').getTime(),
      savedMonths: [],
      savedThreads: [],
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result).toMatchObject({
      status: 'error',
      failedCount: 1,
      pendingCount: 1,
      pendingDreamCount: 0,
      pendingTombstoneCount: 0,
      pendingReviewStateCount: 1,
      errorMessage: 'review-state-sync-failed',
    });
    expect(getStoredReviewStateSnapshot()).toMatchObject({
      syncStatus: 'error',
      syncError: 'review-state-sync-failed',
    });
    expect(getCloudSyncSnapshot()).toMatchObject({
      status: 'error',
      failedCount: 1,
      pendingCount: 1,
      pendingReviewStateCount: 1,
      errorMessage: 'review-state-sync-failed',
    });
    expect(getCloudSyncEvents()[0]).toMatchObject({
      status: 'error',
      pendingCount: 1,
      pendingReviewStateCount: 1,
      errorMessage: 'review-state-sync-failed',
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

  test('does not upload a stale local tombstone over a newer remote dream revision', async () => {
    const remoteBundle: DreamSyncBundle = {
      dream: {
        id: 'remote-survives',
        user_id: 'user-tombstone',
        created_at: '2026-03-06T08:00:00.000Z',
        updated_at: '2026-03-06T10:30:00.000Z',
        sleep_date: '2026-03-06',
        title: 'Remote survives',
        raw_text: 'Remote dream stays',
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
      tags: [{ dream_id: 'remote-survives', tag: 'survive', position: 0 }],
      wakeEmotions: [],
      preSleepEmotions: [],
      sleepContext: null,
    };
    const { client, tombstonesUpsert } = createMockSupabaseClient({
      remoteBundles: [remoteBundle],
    });
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-tombstone',
      isAnonymous: true,
    });

    saveDreamDeletionTombstone(
      'remote-survives',
      new Date('2026-03-06T09:00:00.000Z').getTime(),
    );

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.status).toBe('success');
    expect(result.uploadedCount).toBe(0);
    expect(result.pulledCount).toBe(1);
    expect(result.remoteWinsCount).toBe(1);
    expect(tombstonesUpsert).not.toHaveBeenCalled();
    expect(getDreamDeletionTombstone('remote-survives')).toBeUndefined();
    expect(getDream('remote-survives')).toMatchObject({
      text: 'Remote dream stays',
      tags: ['survive'],
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
    toggleSavedMonthlyReportMonth('2026-03');
    markDreamSynced('remote-delete', {
      syncedAt: 1772787000000,
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result.pulledCount).toBe(1);
    expect(result.conflictsResolvedCount).toBe(0);
    expect(getDream('remote-delete')).toBeUndefined();
    expect(listDreamListItems().some(item => item.id === 'remote-delete')).toBe(
      false,
    );
    expect(getDreamsMeta().totalCount).toBe(0);
    expect(getSavedMonthlyReportMonths()).toEqual([]);
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

  test('records an error snapshot and event when cloud session is unavailable before sync starts', async () => {
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-out',
    });

    const result = await runCloudSync({ reason: 'manual' });

    expect(result).toMatchObject({
      status: 'error',
      reason: 'manual',
      errorMessage: 'cloud-session-required',
    });
    expect(getCloudSyncSnapshot()).toMatchObject({
      status: 'error',
      reason: 'manual',
      errorMessage: 'cloud-session-required',
    });
    expect(getCloudSyncEvents()[0]).toMatchObject({
      status: 'error',
      reason: 'manual',
      errorMessage: 'cloud-session-required',
    });
  });

  test('records an error snapshot and event when auth refresh throws before sync starts', async () => {
    mockedSyncCloudSessionFromAuth.mockRejectedValue(
      new Error('auth-refresh-failed'),
    );

    const result = await runCloudSync({ reason: 'manual' });

    expect(result).toMatchObject({
      status: 'error',
      reason: 'manual',
      errorMessage: 'auth-refresh-failed',
    });
    expect(getCloudSyncSnapshot()).toMatchObject({
      status: 'error',
      reason: 'manual',
      errorMessage: 'auth-refresh-failed',
    });
    expect(getCloudSyncEvents()[0]).toMatchObject({
      status: 'error',
      reason: 'manual',
      errorMessage: 'auth-refresh-failed',
    });
  });

  test('preserves last successful sync timestamp after a later failed sync attempt', async () => {
    const { client } = createMockSupabaseClient();
    mockedGetSupabaseClient.mockReturnValue(client as never);
    mockedSyncCloudSessionFromAuth.mockResolvedValue({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      isAnonymous: true,
    });

    saveDream({
      id: 'first-success',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Sync me once',
      tags: [],
    });

    const first = await runCloudSync({ reason: 'manual' });
    expect(first.status).toBe('success');
    const previousLastSuccessAt = getCloudSyncSnapshot().lastSuccessAt;
    expect(typeof previousLastSuccessAt).toBe('number');

    mockedGetSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        dreamEntryError: new Error('dream-upsert-failed'),
      }).client as never,
    );

    saveDream({
      id: 'second-failure',
      createdAt: 1710000100000,
      sleepDate: '2026-03-06',
      text: 'Fails later',
      tags: [],
    });

    const second = await runCloudSync({ reason: 'manual' });

    expect(second.status).toBe('error');
    expect(getCloudSyncSnapshot()).toMatchObject({
      status: 'error',
      errorMessage: 'dream-upsert-failed',
      lastSuccessAt: previousLastSuccessAt,
    });
  });

  describe('encrypted archive', () => {
    /**
     * The step the spec called the riskiest in the whole change.
     *
     * After the encryption migration the server holds nothing. A device whose
     * dreams are all marked "synced" must read that as "upload again", never as
     * "these were deleted elsewhere" — the same mistake that cost data twice
     * before, arriving through a new door.
     */
    test('an empty server re-queues the local archive instead of erasing it', async () => {
      const { client, dreamEntriesUpsert, getStoredKeyCheck } =
        createMockSupabaseClient({ archiveKey: null });
      mockedGetSupabaseClient.mockReturnValue(client as never);
      mockSignedInCloudSession(mockedSyncCloudSessionFromAuth);

      saveDream({
        id: 'survivor-1',
        createdAt: 1710000000000,
        sleepDate: '2026-03-06',
        text: 'Written before encryption existed',
        tags: ['ліс'],
      });
      saveDream({
        id: 'survivor-2',
        createdAt: 1710000100000,
        sleepDate: '2026-03-07',
        text: 'Also written before',
        tags: [],
      });
      markDreamSynced('survivor-1');
      markDreamSynced('survivor-2');

      const result = await runCloudSync({ reason: 'manual' });

      expect(getDream('survivor-1')?.text).toBe(
        'Written before encryption existed',
      );
      expect(getDream('survivor-2')?.text).toBe('Also written before');
      expect(result.uploadedCount).toBe(2);
      expect(dreamEntriesUpsert).toHaveBeenCalledTimes(2);
      // Having claimed the archive, the device leaves a check behind so the
      // next one can tell whether it holds the same key.
      expect(getStoredKeyCheck()).toEqual(expect.any(String));
    });

    test('re-queuing does not make dreams look freshly edited to other devices', async () => {
      const { client } = createMockSupabaseClient({ archiveKey: null });
      mockedGetSupabaseClient.mockReturnValue(client as never);
      mockSignedInCloudSession(mockedSyncCloudSessionFromAuth);

      saveDream({
        id: 'untouched-timestamp',
        createdAt: 1710000000000,
        sleepDate: '2026-03-06',
        text: 'Old dream',
        tags: [],
      });
      markDreamSynced('untouched-timestamp');
      const updatedAtBefore = getDream('untouched-timestamp')?.updatedAt;

      await runCloudSync({ reason: 'manual' });

      // A bumped updatedAt would win every conflict on the user's other phone
      // and overwrite edits made there.
      expect(getDream('untouched-timestamp')?.updatedAt).toBe(updatedAtBefore);
    });

    /**
     * Two devices, two keys, one account. Without the check on the profile both
     * would sync without complaint and the archive would silently split in
     * half, each device able to read only what it wrote.
     */
    test('a device holding the wrong key stops instead of writing a second archive', async () => {
      const { client, dreamEntriesUpsert } = createMockSupabaseClient();
      mockedGetSupabaseClient.mockReturnValue(client as never);
      mockSignedInCloudSession(mockedSyncCloudSessionFromAuth);
      await installTestArchiveKey(
        Uint8Array.from({ length: 32 }, (_, index) => index + 200),
      );

      saveDream({
        id: 'not-uploaded',
        createdAt: 1710000000000,
        sleepDate: '2026-03-06',
        text: 'Stays here',
        tags: [],
      });

      const result = await runCloudSync({ reason: 'manual' });

      expect(result.status).toBe('error');
      expect(result.errorMessage).toBe('archive-key-required');
      expect(dreamEntriesUpsert).not.toHaveBeenCalled();
      // Nothing was pulled, nothing was deleted, nothing was marked synced.
      expect(getDream('not-uploaded')?.text).toBe('Stays here');
      expect(getDream('not-uploaded')?.syncStatus).not.toBe('synced');
    });

    test('one unreadable record does not strand the rest of the archive', async () => {
      const readable: DreamSyncBundle = {
        dream: {
          id: 'readable',
          user_id: 'user-1',
          created_at: new Date(1710000000000).toISOString(),
          updated_at: new Date(1710000200000).toISOString(),
          sleep_date: '2026-03-06',
          title: null,
          raw_text: 'This one opens',
          audio_storage_path: null,
          transcript: null,
          transcript_status: null,
          transcript_source: null,
          transcript_updated_at: null,
          mood: null,
          lucidity: null,
          archived_at: null,
          starred_at: null,
          analysis_provider: null,
          analysis_status: null,
          analysis_summary: null,
          analysis_themes: [],
          analysis_generated_at: null,
          analysis_error_message: null,
        },
        tags: [],
        wakeEmotions: [],
        preSleepEmotions: [],
        sleepContext: null,
      };

      const { client } = createMockSupabaseClient({
        remoteBundles: [readable],
        // A row no key opens — corruption, or a record sealed with a key that
        // was since replaced. The pull must carry on past it.
        extraRemoteRows: [
          {
            id: 'corrupt',
            user_id: 'user-1',
            updated_at: new Date(1710000300000).toISOString(),
            audio_storage_path: null,
            ciphertext: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            cipher_version: 1,
          },
        ],
      });

      mockedGetSupabaseClient.mockReturnValue(client as never);
      mockSignedInCloudSession(mockedSyncCloudSessionFromAuth);

      const result = await runCloudSync({ reason: 'manual' });

      expect(result.status).toBe('error');
      expect(result.errorMessage).toBe('archive-record-unreadable');
      expect(result.failedCount).toBe(1);
      expect(getDream('corrupt')).toBeUndefined();
      // The readable one still landed, which is the whole point.
      expect(getDream('readable')?.text).toBe('This one opens');
    });
  });
});
