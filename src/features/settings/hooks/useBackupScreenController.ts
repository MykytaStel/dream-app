import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { type AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';
import {
  exportDreamArchivePdf,
  exportDreamReadableArchive,
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
import {
  trackBackupExportCompleted,
  trackBackupExportStarted,
  trackRestoreCompleted,
  trackRestoreStarted,
} from '../../../services/observability/events';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

type UseBackupScreenControllerArgs = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  copy: SettingsCopy;
};

function getReadableExportMimeType(format: 'markdown' | 'text') {
  return format === 'markdown' ? 'text/markdown' : 'text/plain';
}

export function useBackupScreenController({
  locale,
  setLocale,
  copy,
}: UseBackupScreenControllerArgs) {
  const [exportingFormat, setExportingFormat] =
    React.useState<'json' | 'pdf' | 'markdown' | 'text' | null>(null);
  const [lastJsonExportArtifact, setLastJsonExportArtifact] =
    React.useState<LocalDreamExportArtifact | null>(
      null,
    );
  const [lastMarkdownExportArtifact, setLastMarkdownExportArtifact] =
    React.useState<LocalDreamExportArtifact | null>(
      null,
    );
  const [lastTextExportArtifact, setLastTextExportArtifact] =
    React.useState<LocalDreamExportArtifact | null>(
      null,
    );
  const [lastPdfExportArtifact, setLastPdfExportArtifact] =
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
  const lastBackupName = lastJsonExportArtifact?.fileName ?? null;
  const lastMarkdownName = lastMarkdownExportArtifact?.fileName ?? null;
  const lastTextName = lastTextExportArtifact?.fileName ?? null;
  const lastPdfName = lastPdfExportArtifact?.fileName ?? null;

  const refreshLocalExports = React.useCallback(async () => {
    setIsLoadingLocalExports(true);

    try {
      const [files, artifacts] = await Promise.all([
        listLocalDreamExportFiles(),
        listLocalDreamExportArtifacts(),
      ]);
      setLocalExportFiles(files);
      setLastJsonExportArtifact(
        artifacts.find(artifact => artifact.format === 'json') ?? null,
      );
      setLastMarkdownExportArtifact(
        artifacts.find(artifact => artifact.format === 'markdown') ?? null,
      );
      setLastTextExportArtifact(
        artifacts.find(artifact => artifact.format === 'text') ?? null,
      );
      setLastPdfExportArtifact(
        artifacts.find(artifact => artifact.format === 'pdf') ?? null,
      );

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
    trackBackupExportStarted();

    try {
      const result = await exportDreamDataSnapshot();
      trackBackupExportCompleted({
        dreamCount: result.payload.summary.dreamCount,
      });
      setLastJsonExportArtifact({
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

  const onExportReadableData = React.useCallback(
    async (format: 'markdown' | 'text') => {
      setExportingFormat(format);

      try {
        const result = await exportDreamReadableArchive(format);
        const artifact = {
          fileName: result.filePath.split('/').filter(Boolean).pop() ?? result.filePath,
          filePath: result.filePath,
          modifiedAt: Date.now(),
          format,
        } satisfies LocalDreamExportArtifact;

        if (format === 'markdown') {
          setLastMarkdownExportArtifact(artifact);
        } else {
          setLastTextExportArtifact(artifact);
        }

        await refreshLocalExports();
      } catch (error) {
        Alert.alert(
          copy.exportErrorTitle,
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setExportingFormat(null);
      }
    },
    [copy.exportErrorTitle, refreshLocalExports],
  );

  const onExportPdfData = React.useCallback(async () => {
    setExportingFormat('pdf');

    try {
      const result = await exportDreamArchivePdf();
      setLastPdfExportArtifact({
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

  const onShareLastBackup = React.useCallback(async () => {
    if (!lastJsonExportArtifact) {
      return;
    }

    await shareLocalBackupFile(
      lastJsonExportArtifact.filePath,
      'application/json',
      lastJsonExportArtifact.fileName,
    );
  }, [lastJsonExportArtifact]);

  const onShareLastPdf = React.useCallback(async () => {
    if (!lastPdfExportArtifact) {
      return;
    }

    await shareLocalBackupFile(
      lastPdfExportArtifact.filePath,
      'application/pdf',
      lastPdfExportArtifact.fileName,
    );
  }, [lastPdfExportArtifact]);

  const onShareLastMarkdown = React.useCallback(async () => {
    if (!lastMarkdownExportArtifact) {
      return;
    }

    await shareLocalBackupFile(
      lastMarkdownExportArtifact.filePath,
      getReadableExportMimeType('markdown'),
      lastMarkdownExportArtifact.fileName,
    );
  }, [lastMarkdownExportArtifact]);

  const onShareLastText = React.useCallback(async () => {
    if (!lastTextExportArtifact) {
      return;
    }

    await shareLocalBackupFile(
      lastTextExportArtifact.filePath,
      getReadableExportMimeType('text'),
      lastTextExportArtifact.fileName,
    );
  }, [lastTextExportArtifact]);

  const onOpenLastPdf = React.useCallback(async () => {
    if (!lastPdfExportArtifact) {
      return;
    }

    try {
      await openLocalBackupFile(
        lastPdfExportArtifact.filePath,
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
    lastPdfExportArtifact,
  ]);

  const onOpenLastMarkdown = React.useCallback(async () => {
    if (!lastMarkdownExportArtifact) {
      return;
    }

    try {
      await openLocalBackupFile(
        lastMarkdownExportArtifact.filePath,
        getReadableExportMimeType('markdown'),
      );
    } catch {
      Alert.alert(
        copy.exportReadableOpenErrorTitle,
        copy.exportReadableOpenErrorDescription,
      );
    }
  }, [
    copy.exportReadableOpenErrorDescription,
    copy.exportReadableOpenErrorTitle,
    lastMarkdownExportArtifact,
  ]);

  const onOpenLastText = React.useCallback(async () => {
    if (!lastTextExportArtifact) {
      return;
    }

    try {
      await openLocalBackupFile(
        lastTextExportArtifact.filePath,
        getReadableExportMimeType('text'),
      );
    } catch {
      Alert.alert(
        copy.exportReadableOpenErrorTitle,
        copy.exportReadableOpenErrorDescription,
      );
    }
  }, [
    copy.exportReadableOpenErrorDescription,
    copy.exportReadableOpenErrorTitle,
    lastTextExportArtifact,
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
          trackRestoreStarted({ mode: importMode });

          restoreDreamImportFromFile(selectedImportPath, importMode)
            .then(async preview => {
              trackRestoreCompleted({
                mode: preview.mode,
                importedDreamCount: preview.diff.importDreamCount,
                resultingDreamCount: preview.diff.resultingDreamCount,
              });
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
    isExportingMarkdown: exportingFormat === 'markdown',
    isExportingPdf: exportingFormat === 'pdf',
    isExportingText: exportingFormat === 'text',
    lastBackupName,
    lastMarkdownName,
    lastPdfName,
    lastTextName,
    onExportData,
    onExportMarkdownData: () => onExportReadableData('markdown'),
    onExportPdfData,
    onExportTextData: () => onExportReadableData('text'),
    onOpenLastMarkdown,
    onOpenLastPdf,
    onOpenLastText,
    onShareLastBackup,
    onShareLastMarkdown,
    onShareLastPdf,
    onShareLastText,
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
