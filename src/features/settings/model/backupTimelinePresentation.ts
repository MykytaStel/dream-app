import { type AppLocale } from '../../../i18n/types';
import { type CloudSession } from '../../../services/auth/session';
import { type Dream } from '../../dreams/model/dream';
import {
  type DreamImportPreview,
  type LocalDreamExportFile,
} from '../services/dataImportService';
import { type CloudSyncSnapshot } from '../../../services/cloud/syncState';
import { type SavedReviewStateSnapshot } from '../../stats/services/reviewStateStorageService';
import {
  formatBackupTimestamp,
  type SettingsCopy,
} from './backupPresentationShared';

export type BackupTimelineItem = {
  key: 'sync' | 'snapshot' | 'device';
  title: string;
  meta: string;
  value: string;
};

function getDreamFreshnessTimestamp(dream: Dream) {
  return Math.max(
    dream.updatedAt ?? 0,
    dream.createdAt ?? 0,
    dream.transcriptUpdatedAt ?? 0,
    dream.lastSyncedAt ?? 0,
    dream.analysis?.generatedAt ?? 0,
  );
}

function hasPendingReviewState(snapshot: SavedReviewStateSnapshot) {
  const hasItems =
    snapshot.savedMonths.length > 0 || snapshot.savedThreads.length > 0;
  return snapshot.syncStatus !== 'synced' && (hasItems || snapshot.updatedAt > 0);
}

export function buildBackupTimelineItems(input: {
  copy: SettingsCopy;
  locale: AppLocale;
  snapshot: CloudSyncSnapshot;
  dreams: Dream[];
  session: CloudSession;
  latestBackupFile: LocalDreamExportFile | null;
  latestBackupPreview: DreamImportPreview | null;
  reviewState: SavedReviewStateSnapshot;
}): BackupTimelineItem[] {
  const {
    copy,
    locale,
    snapshot,
    dreams,
    session,
    latestBackupFile,
    latestBackupPreview,
    reviewState,
  } = input;
  const syncedDreamCount = dreams.filter(dream => dream.syncStatus === 'synced').length;
  const pendingDreamCount = dreams.filter(
    dream => (dream.syncStatus ?? 'local') === 'local' || dream.syncStatus === 'syncing',
  ).length;
  const pendingReviewStateCount = hasPendingReviewState(reviewState) ? 1 : 0;
  const errorDreamCount = dreams.filter(dream => dream.syncStatus === 'error').length;
  const freshestDreamTimestamp = dreams.reduce(
    (latest, dream) => Math.max(latest, getDreamFreshnessTimestamp(dream)),
    0,
  );

  const syncValue =
    typeof snapshot.lastSuccessAt === 'number'
      ? formatBackupTimestamp(new Date(snapshot.lastSuccessAt).toISOString(), locale)
      : copy.cloudLastSyncNever;
  const syncMetaParts = [
    snapshot.status === 'syncing'
      ? copy.cloudSyncStateSyncing
      : snapshot.status === 'error'
        ? copy.cloudSyncStateError
        : snapshot.status === 'success'
          ? copy.cloudSyncStateSuccess
          : copy.cloudSyncStateIdle,
    `${copy.cloudPendingLabel} ${snapshot.pendingCount}`,
    `${copy.cloudSyncedLabel} ${snapshot.uploadedCount}`,
    `${copy.cloudPulledLabel} ${snapshot.pulledCount}`,
  ];

  if (snapshot.failedCount) {
    syncMetaParts.push(`${copy.cloudErrorsLabel} ${snapshot.failedCount}`);
  }

  const snapshotValue = latestBackupPreview
    ? formatBackupTimestamp(latestBackupPreview.exportedAt, locale)
    : latestBackupFile
      ? formatBackupTimestamp(new Date(latestBackupFile.modifiedAt).toISOString(), locale)
      : copy.backupTimelineSnapshotMissing;
  const snapshotMeta = latestBackupPreview
    ? `${copy.restoreDreamCountLabel} ${latestBackupPreview.summary.dreamCount} • ${copy.restoreAppVersionLabel} ${latestBackupPreview.appVersion}`
    : latestBackupFile
      ? latestBackupFile.fileName
      : copy.backupTimelineSnapshotMissingMeta;

  let deviceValue = copy.backupTimelineDeviceLocalOnly;
  if (session.status === 'signed-in') {
    if (errorDreamCount > 0 || snapshot.status === 'error') {
      deviceValue = copy.backupTimelineDeviceNeedsAttention;
    } else if (pendingDreamCount > 0) {
      deviceValue =
        pendingDreamCount === 1
          ? copy.backupTimelineDeviceAheadSingle
          : copy.backupTimelineDeviceAheadPlural.replace('{count}', String(pendingDreamCount));
    } else if (pendingReviewStateCount > 0) {
      deviceValue = copy.backupTimelineDeviceReviewAhead;
    } else if (typeof snapshot.lastSuccessAt === 'number') {
      deviceValue = copy.backupTimelineDeviceCaughtUp;
    } else {
      deviceValue = copy.backupTimelineDeviceWaitingFirstSync;
    }
  }

  const freshnessAnchor =
    freshestDreamTimestamp > 0
      ? formatBackupTimestamp(new Date(freshestDreamTimestamp).toISOString(), locale)
      : copy.backupTimelineDeviceNoLocalChanges;
  const deviceMetaParts = [
    `${copy.cloudPendingLabel} ${pendingDreamCount}`,
    `${copy.cloudSyncedLabel} ${syncedDreamCount}`,
    `${copy.backupTimelineReviewSetsLabel} ${reviewState.savedMonths.length + reviewState.savedThreads.length}`,
  ];
  if (errorDreamCount) {
    deviceMetaParts.push(`${copy.cloudErrorsLabel} ${errorDreamCount}`);
  }
  if (pendingReviewStateCount) {
    deviceMetaParts.push(copy.backupTimelineReviewSetsPending);
  }
  deviceMetaParts.push(
    `${copy.backupTimelineDeviceFreshnessLabel} ${freshnessAnchor}`,
  );

  return [
    {
      key: 'sync',
      title: copy.backupTimelineSyncTitle,
      meta: syncMetaParts.join(' • '),
      value: syncValue,
    },
    {
      key: 'snapshot',
      title: copy.backupTimelineSnapshotTitle,
      meta: snapshotMeta,
      value: snapshotValue,
    },
    {
      key: 'device',
      title: copy.backupTimelineDeviceTitle,
      meta: deviceMetaParts.join(' • '),
      value: deviceValue,
    },
  ];
}
