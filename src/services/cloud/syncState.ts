import {
  CLOUD_SYNC_EVENTS_STORAGE_KEY,
  CLOUD_SYNC_SNAPSHOT_STORAGE_KEY,
} from '../storage/keys';
import { kv } from '../storage/mmkv';
import { getStoredReviewStateSnapshot } from '../../features/stats/services/reviewStateStorageService';

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

export type CloudSyncEvent = {
  id: string;
  status: CloudSyncStatus;
  reason?: CloudSyncReason;
  at: number;
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

export const DEFAULT_CLOUD_SYNC_SNAPSHOT: CloudSyncSnapshot = {
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

const MAX_CLOUD_SYNC_EVENTS = 12;

export function getPendingReviewStateCount(
  snapshot = getStoredReviewStateSnapshot(),
) {
  const hasItems = snapshot.savedMonths.length > 0 || snapshot.savedThreads.length > 0;
  return snapshot.syncStatus !== 'synced' && (hasItems || snapshot.updatedAt > 0) ? 1 : 0;
}

export function getLocalCloudSyncPendingCount(args?: {
  pendingDreamCount?: number;
  pendingTombstoneCount?: number;
  pendingReviewStateCount?: number;
}) {
  return (
    (args?.pendingDreamCount ?? 0) +
    (args?.pendingTombstoneCount ?? 0) +
    (args?.pendingReviewStateCount ?? getPendingReviewStateCount())
  );
}

export function persistCloudSyncSnapshot(snapshot: CloudSyncSnapshot) {
  kv.set(CLOUD_SYNC_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

function normalizeCloudSyncEvent(
  value: Partial<CloudSyncEvent> | null | undefined,
): CloudSyncEvent | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const at =
    typeof value.at === 'number' && Number.isFinite(value.at) ? value.at : null;
  if (!at) {
    return null;
  }

  return {
    id:
      typeof value.id === 'string' && value.id.trim()
        ? value.id
        : `cloud-sync-${at}`,
    status:
      value.status === 'syncing' || value.status === 'success' || value.status === 'error'
        ? value.status
        : 'idle',
    reason:
      value.reason === 'manual' || value.reason === 'launch'
        ? value.reason
        : undefined,
    at,
    uploadedCount:
      typeof value.uploadedCount === 'number' ? value.uploadedCount : 0,
    pulledCount:
      typeof value.pulledCount === 'number' ? value.pulledCount : 0,
    skippedCount:
      typeof value.skippedCount === 'number' ? value.skippedCount : 0,
    conflictsResolvedCount:
      typeof value.conflictsResolvedCount === 'number'
        ? value.conflictsResolvedCount
        : 0,
    localWinsCount:
      typeof value.localWinsCount === 'number' ? value.localWinsCount : 0,
    remoteWinsCount:
      typeof value.remoteWinsCount === 'number' ? value.remoteWinsCount : 0,
    failedCount:
      typeof value.failedCount === 'number' ? value.failedCount : 0,
    pendingCount:
      typeof value.pendingCount === 'number' ? value.pendingCount : 0,
    errorMessage:
      typeof value.errorMessage === 'string' ? value.errorMessage : undefined,
  };
}

function persistCloudSyncEvents(events: CloudSyncEvent[]) {
  kv.set(CLOUD_SYNC_EVENTS_STORAGE_KEY, JSON.stringify(events));
  return events;
}

export function getCloudSyncEvents() {
  const raw = kv.getString(CLOUD_SYNC_EVENTS_STORAGE_KEY);
  if (!raw) {
    return [] as CloudSyncEvent[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<CloudSyncEvent>>;
    if (!Array.isArray(parsed)) {
      return [] as CloudSyncEvent[];
    }

    return parsed
      .map(normalizeCloudSyncEvent)
      .filter((item): item is CloudSyncEvent => Boolean(item))
      .sort((left, right) => right.at - left.at)
      .slice(0, MAX_CLOUD_SYNC_EVENTS);
  } catch {
    return [] as CloudSyncEvent[];
  }
}

export function appendCloudSyncEvent(snapshot: CloudSyncSnapshot) {
  if (snapshot.status !== 'success' && snapshot.status !== 'error') {
    return getCloudSyncEvents();
  }

  const at = snapshot.lastFinishedAt ?? snapshot.lastAttemptAt ?? Date.now();
  const nextEvent: CloudSyncEvent = {
    id: `cloud-sync-${at}`,
    status: snapshot.status,
    reason: snapshot.reason,
    at,
    uploadedCount: snapshot.uploadedCount,
    pulledCount: snapshot.pulledCount,
    skippedCount: snapshot.skippedCount,
    conflictsResolvedCount: snapshot.conflictsResolvedCount,
    localWinsCount: snapshot.localWinsCount,
    remoteWinsCount: snapshot.remoteWinsCount,
    failedCount: snapshot.failedCount,
    pendingCount: snapshot.pendingCount,
    errorMessage: snapshot.errorMessage,
  };

  return persistCloudSyncEvents(
    [nextEvent, ...getCloudSyncEvents()].slice(0, MAX_CLOUD_SYNC_EVENTS),
  );
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
