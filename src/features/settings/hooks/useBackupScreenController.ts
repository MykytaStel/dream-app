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
  listLocalDreamExportFiles,
  loadDreamImportPreview,
  restoreDreamImportFromFile,
  type DreamImportMode,
  type DreamImportPreview,
  type LocalDreamExportFile,
} from '../services/dataImportService';
import {
  buildExportHighlights,
  buildRestorePreviewItems,
  buildRestoreSuccessItems,
  formatBackupListMeta,
  formatBackupListTitle,
  formatBackupTimestamp,
  getRestoreConfirmContent,
} from '../model/settingsPresentation';
import { useCloudBackupController } from './useCloudBackupController';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type ExportFormat = 'json' | 'pdf';

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
    React.useState<ExportFormat | null>(null);
  const [lastExportPath, setLastExportPath] = React.useState<string | null>(
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

  const exportHighlights = React.useMemo(
    () => buildExportHighlights(copy),
    [copy],
  );
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

  const refreshLocalExports = React.useCallback(async () => {
    setIsLoadingLocalExports(true);

    try {
      const files = await listLocalDreamExportFiles();
      setLocalExportFiles(files);

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
      setLastExportPath(result.filePath);
      setSelectedImportPath(result.filePath);
      await Promise.all([
        refreshLocalExports(),
        cloudBackup.refreshLatestLocalBackupPreview(),
      ]);
      Alert.alert(
        copy.exportSuccessTitle,
        `${copy.exportSuccessDescription}\n${result.filePath}`,
      );
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
      setLastExportPath(result.filePath);
      await refreshLocalExports();
      Alert.alert(
        copy.exportPdfSuccessTitle,
        `${copy.exportPdfSuccessDescription}\n${result.filePath}`,
      );
    } catch (error) {
      Alert.alert(
        copy.exportPdfErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setExportingFormat(null);
    }
  }, [copy, refreshLocalExports]);

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
                `${copy.restoreSuccessDescription}\n${selectedImportPath}`,
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
    exportHighlights,
    isExportingJson: exportingFormat === 'json',
    isExportingPdf: exportingFormat === 'pdf',
    lastExportPath,
    onExportData,
    onExportPdfData,
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
