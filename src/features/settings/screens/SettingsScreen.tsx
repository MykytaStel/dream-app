import React from 'react';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { APP_VERSION_LABEL } from '../../../config/app';
import { Theme } from '../../../theme/theme';
import { CURRENT_STORAGE_SCHEMA_VERSION } from '../../../services/storage/keys';
import {
  exportDreamDataSnapshot,
  DREAM_EXPORT_VERSION,
} from '../services/dataExportService';
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
import { SettingsActionRow } from '../components/SettingsActionRow';
import { SettingsMetaGrid } from '../components/SettingsMetaGrid';
import { SettingsSectionHeader } from '../components/SettingsSectionHeader';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { AppLocale } from '../../../i18n/types';
import { useI18n } from '../../../i18n/I18nProvider';

export default function SettingsScreen() {
  const t = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = createSettingsScreenStyles(t);
  const footerMeta = `${copy.footerStorageMetaPrefix} ${CURRENT_STORAGE_SCHEMA_VERSION} • ${copy.footerExportMetaPrefix} v${DREAM_EXPORT_VERSION}`;
  const [reminderSettings, setReminderSettings] = React.useState<DreamReminderSettings>(() =>
    getDreamReminderSettings(),
  );
  const [permissionGranted, setPermissionGranted] = React.useState<boolean>(true);
  const [isApplyingReminder, setIsApplyingReminder] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDownloadingTranscriptionModel, setIsDownloadingTranscriptionModel] =
    React.useState(false);
  const [isDeletingTranscriptionModel, setIsDeletingTranscriptionModel] = React.useState(false);
  const [lastExportPath, setLastExportPath] = React.useState<string | null>(null);
  const [transcriptionModelStatus, setTranscriptionModelStatus] =
    React.useState<DreamTranscriptionModelStatus | null>(null);
  const [transcriptionDownloadProgress, setTranscriptionDownloadProgress] =
    React.useState<DreamTranscriptionProgress | null>(null);
  const [showIosTimePicker, setShowIosTimePicker] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [seedDreamCount, setSeedDreamCount] = React.useState(0);
  const [isUpdatingSeedDreams, setIsUpdatingSeedDreams] = React.useState(false);
  const [analysisSettings, setAnalysisSettings] = React.useState<DreamAnalysisSettings>(() =>
    getDreamAnalysisSettings(),
  );
  const privacyHighlights = React.useMemo(
    () => [
      {
        label: copy.privacyStorageLabel,
        value: copy.privacyStorageValue,
      },
      {
        label: copy.privacySyncLabel,
        value: copy.privacySyncValue,
      },
      {
        label: copy.privacyAccountLabel,
        value: copy.privacyAccountValue,
      },
      {
        label: copy.privacyReminderLabel,
        value: copy.privacyReminderValue,
      },
      {
        label: copy.privacyTranscriptionLabel,
        value: copy.privacyTranscriptionValue,
        wide: true,
      },
    ],
    [copy],
  );
  const analysisHighlights = React.useMemo(
    () => [
      {
        label: copy.analysisProviderLabel,
        value:
          analysisSettings.provider === 'openai'
            ? copy.analysisProviderOpenAi
            : copy.analysisProviderManual,
      },
      {
        label: copy.analysisNetworkLabel,
        value:
          analysisSettings.allowNetwork
            ? copy.analysisNetworkAllowed
            : copy.analysisNetworkBlocked,
      },
    ],
    [analysisSettings.allowNetwork, analysisSettings.provider, copy],
  );
  const transcriptionHighlights = React.useMemo(
    () => [
      {
        label: copy.transcriptionStatusLabel,
        value:
          transcriptionModelStatus?.installed
            ? copy.transcriptionStatusInstalled
            : copy.transcriptionStatusMissing,
      },
      {
        label: copy.transcriptionSizeLabel,
        value: formatModelSize(transcriptionModelStatus?.sizeBytes ?? null),
      },
      ...(transcriptionModelStatus?.installed && transcriptionModelStatus.filePath
        ? [
            {
              label: copy.transcriptionPathLabel,
              value: formatModelFileName(transcriptionModelStatus.filePath) ?? '...',
              wide: true,
            },
          ]
        : []),
    ],
    [copy, transcriptionModelStatus],
  );
  const exportHighlights = React.useMemo(
    () => [
      {
        label: copy.exportIncludesLabel,
        value: copy.exportIncludesValue,
        wide: true,
      },
      {
        label: copy.exportFormatLabel,
        value: copy.exportFormatValue,
      },
    ],
    [copy],
  );

  function getReminderDate(settings: DreamReminderSettings) {
    const date = new Date();
    date.setHours(settings.hour, settings.minute, 0, 0);
    return date;
  }

  function getPickerLocale(currentLocale: AppLocale) {
    return currentLocale === 'uk' ? 'uk-UA' : 'en-US';
  }

  function formatReminderTime(settings: DreamReminderSettings) {
    return getReminderDate(settings).toLocaleTimeString(getPickerLocale(locale), {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatModelSize(sizeBytes: number | null) {
    if (typeof sizeBytes !== 'number' || Number.isNaN(sizeBytes)) {
      return 'Unknown';
    }

    const sizeMiB = sizeBytes / (1024 * 1024);
    return `${sizeMiB.toFixed(sizeMiB >= 100 ? 0 : 1)} MiB`;
  }

  function formatModelFileName(filePath?: string | null) {
    if (!filePath?.trim()) {
      return null;
    }

    return filePath.split('/').filter(Boolean).pop() ?? filePath;
  }

  function formatDownloadProgress(progress: DreamTranscriptionProgress | null) {
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

  const refreshReminderState = React.useCallback(async () => {
    setReminderSettings(getDreamReminderSettings());
    setAnalysisSettings(getDreamAnalysisSettings());
    setPermissionGranted(await getDreamReminderPermissionGranted());
    setTranscriptionModelStatus(await getDreamTranscriptionModelStatus());
    if (__DEV__) {
      setSeedDreamCount(countSeedDreams());
    }
  }, []);

  function saveNextAnalysisSettings(next: DreamAnalysisSettings) {
    const saved = saveDreamAnalysisSettings(next);
    setAnalysisSettings(saved);
    return saved;
  }

  useFocusEffect(
    React.useCallback(() => {
      refreshReminderState().catch(() => undefined);
    }, [refreshReminderState]),
  );

  async function updateReminderSettings(next: DreamReminderSettings) {
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
  }

  async function onToggleReminder() {
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
  }

  React.useEffect(() => {
    if (!reminderSettings.enabled && showIosTimePicker) {
      setShowIosTimePicker(false);
    }
  }, [reminderSettings.enabled, showIosTimePicker]);

  async function onSelectTime(hour: number, minute: number) {
    await updateReminderSettings({
      ...reminderSettings,
      hour,
      minute,
    });
  }

  function onNativeTimePickerChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type !== 'set' || !selectedDate) {
      return;
    }

    onSelectTime(selectedDate.getHours(), selectedDate.getMinutes()).catch(() => undefined);
  }

  function onOpenReminderTimePicker() {
    if (!reminderSettings.enabled || isApplyingReminder) {
      return;
    }

    const currentDate = getReminderDate(reminderSettings);

    if (Platform.OS === 'android') {
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
  }

  async function onSelectLocale(nextLocale: AppLocale) {
    setLocale(nextLocale);

    try {
      const appliedSettings = await applyDreamReminderSettings(reminderSettings);
      setReminderSettings(appliedSettings);
      setPermissionGranted(await getDreamReminderPermissionGranted());
    } catch (error) {
      Alert.alert(copy.reminderSaveErrorTitle, String(error));
    }
  }

  async function onExportData() {
    setIsExporting(true);

    try {
      const result = await exportDreamDataSnapshot();
      setLastExportPath(result.filePath);
      Alert.alert(copy.exportSuccessTitle, `${copy.exportSuccessDescription}\n${result.filePath}`);
    } catch (error) {
      Alert.alert(
        copy.exportErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function onDeleteTranscriptionModel() {
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
  }

  async function onSeedDreams(targetCount: number) {
    setIsUpdatingSeedDreams(true);

    try {
      const nextSeedCount = seedDreamSamples(targetCount);
      setSeedDreamCount(nextSeedCount);
      Alert.alert(copy.scaleTestSeededTitle, copy.scaleTestSeededDescription);
    } catch (error) {
      Alert.alert(copy.scaleTestErrorTitle, error instanceof Error ? error.message : String(error));
    } finally {
      setIsUpdatingSeedDreams(false);
    }
  }

  function onClearSeedDreams() {
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
  }

  async function onDownloadTranscriptionModel() {
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
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.heroHeader}>
        <SectionHeader title={copy.title} large />
        <View style={styles.inlineLanguageRow}>
          <Text style={styles.inlineLanguageLabel}>{copy.languageTitle}</Text>
          <View style={styles.inlineLanguageControls}>
            {([
              { value: 'en', label: copy.languageEnglish },
              { value: 'uk', label: copy.languageUkrainian },
            ] as Array<{ value: AppLocale; label: string }>).map(option => {
              const selected = locale === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.inlineLanguageChip,
                    selected ? styles.inlineLanguageChipActive : null,
                  ]}
                  disabled={isApplyingReminder}
                  onPress={() => onSelectLocale(option.value)}
                >
                  <Text
                    style={[
                      styles.inlineLanguageChipText,
                      selected ? styles.inlineLanguageChipTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Card style={styles.sectionCard}>
        <SettingsSectionHeader
          title={copy.reminderTitle}
          description={copy.reminderDescription}
          trailing={
            <Switch
              value={reminderSettings.enabled}
              onValueChange={() => onToggleReminder().catch(() => undefined)}
              disabled={isApplyingReminder}
              trackColor={{ false: t.colors.border, true: t.colors.primary }}
              thumbColor={t.colors.background}
            />
          }
        />

        {!permissionGranted ? (
          <Text style={styles.reminderHint}>
            {`${copy.reminderPermissionLabel}: ${copy.reminderPermissionBlocked}.`}
          </Text>
        ) : null}

        {reminderSettings.enabled ? (
          <>
            <SettingsActionRow
              title={copy.reminderTimeLabel}
              meta={copy.reminderTimeHint}
              value={formatReminderTime(reminderSettings)}
              disabled={isApplyingReminder}
              onPress={onOpenReminderTimePicker}
            />

            {Platform.OS === 'ios' && showIosTimePicker ? (
              <View style={styles.iosPickerWrap}>
                <DateTimePicker
                  value={getReminderDate(reminderSettings)}
                  mode="time"
                  display="spinner"
                  locale={getPickerLocale(locale)}
                  themeVariant="dark"
                  onChange={onNativeTimePickerChange}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card style={styles.sectionCard}>
        <SettingsSectionHeader
          title={copy.privacyTitle}
          description={copy.privacyDescription}
        />
        <SettingsMetaGrid items={privacyHighlights} />
        <Text style={styles.privacyFootnote}>{copy.privacyFootnote}</Text>
      </Card>

      <View style={styles.advancedToggleWrap}>
        <SettingsActionRow
          title={copy.advancedTitle}
          meta={copy.advancedDescription}
          value={showAdvanced ? copy.advancedHide : copy.advancedShow}
          onPress={() => setShowAdvanced(current => !current)}
        />
      </View>

      {showAdvanced ? (
        <>
          <Card style={styles.sectionCard}>
            <SettingsSectionHeader
              title={copy.analysisTitle}
              description={copy.analysisDescription}
              trailing={
                <Switch
                  value={analysisSettings.enabled}
                  onValueChange={enabled => {
                    saveNextAnalysisSettings({
                      ...analysisSettings,
                      enabled,
                    });
                  }}
                  trackColor={{ false: t.colors.border, true: t.colors.primary }}
                  thumbColor={t.colors.background}
                />
              }
            />
            <SettingsMetaGrid items={analysisHighlights} />
            <View style={styles.buttonRow}>
              <Button
                title={copy.analysisUseManualButton}
                variant={analysisSettings.provider === 'manual' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() =>
                  saveNextAnalysisSettings({
                    ...analysisSettings,
                    provider: 'manual',
                    allowNetwork: false,
                  })
                }
              />
              <Button
                title={copy.analysisUseOpenAiButton}
                variant={analysisSettings.provider === 'openai' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() =>
                  saveNextAnalysisSettings({
                    ...analysisSettings,
                    provider: 'openai',
                  })
                }
              />
            </View>
            <View style={styles.buttonStack}>
              <Button
                title={
                  analysisSettings.allowNetwork
                    ? copy.analysisNetworkBlockButton
                    : copy.analysisNetworkAllowButton
                }
                variant="ghost"
                size="sm"
                onPress={() =>
                  saveNextAnalysisSettings({
                    ...analysisSettings,
                    allowNetwork: !analysisSettings.allowNetwork,
                  })
                }
              />
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SettingsSectionHeader
              title={copy.transcriptionTitle}
              description={copy.transcriptionDescription}
            />
            <SettingsMetaGrid items={transcriptionHighlights} />
            <View style={styles.buttonStack}>
              <Button
                title={
                  isDownloadingTranscriptionModel
                    ? formatDownloadProgress(transcriptionDownloadProgress) ??
                      copy.transcriptionDownloadButtonBusy
                    : copy.transcriptionDownloadButton
                }
                variant="primary"
                size="sm"
                onPress={onDownloadTranscriptionModel}
                disabled={
                  isDownloadingTranscriptionModel || Boolean(transcriptionModelStatus?.installed)
                }
              />
              <Button
                title={
                  isDeletingTranscriptionModel
                    ? copy.transcriptionDeleteButtonBusy
                    : copy.transcriptionDeleteButton
                }
                variant="ghost"
                size="sm"
                onPress={onDeleteTranscriptionModel}
                disabled={isDeletingTranscriptionModel || !transcriptionModelStatus?.installed}
              />
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SettingsSectionHeader title={copy.exportTitle} description={copy.exportDescription} />
            <SettingsMetaGrid items={exportHighlights} />
            {lastExportPath ? (
              <View style={styles.exportPathBlock}>
                <Text style={styles.exportPathLabel}>{copy.exportLatestPathLabel}</Text>
                <Text style={styles.exportPathValue}>{lastExportPath}</Text>
              </View>
            ) : null}
            <View style={styles.buttonStack}>
              <Button
                title={isExporting ? copy.exportButtonBusy : copy.exportButton}
                variant="primary"
                size="sm"
                onPress={onExportData}
                disabled={isExporting}
              />
            </View>
            <Text style={styles.privacyFootnote}>{copy.exportFootnote}</Text>
          </Card>

          {__DEV__ ? (
            <Card style={styles.sectionCard}>
              <SettingsSectionHeader
                title={copy.scaleTestTitle}
                description={copy.scaleTestDescription}
              />
              <SettingsMetaGrid
                items={[
                  {
                    label: copy.scaleTestSeededLabel,
                    value: String(seedDreamCount),
                  },
                ]}
              />
              <View style={styles.buttonRow}>
                <Button
                  title={isUpdatingSeedDreams ? copy.scaleTestBusy : copy.scaleTestAdd250}
                  variant="ghost"
                  size="sm"
                  onPress={() => onSeedDreams(250).catch(() => undefined)}
                  disabled={isUpdatingSeedDreams}
                />
                <Button
                  title={isUpdatingSeedDreams ? copy.scaleTestBusy : copy.scaleTestAdd1000}
                  variant="primary"
                  size="sm"
                  onPress={() => onSeedDreams(1000).catch(() => undefined)}
                  disabled={isUpdatingSeedDreams}
                />
              </View>
              <View style={styles.buttonStack}>
                <Button
                  title={copy.scaleTestClear}
                  variant="ghost"
                  size="sm"
                  onPress={onClearSeedDreams}
                  disabled={isUpdatingSeedDreams || seedDreamCount === 0}
                />
              </View>
            </Card>
          ) : null}
        </>
      ) : null}

      <View style={styles.footerBlock}>
        <Text style={styles.footerVersion}>
          {`${copy.footerBuildLabel} ${APP_VERSION_LABEL}`}
        </Text>
        <Text style={styles.footerMeta}>{footerMeta}</Text>
      </View>
    </ScreenContainer>
  );
}
