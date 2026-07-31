import type { DreamSyncBundle } from '../../src/services/api/contracts/dreamSync';
import { sealDreamSyncBundle } from '../../src/services/api/contracts/dreamSyncCipher';
import {
  createArchiveKeyCheck,
  createArchiveSealer,
  forgetArchiveKey,
} from '../../src/services/crypto/archiveKeyService';
import { saveArchiveKey } from '../../src/services/security/archiveKeyStorage';
import type { syncCloudSessionFromAuth } from '../../src/services/auth/cloudAuth';
import type { CloudSession } from '../../src/services/auth/session';
import { CIPHER_VERSION } from '../../src/services/crypto/archiveCipher';

/**
 * The key the fake server's archive is sealed with.
 *
 * Tests that want a second device holding the wrong key pass a different one as
 * `archiveKey`; the default matches whatever the device generates, because the
 * helper seals the remote rows with the same key it advertises in the profile.
 */
export const TEST_ARCHIVE_KEY = Uint8Array.from(
  { length: 32 },
  (_, index) => index + 1,
);

/**
 * Puts a known key on the device, the way a restore or a previous run would.
 *
 * Without this each suite would generate its own key and every remote row would
 * be unreadable — which is the correct behaviour, and exactly what
 * `installTestArchiveKey(OTHER)` is used to assert.
 */
export async function installTestArchiveKey(key = TEST_ARCHIVE_KEY) {
  forgetArchiveKey();
  await saveArchiveKey(key);
  forgetArchiveKey();
}

export function createMockSupabaseClient(options?: {
  dreamEntryError?: Error | null;
  uploadError?: Error | null;
  reviewSavedStateUpsertError?: Error | null;
  remoteBundles?: DreamSyncBundle[];
  /** Seals the remote rows and answers the profile check. Null = unclaimed. */
  archiveKey?: Uint8Array | null;
  /** Rows returned as-is, for cases the sealing path cannot produce. */
  extraRemoteRows?: unknown[];
  tombstoneUpsertError?: Error | null;
  remoteDeletionTombstones?: Array<{
    dream_id: string;
    user_id: string;
    deleted_at: string;
  }>;
  remoteSavedReviewState?: {
    user_id: string;
    updated_at: string;
    saved_months: Array<{ monthKey: string; savedAt: number }> | null;
    saved_threads: Array<{
      signal: string;
      kind: 'word' | 'theme' | 'symbol';
      savedAt: number;
    }> | null;
  } | null;
}) {
  const remoteBundles = options?.remoteBundles ?? [];
  const remoteDeletionTombstones = options?.remoteDeletionTombstones ?? [];
  const archiveKey =
    options?.archiveKey === undefined ? TEST_ARCHIVE_KEY : options.archiveKey;
  // The stored check is what a real profile row would hold; a device whose key
  // does not open it must refuse to sync rather than write a second archive.
  let storedKeyCheck = archiveKey ? createArchiveKeyCheck(archiveKey) : null;
  const remoteDreamRows = archiveKey
    ? remoteBundles.map(bundle =>
        sealDreamSyncBundle(
          bundle,
          createArchiveSealer(archiveKey).seal,
          CIPHER_VERSION,
        ),
      )
    : [];
  const dreamEntriesUpsert = jest.fn(
    async (_row: unknown, _options?: unknown) => ({
      error: options?.dreamEntryError ?? null,
    }),
  );
  const dreamEntriesDeleteEqUser = jest.fn(async () => ({ error: null }));
  const dreamEntriesDeleteEqId = jest.fn(() => ({
    eq: dreamEntriesDeleteEqUser,
  }));
  const dreamEntriesSelectOrder = jest.fn(async () => ({
    data: [...remoteDreamRows, ...(options?.extraRemoteRows ?? [])],
    error: null,
  }));
  const dreamEntriesSelectQuery: {
    eq: jest.Mock;
    gte: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
  } = {} as never;
  dreamEntriesSelectQuery.eq = jest.fn(() => dreamEntriesSelectQuery);
  dreamEntriesSelectQuery.gte = jest.fn(() => dreamEntriesSelectQuery);
  dreamEntriesSelectQuery.in = jest.fn(() => dreamEntriesSelectQuery);
  dreamEntriesSelectQuery.order = dreamEntriesSelectOrder;
  const dreamEntriesSelect = jest.fn(() => dreamEntriesSelectQuery);
  const profilesMaybeSingle = jest.fn(async () => ({
    data: { archive_key_check: storedKeyCheck },
    error: null,
  }));
  const profilesSelect = jest.fn(() => ({
    eq: jest.fn(() => ({ maybeSingle: profilesMaybeSingle })),
  }));
  // Mirrors the conditional update the client uses to claim an unsealed
  // archive: it only takes effect while the column is still null.
  const profilesUpdateIs = jest.fn(async (_column: string, _value: null) => ({
    error: null,
  }));
  const profilesUpdate = jest.fn((patch: { archive_key_check: string }) => ({
    eq: jest.fn(() => ({
      is: jest.fn(async (column: string, value: null) => {
        if (storedKeyCheck === null) {
          storedKeyCheck = patch.archive_key_check;
        }
        return profilesUpdateIs(column, value);
      }),
    })),
  }));
  const tombstonesUpsert = jest.fn(async () => ({
    error: options?.tombstoneUpsertError ?? null,
  }));
  const tombstonesSelectOrder = jest.fn(async () => ({
    data: remoteDeletionTombstones,
    error: null,
  }));
  const tombstonesSelectQuery: {
    eq: jest.Mock;
    gte: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
  } = {} as never;
  tombstonesSelectQuery.eq = jest.fn(() => tombstonesSelectQuery);
  tombstonesSelectQuery.gte = jest.fn(() => tombstonesSelectQuery);
  tombstonesSelectQuery.in = jest.fn(() => tombstonesSelectQuery);
  tombstonesSelectQuery.order = tombstonesSelectOrder;
  const tombstonesSelect = jest.fn(() => tombstonesSelectQuery);
  const reviewSavedStateUpsert = jest.fn(async () => ({
    error: options?.reviewSavedStateUpsertError ?? null,
  }));
  const reviewSavedStateMaybeSingle = jest.fn(async () => ({
    data: options?.remoteSavedReviewState ?? null,
    error: null,
  }));
  const reviewSavedStateSelectEq = jest.fn(() => ({
    maybeSingle: reviewSavedStateMaybeSingle,
  }));
  const reviewSavedStateSelect = jest.fn(() => ({
    eq: reviewSavedStateSelectEq,
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
        case 'profiles':
          return {
            select: profilesSelect,
            update: profilesUpdate,
          };
        case 'dream_entry_tombstones':
          return {
            select: tombstonesSelect,
            upsert: tombstonesUpsert,
          };
        case 'review_saved_state_snapshots':
          return {
            select: reviewSavedStateSelect,
            upsert: reviewSavedStateUpsert,
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
    dreamEntriesSelectQuery,
    profilesUpdate,
    reviewSavedStateUpsert,
    tombstonesUpsert,
    tombstonesSelectQuery,
    upload,
    getStoredKeyCheck: () => storedKeyCheck,
  };
}

export function mockSignedInCloudSession(
  mockedSyncCloudSessionFromAuth: jest.MockedFunction<
    typeof syncCloudSessionFromAuth
  >,
  overrides?: Partial<Extract<CloudSession, { status: 'signed-in' }>>,
) {
  mockedSyncCloudSessionFromAuth.mockResolvedValue({
    status: 'signed-in',
    provider: 'supabase',
    userId: 'user-1',
    isAnonymous: true,
    ...overrides,
  });
}
