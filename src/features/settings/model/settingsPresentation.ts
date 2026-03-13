import { type AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { type CloudSession } from '../../../services/auth/session';
import { type Dream } from '../../dreams/model/dream';
import {
  type DreamTranscriptionModelStatus,
  type DreamTranscriptionProgress,
} from '../../dreams/services/dreamTranscriptionService';
import { type DreamReminderSettings } from '../../reminders/services/dreamReminderService';
import {
  type DreamImportMode,
  type DreamImportPreview,
  type LocalDreamExportFile,
} from '../services/dataImportService';
import { type SettingsMetaItem } from '../components/SettingsMetaGrid';
import { CURRENT_STORAGE_SCHEMA_VERSION } from '../../../services/storage/keys';
import { DREAM_EXPORT_VERSION } from '../services/dataExportService';
import { type CloudSyncSnapshot } from '../../../services/cloud/sync';
import { type SavedReviewStateSnapshot } from '../../stats/services/reviewStateStorageService';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

export type BackupTimelineItem = {
  key: 'sync' | 'snapshot' | 'device';
  title: string;
  meta: string;
  value: string;
};

export type BackupContentTrustItem = {
  key: 'audio' | 'transcript' | 'review';
  title: string;
  meta: string;
  value: string;
};

function fillTemplate(
  template: string,
  replacements: Record<string, string | number>,
) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

export function getSettingsFooterMeta(copy: SettingsCopy) {
  return `${copy.footerStorageMetaPrefix} ${CURRENT_STORAGE_SCHEMA_VERSION} • ${copy.footerExportMetaPrefix} v${DREAM_EXPORT_VERSION}`;
}

export function getPickerLocale(locale: AppLocale) {
  return locale === 'uk' ? 'uk-UA' : 'en-US';
}

export function formatLocaleDisplayName(value: AppLocale, locale: AppLocale) {
  if (locale === 'uk') {
    return value === 'uk' ? 'Українська' : 'Англійська';
  }

  return value === 'uk' ? 'Ukrainian' : 'English';
}

export function getReminderDate(settings: DreamReminderSettings) {
  const date = new Date();
  date.setHours(settings.hour, settings.minute, 0, 0);
  return date;
}

export function formatReminderTime(
  settings: DreamReminderSettings,
  locale: AppLocale,
) {
  return getReminderDate(settings).toLocaleTimeString(getPickerLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatModelSize(sizeBytes: number | null) {
  if (typeof sizeBytes !== 'number' || Number.isNaN(sizeBytes)) {
    return 'Unknown';
  }

  const sizeMiB = sizeBytes / (1024 * 1024);
  return `${sizeMiB.toFixed(sizeMiB >= 100 ? 0 : 1)} MiB`;
}

export function formatModelFileName(filePath?: string | null) {
  if (!filePath?.trim()) {
    return null;
  }

  return filePath.split('/').filter(Boolean).pop() ?? filePath;
}

export function formatDownloadProgress(
  progress: DreamTranscriptionProgress | null,
  copy: SettingsCopy,
) {
  if (!progress) {
    return null;
  }

  const base =
    progress.phase === 'preparing-model'
      ? copy.transcriptionDownloadButtonBusy
      : copy.transcriptionStatusInstalled;

  if (typeof progress.progress !== 'number') {
    return base;
  }

  return `${base} ${progress.progress}%`;
}

export function formatBackupTimestamp(value: string, locale: AppLocale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(getPickerLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBackupListTitle(
  value: number,
  locale: AppLocale,
  copy: SettingsCopy,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return copy.restoreTitle;
  }

  return date.toLocaleString(getPickerLocale(locale), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBackupListMeta(fileName: string) {
  return fileName.replace(/\.json$/i, '');
}

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
    parts.push(
      `${copy.cloudConflictsLabel} ${snapshot.conflictsResolvedCount}`,
    );
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

function getDreamFreshnessTimestamp(dream: Dream) {
  return Math.max(
    dream.updatedAt ?? 0,
    dream.createdAt ?? 0,
    dream.transcriptUpdatedAt ?? 0,
    dream.lastSyncedAt ?? 0,
    dream.analysis?.generatedAt ?? 0,
  );
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
  const pendingReviewStateCount = reviewState.syncStatus !== 'synced' ? 1 : 0;
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

export function buildBackupContentTrustItems(input: {
  copy: SettingsCopy;
  dreams: Dream[];
  session: CloudSession;
  reviewState: SavedReviewStateSnapshot;
}): BackupContentTrustItem[] {
  const { copy, dreams, session, reviewState } = input;
  const signedIn = session.status === 'signed-in';
  const audioDreams = dreams.filter(dream => Boolean(dream.audioUri?.trim()));
  const uploadedAudioCount = audioDreams.filter(dream =>
    Boolean(dream.audioRemotePath?.trim()),
  ).length;
  const audioStillLocalCount = signedIn
    ? audioDreams.filter(dream => !dream.audioRemotePath?.trim()).length
    : audioDreams.length;

  const transcriptDreams = dreams.filter(dream => Boolean(dream.transcript?.trim()));
  const editedTranscriptCount = transcriptDreams.filter(
    dream => dream.transcriptSource === 'edited',
  ).length;
  const transcriptStillLocalCount = signedIn
    ? transcriptDreams.filter(dream => {
        const transcriptTimestamp =
          dream.transcriptUpdatedAt ?? dream.updatedAt ?? dream.createdAt;
        return (
          dream.syncStatus !== 'synced' ||
          transcriptTimestamp > (dream.lastSyncedAt ?? 0)
        );
      }).length
    : transcriptDreams.length;

  const audioValue =
    audioDreams.length === 0
      ? copy.backupContentTrustAudioEmpty
      : !signedIn
      ? copy.backupContentTrustLocalOnly
      : audioStillLocalCount === 0
      ? copy.backupContentTrustAudioAllBackedUp
      : audioStillLocalCount === 1
      ? copy.backupContentTrustAudioStillLocalSingle
      : fillTemplate(copy.backupContentTrustAudioStillLocalPlural, {
          count: audioStillLocalCount,
        });
  const audioMeta =
    audioDreams.length === 0
      ? copy.backupContentTrustAudioEmptyMeta
      : fillTemplate(copy.backupContentTrustAudioMeta, {
          total: audioDreams.length,
          synced: uploadedAudioCount,
        });

  const transcriptValue =
    transcriptDreams.length === 0
      ? copy.backupContentTrustTranscriptEmpty
      : !signedIn
      ? copy.backupContentTrustLocalOnly
      : transcriptStillLocalCount === 0
      ? copy.backupContentTrustTranscriptCaughtUp
      : transcriptStillLocalCount === 1
      ? copy.backupContentTrustTranscriptStillLocalSingle
      : fillTemplate(copy.backupContentTrustTranscriptStillLocalPlural, {
          count: transcriptStillLocalCount,
        });
  const transcriptMeta =
    transcriptDreams.length === 0
      ? copy.backupContentTrustTranscriptEmptyMeta
      : fillTemplate(copy.backupContentTrustTranscriptMeta, {
          total: transcriptDreams.length,
        edited: editedTranscriptCount,
      });

  const totalReviewSetCount =
    reviewState.savedMonths.length + reviewState.savedThreads.length;
  const reviewValue =
    totalReviewSetCount === 0
      ? copy.backupContentTrustReviewEmpty
      : !signedIn
      ? copy.backupContentTrustLocalOnly
      : reviewState.syncStatus === 'synced'
      ? copy.backupContentTrustReviewCaughtUp
      : copy.backupContentTrustReviewStillLocal;
  const reviewMeta =
    totalReviewSetCount === 0
      ? copy.backupContentTrustReviewEmptyMeta
      : fillTemplate(copy.backupContentTrustReviewMeta, {
          total: totalReviewSetCount,
          months: reviewState.savedMonths.length,
          threads: reviewState.savedThreads.length,
        });

  return [
    {
      key: 'audio',
      title: copy.backupContentTrustAudioTitle,
      meta: audioMeta,
      value: audioValue,
    },
    {
      key: 'transcript',
      title: copy.backupContentTrustTranscriptTitle,
      meta: transcriptMeta,
      value: transcriptValue,
    },
    {
      key: 'review',
      title: copy.backupContentTrustReviewTitle,
      meta: reviewMeta,
      value: reviewValue,
    },
  ];
}

export function buildPrivacyHighlights(copy: SettingsCopy): SettingsMetaItem[] {
  return [
    {
      label: copy.privacyStorageLabel,
      value: copy.privacyStorageValue,
      icon: 'phone-portrait-outline',
    },
    {
      label: copy.privacyReminderLabel,
      value: copy.privacyReminderValue,
      icon: 'notifications-outline',
    },
  ];
}

export function buildCloudHighlights(
  copy: SettingsCopy,
  session: CloudSession,
  syncEnabled: boolean,
  dreams: Dream[],
  cloudConfigured: boolean,
  showDeveloperConfig = false,
): SettingsMetaItem[] {
  const summary = dreams.reduce(
    (acc, dream) => {
      switch (dream.syncStatus ?? 'local') {
        case 'synced':
          acc.synced += 1;
          break;
        case 'error':
          acc.errors += 1;
          break;
        case 'syncing':
        case 'local':
        default:
          acc.pending += 1;
          break;
      }

      return acc;
    },
    { pending: 0, synced: 0, errors: 0 },
  );

  return [
    ...(showDeveloperConfig
      ? [
          {
            label: copy.cloudConfigLabel,
            value: cloudConfigured
              ? copy.cloudConfigReady
              : copy.cloudConfigMissing,
            icon: 'server-outline',
          } satisfies SettingsMetaItem,
        ]
      : []),
    {
      label: copy.cloudSessionLabel,
      value:
        session.status === 'signed-in'
          ? copy.cloudSessionSignedIn
          : copy.cloudSessionSignedOut,
      icon: 'cloud-outline',
    },
    {
      label: copy.cloudAccountLabel,
      value:
        session.status === 'signed-in'
          ? session.isAnonymous
            ? copy.cloudAccountAnonymous
            : session.email || session.userId
          : copy.cloudAccountDisconnected,
      icon: 'person-circle-outline',
      wide: true,
    },
    ...(session.status === 'signed-in'
      ? [
          {
            label: copy.cloudSyncToggleLabel,
            value: syncEnabled ? copy.cloudSyncEnabled : copy.cloudSyncDisabled,
            icon: 'sync-outline',
          } satisfies SettingsMetaItem,
        ]
      : []),
    {
      label: copy.cloudPendingLabel,
      value: String(summary.pending),
      icon: 'cloud-upload-outline',
    },
    {
      label: copy.cloudSyncedLabel,
      value: String(summary.synced),
      icon: 'checkmark-done-outline',
    },
    {
      label: copy.cloudErrorsLabel,
      value: String(summary.errors),
      icon: 'alert-circle-outline',
    },
  ];
}

export function getCloudSummaryState(
  copy: SettingsCopy,
  session: CloudSession,
  syncEnabled: boolean,
) {
  return {
    statusValue:
      session.status === 'signed-in'
        ? copy.cloudSessionSignedIn
        : copy.cloudSessionSignedOut,
    accountValue:
      session.status === 'signed-in'
        ? session.isAnonymous
          ? copy.cloudAccountAnonymous
          : session.email || session.userId
        : copy.cloudAccountDisconnected,
    syncValue:
      session.status === 'signed-in'
        ? syncEnabled
          ? copy.cloudSyncEnabled
          : copy.cloudSyncDisabled
        : null,
  };
}

export function buildAnalysisHighlights(
  copy: SettingsCopy,
  settings: DreamAnalysisSettings,
): SettingsMetaItem[] {
  return [
    {
      label: copy.analysisProviderLabel,
      value:
        settings.provider === 'openai'
          ? copy.analysisProviderOpenAi
          : copy.analysisProviderManual,
    },
    {
      label: copy.analysisNetworkLabel,
      value: settings.allowNetwork
        ? copy.analysisNetworkAllowed
        : copy.analysisNetworkBlocked,
    },
  ];
}

export function buildTranscriptionHighlights(
  copy: SettingsCopy,
  status: DreamTranscriptionModelStatus | null,
): SettingsMetaItem[] {
  return [
    {
      label: copy.transcriptionStatusLabel,
      value: status?.installed
        ? copy.transcriptionStatusInstalled
        : copy.transcriptionStatusMissing,
    },
    {
      label: copy.transcriptionSizeLabel,
      value: formatModelSize(status?.sizeBytes ?? null),
    },
    ...(status?.installed && status.filePath
      ? [
          {
            label: copy.transcriptionPathLabel,
            value: formatModelFileName(status.filePath) ?? '...',
            wide: true,
          } satisfies SettingsMetaItem,
        ]
      : []),
  ];
}

export function buildExportHighlights(copy: SettingsCopy): SettingsMetaItem[] {
  return [
    {
      label: copy.exportIncludesLabel,
      value: copy.exportIncludesValue,
      wide: true,
    },
    {
      label: copy.exportFormatLabel,
      value: copy.exportFormatValue,
    },
  ];
}

export function buildRestorePreviewItems(
  copy: SettingsCopy,
  preview: DreamImportPreview,
  locale: AppLocale,
  options: { compact?: boolean } = {},
): SettingsMetaItem[] {
  if (options.compact) {
    return [
      {
        label: copy.restoreDreamCountLabel,
        value: String(preview.summary.dreamCount),
      },
      {
        label: copy.restoreNewCountLabel,
        value: String(preview.diff.newDreamCount),
      },
      {
        label: copy.restoreResultCountLabel,
        value: String(preview.diff.resultingDreamCount),
      },
      {
        label: copy.restoreDraftLabel,
        value: preview.summary.draftIncluded
          ? copy.restoreDraftPresent
          : copy.restoreDraftMissing,
      },
      {
        label: copy.restoreSettingsLabel,
        value:
          preview.settingsAction === 'replace'
            ? copy.restoreSettingsReplace
            : copy.restoreSettingsKeepCurrent,
        wide: true,
      },
      {
        label: copy.restoreExportedAtLabel,
        value: formatBackupTimestamp(preview.exportedAt, locale),
        wide: true,
      },
    ];
  }

  return [
    {
      label: copy.restoreCurrentCountLabel,
      value: String(preview.diff.currentDreamCount),
    },
    {
      label: copy.restoreIncomingCountLabel,
      value: String(preview.diff.importDreamCount),
    },
    {
      label: copy.restoreNewCountLabel,
      value: String(preview.diff.newDreamCount),
    },
    {
      label: copy.restoreResultCountLabel,
      value: String(preview.diff.resultingDreamCount),
    },
    {
      label: copy.restoreOverlapCountLabel,
      value: String(preview.diff.overlappingDreamCount),
    },
    {
      label: copy.restoreDreamCountLabel,
      value: String(preview.summary.dreamCount),
    },
    {
      label: copy.restoreSettingsLabel,
      value:
        preview.settingsAction === 'replace'
          ? copy.restoreSettingsReplace
          : copy.restoreSettingsKeepCurrent,
      wide: true,
    },
    {
      label: copy.restoreDraftActionLabel,
      value:
        preview.draftAction === 'replace'
          ? copy.restoreDraftActionReplace
          : copy.restoreDraftActionImportIfEmpty,
      wide: true,
    },
    {
      label: copy.restoreDraftLabel,
      value: preview.summary.draftIncluded
        ? copy.restoreDraftPresent
        : copy.restoreDraftMissing,
    },
    {
      label: copy.restoreLocaleLabel,
      value: formatLocaleDisplayName(preview.locale, locale),
    },
    {
      label: copy.restoreVersionLabel,
      value: `v${preview.version}`,
    },
    {
      label: copy.restoreAppVersionLabel,
      value: preview.appVersion,
    },
    {
      label: copy.restoreExportedAtLabel,
      value: formatBackupTimestamp(preview.exportedAt, locale),
      wide: true,
    },
    {
      label: copy.restoreFileLabel,
      value: preview.fileName,
      wide: true,
    },
  ];
}

export function buildRestoreSuccessItems(
  copy: SettingsCopy,
  preview: DreamImportPreview,
): SettingsMetaItem[] {
  return [
    {
      label: copy.restoreSuccessModeLabel,
      value:
        preview.mode === 'merge'
          ? copy.restoreModeMerge
          : copy.restoreModeReplace,
    },
    {
      label: copy.restoreSuccessCountLabel,
      value: String(preview.diff.resultingDreamCount),
    },
    {
      label: copy.restoreFileLabel,
      value: preview.fileName,
      wide: true,
    },
  ];
}

export function getRestoreConfirmContent(
  copy: SettingsCopy,
  mode: DreamImportMode,
) {
  const isMerge = mode === 'merge';

  return {
    isMerge,
    title: isMerge ? copy.restoreMergeConfirmTitle : copy.restoreConfirmTitle,
    description: isMerge
      ? copy.restoreMergeConfirmDescription
      : copy.restoreConfirmDescription,
    confirmLabel: isMerge ? copy.restoreModeMerge : copy.restoreModeReplace,
  };
}
