import {
  establishArchiveKey,
  fetchRemoteDreamBundles,
  fetchRemoteDreamDeletionTombstones,
  fetchRemoteDreamRevisions,
  fetchRemoteSavedReviewState,
  uploadDream,
  uploadDreamDeletionTombstone,
  uploadSavedReviewStateSnapshot,
  type ArchiveSealer,
} from './syncTransport';
import { syncCloudSessionFromAuth } from '../auth/cloudAuth';
import { getCloudSyncEnabled } from '../auth/session';
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

/** The counters a sync reports when it finishes; passed into each phase and updated in place. */
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
 * Uploads waiting dreams, resolving each against the server. Returns the last
 * error, or undefined — a failure is recorded on the dream and counted, never
 * thrown, so one bad dream does not stop the sync.
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

/**
 * Applies deletions, then the dreams the server has that this device lacks.
 * Deletions first: a dream deleted elsewhere and edited here must meet the
 * tombstone before the pull, or it would be resurrected then deleted again.
 * An undecryptable record is counted as a failure and named, not thrown.
 */
async function pullRemoteChanges(
  input: {
    userId: string;
    sealer: ArchiveSealer;
    changesSince: number | undefined;
    conflictContext: CloudSyncConflictContext;
  },
  counters: SyncCounters,
): Promise<string | undefined> {
  let lastErrorMessage: string | undefined;

  const remoteTombstones = await fetchRemoteDreamDeletionTombstones(
    input.userId,
    { deletedAtOrAfter: input.changesSince },
  );

  for (const row of remoteTombstones) {
    const decision = decideRemoteTombstoneResolution(
      row,
      input.conflictContext,
    );
    Object.assign(counters, accumulateConflictDecision(decision, counters));

    if (decision.action === 'skip') {
      counters.skippedCount += 1;
      continue;
    }

    applyRemoteDreamDeletion(row.dream_id, new Date(row.deleted_at).getTime());
    counters.pulledCount += 1;
  }

  const { bundles: remoteBundles, unreadableCount } =
    await fetchRemoteDreamBundles(input.userId, input.sealer, {
      updatedAtOrAfter: input.changesSince,
    });

  counters.failedCount += unreadableCount;
  if (unreadableCount) {
    lastErrorMessage = 'archive-record-unreadable';
  }

  for (const bundle of remoteBundles) {
    const decision = decideRemoteBundleResolution(
      bundle,
      input.conflictContext,
    );
    Object.assign(counters, accumulateConflictDecision(decision, counters));

    if (decision.action === 'skip') {
      counters.skippedCount += 1;
      continue;
    }

    upsertDreamFromSyncBundle(bundle);
    counters.pulledCount += 1;
  }

  return lastErrorMessage;
}

/**
 * Reconciles saved months and threads (reading state, not dreams). Travels as
 * one snapshot, so resolution is a single newer-side decision. A skip is
 * counted only when there was something to skip.
 */
async function syncSavedReviewState(
  input: { userId: string },
  counters: SyncCounters,
): Promise<string | undefined> {
  let lastErrorMessage: string | undefined;

  const reconciledReviewState = reconcileDerivedReviewState(listDreams());
  const remoteSavedReviewState = await fetchRemoteSavedReviewState(
    input.userId,
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
        input.userId,
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

    // The server has no sealed archive for this account (e.g. right after the
    // encryption migration discarded the plaintext). Re-queue local "synced"
    // dreams; never delete them because the server looks empty.
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

    const pullError = await pullRemoteChanges(
      {
        userId: session.userId,
        sealer,
        changesSince: previousSnapshot.lastSuccessAt,
        conflictContext,
      },
      counters,
    );
    if (pullError) {
      lastErrorMessage = pullError;
    }

    const reviewStateError = await syncSavedReviewState(
      { userId: session.userId },
      counters,
    );
    if (reviewStateError) {
      lastErrorMessage = reviewStateError;
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
