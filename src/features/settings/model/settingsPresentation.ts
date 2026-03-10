import { type AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import {
  type DreamTranscriptionModelStatus,
  type DreamTranscriptionProgress,
} from '../../dreams/services/dreamTranscriptionService';
import { type DreamReminderSettings } from '../../reminders/services/dreamReminderService';
import { type DreamImportMode, type DreamImportPreview } from '../services/dataImportService';
import { type SettingsMetaItem } from '../components/SettingsMetaGrid';
import { CURRENT_STORAGE_SCHEMA_VERSION } from '../../../services/storage/keys';
import { DREAM_EXPORT_VERSION } from '../services/dataExportService';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

export function getSettingsFooterMeta(copy: SettingsCopy) {
  return `${copy.footerStorageMetaPrefix} ${CURRENT_STORAGE_SCHEMA_VERSION} • ${copy.footerExportMetaPrefix} v${DREAM_EXPORT_VERSION}`;
}

export function getPickerLocale(locale: AppLocale) {
  return locale === 'uk' ? 'uk-UA' : 'en-US';
}

export function getReminderDate(settings: DreamReminderSettings) {
  const date = new Date();
  date.setHours(settings.hour, settings.minute, 0, 0);
  return date;
}

export function formatReminderTime(settings: DreamReminderSettings, locale: AppLocale) {
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

export function formatBackupListTitle(value: number, locale: AppLocale, copy: SettingsCopy) {
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

export function buildPrivacyHighlights(copy: SettingsCopy): SettingsMetaItem[] {
  return [
    {
      label: copy.privacyStorageLabel,
      value: copy.privacyStorageValue,
      icon: 'phone-portrait-outline',
    },
    {
      label: copy.privacySyncLabel,
      value: copy.privacySyncValue,
      icon: 'cloud-offline-outline',
    },
    {
      label: copy.privacyAccountLabel,
      value: copy.privacyAccountValue,
      icon: 'person-outline',
    },
    {
      label: copy.privacyReminderLabel,
      value: copy.privacyReminderValue,
      icon: 'notifications-outline',
    },
    {
      label: copy.privacyTranscriptionLabel,
      value: copy.privacyTranscriptionValue,
      icon: 'mic-outline',
      wide: true,
    },
  ];
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
      value:
        settings.allowNetwork
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
      value:
        status?.installed
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
): SettingsMetaItem[] {
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
      value: preview.locale.toUpperCase(),
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
