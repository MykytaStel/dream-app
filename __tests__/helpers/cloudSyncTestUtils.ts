import type { DreamSyncBundle } from '../../src/services/api/contracts/dreamSync';

export function createMockSupabaseClient(options?: {
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
  const reviewSavedStateUpsert = jest.fn(async () => ({ error: null }));
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
    reviewSavedStateUpsert,
    tagsInsert,
    tombstonesUpsert,
    upload,
  };
}

export function mockSignedInCloudSession(
  mockedSyncCloudSessionFromAuth: jest.Mock,
  overrides?: Partial<{
    provider: 'supabase';
    userId: string;
    isAnonymous: boolean;
    email: string;
  }>,
) {
  mockedSyncCloudSessionFromAuth.mockResolvedValue({
    status: 'signed-in',
    provider: 'supabase',
    userId: 'user-1',
    isAnonymous: true,
    ...overrides,
  });
}
