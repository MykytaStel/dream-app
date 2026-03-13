import React from 'react';
import { Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { APP_VERSION_LABEL } from '../../../config/app';
import { type AppLocale } from '../../../i18n/types';
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
  buildPrivacyHighlights,
  buildTranscriptionHighlights,
  formatDownloadProgress,
  formatReminderTime,
  getPickerLocale,
  getReminderDate,
  getSettingsFooterMeta,
} from '../model/settingsPresentation';
import { useCloudBackupController } from './useCloudBackupController';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

type UseSettingsScreenControllerArgs = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  copy: SettingsCopy;
};

export function useSettingsScreenController({
  locale,
  setLocale,
  copy,
}: UseSettingsScreenControllerArgs) {
  const [reminderSettings, setReminderSettings] =
    React.useState<DreamReminderSettings>(() => getDreamReminderSettings());
  const [permissionGranted, setPermissionGranted] =
    React.useState<boolean>(true);
  const [isApplyingReminder, setIsApplyingReminder] = React.useState(false);
  const [isDownloadingTranscriptionModel, setIsDownloadingTranscriptionModel] =
    React.useState(false);
  const [isDeletingTranscriptionModel, setIsDeletingTranscriptionModel] =
    React.useState(false);
  const [transcriptionModelStatus, setTranscriptionModelStatus] =
    React.useState<DreamTranscriptionModelStatus | null>(null);
  const [transcriptionDownloadProgress, setTranscriptionDownloadProgress] =
    React.useState<DreamTranscriptionProgress | null>(null);
  const [showIosTimePicker, setShowIosTimePicker] = React.useState(false);
  const [seedDreamCount, setSeedDreamCount] = React.useState(0);
  const [isUpdatingSeedDreams, setIsUpdatingSeedDreams] = React.useState(false);
  const [analysisSettings, setAnalysisSettings] =
    React.useState<DreamAnalysisSettings>(() => getDreamAnalysisSettings());
  const cloudBackup = useCloudBackupController({
    locale,
    copy,
    mode: 'summary',
  });

  const footerMeta = React.useMemo(() => getSettingsFooterMeta(copy), [copy]);
  const privacyHighlights = React.useMemo(
    () => buildPrivacyHighlights(copy),
    [copy],
  );
  const analysisHighlights = React.useMemo(
    () => buildAnalysisHighlights(copy, analysisSettings),
    [analysisSettings, copy],
  );
  const transcriptionHighlights = React.useMemo(
    () => buildTranscriptionHighlights(copy, transcriptionModelStatus),
    [copy, transcriptionModelStatus],
  );
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
  const refreshReminderState = React.useCallback(async () => {
    setReminderSettings(getDreamReminderSettings());
    setAnalysisSettings(getDreamAnalysisSettings());
    setPermissionGranted(await getDreamReminderPermissionGranted());
    setTranscriptionModelStatus(await getDreamTranscriptionModelStatus());
    if (__DEV__) {
      setSeedDreamCount(countSeedDreams());
    }
  }, []);

  const saveNextAnalysisSettings = React.useCallback(
    (next: DreamAnalysisSettings) => {
      const saved = saveDreamAnalysisSettings(next);
      setAnalysisSettings(saved);
      return saved;
    },
    [],
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshReminderState().catch(() => undefined);
    }, [refreshReminderState]),
  );

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

      onSelectTime(selectedDate.getHours(), selectedDate.getMinutes()).catch(
        () => undefined,
      );
    },
    [onSelectTime],
  );

  const onOpenReminderTimePicker = React.useCallback(() => {
    if (!reminderSettings.enabled || isApplyingReminder) {
      return;
    }

    const currentDate = getReminderDate(reminderSettings);

    if (Platform.OS === 'android') {
      const {
        DateTimePickerAndroid,
      } = require('@react-native-community/datetimepicker');
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
        const appliedSettings = await applyDreamReminderSettings(
          reminderSettings,
        );
        setReminderSettings(appliedSettings);
        setPermissionGranted(await getDreamReminderPermissionGranted());
      } catch (error) {
        Alert.alert(copy.reminderSaveErrorTitle, String(error));
      }
    },
    [copy.reminderSaveErrorTitle, reminderSettings, setLocale],
  );

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
    ...cloudBackup,
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
    __DEV__,
    seedDreamCount,
    isUpdatingSeedDreams,
    onSeedDreams,
    onClearSeedDreams,
  };
}
