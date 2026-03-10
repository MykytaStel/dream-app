import React from 'react';
import { Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { APP_VERSION_LABEL } from '../../../config/app';
import { type AppLocale } from '../../../i18n/types';
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
  ensureDreamTranscriptionModelInstalled,
  deleteDreamTranscriptionModel,
  getDreamTranscriptionModelStatus,
  type DreamTranscriptionProgress,
  type DreamTranscriptionModelStatus,
} from '../../dreams/services/dreamTranscriptionService';
import {
  applyDreamReminderSettings,
  getDreamReminderPermissionGranted,
  getDreamReminderSettings,
  requestReminderPermission,
  type DreamReminderSettings,
} from '../../reminders/services/dreamReminderService';
import {
  clearSeedDreams,
  countSeedDreams,
  seedDreamSamples,
} from '../../dreams/services/dreamSeedService';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import {
  getDreamAnalysisSettings,
  saveDreamAnalysisSettings,
} from '../../analysis/services/dreamAnalysisSettingsService';
import { getSettingsCopy } from '../../../constants/copy/settings';
import {
  buildAnalysisHighlights,
  buildExportHighlights,
  buildPrivacyHighlights,
  buildRestorePreviewItems,
  buildRestoreSuccessItems,
  buildTranscriptionHighlights,
  formatBackupListMeta,
  formatBackupListTitle,
  formatBackupTimestamp,
  formatDownloadProgress,
  formatReminderTime,
  getPickerLocale,
  getReminderDate,
  getRestoreConfirmContent,
  getSettingsFooterMeta,
} from '../model/settingsPresentation';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

type UseSettingsScreenControllerArgs = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  copy: SettingsCopy;
};

type ExportFormat = 'json' | 'pdf';

export function useSettingsScreenController({
  locale,
  setLocale,
  copy,
}: UseSettingsScreenControllerArgs) {
  const [reminderSettings, setReminderSettings] = React.useState<DreamReminderSettings>(() =>
    getDreamReminderSettings(),
  );
  const [permissionGranted, setPermissionGranted] = React.useState<boolean>(true);
  const [isApplyingReminder, setIsApplyingReminder] = React.useState(false);
  const [exportingFormat, setExportingFormat] = React.useState<ExportFormat | null>(null);
  const [isDownloadingTranscriptionModel, setIsDownloadingTranscriptionModel] =
    React.useState(false);
  const [isDeletingTranscriptionModel, setIsDeletingTranscriptionModel] = React.useState(false);
  const [lastExportPath, setLastExportPath] = React.useState<string | null>(null);
  const [localExportFiles, setLocalExportFiles] = React.useState<LocalDreamExportFile[]>([]);
  const [isLoadingLocalExports, setIsLoadingLocalExports] = React.useState(false);
  const [selectedImportPreview, setSelectedImportPreview] =
    React.useState<DreamImportPreview | null>(null);
  const [selectedImportPath, setSelectedImportPath] = React.useState<string | null>(null);
  const [importMode, setImportMode] = React.useState<DreamImportMode>('replace');
  const [showRestorePreview, setShowRestorePreview] = React.useState(false);
  const [importPreviewError, setImportPreviewError] = React.useState<string | null>(null);
  const [isLoadingImportPreview, setIsLoadingImportPreview] = React.useState(false);
  const [isRestoringImport, setIsRestoringImport] = React.useState(false);
  const [lastRestorePreview, setLastRestorePreview] = React.useState<DreamImportPreview | null>(
    null,
  );
  const [transcriptionModelStatus, setTranscriptionModelStatus] =
    React.useState<DreamTranscriptionModelStatus | null>(null);
  const [transcriptionDownloadProgress, setTranscriptionDownloadProgress] =
    React.useState<DreamTranscriptionProgress | null>(null);
  const [showIosTimePicker, setShowIosTimePicker] = React.useState(false);
  const [seedDreamCount, setSeedDreamCount] = React.useState(0);
  const [isUpdatingSeedDreams, setIsUpdatingSeedDreams] = React.useState(false);
  const [analysisSettings, setAnalysisSettings] = React.useState<DreamAnalysisSettings>(() =>
    getDreamAnalysisSettings(),
  );

  const footerMeta = React.useMemo(() => getSettingsFooterMeta(copy), [copy]);
  const privacyHighlights = React.useMemo(() => buildPrivacyHighlights(copy), [copy]);
  const analysisHighlights = React.useMemo(
    () => buildAnalysisHighlights(copy, analysisSettings),
    [analysisSettings, copy],
  );
  const transcriptionHighlights = React.useMemo(
    () => buildTranscriptionHighlights(copy, transcriptionModelStatus),
    [copy, transcriptionModelStatus],
  );
  const exportHighlights = React.useMemo(() => buildExportHighlights(copy), [copy]);
  const reminderTime = React.useMemo(
    () => formatReminderTime(reminderSettings, locale),
    [locale, reminderSettings],
  );
  const transcriptionDownloadLabel = React.useMemo(
    () =>
      isDownloadingTranscriptionModel
        ? formatDownloadProgress(transcriptionDownloadProgress, copy) ??
          copy.transcriptionDownloadButtonBusy
        : copy.transcriptionDownloadButton,
    [copy, isDownloadingTranscriptionModel, transcriptionDownloadProgress],
  );
  const restorePreviewMeta = React.useMemo(
    () =>
      selectedImportPreview
        ? `${copy.restoreResultCountLabel} ${selectedImportPreview.diff.resultingDreamCount} • ${formatBackupTimestamp(selectedImportPreview.exportedAt, locale)}`
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
      lastRestorePreview ? buildRestoreSuccessItems(copy, lastRestorePreview) : [],
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
          : (files[0]?.filePath ?? null);
      });
    } finally {
      setIsLoadingLocalExports(false);
    }
  }, []);

  const refreshReminderState = React.useCallback(async () => {
    setReminderSettings(getDreamReminderSettings());
    setAnalysisSettings(getDreamAnalysisSettings());
    setPermissionGranted(await getDreamReminderPermissionGranted());
    setTranscriptionModelStatus(await getDreamTranscriptionModelStatus());
    if (__DEV__) {
      setSeedDreamCount(countSeedDreams());
    }
  }, []);

  const saveNextAnalysisSettings = React.useCallback((next: DreamAnalysisSettings) => {
    const saved = saveDreamAnalysisSettings(next);
    setAnalysisSettings(saved);
    return saved;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshReminderState().catch(() => undefined);
      refreshLocalExports().catch(() => undefined);
    }, [refreshLocalExports, refreshReminderState]),
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
          setImportPreviewError(error instanceof Error ? error.message : String(error));
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

  React.useEffect(() => {
    if (!reminderSettings.enabled && showIosTimePicker) {
      setShowIosTimePicker(false);
    }
  }, [reminderSettings.enabled, showIosTimePicker]);

  const updateReminderSettings = React.useCallback(
    async (next: DreamReminderSettings) => {
      setIsApplyingReminder(true);

      try {
        const appliedSettings = await applyDreamReminderSettings(next);
        const granted = await getDreamReminderPermissionGranted();
        setReminderSettings(appliedSettings);
        setPermissionGranted(granted);

        if (next.enabled && !appliedSettings.enabled && !granted) {
          Alert.alert(
            copy.reminderPermissionDeniedTitle,
            copy.reminderPermissionDeniedDescription,
          );
        }
      } catch (error) {
        await refreshReminderState();
        Alert.alert(
          copy.reminderSaveErrorTitle,
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setIsApplyingReminder(false);
      }
    },
    [copy, refreshReminderState],
  );

  const onToggleReminder = React.useCallback(async () => {
    if (!reminderSettings.enabled) {
      const allowed = await requestReminderPermission();
      if (!allowed) {
        Alert.alert(
          copy.reminderPermissionDeniedTitle,
          copy.reminderPermissionDeniedDescription,
        );
        setPermissionGranted(false);
        return;
      }

      setPermissionGranted(true);
    }

    await updateReminderSettings({
      ...reminderSettings,
      enabled: !reminderSettings.enabled,
    });
  }, [copy, reminderSettings, updateReminderSettings]);

  const onSelectTime = React.useCallback(
    async (hour: number, minute: number) => {
      await updateReminderSettings({
        ...reminderSettings,
        hour,
        minute,
      });
    },
    [reminderSettings, updateReminderSettings],
  );

  const onNativeTimePickerChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type !== 'set' || !selectedDate) {
        return;
      }

      onSelectTime(selectedDate.getHours(), selectedDate.getMinutes()).catch(() => undefined);
    },
    [onSelectTime],
  );

  const onOpenReminderTimePicker = React.useCallback(() => {
    if (!reminderSettings.enabled || isApplyingReminder) {
      return;
    }

    const currentDate = getReminderDate(reminderSettings);

    if (Platform.OS === 'android') {
      const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'time',
        display: 'clock',
        is24Hour: locale === 'uk',
        onChange: onNativeTimePickerChange,
      });
      return;
    }

    setShowIosTimePicker(current => !current);
  }, [isApplyingReminder, locale, onNativeTimePickerChange, reminderSettings]);

  const onSelectLocale = React.useCallback(
    async (nextLocale: AppLocale) => {
      setLocale(nextLocale);

      try {
        const appliedSettings = await applyDreamReminderSettings(reminderSettings);
        setReminderSettings(appliedSettings);
        setPermissionGranted(await getDreamReminderPermissionGranted());
      } catch (error) {
        Alert.alert(copy.reminderSaveErrorTitle, String(error));
      }
    },
    [copy.reminderSaveErrorTitle, reminderSettings, setLocale],
  );

  const onExportData = React.useCallback(async () => {
    setExportingFormat('json');

    try {
      const result = await exportDreamDataSnapshot();
      setLastExportPath(result.filePath);
      setSelectedImportPath(result.filePath);
      await refreshLocalExports();
      Alert.alert(copy.exportSuccessTitle, `${copy.exportSuccessDescription}\n${result.filePath}`);
    } catch (error) {
      Alert.alert(
        copy.exportErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setExportingFormat(null);
    }
  }, [copy, refreshLocalExports]);

  const onExportPdfData = React.useCallback(async () => {
    setExportingFormat('pdf');

    try {
      const result = await exportDreamArchivePdf();
      setLastExportPath(result.filePath);
      await refreshLocalExports();
      Alert.alert(copy.exportPdfSuccessTitle, `${copy.exportPdfSuccessDescription}\n${result.filePath}`);
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
              await refreshReminderState();
              await refreshLocalExports();
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
    copy,
    importMode,
    refreshLocalExports,
    refreshReminderState,
    selectedImportPath,
    setLocale,
  ]);

  const onDeleteTranscriptionModel = React.useCallback(async () => {
    setIsDeletingTranscriptionModel(true);

    try {
      await deleteDreamTranscriptionModel();
      const nextStatus = await getDreamTranscriptionModelStatus();
      setTranscriptionModelStatus(nextStatus);
      Alert.alert(
        copy.transcriptionDeleteSuccessTitle,
        copy.transcriptionDeleteSuccessDescription,
      );
    } catch (error) {
      Alert.alert(
        copy.transcriptionDeleteErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsDeletingTranscriptionModel(false);
    }
  }, [copy]);

  const onDownloadTranscriptionModel = React.useCallback(async () => {
    setIsDownloadingTranscriptionModel(true);
    setTranscriptionDownloadProgress({
      phase: 'preparing-model',
      progress: 0,
    });

    try {
      const result = await ensureDreamTranscriptionModelInstalled(progress => {
        setTranscriptionDownloadProgress(progress);
      });
      setTranscriptionModelStatus(result.status);
      Alert.alert(
        copy.transcriptionDownloadSuccessTitle,
        copy.transcriptionDownloadSuccessDescription,
      );
    } catch (error) {
      Alert.alert(
        copy.transcriptionDownloadErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsDownloadingTranscriptionModel(false);
      setTranscriptionDownloadProgress(null);
    }
  }, [copy]);

  const onSeedDreams = React.useCallback(
    async (targetCount: number) => {
      setIsUpdatingSeedDreams(true);

      try {
        const nextSeedCount = seedDreamSamples(targetCount);
        setSeedDreamCount(nextSeedCount);
        Alert.alert(copy.scaleTestSeededTitle, copy.scaleTestSeededDescription);
      } catch (error) {
        Alert.alert(
          copy.scaleTestErrorTitle,
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setIsUpdatingSeedDreams(false);
      }
    },
    [copy],
  );

  const onClearSeedDreams = React.useCallback(() => {
    Alert.alert(copy.scaleTestClearTitle, copy.scaleTestClearDescription, [
      {
        text: copy.actionCancel,
        style: 'cancel',
      },
      {
        text: copy.scaleTestClear,
        style: 'destructive',
        onPress: () => {
          setIsUpdatingSeedDreams(true);

          try {
            clearSeedDreams();
            setSeedDreamCount(0);
          } catch (error) {
            Alert.alert(
              copy.scaleTestErrorTitle,
              error instanceof Error ? error.message : String(error),
            );
          } finally {
            setIsUpdatingSeedDreams(false);
          }
        },
      },
    ]);
  }, [copy]);

  return {
    APP_VERSION_LABEL,
    footerMeta,
    reminderSettings,
    permissionGranted,
    isApplyingReminder,
    reminderTime,
    showIosTimePicker,
    onToggleReminder,
    onOpenReminderTimePicker,
    onNativeTimePickerChange,
    getReminderDate: () => getReminderDate(reminderSettings),
    pickerLocale: getPickerLocale(locale),
    onSelectLocale,
    privacyHighlights,
    analysisSettings,
    saveNextAnalysisSettings,
    analysisHighlights,
    transcriptionHighlights,
    transcriptionModelInstalled: Boolean(transcriptionModelStatus?.installed),
    isDownloadingTranscriptionModel,
    isDeletingTranscriptionModel,
    transcriptionDownloadLabel,
    onDownloadTranscriptionModel,
    onDeleteTranscriptionModel,
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
    formatBackupListTitle: (value: number) => formatBackupListTitle(value, locale, copy),
    formatBackupListMeta,
    __DEV__,
    seedDreamCount,
    isUpdatingSeedDreams,
    onSeedDreams,
    onClearSeedDreams,
  };
}
