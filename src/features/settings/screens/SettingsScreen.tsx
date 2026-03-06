import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { InfoRow } from '../../../components/ui/InfoRow';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { APP_VERSION_LABEL } from '../../../config/app';
import { Theme } from '../../../theme/theme';
import { exportDreamDataSnapshot } from '../services/dataExportService';
import {
  getDreamAnalysisSettings,
  saveDreamAnalysisSettings,
} from '../../analysis/services/dreamAnalysisSettingsService';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
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
  REMINDER_TIME_OPTIONS,
  requestReminderPermission,
  type DreamReminderSettings,
} from '../../reminders/services/dreamReminderService';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { AppLocale } from '../../../i18n/types';
import { useI18n } from '../../../i18n/I18nProvider';

export default function SettingsScreen() {
  const t = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = createSettingsScreenStyles(t);
  const [reminderSettings, setReminderSettings] = React.useState<DreamReminderSettings>(() =>
    getDreamReminderSettings(),
  );
  const [permissionGranted, setPermissionGranted] = React.useState<boolean>(true);
  const [isApplyingReminder, setIsApplyingReminder] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDownloadingTranscriptionModel, setIsDownloadingTranscriptionModel] =
    React.useState(false);
  const [isDeletingTranscriptionModel, setIsDeletingTranscriptionModel] = React.useState(false);
  const [analysisSettings, setAnalysisSettings] = React.useState<DreamAnalysisSettings>(() =>
    getDreamAnalysisSettings(),
  );
  const [lastExportPath, setLastExportPath] = React.useState<string | null>(null);
  const [transcriptionModelStatus, setTranscriptionModelStatus] =
    React.useState<DreamTranscriptionModelStatus | null>(null);
  const [transcriptionDownloadProgress, setTranscriptionDownloadProgress] =
    React.useState<DreamTranscriptionProgress | null>(null);

  function formatModelSize(sizeBytes: number | null) {
    if (typeof sizeBytes !== 'number' || Number.isNaN(sizeBytes)) {
      return 'Unknown';
    }

    const sizeMiB = sizeBytes / (1024 * 1024);
    return `${sizeMiB.toFixed(sizeMiB >= 100 ? 0 : 1)} MiB`;
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
  }, []);

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

  async function onSelectTime(hour: number, minute: number) {
    await updateReminderSettings({
      ...reminderSettings,
      hour,
      minute,
    });
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

  function onToggleAnalysisEnabled() {
    setAnalysisSettings(current =>
      saveDreamAnalysisSettings({
        ...current,
        enabled: !current.enabled,
      }),
    );
  }

  function onSelectAnalysisProvider(nextProvider: DreamAnalysisSettings['provider']) {
    setAnalysisSettings(current =>
      saveDreamAnalysisSettings({
        ...current,
        provider: nextProvider,
      }),
    );
  }

  function onToggleAnalysisNetwork() {
    setAnalysisSettings(current =>
      saveDreamAnalysisSettings({
        ...current,
        allowNetwork: !current.allowNetwork,
      }),
    );
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
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{copy.title}</Text>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.versionTitle}</Text>
        <Text style={styles.description}>{APP_VERSION_LABEL}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.reminderTitle}</Text>
        <Text style={styles.description}>{copy.reminderDescription}</Text>

        <View style={styles.reminderMetaStack}>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>{copy.reminderStatusLabel}</Text>
            <Text style={styles.reminderValue}>
              {reminderSettings.enabled
                ? copy.reminderEnabled
                : copy.reminderDisabled}
            </Text>
          </View>

          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>{copy.reminderPermissionLabel}</Text>
            <Text style={styles.reminderValue}>
              {permissionGranted
                ? copy.reminderPermissionAllowed
                : copy.reminderPermissionBlocked}
            </Text>
          </View>
        </View>

        <Text style={styles.reminderHint}>{copy.reminderStateHint}</Text>

        <Text style={styles.reminderLabel}>{copy.reminderTimeLabel}</Text>
        <View style={styles.reminderTimeRow}>
          {REMINDER_TIME_OPTIONS.map(option => {
            const active =
              reminderSettings.hour === option.hour &&
              reminderSettings.minute === option.minute;
            return (
              <Pressable
                key={option.label}
                style={[
                  styles.reminderTimeChip,
                  active ? styles.reminderTimeChipActive : null,
                ]}
                disabled={isApplyingReminder}
                onPress={() => onSelectTime(option.hour, option.minute)}
              >
                <Text
                  style={[
                    styles.reminderTimeChipText,
                    active ? styles.reminderTimeChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title={
            reminderSettings.enabled
              ? copy.reminderDisableButton
              : copy.reminderEnableButton
          }
          variant={reminderSettings.enabled ? 'ghost' : 'primary'}
          onPress={onToggleReminder}
          disabled={isApplyingReminder}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.languageTitle}</Text>
        <Text style={styles.description}>{copy.languageDescription}</Text>
        <View style={styles.reminderTimeRow}>
          {([
            { value: 'en', label: copy.languageEnglish },
            { value: 'uk', label: copy.languageUkrainian },
          ] as Array<{ value: AppLocale; label: string }>).map(option => {
            const selected = locale === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.reminderTimeChip,
                  selected ? styles.reminderTimeChipActive : null,
                ]}
                disabled={isApplyingReminder}
                onPress={() => onSelectLocale(option.value)}
              >
                <Text
                  style={[
                    styles.reminderTimeChipText,
                    selected ? styles.reminderTimeChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.privacyTitle}</Text>
        <Text style={styles.description}>{copy.privacyDescription}</Text>
        <View style={styles.privacyRows}>
          <InfoRow label={copy.privacyStorageLabel} value={copy.privacyStorageValue} />
          <InfoRow label={copy.privacySyncLabel} value={copy.privacySyncValue} />
          <InfoRow label={copy.privacyAccountLabel} value={copy.privacyAccountValue} />
          <InfoRow label={copy.privacyReminderLabel} value={copy.privacyReminderValue} />
          <InfoRow
            label={copy.privacyTranscriptionLabel}
            value={copy.privacyTranscriptionValue}
          />
        </View>
        <Text style={styles.privacyFootnote}>{copy.privacyFootnote}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.transcriptionTitle}</Text>
        <Text style={styles.description}>{copy.transcriptionDescription}</Text>
        <View style={styles.privacyRows}>
          <InfoRow
            label={copy.transcriptionStatusLabel}
            value={
              transcriptionModelStatus?.installed
                ? copy.transcriptionStatusInstalled
                : copy.transcriptionStatusMissing
            }
          />
          <InfoRow
            label={copy.transcriptionSizeLabel}
            value={formatModelSize(transcriptionModelStatus?.sizeBytes ?? null)}
          />
          <InfoRow
            label={copy.transcriptionPathLabel}
            value={transcriptionModelStatus?.filePath ?? '...'}
          />
        </View>
        <Button
          title={
            isDownloadingTranscriptionModel
              ? formatDownloadProgress(transcriptionDownloadProgress) ??
                copy.transcriptionDownloadButtonBusy
              : copy.transcriptionDownloadButton
          }
          variant="primary"
          onPress={onDownloadTranscriptionModel}
          disabled={isDownloadingTranscriptionModel || Boolean(transcriptionModelStatus?.installed)}
        />
        <Button
          title={
            isDeletingTranscriptionModel
              ? copy.transcriptionDeleteButtonBusy
              : copy.transcriptionDeleteButton
          }
          variant="ghost"
          onPress={onDeleteTranscriptionModel}
          disabled={isDeletingTranscriptionModel || !transcriptionModelStatus?.installed}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.analysisTitle}</Text>
        <Text style={styles.description}>{copy.analysisDescription}</Text>
        <View style={styles.privacyRows}>
          <InfoRow
            label={copy.analysisEnabledLabel}
            value={analysisSettings.enabled ? copy.analysisEnabled : copy.analysisDisabled}
          />
          <InfoRow
            label={copy.analysisProviderLabel}
            value={
              analysisSettings.provider === 'openai'
                ? copy.analysisProviderOpenAi
                : copy.analysisProviderManual
            }
          />
          <InfoRow
            label={copy.analysisNetworkLabel}
            value={
              analysisSettings.allowNetwork
                ? copy.analysisNetworkAllowed
                : copy.analysisNetworkBlocked
            }
          />
        </View>
        <View style={styles.reminderTimeRow}>
          {([
            { value: 'manual', label: copy.analysisProviderManual },
            { value: 'openai', label: copy.analysisProviderOpenAi },
          ] as Array<{ value: DreamAnalysisSettings['provider']; label: string }>).map(option => {
            const selected = analysisSettings.provider === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.reminderTimeChip,
                  selected ? styles.reminderTimeChipActive : null,
                ]}
                onPress={() => onSelectAnalysisProvider(option.value)}
              >
                <Text
                  style={[
                    styles.reminderTimeChipText,
                    selected ? styles.reminderTimeChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          title={analysisSettings.enabled ? copy.analysisDisableButton : copy.analysisEnableButton}
          variant={analysisSettings.enabled ? 'ghost' : 'primary'}
          onPress={onToggleAnalysisEnabled}
        />
        <Button
          title={
            analysisSettings.allowNetwork
              ? copy.analysisNetworkBlockButton
              : copy.analysisNetworkAllowButton
          }
          variant="ghost"
          onPress={onToggleAnalysisNetwork}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.exportTitle}</Text>
        <Text style={styles.description}>{copy.exportDescription}</Text>
        <View style={styles.privacyRows}>
          <InfoRow label={copy.exportIncludesLabel} value={copy.exportIncludesValue} />
          <InfoRow label={copy.exportFormatLabel} value={copy.exportFormatValue} />
        </View>
        {lastExportPath ? (
          <View style={styles.exportPathBlock}>
            <Text style={styles.exportPathLabel}>{copy.exportLatestPathLabel}</Text>
            <Text style={styles.exportPathValue}>{lastExportPath}</Text>
          </View>
        ) : null}
        <Button
          title={isExporting ? copy.exportButtonBusy : copy.exportButton}
          variant="primary"
          onPress={onExportData}
          disabled={isExporting}
        />
        <Text style={styles.privacyFootnote}>{copy.exportFootnote}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.architectureTitle}</Text>
        <Text style={styles.description}>{copy.architectureDescription}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.plannedTitle}</Text>
        <Text style={styles.description}>
          {copy.plannedDescription}
        </Text>
      </Card>
    </ScreenContainer>
  );
}
