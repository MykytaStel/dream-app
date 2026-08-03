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
import { uploadDreamAudio } from './audioUpload';
import {
  encryptAudioFileForUpload,
  ENCRYPTED_AUDIO_MIME_TYPE,
} from './audioCipher';
import { listDreams } from '../../features/dreams/repository/dreamsRepository';
import { listDreamDeletionTombstones } from '../../features/dreams/repository/dreamDeletionTombstonesRepository';
import type { SavedReviewStateSnapshot } from '../../features/stats/services/reviewStateStorageService';
import type {
  RemoteDreamRevisionRow,
  RemoteDreamDeletionTombstoneRow,
  RemoteSavedReviewStateRow,
} from './syncResolution';

/**
 * Everything the sync says to the server, and nothing it decides.
 *
 * Split out of sync.ts, which had grown to a thousand lines holding two
 * unrelated jobs: how to talk to Supabase, and what a sync should do. They
 * read as one thing because every phase called straight into a query, but they
 * change for different reasons — a column rename touches only this file, a
 * change to conflict handling touches only the other.
 *
 * The give-away was the repetition: every function here opens by asking for
 * the client and refusing without one, and none of them knows what a phase or
 * a counter is.
 *
 * These are deliberately not exported through an index. `sync.ts` is the only
 * caller, and a second one would be worth noticing.
 */

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

export async function ensureDreamAudioUploaded(
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

export type ArchiveSealer = ReturnType<typeof createArchiveSealer>;

export async function uploadDream(
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

export async function uploadDreamDeletionTombstone(
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

export async function uploadSavedReviewStateSnapshot(
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

export async function fetchRemoteDreamBundles(
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
export async function establishArchiveKey(userId: string) {
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

export async function fetchRemoteDreamRevisions(
  userId: string,
  dreamIds?: string[],
) {
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

export async function fetchRemoteDreamDeletionTombstones(
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

export async function fetchRemoteSavedReviewState(userId: string) {
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
