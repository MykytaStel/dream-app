import type {
  PreSleepEmotion,
  WakeEmotion,
} from '../../../features/dreams/model/dream';
import type {
  DreamEntryRow,
  DreamSleepContextRow,
  DreamSyncBundle,
} from './dreamSync';

/**
 * The boundary between what the server stores and what only the device can read.
 *
 * Everything that is content travels as one sealed blob. The alternative —
 * encrypting each column — meant nine places to get it wrong, a migration for
 * every new field, and CHECK constraints that only make sense on plaintext.
 *
 * Sealing here rather than inside `sync.ts` keeps this testable without a
 * network: the seal and open functions are injected, so the framing can be
 * proven correct against a fake primitive and separately against the real one.
 */

/**
 * Columns that stay readable, and the whole reason each one does.
 *
 * The list is shorter than the spec proposed. `created_at`, `archived_at`,
 * `starred_at` and `sleep_date` were kept open there for "sync filters" — but
 * no query in `sync.ts` reads them, so they buy nothing and leak when you
 * slept, what you archived and what you starred. They moved into the blob.
 */
export const CLEARTEXT_ENTRY_COLUMNS = {
  id: 'row key',
  user_id: 'row-level security',
  updated_at: 'conflict resolution compares it before anything is decrypted',
  audio_storage_path: 'a generated path, needed to fetch the file',
} as const;

export type EncryptedDreamEntryRow = {
  id: string;
  user_id: string;
  updated_at: string;
  audio_storage_path: string | null;
  ciphertext: string;
  cipher_version: number;
};

type SealedEntryColumns = Omit<
  DreamEntryRow,
  'id' | 'user_id' | 'updated_at' | 'audio_storage_path'
>;

/**
 * Bumped when the shape of the plaintext changes. Distinct from the cipher
 * version, which describes the envelope: the format of what is inside can move
 * without the algorithm changing, and the reverse is also true.
 */
export const SEALED_PAYLOAD_VERSION = 1;

export type SealedDreamContent = {
  payloadVersion: typeof SEALED_PAYLOAD_VERSION;
  entry: SealedEntryColumns;
  // Order carries the meaning that `position` carried in the relation tables,
  // so the column disappears with them.
  tags: string[];
  wakeEmotions: WakeEmotion[];
  preSleepEmotions: PreSleepEmotion[];
  sleepContext: Omit<DreamSleepContextRow, 'dream_id'> | null;
};

export class SealedPayloadVersionError extends Error {
  constructor(readonly received: unknown) {
    super(`Unsupported sealed payload version: ${String(received)}.`);
    this.name = 'SealedPayloadVersionError';
  }
}

export type SealContent = (content: SealedDreamContent) => string;
export type OpenContent = (ciphertext: string) => unknown;

export function toSealedDreamContent(
  bundle: DreamSyncBundle,
): SealedDreamContent {
  const {
    id: _id,
    user_id: _userId,
    updated_at: _updatedAt,
    audio_storage_path: _audioPath,
    ...entry
  } = bundle.dream;

  const byPosition = <T extends { position: number }>(rows: T[]) =>
    rows.slice().sort((left, right) => left.position - right.position);

  const sleepContext = bundle.sleepContext
    ? (() => {
        const { dream_id: _dreamId, ...rest } = bundle.sleepContext;
        return rest;
      })()
    : null;

  return {
    payloadVersion: SEALED_PAYLOAD_VERSION,
    entry,
    tags: byPosition(bundle.tags).map(row => row.tag),
    wakeEmotions: byPosition(bundle.wakeEmotions).map(row => row.emotion),
    preSleepEmotions: byPosition(bundle.preSleepEmotions).map(
      row => row.emotion,
    ),
    sleepContext,
  };
}

export function fromSealedDreamContent(
  content: SealedDreamContent,
  open: {
    id: string;
    user_id: string;
    updated_at: string;
    audio_storage_path: string | null;
  },
): DreamSyncBundle {
  if (content?.payloadVersion !== SEALED_PAYLOAD_VERSION) {
    throw new SealedPayloadVersionError(content?.payloadVersion);
  }

  return {
    dream: {
      ...content.entry,
      id: open.id,
      user_id: open.user_id,
      updated_at: open.updated_at,
      audio_storage_path: open.audio_storage_path,
    },
    tags: content.tags.map((tag, position) => ({
      dream_id: open.id,
      tag,
      position,
    })),
    wakeEmotions: content.wakeEmotions.map((emotion, position) => ({
      dream_id: open.id,
      emotion,
      position,
    })),
    preSleepEmotions: content.preSleepEmotions.map((emotion, position) => ({
      dream_id: open.id,
      emotion,
      position,
    })),
    sleepContext: content.sleepContext
      ? { dream_id: open.id, ...content.sleepContext }
      : null,
  };
}

export function sealDreamSyncBundle(
  bundle: DreamSyncBundle,
  seal: SealContent,
  cipherVersion: number,
): EncryptedDreamEntryRow {
  return {
    id: bundle.dream.id,
    user_id: bundle.dream.user_id,
    updated_at: bundle.dream.updated_at,
    audio_storage_path: bundle.dream.audio_storage_path,
    ciphertext: seal(toSealedDreamContent(bundle)),
    cipher_version: cipherVersion,
  };
}

export function openDreamSyncBundle(
  row: EncryptedDreamEntryRow,
  open: OpenContent,
): DreamSyncBundle {
  return fromSealedDreamContent(open(row.ciphertext) as SealedDreamContent, {
    id: row.id,
    user_id: row.user_id,
    updated_at: row.updated_at,
    audio_storage_path: row.audio_storage_path,
  });
}
