import RNFS from 'react-native-fs';
import {
  createDreamAudioStoragePath,
  createDreamSyncBundle,
  DREAM_AUDIO_BUCKET,
  type DreamEntryRow,
  type DreamPreSleepEmotionRow,
  type DreamSleepContextRow,
  type DreamTagRow,
  type DreamWakeEmotionRow,
} from '../api/contracts/dreamSync';
import { getSupabaseClient } from '../api/supabase/client';
import { syncCloudSessionFromAuth } from '../auth/cloudAuth';
import { getCloudSyncEnabled } from '../auth/session';
import {
  listDreams,
  applyRemoteDreamDeletion,
  markDreamSynced,
  markDreamSyncError,
  markDreamSyncing,
  upsertDreamFromSyncBundle,
} from '../../features/dreams/repository/dreamsRepository';
import {
  listDreamDeletionTombstones,
  markDreamDeletionTombstoneSynced,
  markDreamDeletionTombstoneSyncError,
  markDreamDeletionTombstoneSyncing,
} from '../../features/dreams/repository/dreamDeletionTombstonesRepository';
import { reconcileDerivedReviewState } from '../../features/stats/services/reviewShelfStateService';
import {
  applyRemoteSavedReviewStateSnapshot,
  getStoredReviewStateSnapshot,
  markSavedReviewStateSyncError,
  markSavedReviewStateSynced,
  markSavedReviewStateSyncing,
  type SavedReviewStateSnapshot,
} from '../../features/stats/services/reviewStateStorageService';
import {
  appendCloudSyncEvent,
  getCloudSyncSnapshot,
  getLocalCloudSyncPendingCount,
  getPendingReviewStateCount,
  persistCloudSyncSnapshot,
  type CloudSyncReason,
  type CloudSyncResult,
} from './syncState';
import {
  accumulateConflictDecision,
  decideRemoteBundleResolution,
  decideRemoteTombstoneResolution,
  decideSavedReviewStateResolution,
  type CloudSyncConflictContext,
  type RemoteDreamDeletionTombstoneRow,
  type RemoteSavedReviewStateRow,
} from './syncResolution';

export {
  getCloudSyncEvents,
  getCloudSyncSnapshot,
  type CloudSyncEvent,
  type CloudSyncReason,
  type CloudSyncResult,
  type CloudSyncSnapshot,
  type CloudSyncStatus,
} from './syncState';

let activeCloudSyncPromise: Promise<CloudSyncResult> | null = null;

function normalizeLocalAudioPath(value: string) {
  return value.startsWith('file://') ? value.slice('file://'.length) : value;
}

function getAudioFilename(audioUri: string, dreamId: string) {
  const lastSegment = audioUri.split('/').filter(Boolean).pop();
  return lastSegment?.trim() || `${dreamId}.m4a`;
}

function getAudioMimeType(filename: string) {
  const normalized = filename.toLowerCase();

  if (normalized.endsWith('.wav')) {
    return 'audio/wav';
  }

  if (normalized.endsWith('.mp3')) {
    return 'audio/mpeg';
  }

  if (normalized.endsWith('.aac')) {
    return 'audio/aac';
  }

  return 'audio/mp4';
}

function decodeBase64ToUint8Array(input: string) {
  const clean = input.replace(/[^A-Za-z0-9+/=]/g, '');
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    if (char === '=') {
      break;
    }

    const value =
      char >= 'A' && char <= 'Z'
        ? char.charCodeAt(0) - 65
        : char >= 'a' && char <= 'z'
        ? char.charCodeAt(0) - 71
        : char >= '0' && char <= '9'
        ? char.charCodeAt(0) + 4
        : char === '+'
        ? 62
        : char === '/'
        ? 63
        : -1;

    if (value < 0) {
      continue;
    }

    buffer = buffer * 64 + value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      const divisor = 2 ** bits;
      output.push(Math.floor(buffer / divisor) % 256);
      buffer %= divisor;
    }
  }

  return new Uint8Array(output);
}

function normalizeSyncError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function ensureDreamAudioUploaded(
  userId: string,
  dream: ReturnType<typeof listDreams>[number],
) {
  if (!dream.audioUri?.trim()) {
    return dream.audioRemotePath;
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const audioFilePath = normalizeLocalAudioPath(dream.audioUri);
  const fileExists = await RNFS.exists(audioFilePath);
  if (!fileExists) {
    if (dream.audioRemotePath) {
      return dream.audioRemotePath;
    }

    throw new Error('local-audio-file-missing');
  }

  const filename = getAudioFilename(dream.audioUri, dream.id);
  const remotePath =
    dream.audioRemotePath ??
    createDreamAudioStoragePath({
      userId,
      dreamId: dream.id,
      filename,
    });

  const base64 = await RNFS.readFile(audioFilePath, 'base64');
  const bytes = decodeBase64ToUint8Array(base64);
  const { error } = await client.storage
    .from(DREAM_AUDIO_BUCKET)
    .upload(remotePath, bytes, {
      contentType: getAudioMimeType(filename),
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return remotePath;
}

async function replaceDreamRelationRows(
  tableName: 'dream_tags' | 'dream_wake_emotions' | 'dream_pre_sleep_emotions',
  dreamId: string,
  rows: Array<Record<string, unknown>>,
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { error: deleteError } = await client
    .from(tableName)
    .delete()
    .eq('dream_id', dreamId);
  if (deleteError) {
    throw deleteError;
  }

  if (!rows.length) {
    return;
  }

  const { error: insertError } = await client.from(tableName).insert(rows);
  if (insertError) {
    throw insertError;
  }
}

async function replaceDreamSleepContext(
  dreamId: string,
  row: Record<string, unknown> | null,
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  if (!row) {
    const { error } = await client
      .from('dream_sleep_contexts')
      .delete()
      .eq('dream_id', dreamId);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await client.from('dream_sleep_contexts').upsert(row, {
    onConflict: 'dream_id',
  });
  if (error) {
    throw error;
  }
}

async function uploadDream(
  userId: string,
  dream: ReturnType<typeof listDreams>[number],
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const audioRemotePath = await ensureDreamAudioUploaded(userId, dream);
  const bundle = createDreamSyncBundle(
    {
      ...dream,
      audioRemotePath,
    },
    userId,
  );

  const { error: dreamError } = await client
    .from('dream_entries')
    .upsert(bundle.dream, {
      onConflict: 'id',
    });
  if (dreamError) {
    throw dreamError;
  }

  await replaceDreamRelationRows('dream_tags', dream.id, bundle.tags);
  await replaceDreamRelationRows(
    'dream_wake_emotions',
    dream.id,
    bundle.wakeEmotions,
  );
  await replaceDreamRelationRows(
    'dream_pre_sleep_emotions',
    dream.id,
    bundle.preSleepEmotions,
  );
  await replaceDreamSleepContext(dream.id, bundle.sleepContext);

  return {
    audioRemotePath,
  };
}

async function uploadDreamDeletionTombstone(
  userId: string,
  tombstone: ReturnType<typeof listDreamDeletionTombstones>[number],
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const deletedAtIso = new Date(tombstone.deletedAt).toISOString();
  const { error: tombstoneError } = await client
    .from('dream_entry_tombstones')
    .upsert(
      {
        dream_id: tombstone.dreamId,
        user_id: userId,
        deleted_at: deletedAtIso,
      },
      {
        onConflict: 'dream_id',
      },
    );
  if (tombstoneError) {
    throw tombstoneError;
  }

  const { error: deleteDreamError } = await client
    .from('dream_entries')
    .delete()
    .eq('id', tombstone.dreamId)
    .eq('user_id', userId);
  if (deleteDreamError) {
    throw deleteDreamError;
  }
}

async function uploadSavedReviewStateSnapshot(
  userId: string,
  snapshot: SavedReviewStateSnapshot,
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { error } = await client.from('review_saved_state_snapshots').upsert(
    {
      user_id: userId,
      updated_at: new Date(snapshot.updatedAt || Date.now()).toISOString(),
      saved_months: snapshot.savedMonths,
      saved_threads: snapshot.savedThreads,
    },
    {
      onConflict: 'user_id',
    },
  );

  if (error) {
    throw error;
  }
}

async function fetchRowsByDreamIds<T extends { dream_id: string }>(
  tableName: string,
  dreamIds: string[],
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  if (!dreamIds.length) {
    return [] as T[];
  }

  const { data, error } = await client
    .from(tableName)
    .select('*')
    .in('dream_id', dreamIds);
  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

async function fetchRemoteDreamBundles(userId: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { data: dreamRows, error: dreamRowsError } = await client
    .from('dream_entries')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (dreamRowsError) {
    throw dreamRowsError;
  }

  const normalizedDreamRows = (dreamRows ?? []) as DreamEntryRow[];
  if (!normalizedDreamRows.length) {
    return [];
  }

  const dreamIds = normalizedDreamRows.map(row => row.id);
  const [tags, wakeEmotions, preSleepEmotions, sleepContexts] =
    await Promise.all([
      fetchRowsByDreamIds<DreamTagRow>('dream_tags', dreamIds),
      fetchRowsByDreamIds<DreamWakeEmotionRow>('dream_wake_emotions', dreamIds),
      fetchRowsByDreamIds<DreamPreSleepEmotionRow>(
        'dream_pre_sleep_emotions',
        dreamIds,
      ),
      fetchRowsByDreamIds<DreamSleepContextRow>(
        'dream_sleep_contexts',
        dreamIds,
      ),
    ]);

  const tagsByDreamId = new Map<string, DreamTagRow[]>();
  tags.forEach(item => {
    const current = tagsByDreamId.get(item.dream_id);
    if (current) {
      current.push(item);
      return;
    }

    tagsByDreamId.set(item.dream_id, [item]);
  });

  const wakeEmotionsByDreamId = new Map<string, DreamWakeEmotionRow[]>();
  wakeEmotions.forEach(item => {
    const current = wakeEmotionsByDreamId.get(item.dream_id);
    if (current) {
      current.push(item);
      return;
    }

    wakeEmotionsByDreamId.set(item.dream_id, [item]);
  });

  const preSleepEmotionsByDreamId = new Map<string, DreamPreSleepEmotionRow[]>();
  preSleepEmotions.forEach(item => {
    const current = preSleepEmotionsByDreamId.get(item.dream_id);
    if (current) {
      current.push(item);
      return;
    }

    preSleepEmotionsByDreamId.set(item.dream_id, [item]);
  });

  const sleepContextByDreamId = new Map<string, DreamSleepContextRow>();
  sleepContexts.forEach(item => {
    sleepContextByDreamId.set(item.dream_id, item);
  });

  return normalizedDreamRows.map(dream => ({
    dream,
    tags: tagsByDreamId.get(dream.id) ?? [],
    wakeEmotions: wakeEmotionsByDreamId.get(dream.id) ?? [],
    preSleepEmotions: preSleepEmotionsByDreamId.get(dream.id) ?? [],
    sleepContext: sleepContextByDreamId.get(dream.id) ?? null,
  }));
}

async function fetchRemoteDreamDeletionTombstones(userId: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { data, error } = await client
    .from('dream_entry_tombstones')
    .select('*')
    .eq('user_id', userId)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RemoteDreamDeletionTombstoneRow[];
}

async function fetchRemoteSavedReviewState(userId: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { data, error } = await client
    .from('review_saved_state_snapshots')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as RemoteSavedReviewStateRow | null;
}

async function performCloudSync(
  reason: CloudSyncReason,
  requireSyncEnabled: boolean,
) {
  const previousSnapshot = getCloudSyncSnapshot();
  if (requireSyncEnabled && !getCloudSyncEnabled()) {
    return persistCloudSyncSnapshot({
      ...previousSnapshot,
      status: 'idle',
      reason,
      uploadedCount: 0,
      pulledCount: 0,
      skippedCount: 0,
      conflictsResolvedCount: 0,
      localWinsCount: 0,
      remoteWinsCount: 0,
      failedCount: 0,
      pendingCount: getLocalCloudSyncPendingCount({
        pendingDreamCount: listDreams().filter(dream => dream.syncStatus !== 'synced').length,
        pendingTombstoneCount: listDreamDeletionTombstones().filter(
          tombstone => tombstone.syncStatus !== 'synced',
        ).length,
      }),
    });
  }

  const pendingDreams = listDreams().filter(
    dream => dream.syncStatus !== 'synced',
  );
  const pendingTombstones = listDreamDeletionTombstones().filter(
    tombstone => tombstone.syncStatus !== 'synced',
  );
  const pendingReviewState = getStoredReviewStateSnapshot();
  const conflictContext: CloudSyncConflictContext = {
    pendingDreamIds: new Set(pendingDreams.map(dream => dream.id)),
    pendingTombstoneIds: new Set(
      pendingTombstones.map(tombstone => tombstone.dreamId),
    ),
  };
  const syncStartedAt = Date.now();

  let uploadedCount = 0;
  let pulledCount = 0;
  let skippedCount = 0;
  let conflictsResolvedCount = 0;
  let localWinsCount = 0;
  let remoteWinsCount = 0;
  let failedCount = 0;
  let lastErrorMessage: string | undefined;

  try {
    const session = await syncCloudSessionFromAuth();
    if (session.status !== 'signed-in') {
      throw new Error('cloud-session-required');
    }

    persistCloudSyncSnapshot({
      status: 'syncing',
      reason,
      lastAttemptAt: syncStartedAt,
      uploadedCount: 0,
      pulledCount: 0,
      skippedCount: 0,
      conflictsResolvedCount: 0,
      localWinsCount: 0,
      remoteWinsCount: 0,
      failedCount: 0,
      pendingCount: getLocalCloudSyncPendingCount({
        pendingDreamCount: pendingDreams.length,
        pendingTombstoneCount: pendingTombstones.length,
        pendingReviewStateCount: getPendingReviewStateCount(pendingReviewState),
      }),
    });

    for (const dream of pendingDreams) {
      markDreamSyncing(dream.id);

      try {
        const uploadResult = await uploadDream(session.userId, dream);
        markDreamSynced(dream.id, {
          audioRemotePath: uploadResult.audioRemotePath,
          syncedAt: Date.now(),
        });
        uploadedCount += 1;
      } catch (error) {
        lastErrorMessage = normalizeSyncError(error);
        markDreamSyncError(dream.id, lastErrorMessage);
        failedCount += 1;
      }
    }

    for (const tombstone of pendingTombstones) {
      markDreamDeletionTombstoneSyncing(tombstone.dreamId);

      try {
        await uploadDreamDeletionTombstone(session.userId, tombstone);
        markDreamDeletionTombstoneSynced(tombstone.dreamId, Date.now());
        uploadedCount += 1;
      } catch (error) {
        lastErrorMessage = normalizeSyncError(error);
        markDreamDeletionTombstoneSyncError(
          tombstone.dreamId,
          lastErrorMessage,
        );
        failedCount += 1;
      }
    }

    const remoteTombstones = await fetchRemoteDreamDeletionTombstones(
      session.userId,
    );
    for (const row of remoteTombstones) {
      const decision = decideRemoteTombstoneResolution(row, conflictContext);
      ({
        conflictsResolvedCount,
        localWinsCount,
        remoteWinsCount,
      } = accumulateConflictDecision(decision, {
        conflictsResolvedCount,
        localWinsCount,
        remoteWinsCount,
      }));

      if (decision.action === 'skip') {
        skippedCount += 1;
        continue;
      }

      applyRemoteDreamDeletion(
        row.dream_id,
        new Date(row.deleted_at).getTime(),
      );
      pulledCount += 1;
    }

    const remoteBundles = await fetchRemoteDreamBundles(session.userId);
    for (const bundle of remoteBundles) {
      const decision = decideRemoteBundleResolution(bundle, conflictContext);
      ({
        conflictsResolvedCount,
        localWinsCount,
        remoteWinsCount,
      } = accumulateConflictDecision(decision, {
        conflictsResolvedCount,
        localWinsCount,
        remoteWinsCount,
      }));

      if (decision.action === 'skip') {
        skippedCount += 1;
        continue;
      }

      upsertDreamFromSyncBundle(bundle);
      pulledCount += 1;
    }

    const reconciledReviewState = reconcileDerivedReviewState(listDreams());
    const remoteSavedReviewState = await fetchRemoteSavedReviewState(session.userId);
    const savedReviewStateDecision = decideSavedReviewStateResolution(
      remoteSavedReviewState,
      reconciledReviewState,
    );
    if (savedReviewStateDecision.conflict && savedReviewStateDecision.winner) {
      conflictsResolvedCount += 1;
      if (savedReviewStateDecision.winner === 'local') {
        localWinsCount += 1;
      } else {
        remoteWinsCount += 1;
      }
    }

    if (savedReviewStateDecision.action === 'apply-remote') {
      applyRemoteSavedReviewStateSnapshot({
        ...savedReviewStateDecision.remoteSnapshot,
        syncedAt: Date.now(),
      });
      pulledCount += 1;
    } else if (savedReviewStateDecision.action === 'upload-local') {
      markSavedReviewStateSyncing();

      try {
        await uploadSavedReviewStateSnapshot(
          session.userId,
          getStoredReviewStateSnapshot(),
        );
        markSavedReviewStateSynced(Date.now());
        uploadedCount += 1;
      } catch (error) {
        lastErrorMessage = normalizeSyncError(error);
        markSavedReviewStateSyncError(lastErrorMessage);
        failedCount += 1;
      }
    } else if (remoteSavedReviewState || reconciledReviewState.savedMonths.length || reconciledReviewState.savedThreads.length) {
      skippedCount += 1;
    }
  } catch (error) {
    lastErrorMessage = normalizeSyncError(error);

    const finishedAt = Date.now();
    const errorSnapshot = persistCloudSyncSnapshot({
      status: 'error',
      reason,
      lastAttemptAt: syncStartedAt,
      lastFinishedAt: finishedAt,
      lastSuccessAt: previousSnapshot.lastSuccessAt,
      uploadedCount,
      pulledCount,
      skippedCount,
      conflictsResolvedCount,
      localWinsCount,
      remoteWinsCount,
      failedCount,
      pendingCount: getLocalCloudSyncPendingCount({
        pendingDreamCount: listDreams().filter(dream => dream.syncStatus !== 'synced').length,
        pendingTombstoneCount: listDreamDeletionTombstones().filter(
          tombstone => tombstone.syncStatus !== 'synced',
        ).length,
      }),
      errorMessage: lastErrorMessage,
    });
    appendCloudSyncEvent(errorSnapshot);
    return errorSnapshot;
  }

  const finishedAt = Date.now();
  const finishedSnapshot = persistCloudSyncSnapshot({
    status: failedCount ? 'error' : 'success',
    reason,
    lastAttemptAt: syncStartedAt,
    lastFinishedAt: finishedAt,
    lastSuccessAt: failedCount ? previousSnapshot.lastSuccessAt : finishedAt,
    uploadedCount,
    pulledCount,
    skippedCount,
    conflictsResolvedCount,
    localWinsCount,
    remoteWinsCount,
    failedCount,
    pendingCount: getLocalCloudSyncPendingCount({
      pendingDreamCount: listDreams().filter(dream => dream.syncStatus !== 'synced').length,
      pendingTombstoneCount: listDreamDeletionTombstones().filter(
        tombstone => tombstone.syncStatus !== 'synced',
      ).length,
    }),
    errorMessage: lastErrorMessage,
  });
  appendCloudSyncEvent(finishedSnapshot);
  return finishedSnapshot;
}

export function runCloudSync(options?: {
  reason?: CloudSyncReason;
  requireSyncEnabled?: boolean;
}) {
  if (activeCloudSyncPromise) {
    return activeCloudSyncPromise;
  }

  activeCloudSyncPromise = performCloudSync(
    options?.reason ?? 'manual',
    options?.requireSyncEnabled ?? false,
  ).finally(() => {
    activeCloudSyncPromise = null;
  });

  return activeCloudSyncPromise;
}

export function maybeRunCloudSyncOnLaunch() {
  if (!getCloudSyncEnabled()) {
    return Promise.resolve<CloudSyncResult | null>(null);
  }

  return runCloudSync({
    reason: 'launch',
    requireSyncEnabled: true,
  });
}
