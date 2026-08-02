import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base-64';
import {
  createDreamAudioStoragePath,
  createDreamSyncBundle,
  DREAM_AUDIO_BUCKET,
} from '../api/contracts/dreamSync';
import {
  openDreamSyncBundle,
  sealDreamSyncBundle,
  type EncryptedDreamEntryRow,
} from '../api/contracts/dreamSyncCipher';
import {
  archiveKeyMatchesCheck,
  ArchiveKeyRequiredError,
  createArchiveKeyCheck,
  createArchiveSealer,
  getOrCreateArchiveKey,
} from '../crypto/archiveKeyService';
import { getSupabaseClient } from '../api/supabase/client';
import { reportError } from '../observability/errorReporting';
import { syncCloudSessionFromAuth } from '../auth/cloudAuth';
import { getCloudSyncEnabled } from '../auth/session';
import { uploadDreamAudio } from './audioUpload';
import {
  encryptAudioFileForUpload,
  ENCRYPTED_AUDIO_MIME_TYPE,
} from './audioCipher';
import {
  listDreams,
  applyRemoteDreamDeletion,
  markAllDreamsPendingUpload,
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
  getLocalCloudSyncPendingCounts,
  getPendingReviewStateCount,
  persistCloudSyncSnapshot,
  type CloudSyncReason,
  type CloudSyncResult,
} from './syncState';
import {
  accumulateConflictDecision,
  decideLocalDreamUploadResolution,
  decideLocalTombstoneUploadResolution,
  decideRemoteBundleResolution,
  decideRemoteTombstoneResolution,
  decideSavedReviewStateResolution,
  type CloudSyncConflictContext,
  type RemoteDreamRevisionRow,
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

function decodeBase64ToUint8Array(input: string): Uint8Array {
  const binary = decodeBase64(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function normalizeSyncError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getPendingDreamCount() {
  return listDreams().filter(dream => dream.syncStatus !== 'synced').length;
}

function getPendingTombstoneCount() {
  return listDreamDeletionTombstones().filter(
    tombstone => tombstone.syncStatus !== 'synced',
  ).length;
}

function getCurrentPendingCounts(
  reviewStateSnapshot = getStoredReviewStateSnapshot(),
) {
  return getLocalCloudSyncPendingCounts({
    pendingDreamCount: getPendingDreamCount(),
    pendingTombstoneCount: getPendingTombstoneCount(),
    pendingReviewStateCount: getPendingReviewStateCount(reviewStateSnapshot),
  });
}

async function ensureDreamAudioUploaded(
  userId: string,
  dream: ReturnType<typeof listDreams>[number],
  sealer: ArchiveSealer,
) {
  if (!dream.audioUri?.trim()) {
    return dream.audioRemotePath;
  }

  if (dream.audioRemotePath?.trim()) {
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

  // No size ceiling any more. The old 100 MB check guarded against loading a
  // whole file into memory, and streamed encryption removed the reason: memory
  // is one chunk however long the recording is.
  const filename = getAudioFilename(dream.audioUri, dream.id);
  const remotePath =
    dream.audioRemotePath ??
    createDreamAudioStoragePath({
      userId,
      dreamId: dream.id,
      filename,
    });

  // The recording is sealed before it leaves, and what goes up is no longer an
  // audio file — so it stops being declared as one. The bucket's allowed types
  // were widened for exactly this in the same migration.
  const encryptedPath = await encryptAudioFileForUpload(
    audioFilePath,
    sealer.key,
  );

  try {
    await uploadDreamAudio(
      remotePath,
      encryptedPath,
      ENCRYPTED_AUDIO_MIME_TYPE,
    );
  } catch (error) {
    // If native upload is unavailable for some reason, fall back to JS upload.
    const message = error instanceof Error ? error.message : String(error);
    if (
      !message.includes('supabase-rest-config-missing') &&
      !message.includes('Supabase runtime config is missing.')
    ) {
      // Native path tried and failed with a specific error; rethrow.
      throw error;
    }

    const base64 = await RNFS.readFile(encryptedPath, 'base64');
    const bytes = decodeBase64ToUint8Array(base64);
    const { error: uploadError } = await client.storage
      .from(DREAM_AUDIO_BUCKET)
      .upload(remotePath, bytes, {
        contentType: ENCRYPTED_AUDIO_MIME_TYPE,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }
  } finally {
    // The sealed copy is a duplicate of the recording; leaving it behind would
    // quietly double what the app stores on disk with every sync.
    await RNFS.unlink(encryptedPath).catch(() => undefined);
  }

  return remotePath;
}

type ArchiveSealer = ReturnType<typeof createArchiveSealer>;

async function uploadDream(
  userId: string,
  dream: ReturnType<typeof listDreams>[number],
  sealer: ArchiveSealer,
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const audioRemotePath = await ensureDreamAudioUploaded(userId, dream, sealer);
  const bundle = createDreamSyncBundle(
    {
      ...dream,
      audioRemotePath,
    },
    userId,
  );

  // One row, one write. The four relation tables this used to fan out to are
  // gone: their contents ride inside the sealed blob, which also removed the
  // window where an entry was uploaded but its tags were not.
  const { error: dreamError } = await client
    .from('dream_entries')
    .upsert(sealDreamSyncBundle(bundle, sealer.seal, sealer.cipherVersion), {
      onConflict: 'id',
    });
  if (dreamError) {
    throw dreamError;
  }

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

async function fetchRemoteDreamBundles(
  userId: string,
  sealer: ArchiveSealer,
  options?: { updatedAtOrAfter?: number },
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  let query = client.from('dream_entries').select('*').eq('user_id', userId);

  if (
    typeof options?.updatedAtOrAfter === 'number' &&
    Number.isFinite(options.updatedAtOrAfter)
  ) {
    query = query.gte(
      'updated_at',
      new Date(options.updatedAtOrAfter).toISOString(),
    );
  }

  const { data: dreamRows, error: dreamRowsError } = await query.order(
    'updated_at',
    { ascending: false },
  );

  if (dreamRowsError) {
    throw dreamRowsError;
  }

  const normalizedDreamRows = (dreamRows ?? []) as EncryptedDreamEntryRow[];
  if (!normalizedDreamRows.length) {
    return { bundles: [], unreadableCount: 0 };
  }

  const bundles = [];
  let unreadableCount = 0;

  for (const row of normalizedDreamRows) {
    try {
      bundles.push(openDreamSyncBundle(row, sealer.open));
    } catch (error) {
      // One unreadable record must not abort the pull: the rest of the archive
      // is still readable, and stopping here would strand it. It is reported
      // rather than swallowed, because a record this device cannot open is
      // either tampered with or sealed under a different key — both worth
      // knowing about, neither a reason to lose the other 400 dreams.
      unreadableCount += 1;
      reportError(error, {
        event: 'archive_record_unreadable',
        dreamId: row.id,
        cipherVersion: row.cipher_version,
      });
    }
  }

  return { bundles, unreadableCount };
}

/**
 * Settles which key this account's archive is sealed with, before a single byte
 * is written.
 *
 * The check value on the profile is claimed with a conditional update, so two
 * devices racing to set it up cannot both win: the loser reads back a value its
 * own key cannot open and stops, instead of uploading records the other device
 * will never be able to read.
 */
async function establishArchiveKey(userId: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const key = await getOrCreateArchiveKey();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('archive_key_check')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) {
    throw profileError;
  }

  const existingCheck = (
    profile as { archive_key_check?: string | null } | null
  )?.archive_key_check;

  if (existingCheck) {
    if (!archiveKeyMatchesCheck(key, existingCheck)) {
      throw new ArchiveKeyRequiredError('mismatch');
    }

    return { sealer: createArchiveSealer(key), isUnclaimedArchive: false };
  }

  const { error: claimError } = await client
    .from('profiles')
    .update({ archive_key_check: createArchiveKeyCheck(key) })
    .eq('id', userId)
    .is('archive_key_check', null);
  if (claimError) {
    throw claimError;
  }

  const { data: claimed, error: claimedError } = await client
    .from('profiles')
    .select('archive_key_check')
    .eq('id', userId)
    .maybeSingle();
  if (claimedError) {
    throw claimedError;
  }

  const claimedCheck = (claimed as { archive_key_check?: string | null } | null)
    ?.archive_key_check;
  if (!claimedCheck || !archiveKeyMatchesCheck(key, claimedCheck)) {
    throw new ArchiveKeyRequiredError('mismatch');
  }

  return { sealer: createArchiveSealer(key), isUnclaimedArchive: true };
}

async function fetchRemoteDreamRevisions(userId: string, dreamIds?: string[]) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  if (dreamIds && !dreamIds.length) {
    return [] as RemoteDreamRevisionRow[];
  }

  let query = client
    .from('dream_entries')
    .select('id, updated_at')
    .eq('user_id', userId);
  if (dreamIds?.length) {
    query = query.in('id', dreamIds);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RemoteDreamRevisionRow[];
}

async function fetchRemoteDreamDeletionTombstones(
  userId: string,
  options?: { dreamIds?: string[]; deletedAtOrAfter?: number },
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  if (options?.dreamIds && !options.dreamIds.length) {
    return [] as RemoteDreamDeletionTombstoneRow[];
  }

  let query = client
    .from('dream_entry_tombstones')
    .select('*')
    .eq('user_id', userId);
  if (options?.dreamIds?.length) {
    query = query.in('dream_id', options.dreamIds);
  }
  if (
    typeof options?.deletedAtOrAfter === 'number' &&
    Number.isFinite(options.deletedAtOrAfter)
  ) {
    query = query.gte(
      'deleted_at',
      new Date(options.deletedAtOrAfter).toISOString(),
    );
  }

  const { data, error } = await query.order('deleted_at', { ascending: false });

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

/**
 * The counters a sync reports when it finishes.
 *
 * Passed into each phase and updated in place. The alternative — returning
 * seven numbers from every phase and adding them at the call site — is the
 * shape this code already had, spelled `({ a, b, c } = accumulate(...))`, and
 * it is why the two upload loops could only be read inside the three hundred
 * line function that owned the variables.
 */
type PendingTombstone = ReturnType<typeof listDreamDeletionTombstones>[number];
type PendingDream = ReturnType<typeof listDreams>[number];

type SyncCounters = {
  uploadedCount: number;
  pulledCount: number;
  skippedCount: number;
  conflictsResolvedCount: number;
  localWinsCount: number;
  remoteWinsCount: number;
  failedCount: number;
};

/**
 * Sends the dreams that are waiting, resolving each against what the server
 * already has.
 *
 * Returns the last upload error, or undefined. A failure here is recorded on
 * the dream and counted, never thrown: one unsendable dream must not stop the
 * rest of the sync, which is the whole reason this loop exists rather than a
 * `Promise.all`.
 */
async function uploadPendingDreams(
  input: {
    userId: string;
    dreams: PendingDream[];
    sealer: ArchiveSealer;
    remoteDreamRevisionMap: Map<string, RemoteDreamRevisionRow>;
    remoteTombstoneMap: Map<string, RemoteDreamDeletionTombstoneRow>;
    conflictContext: CloudSyncConflictContext;
  },
  counters: SyncCounters,
): Promise<string | undefined> {
  let lastErrorMessage: string | undefined;

  for (const dream of input.dreams) {
    const localUploadDecision = decideLocalDreamUploadResolution(
      dream,
      input.remoteDreamRevisionMap.get(dream.id) ?? null,
      input.remoteTombstoneMap.get(dream.id) ?? null,
    );
    Object.assign(
      counters,
      accumulateConflictDecision(localUploadDecision, counters),
    );

    if (localUploadDecision.action === 'mark-synced') {
      input.conflictContext.resolvedDreamIds.add(dream.id);
      markDreamSynced(dream.id, { syncedAt: localUploadDecision.syncedAt });
      counters.skippedCount += 1;
      continue;
    }

    if (localUploadDecision.action === 'defer-to-remote') {
      input.conflictContext.resolvedDreamIds.add(dream.id);
      counters.skippedCount += 1;
      continue;
    }

    markDreamSyncing(dream.id);

    try {
      const uploadResult = await uploadDream(input.userId, dream, input.sealer);
      markDreamSynced(dream.id, {
        audioRemotePath: uploadResult.audioRemotePath,
        syncedAt: Date.now(),
      });
      input.conflictContext.resolvedDreamIds.add(dream.id);
      counters.uploadedCount += 1;
    } catch (error) {
      lastErrorMessage = normalizeSyncError(error);
      markDreamSyncError(dream.id, lastErrorMessage);
      counters.failedCount += 1;
    }
  }

  return lastErrorMessage;
}

/** The same, for deletions. */
async function uploadPendingTombstones(
  input: {
    userId: string;
    tombstones: PendingTombstone[];
    remoteDreamRevisionMap: Map<string, RemoteDreamRevisionRow>;
    remoteTombstoneMap: Map<string, RemoteDreamDeletionTombstoneRow>;
    conflictContext: CloudSyncConflictContext;
  },
  counters: SyncCounters,
): Promise<string | undefined> {
  let lastErrorMessage: string | undefined;

  for (const tombstone of input.tombstones) {
    const localUploadDecision = decideLocalTombstoneUploadResolution(
      tombstone,
      input.remoteDreamRevisionMap.get(tombstone.dreamId) ?? null,
      input.remoteTombstoneMap.get(tombstone.dreamId) ?? null,
    );
    Object.assign(
      counters,
      accumulateConflictDecision(localUploadDecision, counters),
    );

    if (localUploadDecision.action === 'mark-synced') {
      input.conflictContext.resolvedTombstoneIds.add(tombstone.dreamId);
      markDreamDeletionTombstoneSynced(
        tombstone.dreamId,
        localUploadDecision.syncedAt,
      );
      counters.skippedCount += 1;
      continue;
    }

    if (localUploadDecision.action === 'defer-to-remote') {
      input.conflictContext.resolvedTombstoneIds.add(tombstone.dreamId);
      counters.skippedCount += 1;
      continue;
    }

    markDreamDeletionTombstoneSyncing(tombstone.dreamId);

    try {
      await uploadDreamDeletionTombstone(input.userId, tombstone);
      markDreamDeletionTombstoneSynced(tombstone.dreamId, Date.now());
      input.conflictContext.resolvedTombstoneIds.add(tombstone.dreamId);
      counters.uploadedCount += 1;
    } catch (error) {
      lastErrorMessage = normalizeSyncError(error);
      markDreamDeletionTombstoneSyncError(tombstone.dreamId, lastErrorMessage);
      counters.failedCount += 1;
    }
  }

  return lastErrorMessage;
}

async function performCloudSync(
  reason: CloudSyncReason,
  requireSyncEnabled: boolean,
) {
  const previousSnapshot = getCloudSyncSnapshot();
  if (requireSyncEnabled && !getCloudSyncEnabled()) {
    const pendingCounts = getCurrentPendingCounts();
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
      ...pendingCounts,
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
    resolvedDreamIds: new Set(),
    resolvedTombstoneIds: new Set(),
  };
  const syncStartedAt = Date.now();

  const counters: SyncCounters = {
    uploadedCount: 0,
    pulledCount: 0,
    skippedCount: 0,
    conflictsResolvedCount: 0,
    localWinsCount: 0,
    remoteWinsCount: 0,
    failedCount: 0,
  };
  let lastErrorMessage: string | undefined;

  try {
    const session = await syncCloudSessionFromAuth();
    if (session.status !== 'signed-in') {
      throw new Error('cloud-session-required');
    }

    // Before anything is read or written. A key mismatch here throws, which
    // ends the sync with an error the settings screen can act on — and, more
    // importantly, leaves the local archive untouched.
    const { sealer, isUnclaimedArchive } = await establishArchiveKey(
      session.userId,
    );

    // Nobody has sealed this account's archive yet, which is what the server
    // looks like after the encryption migration discarded the plaintext copy.
    // Dreams marked "synced" locally now have nothing behind them, so they are
    // queued again. The reverse — deleting local dreams because the server is
    // empty — is exactly the mistake this must not make.
    const dreamsToUpload = isUnclaimedArchive
      ? (markAllDreamsPendingUpload(),
        listDreams().filter(dream => dream.syncStatus !== 'synced'))
      : pendingDreams;
    dreamsToUpload.forEach(dream =>
      conflictContext.pendingDreamIds.add(dream.id),
    );

    const pendingRemoteLookupIds = Array.from(
      new Set([
        ...dreamsToUpload.map(dream => dream.id),
        ...pendingTombstones.map(tombstone => tombstone.dreamId),
      ]),
    );
    const pendingCounts = getCurrentPendingCounts(pendingReviewState);
    const [remoteDreamRevisionsBeforeUpload, remoteTombstonesBeforeUpload] =
      await Promise.all([
        fetchRemoteDreamRevisions(session.userId, pendingRemoteLookupIds),
        fetchRemoteDreamDeletionTombstones(session.userId, {
          dreamIds: pendingRemoteLookupIds,
        }),
      ]);
    const remoteDreamRevisionMap = new Map(
      remoteDreamRevisionsBeforeUpload.map(row => [row.id, row] as const),
    );
    const remoteTombstoneMap = new Map(
      remoteTombstonesBeforeUpload.map(row => [row.dream_id, row] as const),
    );

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
      ...pendingCounts,
    });

    const dreamUploadError = await uploadPendingDreams(
      {
        userId: session.userId,
        dreams: dreamsToUpload,
        sealer,
        remoteDreamRevisionMap,
        remoteTombstoneMap,
        conflictContext,
      },
      counters,
    );
    if (dreamUploadError) {
      lastErrorMessage = dreamUploadError;
    }

    const tombstoneUploadError = await uploadPendingTombstones(
      {
        userId: session.userId,
        tombstones: pendingTombstones,
        remoteDreamRevisionMap,
        remoteTombstoneMap,
        conflictContext,
      },
      counters,
    );
    if (tombstoneUploadError) {
      lastErrorMessage = tombstoneUploadError;
    }

    const remoteChangesSince = previousSnapshot.lastSuccessAt;
    const remoteTombstones = await fetchRemoteDreamDeletionTombstones(
      session.userId,
      {
        deletedAtOrAfter: remoteChangesSince,
      },
    );
    for (const row of remoteTombstones) {
      const decision = decideRemoteTombstoneResolution(row, conflictContext);
      Object.assign(counters, accumulateConflictDecision(decision, counters));

      if (decision.action === 'skip') {
        counters.skippedCount += 1;
        continue;
      }

      applyRemoteDreamDeletion(
        row.dream_id,
        new Date(row.deleted_at).getTime(),
      );
      counters.pulledCount += 1;
    }

    const { bundles: remoteBundles, unreadableCount } =
      await fetchRemoteDreamBundles(session.userId, sealer, {
        updatedAtOrAfter: remoteChangesSince,
      });
    counters.failedCount += unreadableCount;
    if (unreadableCount) {
      lastErrorMessage = 'archive-record-unreadable';
    }
    for (const bundle of remoteBundles) {
      const decision = decideRemoteBundleResolution(bundle, conflictContext);
      Object.assign(counters, accumulateConflictDecision(decision, counters));

      if (decision.action === 'skip') {
        counters.skippedCount += 1;
        continue;
      }

      upsertDreamFromSyncBundle(bundle);
      counters.pulledCount += 1;
    }

    const reconciledReviewState = reconcileDerivedReviewState(listDreams());
    const remoteSavedReviewState = await fetchRemoteSavedReviewState(
      session.userId,
    );
    const savedReviewStateDecision = decideSavedReviewStateResolution(
      remoteSavedReviewState,
      reconciledReviewState,
    );
    if (savedReviewStateDecision.conflict && savedReviewStateDecision.winner) {
      counters.conflictsResolvedCount += 1;
      if (savedReviewStateDecision.winner === 'local') {
        counters.localWinsCount += 1;
      } else {
        counters.remoteWinsCount += 1;
      }
    }

    if (savedReviewStateDecision.action === 'apply-remote') {
      applyRemoteSavedReviewStateSnapshot({
        ...savedReviewStateDecision.remoteSnapshot,
        syncedAt: Date.now(),
      });
      counters.pulledCount += 1;
    } else if (savedReviewStateDecision.action === 'mark-synced') {
      markSavedReviewStateSynced(savedReviewStateDecision.syncedAt);
      counters.skippedCount += 1;
    } else if (savedReviewStateDecision.action === 'upload-local') {
      markSavedReviewStateSyncing();

      try {
        await uploadSavedReviewStateSnapshot(
          session.userId,
          getStoredReviewStateSnapshot(),
        );
        markSavedReviewStateSynced(Date.now());
        counters.uploadedCount += 1;
      } catch (error) {
        lastErrorMessage = normalizeSyncError(error);
        markSavedReviewStateSyncError(lastErrorMessage);
        counters.failedCount += 1;
      }
    } else if (
      remoteSavedReviewState ||
      reconciledReviewState.savedMonths.length ||
      reconciledReviewState.savedThreads.length
    ) {
      counters.skippedCount += 1;
    }
  } catch (error) {
    lastErrorMessage = normalizeSyncError(error);

    const finishedAt = Date.now();
    const pendingCounts = getCurrentPendingCounts();
    const errorSnapshot = persistCloudSyncSnapshot({
      status: 'error',
      reason,
      lastAttemptAt: syncStartedAt,
      lastFinishedAt: finishedAt,
      lastSuccessAt: previousSnapshot.lastSuccessAt,
      uploadedCount: counters.uploadedCount,
      pulledCount: counters.pulledCount,
      skippedCount: counters.skippedCount,
      conflictsResolvedCount: counters.conflictsResolvedCount,
      localWinsCount: counters.localWinsCount,
      remoteWinsCount: counters.remoteWinsCount,
      failedCount: counters.failedCount,
      ...pendingCounts,
      errorMessage: lastErrorMessage,
    });
    appendCloudSyncEvent(errorSnapshot);
    return errorSnapshot;
  }

  const finishedAt = Date.now();
  const pendingCounts = getCurrentPendingCounts();
  const finishedSnapshot = persistCloudSyncSnapshot({
    status: counters.failedCount ? 'error' : 'success',
    reason,
    lastAttemptAt: syncStartedAt,
    lastFinishedAt: finishedAt,
    lastSuccessAt: counters.failedCount
      ? previousSnapshot.lastSuccessAt
      : finishedAt,
    uploadedCount: counters.uploadedCount,
    pulledCount: counters.pulledCount,
    skippedCount: counters.skippedCount,
    conflictsResolvedCount: counters.conflictsResolvedCount,
    localWinsCount: counters.localWinsCount,
    remoteWinsCount: counters.remoteWinsCount,
    failedCount: counters.failedCount,
    ...pendingCounts,
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
