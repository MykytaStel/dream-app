import { type AppLocale } from '../../../i18n/types';
import {
  type CloudSyncEvent,
  type CloudSyncSnapshot,
} from '../../../services/cloud/syncState';
import {
  formatBackupTimestamp,
  type SettingsCopy,
} from './backupPresentationShared';

export type CloudSyncEventItem = {
  key: string;
  title: string;
  meta: string;
  value: string;
};

export function formatCloudSyncMeta(
  copy: SettingsCopy,
  snapshot: CloudSyncSnapshot,
  locale: AppLocale,
  showDiagnostics = false,
) {
  const stateLabel =
    snapshot.status === 'syncing'
      ? copy.cloudSyncStateSyncing
      : snapshot.status === 'success'
      ? copy.cloudSyncStateSuccess
      : snapshot.status === 'error'
      ? copy.cloudSyncStateError
      : copy.cloudSyncStateIdle;

  const parts = [
    stateLabel,
    `${copy.cloudPendingLabel} ${snapshot.pendingCount}`,
    `${copy.cloudSyncedLabel} ${snapshot.uploadedCount}`,
    `${copy.cloudPulledLabel} ${snapshot.pulledCount}`,
  ];

  if (showDiagnostics && snapshot.skippedCount) {
    parts.push(`${copy.cloudSkippedLabel} ${snapshot.skippedCount}`);
  }

  if (showDiagnostics && snapshot.conflictsResolvedCount) {
    parts.push(`${copy.cloudConflictsLabel} ${snapshot.conflictsResolvedCount}`);
  }

  if (showDiagnostics && snapshot.localWinsCount) {
    parts.push(`${copy.cloudLocalWinsLabel} ${snapshot.localWinsCount}`);
  }

  if (showDiagnostics && snapshot.remoteWinsCount) {
    parts.push(`${copy.cloudRemoteWinsLabel} ${snapshot.remoteWinsCount}`);
  }

  if (snapshot.failedCount) {
    parts.push(`${copy.cloudErrorsLabel} ${snapshot.failedCount}`);
  }

  const timestamp =
    typeof snapshot.lastFinishedAt === 'number'
      ? formatBackupTimestamp(
          new Date(snapshot.lastFinishedAt).toISOString(),
          locale,
        )
      : copy.cloudLastSyncNever;

  return {
    title: timestamp,
    meta: parts.join(' • '),
  };
}

export function buildCloudSyncEventItems(
  copy: SettingsCopy,
  events: CloudSyncEvent[],
  locale: AppLocale,
): CloudSyncEventItem[] {
  return events.map(event => {
    const reasonLabel =
      event.reason === 'launch'
        ? copy.devSyncReasonLaunch
        : copy.devSyncReasonManual;
    const metaParts = [
      reasonLabel,
      `${copy.cloudPendingLabel} ${event.pendingCount}`,
      `${copy.cloudSyncedLabel} ${event.uploadedCount}`,
      `${copy.cloudPulledLabel} ${event.pulledCount}`,
    ];

    if (event.skippedCount) {
      metaParts.push(`${copy.cloudSkippedLabel} ${event.skippedCount}`);
    }

    if (event.conflictsResolvedCount) {
      metaParts.push(`${copy.cloudConflictsLabel} ${event.conflictsResolvedCount}`);
    }

    if (event.failedCount) {
      metaParts.push(`${copy.cloudErrorsLabel} ${event.failedCount}`);
    }

    if (event.errorMessage) {
      metaParts.push(
        event.errorMessage === 'audio-file-too-large'
          ? copy.cloudSyncAudioTooLarge
          : event.errorMessage,
      );
    }

    return {
      key: event.id,
      title: formatBackupTimestamp(new Date(event.at).toISOString(), locale),
      meta: metaParts.join(' • '),
      value:
        event.status === 'syncing'
          ? copy.cloudSyncStateSyncing
          : event.status === 'success'
            ? copy.cloudSyncStateSuccess
            : event.status === 'error'
              ? copy.cloudSyncStateError
              : copy.cloudSyncStateIdle,
    };
  });
}
