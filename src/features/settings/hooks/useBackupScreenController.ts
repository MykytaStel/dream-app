import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { type AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';
import {
  exportDreamArchivePdf,
  exportDreamDataSnapshot,
} from '../services/dataExportService';
import {
  listLocalDreamExportArtifacts,
  listLocalDreamExportFiles,
  loadDreamImportPreview,
  restoreDreamImportFromFile,
  type DreamImportMode,
  type DreamImportPreview,
  type LocalDreamExportArtifact,
  type LocalDreamExportFile,
} from '../services/dataImportService';
import {
  buildRestorePreviewItems,
  buildRestoreSuccessItems,
  formatBackupListMeta,
  formatBackupListTitle,
  formatBackupTimestamp,
  getRestoreConfirmContent,
} from '../model/settingsPresentation';
import {
  openLocalBackupFile,
  shareLocalBackupFile,
} from '../services/backupFileActions';
import { useCloudBackupController } from './useCloudBackupController';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

type UseBackupScreenControllerArgs = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  copy: SettingsCopy;
};

export function useBackupScreenController({
  locale,
  setLocale,
  copy,
}: UseBackupScreenControllerArgs) {
  const [exportingFormat, setExportingFormat] =
    React.useState<'json' | 'pdf' | null>(null);
  const [lastExportArtifact, setLastExportArtifact] =
    React.useState<LocalDreamExportArtifact | null>(
      null,
    );
  const [localExportFiles, setLocalExportFiles] = React.useState<
    LocalDreamExportFile[]
  >([]);
  const [isLoadingLocalExports, setIsLoadingLocalExports] =
    React.useState(false);
  const [selectedImportPreview, setSelectedImportPreview] =
    React.useState<DreamImportPreview | null>(null);
  const [selectedImportPath, setSelectedImportPath] = React.useState<
    string | null
  >(null);
  const [importMode, setImportMode] =
    React.useState<DreamImportMode>('replace');
  const [showRestorePreview, setShowRestorePreview] = React.useState(false);
  const [importPreviewError, setImportPreviewError] = React.useState<
    string | null
  >(null);
  const [isLoadingImportPreview, setIsLoadingImportPreview] =
    React.useState(false);
  const [isRestoringImport, setIsRestoringImport] = React.useState(false);
  const [lastRestorePreview, setLastRestorePreview] =
    React.useState<DreamImportPreview | null>(null);
  const cloudBackup = useCloudBackupController({
    locale,
    copy,
    mode: 'full',
  });
  const restorePreviewMeta = React.useMemo(
    () =>
      selectedImportPreview
        ? `${copy.restoreResultCountLabel} ${
            selectedImportPreview.diff.resultingDreamCount
          } • ${formatBackupTimestamp(
            selectedImportPreview.exportedAt,
            locale,
          )}`
        : null,
    [copy, locale, selectedImportPreview],
  );
  const restorePreviewItems = React.useMemo(
    () =>
      selectedImportPreview
        ? buildRestorePreviewItems(copy, selectedImportPreview, locale)
        : [],
    [copy, locale, selectedImportPreview],
  );
  const restoreSuccessItems = React.useMemo(
    () =>
      lastRestorePreview
        ? buildRestoreSuccessItems(copy, lastRestorePreview)
        : [],
    [copy, lastRestorePreview],
  );
  const lastExportFormat = lastExportArtifact?.format ?? null;
  const lastExportName = lastExportArtifact?.fileName ?? null;
  const lastExportSummaryTitle = React.useMemo(
    () =>
      lastExportFormat === 'pdf'
        ? copy.exportPdfReadyTitle
        : lastExportFormat === 'json'
          ? copy.exportBackupReadyTitle
          : null,
    [
      copy.exportBackupReadyTitle,
      copy.exportPdfReadyTitle,
      lastExportFormat,
    ],
  );
  const lastExportSummaryDescription = React.useMemo(
    () =>
      lastExportFormat === 'pdf'
        ? copy.exportPdfReadyDescription
        : lastExportFormat === 'json'
          ? copy.exportBackupReadyDescription
          : null,
    [
      copy.exportBackupReadyDescription,
      copy.exportPdfReadyDescription,
      lastExportFormat,
    ],
  );
  const shareLastExportTitle = React.useMemo(
    () =>
      lastExportFormat === 'pdf'
        ? copy.exportSharePdfButton
        : copy.exportShareBackupButton,
    [copy.exportShareBackupButton, copy.exportSharePdfButton, lastExportFormat],
  );
  const canOpenLastPdf =
    lastExportArtifact?.format === 'pdf' && Boolean(lastExportArtifact.filePath);

  const refreshLocalExports = React.useCallback(async () => {
    setIsLoadingLocalExports(true);

    try {
      const [files, artifacts] = await Promise.all([
        listLocalDreamExportFiles(),
        listLocalDreamExportArtifacts(),
      ]);
      setLocalExportFiles(files);
      setLastExportArtifact(artifacts[0] ?? null);

      setSelectedImportPath(currentPath => {
        if (!currentPath) {
          return files[0]?.filePath ?? null;
        }

        return files.some(file => file.filePath === currentPath)
          ? currentPath
          : files[0]?.filePath ?? null;
      });
    } finally {
      setIsLoadingLocalExports(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshLocalExports().catch(() => undefined);
    }, [refreshLocalExports]),
  );

  React.useEffect(() => {
    if (!selectedImportPath) {
      setSelectedImportPreview(null);
      setImportPreviewError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingImportPreview(true);
    setImportPreviewError(null);

    loadDreamImportPreview(selectedImportPath, importMode)
      .then(preview => {
        if (!cancelled) {
          setSelectedImportPreview(preview);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setSelectedImportPreview(null);
          setImportPreviewError(
            error instanceof Error ? error.message : String(error),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingImportPreview(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [importMode, selectedImportPath]);

  React.useEffect(() => {
    setShowRestorePreview(false);
  }, [importMode, selectedImportPath]);

  const onExportData = React.useCallback(async () => {
    setExportingFormat('json');

    try {
      const result = await exportDreamDataSnapshot();
      setLastExportArtifact({
        fileName: result.filePath.split('/').filter(Boolean).pop() ?? result.filePath,
        filePath: result.filePath,
        modifiedAt: Date.now(),
        format: 'json' as const,
      });
      setSelectedImportPath(result.filePath);
      await Promise.all([
        refreshLocalExports(),
        cloudBackup.refreshLatestLocalBackupPreview(),
      ]);
    } catch (error) {
      Alert.alert(
        copy.exportErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setExportingFormat(null);
    }
  }, [cloudBackup, copy, refreshLocalExports]);

  const onExportPdfData = React.useCallback(async () => {
    setExportingFormat('pdf');

    try {
      const result = await exportDreamArchivePdf();
      setLastExportArtifact({
        fileName: result.filePath.split('/').filter(Boolean).pop() ?? result.filePath,
        filePath: result.filePath,
        modifiedAt: Date.now(),
        format: 'pdf' as const,
      });
      await refreshLocalExports();
    } catch (error) {
      Alert.alert(
        copy.exportPdfErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setExportingFormat(null);
    }
  }, [copy, refreshLocalExports]);

  const onShareLastExport = React.useCallback(async () => {
    if (!lastExportArtifact) {
      return;
    }

    await shareLocalBackupFile(
      lastExportArtifact.filePath,
      lastExportArtifact.format === 'pdf'
        ? 'application/pdf'
        : 'application/json',
      lastExportArtifact.fileName,
    );
  }, [lastExportArtifact]);

  const onOpenLastPdf = React.useCallback(async () => {
    if (!lastExportArtifact || lastExportArtifact.format !== 'pdf') {
      return;
    }

    try {
      await openLocalBackupFile(
        lastExportArtifact.filePath,
        'application/pdf',
      );
    } catch {
      Alert.alert(
        copy.exportPdfOpenErrorTitle,
        copy.exportPdfOpenErrorDescription,
      );
    }
  }, [
    copy.exportPdfOpenErrorDescription,
    copy.exportPdfOpenErrorTitle,
    lastExportArtifact,
  ]);

  const onSelectImportFile = React.useCallback((filePath: string) => {
    setLastRestorePreview(null);
    setSelectedImportPath(filePath);
  }, []);

  const onRestoreImport = React.useCallback(() => {
    if (!selectedImportPath) {
      return;
    }

    const confirm = getRestoreConfirmContent(copy, importMode);
    Alert.alert(confirm.title, confirm.description, [
      {
        text: copy.actionCancel,
        style: 'cancel',
      },
      {
        text: confirm.confirmLabel,
        style: 'destructive',
        onPress: () => {
          setIsRestoringImport(true);

          restoreDreamImportFromFile(selectedImportPath, importMode)
            .then(async preview => {
              setSelectedImportPreview(preview);
              setLastRestorePreview(preview);
              if (preview.mode === 'replace') {
                setLocale(preview.locale);
              }
              await Promise.all([
                refreshLocalExports(),
                cloudBackup.refreshCloudState(),
              ]);
              Alert.alert(
                copy.restoreSuccessTitle,
                `${copy.restoreSuccessDescription}\n${preview.fileName}`,
              );
            })
            .catch(error => {
              Alert.alert(
                copy.restoreErrorTitle,
                error instanceof Error ? error.message : String(error),
              );
            })
            .finally(() => {
              setIsRestoringImport(false);
            });
        },
      },
    ]);
  }, [
    cloudBackup,
    copy,
    importMode,
    refreshLocalExports,
    selectedImportPath,
    setLocale,
  ]);

  return {
    ...cloudBackup,
    isExportingJson: exportingFormat === 'json',
    isExportingPdf: exportingFormat === 'pdf',
    lastExportName,
    lastExportSummaryTitle,
    lastExportSummaryDescription,
    canOpenLastPdf,
    canShareLastExport: Boolean(lastExportArtifact),
    openLastPdfTitle: copy.exportOpenPdfButton,
    shareLastExportTitle,
    onExportData,
    onExportPdfData,
    onOpenLastPdf,
    onShareLastExport,
    localExportFiles,
    isLoadingLocalExports,
    selectedImportPreview,
    selectedImportPath,
    importMode,
    setImportMode,
    showRestorePreview,
    setShowRestorePreview,
    importPreviewError,
    isLoadingImportPreview,
    isRestoringImport,
    lastRestorePreview,
    onSelectImportFile,
    onRestoreImport,
    restorePreviewMeta,
    restorePreviewItems,
    restoreSuccessItems,
    formatBackupListTitle: (value: number) =>
      formatBackupListTitle(value, locale, copy),
    formatBackupListMeta,
  };
}
