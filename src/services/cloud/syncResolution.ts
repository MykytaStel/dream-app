import { type DreamSyncBundle } from '../api/contracts/dreamSync';
import { getDream } from '../../features/dreams/repository/dreamsRepository';
import {
  getDreamDeletionTombstone,
  type DreamDeletionTombstone,
} from '../../features/dreams/repository/dreamDeletionTombstonesRepository';
import { type SavedReviewStateSnapshot } from '../../features/stats/services/reviewStateStorageService';

export type RemoteDreamDeletionTombstoneRow = {
  dream_id: string;
  user_id: string;
  deleted_at: string;
};

export type RemoteSavedReviewStateRow = {
  user_id: string;
  updated_at: string;
  saved_months: SavedReviewStateSnapshot['savedMonths'] | null;
  saved_threads: SavedReviewStateSnapshot['savedThreads'] | null;
};

export type CloudSyncConflictContext = {
  pendingDreamIds: Set<string>;
  pendingTombstoneIds: Set<string>;
};

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

export type ReviewStateConflictDecision =
  | {
      action: 'skip';
      conflict: boolean;
      winner?: 'local' | 'remote';
    }
  | {
      action: 'upload-local';
      conflict: boolean;
      winner?: 'local' | 'remote';
    }
  | {
      action: 'apply-remote';
      conflict: boolean;
      winner?: 'local' | 'remote';
      remoteSnapshot: {
        updatedAt: number;
        savedMonths: SavedReviewStateSnapshot['savedMonths'];
        savedThreads: SavedReviewStateSnapshot['savedThreads'];
      };
    };

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
  tombstone: DreamDeletionTombstone | null,
  context: CloudSyncConflictContext,
) {
  return Boolean(
    context.pendingTombstoneIds.has(dreamId) ||
      (tombstone && tombstone.syncStatus !== 'synced'),
  );
}

export function decideRemoteBundleResolution(
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

export function decideRemoteTombstoneResolution(
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

export function decideSavedReviewStateResolution(
  remoteRow: RemoteSavedReviewStateRow | null,
  localSnapshot: SavedReviewStateSnapshot,
): ReviewStateConflictDecision {
  const localHasItems =
    localSnapshot.savedMonths.length > 0 || localSnapshot.savedThreads.length > 0;
  const localPending = localSnapshot.syncStatus !== 'synced';

  if (!remoteRow) {
    if (!localHasItems && !localPending) {
      return {
        action: 'skip',
        conflict: false,
      };
    }

    return {
      action: 'upload-local',
      conflict: false,
    };
  }

  const remoteSnapshot = {
    updatedAt: new Date(remoteRow.updated_at).getTime(),
    savedMonths: remoteRow.saved_months ?? [],
    savedThreads: remoteRow.saved_threads ?? [],
  };
  const remoteHasItems =
    remoteSnapshot.savedMonths.length > 0 || remoteSnapshot.savedThreads.length > 0;

  if (!localHasItems && !localPending) {
    if (!remoteHasItems) {
      return {
        action: 'skip',
        conflict: false,
      };
    }

    return {
      action: 'apply-remote',
      conflict: false,
      remoteSnapshot,
    };
  }

  if (remoteSnapshot.updatedAt > localSnapshot.updatedAt) {
    return {
      action: 'apply-remote',
      conflict: localPending,
      winner: localPending ? 'remote' : undefined,
      remoteSnapshot,
    };
  }

  if (remoteSnapshot.updatedAt < localSnapshot.updatedAt) {
    return {
      action: localHasItems || localPending ? 'upload-local' : 'skip',
      conflict: localPending,
      winner: localPending ? 'local' : undefined,
    };
  }

  if (localPending) {
    return {
      action: 'upload-local',
      conflict: true,
      winner: 'local',
    };
  }

  if (!remoteHasItems && !localHasItems) {
    return {
      action: 'skip',
      conflict: false,
    };
  }

  return {
    action: 'apply-remote',
    conflict: false,
    remoteSnapshot,
  };
}

export function accumulateConflictDecision(
  decision: { conflict: boolean; winner?: 'local' | 'remote' },
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
