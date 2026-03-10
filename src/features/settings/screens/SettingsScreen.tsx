import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import { openMonthlyReport, openWakeEntry } from '../../../app/navigation/navigationRef';
import { useSettingsScreenController } from '../hooks/useSettingsScreenController';
import {
  AnalysisSection,
  AdvancedToggleSection,
  DevSection,
  ExportSection,
  RestoreSection,
  TranscriptionSection,
} from '../components/SettingsAdvancedSections';
import {
  PrivacySection,
  ReminderSection,
  SettingsHeroSection,
} from '../components/SettingsTopSections';

export default function SettingsScreen() {
  const theme = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = createSettingsScreenStyles(theme);

  const controller = useSettingsScreenController({
    locale,
    setLocale,
    copy,
  });

  return (
    <ScreenContainer scroll>
      <SettingsHeroSection
        copy={copy}
        locale={locale}
        styles={styles}
        isApplyingReminder={controller.isApplyingReminder}
        onSelectLocale={controller.onSelectLocale}
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
        onToggleReminder={() => controller.onToggleReminder().catch(() => undefined)}
        onOpenReminderTimePicker={controller.onOpenReminderTimePicker}
        onNativeTimePickerChange={controller.onNativeTimePickerChange}
        onPreviewWakeFlow={() => openWakeEntry({ source: 'manual' })}
      />

      <PrivacySection
        copy={copy}
        styles={styles}
        privacyHighlights={controller.privacyHighlights}
      />

      <AdvancedToggleSection
        copy={copy}
        styles={styles}
        showAdvanced={controller.showAdvanced}
        onToggle={() => controller.setShowAdvanced(current => !current)}
      />

      {controller.showAdvanced ? (
        <>
          <AnalysisSection
            copy={copy}
            styles={styles}
            analysisSettings={controller.analysisSettings}
            analysisHighlights={controller.analysisHighlights}
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
            onDownload={() => controller.onDownloadTranscriptionModel().catch(() => undefined)}
            onDelete={() => controller.onDeleteTranscriptionModel().catch(() => undefined)}
          />

          <ExportSection
            copy={copy}
            styles={styles}
            highlights={controller.exportHighlights}
            isExporting={controller.isExporting}
            lastExportPath={controller.lastExportPath}
            onExport={() => controller.onExportData().catch(() => undefined)}
          />

          <RestoreSection
            copy={copy}
            styles={styles}
            importMode={controller.importMode}
            onChangeMode={controller.setImportMode}
            localExportFiles={controller.localExportFiles}
            isLoadingLocalExports={controller.isLoadingLocalExports}
            selectedImportPath={controller.selectedImportPath}
            onSelectImportFile={controller.onSelectImportFile}
            formatBackupListTitle={controller.formatBackupListTitle}
            formatBackupListMeta={controller.formatBackupListMeta}
            importPreviewError={controller.importPreviewError}
            selectedImportPreview={controller.selectedImportPreview}
            showRestorePreview={controller.showRestorePreview}
            onToggleRestorePreview={() =>
              controller.setShowRestorePreview(current => !current)
            }
            restorePreviewMeta={controller.restorePreviewMeta}
            restorePreviewItems={controller.restorePreviewItems}
            lastRestorePreview={controller.lastRestorePreview}
            restoreSuccessItems={controller.restoreSuccessItems}
            isRestoringImport={controller.isRestoringImport}
            isLoadingImportPreview={controller.isLoadingImportPreview}
            onRestoreImport={controller.onRestoreImport}
          />

          {controller.__DEV__ ? (
            <DevSection
              copy={copy}
              styles={styles}
              seedDreamCount={controller.seedDreamCount}
              isUpdatingSeedDreams={controller.isUpdatingSeedDreams}
              onSeed250={() => controller.onSeedDreams(250).catch(() => undefined)}
              onSeed1000={() => controller.onSeedDreams(1000).catch(() => undefined)}
              onPreviewMonthlyReport={() => openMonthlyReport()}
              onClearSeedDreams={controller.onClearSeedDreams}
            />
          ) : null}
        </>
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
