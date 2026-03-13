import RNFS from 'react-native-fs';
import {
  createDreamAudioStoragePath,
  createDreamSyncBundle,
  DREAM_AUDIO_BUCKET,
  type DreamEntryRow,
  type DreamPreSleepEmotionRow,
  type DreamSleepContextRow,
  type DreamSyncBundle,
  type DreamTagRow,
  type DreamWakeEmotionRow,
} from '../api/contracts/dreamSync';
import { getSupabaseClient } from '../api/supabase/client';
import { syncCloudSessionFromAuth } from '../auth/cloudAuth';
import { getCloudSyncEnabled } from '../auth/session';
import {
  getDream,
  listDreams,
  applyRemoteDreamDeletion,
  markDreamSynced,
  markDreamSyncError,
  markDreamSyncing,
  upsertDreamFromSyncBundle,
} from '../../features/dreams/repository/dreamsRepository';
import {
  getDreamDeletionTombstone,
  listDreamDeletionTombstones,
  markDreamDeletionTombstoneSynced,
  markDreamDeletionTombstoneSyncError,
  markDreamDeletionTombstoneSyncing,
} from '../../features/dreams/repository/dreamDeletionTombstonesRepository';
import { CLOUD_SYNC_SNAPSHOT_STORAGE_KEY } from '../storage/keys';
import { kv } from '../storage/mmkv';
import { reconcileSavedReviewState } from '../../features/stats/services/reviewShelfStateService';

export type CloudSyncReason = 'manual' | 'launch';
export type CloudSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type CloudSyncSnapshot = {
  status: CloudSyncStatus;
  reason?: CloudSyncReason;
  lastAttemptAt?: number;
  lastFinishedAt?: number;
  lastSuccessAt?: number;
  uploadedCount: number;
  pulledCount: number;
  skippedCount: number;
  conflictsResolvedCount: number;
  localWinsCount: number;
  remoteWinsCount: number;
  failedCount: number;
  pendingCount: number;
  errorMessage?: string;
};

export type CloudSyncResult = CloudSyncSnapshot;

type RemoteDreamDeletionTombstoneRow = {
  dream_id: string;
  user_id: string;
  deleted_at: string;
};

type CloudSyncConflictContext = {
  pendingDreamIds: Set<string>;
  pendingTombstoneIds: Set<string>;
};

const DEFAULT_CLOUD_SYNC_SNAPSHOT: CloudSyncSnapshot = {
  status: 'idle',
  uploadedCount: 0,
  pulledCount: 0,
  skippedCount: 0,
  conflictsResolvedCount: 0,
  localWinsCount: 0,
  remoteWinsCount: 0,
  failedCount: 0,
  pendingCount: 0,
};

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

function persistCloudSyncSnapshot(snapshot: CloudSyncSnapshot) {
  kv.set(CLOUD_SYNC_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function getCloudSyncSnapshot(): CloudSyncSnapshot {
  const raw = kv.getString(CLOUD_SYNC_SNAPSHOT_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_CLOUD_SYNC_SNAPSHOT;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CloudSyncSnapshot>;

    return {
      status:
        parsed.status === 'syncing' ||
        parsed.status === 'success' ||
        parsed.status === 'error'
          ? parsed.status
          : 'idle',
      reason:
        parsed.reason === 'manual' || parsed.reason === 'launch'
          ? parsed.reason
          : undefined,
      lastAttemptAt:
        typeof parsed.lastAttemptAt === 'number'
          ? parsed.lastAttemptAt
          : undefined,
      lastFinishedAt:
        typeof parsed.lastFinishedAt === 'number'
          ? parsed.lastFinishedAt
          : undefined,
      lastSuccessAt:
        typeof parsed.lastSuccessAt === 'number'
          ? parsed.lastSuccessAt
          : undefined,
      uploadedCount:
        typeof parsed.uploadedCount === 'number' ? parsed.uploadedCount : 0,
      pulledCount:
        typeof parsed.pulledCount === 'number' ? parsed.pulledCount : 0,
      skippedCount:
        typeof parsed.skippedCount === 'number' ? parsed.skippedCount : 0,
      conflictsResolvedCount:
        typeof parsed.conflictsResolvedCount === 'number'
          ? parsed.conflictsResolvedCount
          : 0,
      localWinsCount:
        typeof parsed.localWinsCount === 'number' ? parsed.localWinsCount : 0,
      remoteWinsCount:
        typeof parsed.remoteWinsCount === 'number'
          ? parsed.remoteWinsCount
          : 0,
      failedCount:
        typeof parsed.failedCount === 'number' ? parsed.failedCount : 0,
      pendingCount:
        typeof parsed.pendingCount === 'number' ? parsed.pendingCount : 0,
      errorMessage:
        typeof parsed.errorMessage === 'string'
          ? parsed.errorMessage
          : undefined,
    };
  } catch {
    return DEFAULT_CLOUD_SYNC_SNAPSHOT;
  }
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

function getDreamUpdatedAt(value: { createdAt: number; updatedAt?: number }) {
  return value.updatedAt ?? value.createdAt;
}

function hasPendingLocalDreamState(
  dreamId: string,
  dream: ReturnType<typeof getDream>,
  context: CloudSyncConflictContext,
) {
  return Boolean(
    context.pendingDreamIds.has(dreamId) ||
      (dream && dream.syncStatus !== 'synced'),
  );
}

function hasPendingLocalTombstoneState(
  dreamId: string,
  tombstone: ReturnType<typeof getDreamDeletionTombstone>,
  context: CloudSyncConflictContext,
) {
  return Boolean(
    context.pendingTombstoneIds.has(dreamId) ||
      (tombstone && tombstone.syncStatus !== 'synced'),
  );
}

type RemoteConflictDecision =
  | {
      action: 'apply';
      conflict: boolean;
      winner?: 'local' | 'remote';
      reason:
        | 'apply-remote-newer'
        | 'apply-remote-to-empty-local'
        | 'apply-equal-synced'
        | 'apply-remote-delete'
        | 'apply-remote-delete-to-empty-local';
    }
  | {
      action: 'skip';
      conflict: boolean;
      winner?: 'local' | 'remote';
      reason:
        | 'skip-local-tombstone'
        | 'skip-local-newer'
        | 'skip-equal-local-pending'
        | 'skip-stale-remote-update'
        | 'skip-local-tombstone-newer'
        | 'skip-local-newer-than-delete';
    };

function decideRemoteBundleResolution(
  bundle: DreamSyncBundle,
  context: CloudSyncConflictContext,
): RemoteConflictDecision {
  const localTombstone = getDreamDeletionTombstone(bundle.dream.id);
  const remoteUpdatedAt = new Date(bundle.dream.updated_at).getTime();
  if (localTombstone && localTombstone.deletedAt >= remoteUpdatedAt) {
    const hasPendingLocalTombstone = hasPendingLocalTombstoneState(
      bundle.dream.id,
      localTombstone,
      context,
    );
    return {
      action: 'skip',
      conflict: hasPendingLocalTombstone,
      winner: hasPendingLocalTombstone ? 'local' : undefined,
      reason: 'skip-local-tombstone',
    };
  }

  const localDream = getDream(bundle.dream.id);
  if (!localDream) {
    return {
      action: 'apply',
      conflict: false,
      reason: 'apply-remote-to-empty-local',
    };
  }

  const localUpdatedAt = getDreamUpdatedAt(localDream);
  const hasPendingLocalState = hasPendingLocalDreamState(
    bundle.dream.id,
    localDream,
    context,
  );
  if (remoteUpdatedAt > localUpdatedAt) {
    return {
      action: 'apply',
      conflict: hasPendingLocalState,
      winner: hasPendingLocalState ? 'remote' : undefined,
      reason: 'apply-remote-newer',
    };
  }

  if (remoteUpdatedAt < localUpdatedAt) {
    return {
      action: 'skip',
      conflict: hasPendingLocalState,
      winner: hasPendingLocalState ? 'local' : undefined,
      reason: hasPendingLocalState
        ? 'skip-local-newer'
        : 'skip-stale-remote-update',
    };
  }

  if (localDream.syncStatus === 'synced') {
    return {
      action: 'apply',
      conflict: false,
      reason: 'apply-equal-synced',
    };
  }

  return {
    action: 'skip',
    conflict: true,
    winner: 'local',
    reason: 'skip-equal-local-pending',
  };
}

function decideRemoteTombstoneResolution(
  row: RemoteDreamDeletionTombstoneRow,
  context: CloudSyncConflictContext,
): RemoteConflictDecision {
  const remoteDeletedAt = new Date(row.deleted_at).getTime();
  const localTombstone = getDreamDeletionTombstone(row.dream_id);
  if (localTombstone && localTombstone.deletedAt >= remoteDeletedAt) {
    const hasPendingLocalTombstone = hasPendingLocalTombstoneState(
      row.dream_id,
      localTombstone,
      context,
    );
    return {
      action: 'skip',
      conflict: hasPendingLocalTombstone,
      winner: hasPendingLocalTombstone ? 'local' : undefined,
      reason: 'skip-local-tombstone-newer',
    };
  }

  const localDream = getDream(row.dream_id);
  if (!localDream) {
    return {
      action: 'apply',
      conflict: false,
      reason: 'apply-remote-delete-to-empty-local',
    };
  }

  const hasPendingLocalState = hasPendingLocalDreamState(
    row.dream_id,
    localDream,
    context,
  );
  if (getDreamUpdatedAt(localDream) < remoteDeletedAt) {
    return {
      action: 'apply',
      conflict: hasPendingLocalState,
      winner: hasPendingLocalState ? 'remote' : undefined,
      reason: 'apply-remote-delete',
    };
  }

  return {
    action: 'skip',
    conflict: hasPendingLocalState,
    winner: hasPendingLocalState ? 'local' : undefined,
    reason: 'skip-local-newer-than-delete',
  };
}

function accumulateConflictDecision(
  decision: RemoteConflictDecision,
  counts: {
    conflictsResolvedCount: number;
    localWinsCount: number;
    remoteWinsCount: number;
  },
) {
  if (!decision.conflict || !decision.winner) {
    return counts;
  }

  counts.conflictsResolvedCount += 1;
  if (decision.winner === 'local') {
    counts.localWinsCount += 1;
  } else {
    counts.remoteWinsCount += 1;
  }

  return counts;
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

  return normalizedDreamRows.map(dream => ({
    dream,
    tags: tags.filter(item => item.dream_id === dream.id),
    wakeEmotions: wakeEmotions.filter(item => item.dream_id === dream.id),
    preSleepEmotions: preSleepEmotions.filter(
      item => item.dream_id === dream.id,
    ),
    sleepContext:
      sleepContexts.find(item => item.dream_id === dream.id) ?? null,
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

async function performCloudSync(
  reason: CloudSyncReason,
  requireSyncEnabled: boolean,
) {
  if (requireSyncEnabled && !getCloudSyncEnabled()) {
    return persistCloudSyncSnapshot({
      ...getCloudSyncSnapshot(),
      status: 'idle',
      reason,
      uploadedCount: 0,
      pulledCount: 0,
      skippedCount: 0,
      conflictsResolvedCount: 0,
      localWinsCount: 0,
      remoteWinsCount: 0,
      failedCount: 0,
      pendingCount:
        listDreams().filter(dream => dream.syncStatus !== 'synced').length +
        listDreamDeletionTombstones().filter(
          tombstone => tombstone.syncStatus !== 'synced',
        ).length,
    });
  }

  const session = await syncCloudSessionFromAuth();
  if (session.status !== 'signed-in') {
    throw new Error('cloud-session-required');
  }

  const pendingDreams = listDreams().filter(
    dream => dream.syncStatus !== 'synced',
  );
  const pendingTombstones = listDreamDeletionTombstones().filter(
    tombstone => tombstone.syncStatus !== 'synced',
  );
  const conflictContext: CloudSyncConflictContext = {
    pendingDreamIds: new Set(pendingDreams.map(dream => dream.id)),
    pendingTombstoneIds: new Set(
      pendingTombstones.map(tombstone => tombstone.dreamId),
    ),
  };
  const syncStartedAt = Date.now();

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
    pendingCount: pendingDreams.length + pendingTombstones.length,
  });

  let uploadedCount = 0;
  let pulledCount = 0;
  let skippedCount = 0;
  let conflictsResolvedCount = 0;
  let localWinsCount = 0;
  let remoteWinsCount = 0;
  let failedCount = 0;
  let lastErrorMessage: string | undefined;

  try {
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

    reconcileSavedReviewState(listDreams());
  } catch (error) {
    lastErrorMessage = normalizeSyncError(error);

    const finishedAt = Date.now();
    return persistCloudSyncSnapshot({
      status: 'error',
      reason,
      lastAttemptAt: syncStartedAt,
      lastFinishedAt: finishedAt,
      uploadedCount,
      pulledCount,
      skippedCount,
      conflictsResolvedCount,
      localWinsCount,
      remoteWinsCount,
      failedCount,
      pendingCount:
        listDreams().filter(dream => dream.syncStatus !== 'synced').length +
        listDreamDeletionTombstones().filter(
          tombstone => tombstone.syncStatus !== 'synced',
        ).length,
      errorMessage: lastErrorMessage,
    });
  }

  const finishedAt = Date.now();
  return persistCloudSyncSnapshot({
    status: failedCount ? 'error' : 'success',
    reason,
    lastAttemptAt: syncStartedAt,
    lastFinishedAt: finishedAt,
    lastSuccessAt: failedCount ? undefined : finishedAt,
    uploadedCount,
    pulledCount,
    skippedCount,
    conflictsResolvedCount,
    localWinsCount,
    remoteWinsCount,
    failedCount,
    pendingCount:
      listDreams().filter(dream => dream.syncStatus !== 'synced').length +
      listDreamDeletionTombstones().filter(
        tombstone => tombstone.syncStatus !== 'synced',
      ).length,
    errorMessage: lastErrorMessage,
  });
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
