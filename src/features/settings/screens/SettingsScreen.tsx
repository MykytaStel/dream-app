import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  openBackupOnboardingPreview,
  openMonthlyReport,
  openSyncDiagnosticsPreview,
  openWakeEntry,
} from '../../../app/navigation/navigationRef';
import { logActionError } from '../../../app/errorReporting';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useSettingsScreenController } from '../hooks/useSettingsScreenController';
import {
  AnalysisSection,
  DevSection,
  TranscriptionSection,
} from '../components/SettingsAdvancedSections';
import {
  BiometricLockSection,
  PrivacySection,
  ReminderSection,
  SettingsHeroSection,
} from '../components/SettingsTopSections';
import { SettingsActionRow } from '../components/SettingsActionRow';

export default function SettingsScreen() {
  const theme = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = React.useMemo(() => createSettingsScreenStyles(theme), [theme]);

  const controller = useSettingsScreenController({
    locale,
    setLocale,
    copy,
  });

  const backupTeaserMeta = React.useMemo(() => {
    if (controller.cloudSession.status !== 'signed-in') {
      return controller.cloudSummaryAccountValue;
    }

    return `${controller.cloudSummaryAccountValue} • ${copy.cloudLastSyncLabel} ${controller.cloudSyncMetaTitle}`;
  }, [
    controller.cloudSummaryAccountValue,
    controller.cloudSession.status,
    controller.cloudSyncMetaTitle,
    copy.cloudLastSyncLabel,
  ]);

  return (
    <ScreenContainer scroll>
      <SettingsHeroSection
        copy={copy}
        locale={locale}
        isApplyingReminder={controller.isApplyingReminder}
        onSelectLocale={controller.onSelectLocale}
        styles={styles}
      />

      <ReminderSection
        copy={copy}
        styles={styles}
        reminderSettings={controller.reminderSettings}
        permissionGranted={controller.permissionGranted}
        isApplyingReminder={controller.isApplyingReminder}
        reminderTime={controller.reminderTime}
        showIosTimePicker={controller.showIosTimePicker}
        pickerLocale={controller.pickerLocale}
        getReminderDate={controller.getReminderDate}
        onToggleReminder={() =>
          controller.onToggleReminder().catch(e =>
            logActionError('SettingsScreen.onToggleReminder', e),
          )
        }
        onOpenReminderTimePicker={controller.onOpenReminderTimePicker}
        onNativeTimePickerChange={controller.onNativeTimePickerChange}
      />

      <Card style={styles.sectionCard}>
        <SettingsActionRow
          title={copy.backupScreenTitle}
          meta={backupTeaserMeta}
          value={controller.cloudSummaryStatusValue}
          variant="inline"
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.Backup)}
        />
      </Card>

      <BiometricLockSection
        copy={copy}
        styles={styles}
        biometricAvailability={controller.biometricAvailability}
        biometricLockEnabled={controller.biometricLockEnabled}
        isApplyingBiometricLock={controller.isApplyingBiometricLock}
        onToggleBiometricLock={() =>
          controller.onToggleBiometricLock().catch(e =>
            logActionError('SettingsScreen.onToggleBiometricLock', e),
          )
        }
      />

      <PrivacySection
        copy={copy}
        styles={styles}
        privacyHighlights={controller.privacyHighlights}
      />

      <AnalysisSection
        copy={copy}
        styles={styles}
        analysisSettings={controller.analysisSettings}
        onSave={controller.saveNextAnalysisSettings}
      />

      <TranscriptionSection
        copy={copy}
        styles={styles}
        highlights={controller.transcriptionHighlights}
        isDownloading={controller.isDownloadingTranscriptionModel}
        isDeleting={controller.isDeletingTranscriptionModel}
        downloadLabel={controller.transcriptionDownloadLabel}
        installed={controller.transcriptionModelInstalled}
        onDownload={() =>
          controller.onDownloadTranscriptionModel().catch(e =>
            logActionError('SettingsScreen.onDownloadTranscriptionModel', e),
          )
        }
        onDelete={() =>
          controller.onDeleteTranscriptionModel().catch(e =>
            logActionError('SettingsScreen.onDeleteTranscriptionModel', e),
          )
        }
      />

      {controller.__DEV__ ? (
        <DevSection
          copy={copy}
          styles={styles}
          seedDreamCount={controller.seedDreamCount}
          isUpdatingSeedDreams={controller.isUpdatingSeedDreams}
          onPreviewWakeFlow={() => openWakeEntry({ source: 'manual' })}
          onSeed250={() =>
            controller.onSeedDreams(250).catch(e =>
              logActionError('SettingsScreen.onSeedDreams', e),
            )
          }
          onSeed1000={() =>
            controller.onSeedDreams(1000).catch(e =>
              logActionError('SettingsScreen.onSeedDreams', e),
            )
          }
          onPreviewMonthlyReport={() => openMonthlyReport()}
          onPreviewBackupOnboarding={() => openBackupOnboardingPreview()}
          onPreviewSyncDiagnostics={() => openSyncDiagnosticsPreview()}
          onClearSeedDreams={controller.onClearSeedDreams}
        />
      ) : null}

      <View style={styles.footerBlock}>
        <Text style={styles.footerVersion}>
          {`${copy.footerBuildLabel} ${controller.APP_VERSION_LABEL}`}
        </Text>
        <Text style={styles.footerMeta}>{controller.footerMeta}</Text>
      </View>
    </ScreenContainer>
  );
}
