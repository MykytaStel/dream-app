import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  openMonthlyReport,
  openWakeEntry,
} from '../../../app/navigation/navigationRef';
import { useSettingsScreenController } from '../hooks/useSettingsScreenController';
import {
  AnalysisSection,
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
import { SettingsActionRow } from '../components/SettingsActionRow';
import { SettingsSectionHeader } from '../components/SettingsSectionHeader';
import { SettingsSegmentedControl } from '../components/SettingsSegmentedControl';

type SettingsWorkspace = 'general' | 'backup' | 'tools';

export default function SettingsScreen() {
  const theme = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = createSettingsScreenStyles(theme);
  const [selectedWorkspace, setSelectedWorkspace] =
    React.useState<SettingsWorkspace>('general');

  const controller = useSettingsScreenController({
    locale,
    setLocale,
    copy,
  });

  const workspaceOptions = React.useMemo(
    () => [
      { value: 'general' as const, label: copy.sectionGeneral },
      { value: 'backup' as const, label: copy.sectionBackup },
      { value: 'tools' as const, label: copy.sectionTools },
    ],
    [copy.sectionBackup, copy.sectionGeneral, copy.sectionTools],
  );
  const backupStatusValue = React.useMemo(
    () =>
      controller.cloudSummaryHighlights[0]?.value ?? copy.cloudSessionSignedOut,
    [controller.cloudSummaryHighlights, copy.cloudSessionSignedOut],
  );
  const backupAccountValue = React.useMemo(
    () =>
      controller.cloudSummaryHighlights.find(
        item => item.label === copy.cloudAccountLabel,
      )?.value ?? copy.cloudAccountDisconnected,
    [
      controller.cloudSummaryHighlights,
      copy.cloudAccountDisconnected,
      copy.cloudAccountLabel,
    ],
  );
  const backupTeaserMeta = React.useMemo(() => {
    if (controller.cloudSession.status !== 'signed-in') {
      return backupAccountValue;
    }

    return `${backupAccountValue} • ${copy.cloudLastSyncLabel} ${controller.cloudSyncMetaTitle}`;
  }, [
    backupAccountValue,
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

      <Card style={styles.workspaceCard}>
        <SettingsSectionHeader title={copy.sectionTitle} />
        <SettingsSegmentedControl
          selectedValue={selectedWorkspace}
          onChange={setSelectedWorkspace}
          options={workspaceOptions}
          columns={3}
          minWidth={96}
        />
      </Card>

      {selectedWorkspace === 'general' ? (
        <>
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
              controller.onToggleReminder().catch(() => undefined)
            }
            onOpenReminderTimePicker={controller.onOpenReminderTimePicker}
            onNativeTimePickerChange={controller.onNativeTimePickerChange}
          />

          <Card style={styles.sectionCard}>
            <SettingsSectionHeader
              title={copy.backupScreenTitle}
              description={copy.cloudDescription}
            />
            <SettingsActionRow
              title={controller.cloudManageActionTitle}
              meta={backupTeaserMeta}
              value={backupStatusValue}
              onPress={() => setSelectedWorkspace('backup')}
            />
          </Card>

          <PrivacySection
            copy={copy}
            styles={styles}
            privacyHighlights={controller.privacyHighlights}
          />
        </>
      ) : null}

      {selectedWorkspace === 'backup' ? (
        <>
          <ExportSection
            copy={copy}
            styles={styles}
            highlights={controller.exportHighlights}
            isExportingJson={controller.isExportingJson}
            isExportingPdf={controller.isExportingPdf}
            lastExportPath={controller.lastExportPath}
            onExportJson={() =>
              controller.onExportData().catch(() => undefined)
            }
            onExportPdf={() =>
              controller.onExportPdfData().catch(() => undefined)
            }
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
        </>
      ) : null}

      {selectedWorkspace === 'tools' ? (
        <>
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
              controller.onDownloadTranscriptionModel().catch(() => undefined)
            }
            onDelete={() =>
              controller.onDeleteTranscriptionModel().catch(() => undefined)
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
                controller.onSeedDreams(250).catch(() => undefined)
              }
              onSeed1000={() =>
                controller.onSeedDreams(1000).catch(() => undefined)
              }
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
