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

export type RemoteDreamRevisionRow = {
  id: string;
  updated_at: string;
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
  resolvedDreamIds: Set<string>;
  resolvedTombstoneIds: Set<string>;
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

type LocalUploadConflictDecision =
  | {
      action: 'upload';
      conflict: boolean;
      winner?: 'local' | 'remote';
      reason:
        | 'upload-no-remote'
        | 'upload-equal-remote-pending'
        | 'upload-local-newer-than-remote'
        | 'upload-local-newer-than-remote-delete'
        | 'upload-local-delete-newer-than-remote'
        | 'upload-local-delete-newer-than-remote-dream';
    }
  | {
      action: 'defer-to-remote';
      conflict: boolean;
      winner?: 'local' | 'remote';
      reason:
        | 'defer-to-remote-newer'
        | 'defer-to-remote-delete-newer'
        | 'defer-to-remote-dream-newer';
    }
  | {
      action: 'mark-synced';
      conflict: boolean;
      winner?: 'local' | 'remote';
      syncedAt: number;
      reason:
        | 'mark-synced-equal-remote'
        | 'mark-synced-equal-remote-delete';
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
      action: 'mark-synced';
      conflict: boolean;
      winner?: 'local' | 'remote';
      syncedAt: number;
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

function getRemoteUpdatedAt(value: { updated_at: string }) {
  return new Date(value.updated_at).getTime();
}

function getRemoteDeletedAt(value: { deleted_at: string }) {
  return new Date(value.deleted_at).getTime();
}

function normalizeSavedMonths(
  savedMonths: SavedReviewStateSnapshot['savedMonths'],
) {
  return savedMonths
    .slice()
    .sort((left, right) =>
      left.monthKey === right.monthKey
        ? left.savedAt - right.savedAt
        : left.monthKey.localeCompare(right.monthKey),
    );
}

function normalizeSavedThreads(
  savedThreads: SavedReviewStateSnapshot['savedThreads'],
) {
  return savedThreads
    .slice()
    .sort((left, right) => {
      const leftKey = `${left.kind}:${left.signal}`;
      const rightKey = `${right.kind}:${right.signal}`;
      return leftKey === rightKey
        ? left.savedAt - right.savedAt
        : leftKey.localeCompare(rightKey);
    });
}

function reviewStateContentEquals(
  left: Pick<SavedReviewStateSnapshot, 'savedMonths' | 'savedThreads'>,
  right: Pick<SavedReviewStateSnapshot, 'savedMonths' | 'savedThreads'>,
) {
  const leftMonths = normalizeSavedMonths(left.savedMonths);
  const rightMonths = normalizeSavedMonths(right.savedMonths);
  if (leftMonths.length !== rightMonths.length) {
    return false;
  }

  for (let index = 0; index < leftMonths.length; index += 1) {
    if (
      leftMonths[index].monthKey !== rightMonths[index].monthKey ||
      leftMonths[index].savedAt !== rightMonths[index].savedAt
    ) {
      return false;
    }
  }

  const leftThreads = normalizeSavedThreads(left.savedThreads);
  const rightThreads = normalizeSavedThreads(right.savedThreads);
  if (leftThreads.length !== rightThreads.length) {
    return false;
  }

  for (let index = 0; index < leftThreads.length; index += 1) {
    if (
      leftThreads[index].kind !== rightThreads[index].kind ||
      leftThreads[index].signal !== rightThreads[index].signal ||
      leftThreads[index].savedAt !== rightThreads[index].savedAt
    ) {
      return false;
    }
  }

  return true;
}

function hasPendingLocalDreamState(
  dreamId: string,
  dream: ReturnType<typeof getDream>,
  context: CloudSyncConflictContext,
) {
  if (context.resolvedDreamIds.has(dreamId)) {
    return false;
  }

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
  if (context.resolvedTombstoneIds.has(dreamId)) {
    return false;
  }

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
  const remoteUpdatedAt = getRemoteUpdatedAt(bundle.dream);
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
  const remoteDeletedAt = getRemoteDeletedAt(row);
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

export function decideLocalDreamUploadResolution(
  dream: { id: string; createdAt: number; updatedAt?: number },
  remoteDream: RemoteDreamRevisionRow | null,
  remoteTombstone: RemoteDreamDeletionTombstoneRow | null,
): LocalUploadConflictDecision {
  const localUpdatedAt = getDreamUpdatedAt(dream);

  if (remoteTombstone) {
    const remoteDeletedAt = getRemoteDeletedAt(remoteTombstone);
    if (remoteDeletedAt >= localUpdatedAt) {
      return {
        action: 'defer-to-remote',
        conflict: true,
        winner: 'remote',
        reason: 'defer-to-remote-delete-newer',
      };
    }

    return {
      action: 'upload',
      conflict: true,
      winner: 'local',
      reason: 'upload-local-newer-than-remote-delete',
    };
  }

  if (!remoteDream) {
    return {
      action: 'upload',
      conflict: false,
      reason: 'upload-no-remote',
    };
  }

  const remoteUpdatedAt = getRemoteUpdatedAt(remoteDream);
  if (localUpdatedAt > remoteUpdatedAt) {
    return {
      action: 'upload',
      conflict: true,
      winner: 'local',
      reason: 'upload-local-newer-than-remote',
    };
  }

  if (localUpdatedAt === remoteUpdatedAt) {
    if (getDream(dream.id)?.syncStatus !== 'synced') {
      return {
        action: 'upload',
        conflict: false,
        reason: 'upload-equal-remote-pending',
      };
    }

    return {
      action: 'mark-synced',
      conflict: false,
      syncedAt: remoteUpdatedAt,
      reason: 'mark-synced-equal-remote',
    };
  }

  return {
    action: 'defer-to-remote',
    conflict: true,
    winner: 'remote',
    reason: 'defer-to-remote-newer',
  };
}

export function decideLocalTombstoneUploadResolution(
  tombstone: { deletedAt: number },
  remoteDream: RemoteDreamRevisionRow | null,
  remoteTombstone: RemoteDreamDeletionTombstoneRow | null,
): LocalUploadConflictDecision {
  const localDeletedAt = tombstone.deletedAt;

  if (remoteDream) {
    const remoteUpdatedAt = getRemoteUpdatedAt(remoteDream);
    if (remoteUpdatedAt >= localDeletedAt) {
      return {
        action: 'defer-to-remote',
        conflict: true,
        winner: 'remote',
        reason: 'defer-to-remote-dream-newer',
      };
    }
  }

  if (!remoteTombstone) {
    if (remoteDream) {
      return {
        action: 'upload',
        conflict: true,
        winner: 'local',
        reason: 'upload-local-delete-newer-than-remote-dream',
      };
    }

    return {
      action: 'upload',
      conflict: false,
      reason: 'upload-no-remote',
    };
  }

  const remoteDeletedAt = getRemoteDeletedAt(remoteTombstone);
  if (localDeletedAt > remoteDeletedAt) {
    return {
      action: 'upload',
      conflict: true,
      winner: 'local',
      reason: 'upload-local-delete-newer-than-remote',
    };
  }

  if (localDeletedAt === remoteDeletedAt) {
    return {
      action: 'mark-synced',
      conflict: false,
      syncedAt: remoteDeletedAt,
      reason: 'mark-synced-equal-remote-delete',
    };
  }

  return {
    action: 'defer-to-remote',
    conflict: true,
    winner: 'remote',
    reason: 'defer-to-remote-delete-newer',
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
  const sameContent = reviewStateContentEquals(localSnapshot, remoteSnapshot);

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

  if (sameContent) {
    if (localPending) {
      return {
        action: 'mark-synced',
        conflict: false,
        syncedAt: Math.max(localSnapshot.updatedAt, remoteSnapshot.updatedAt),
      };
    }

    return {
      action: 'skip',
      conflict: false,
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
