import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { logActionError } from '../../../app/errorReporting';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { SettingsActionRow } from '../components/SettingsActionRow';
import { CloudSection } from '../components/SettingsCloudSection';
import { SettingsMetaGrid } from '../components/SettingsMetaGrid';
import {
  BackupFlowGuideSection,
  BackupExportSection,
  PortableExportSection,
  PdfExportSection,
  RestoreSection,
} from '../components/SettingsAdvancedSections';
import { useBackupScreenController } from '../hooks/useBackupScreenController';
import { createSettingsScreenStyles } from './SettingsScreen.styles';

export default function BackupScreen() {
  const theme = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = React.useMemo(() => createSettingsScreenStyles(theme), [theme]);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.Backup>
    >();
  const controller = useBackupScreenController({
    locale,
    setLocale,
    copy,
  });
  const [showStatusDetails, setShowStatusDetails] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: copy.backupScreenTitle,
    });
  }, [copy.backupScreenTitle, navigation]);

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Text style={styles.restoreHint}>{copy.backupScreenSubtitle}</Text>
      <SectionHeader
        title={copy.backupLocalSectionTitle}
        subtitle={copy.backupLocalSectionDescription}
      />
      <BackupFlowGuideSection copy={copy} styles={styles} />
      <BackupExportSection
        copy={copy}
        styles={styles}
        isExportingJson={controller.isExportingJson}
        isBusy={
          controller.isExportingJson ||
          controller.isExportingMarkdown ||
          controller.isExportingText ||
          controller.isExportingPdf
        }
        lastBackupName={controller.lastBackupName}
        onExportJson={() =>
          controller.onExportData().catch(e =>
            logActionError('BackupScreen.onExportData', e),
          )
        }
        onShareLastBackup={() =>
          controller.onShareLastBackup().catch(e =>
            logActionError('BackupScreen.onShareLastBackup', e),
          )
        }
      />
      <PortableExportSection
        copy={copy}
        styles={styles}
        isExportingMarkdown={controller.isExportingMarkdown}
        isExportingText={controller.isExportingText}
        isBusy={
          controller.isExportingJson ||
          controller.isExportingMarkdown ||
          controller.isExportingText ||
          controller.isExportingPdf
        }
        lastMarkdownName={controller.lastMarkdownName}
        lastTextName={controller.lastTextName}
        onExportMarkdown={() =>
          controller.onExportMarkdownData().catch(e =>
            logActionError('BackupScreen.onExportMarkdownData', e),
          )
        }
        onExportText={() =>
          controller.onExportTextData().catch(e =>
            logActionError('BackupScreen.onExportTextData', e),
          )
        }
        onOpenLastMarkdown={() =>
          controller.onOpenLastMarkdown().catch(e =>
            logActionError('BackupScreen.onOpenLastMarkdown', e),
          )
        }
        onOpenLastText={() =>
          controller.onOpenLastText().catch(e =>
            logActionError('BackupScreen.onOpenLastText', e),
          )
        }
        onShareLastMarkdown={() =>
          controller.onShareLastMarkdown().catch(e =>
            logActionError('BackupScreen.onShareLastMarkdown', e),
          )
        }
        onShareLastText={() =>
          controller.onShareLastText().catch(e =>
            logActionError('BackupScreen.onShareLastText', e),
          )
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
      <PdfExportSection
        copy={copy}
        styles={styles}
        isExportingPdf={controller.isExportingPdf}
        isBusy={
          controller.isExportingJson ||
          controller.isExportingMarkdown ||
          controller.isExportingText ||
          controller.isExportingPdf
        }
        lastPdfName={controller.lastPdfName}
        onExportPdf={() =>
          controller.onExportPdfData().catch(e =>
            logActionError('BackupScreen.onExportPdfData', e),
          )
        }
        onOpenLastPdf={() =>
          controller.onOpenLastPdf().catch(e =>
            logActionError('BackupScreen.onOpenLastPdf', e),
          )
        }
        onShareLastPdf={() =>
          controller.onShareLastPdf().catch(e =>
            logActionError('BackupScreen.onShareLastPdf', e),
          )
        }
      />
      <SectionHeader
        title={copy.backupCloudSectionTitle}
        subtitle={copy.backupCloudSectionDescription}
      />
      <CloudSection
        copy={copy}
        styles={styles}
        highlights={controller.cloudHighlights}
        showDeveloperCloudConfig={__DEV__}
        cloudConfigured={controller.cloudConfigured}
        cloudSessionStatus={controller.cloudSession.status}
        cloudSessionIsAnonymous={controller.cloudSessionIsAnonymous}
        cloudSyncEnabled={controller.cloudSyncEnabled}
        cloudSyncEnabledDisabled={controller.cloudSyncEnabledDisabled}
        cloudConfigUrl={controller.cloudConfigDraft.url}
        cloudConfigAnonKey={controller.cloudConfigDraft.anonKey}
        cloudIdentityEmail={controller.cloudIdentityEmail}
        cloudIdentityPassword={controller.cloudIdentityPassword}
        isConnectingCloud={controller.isConnectingCloud}
        isSigningInCloudAccount={controller.isSigningInCloudAccount}
        isRequestingCloudPasswordReset={
          controller.isRequestingCloudPasswordReset
        }
        isUpgradingCloudAccount={controller.isUpgradingCloudAccount}
        isDisconnectingCloud={controller.isDisconnectingCloud}
        isSyncingCloud={controller.isSyncingCloud}
        cloudActionFeedback={controller.cloudActionFeedback}
        cloudSyncMetaTitle={controller.cloudSyncMetaTitle}
        cloudSyncMetaDescription={controller.cloudSyncMetaDescription}
        onChangeCloudConfigUrl={controller.onChangeCloudConfigUrl}
        onChangeCloudConfigAnonKey={controller.onChangeCloudConfigAnonKey}
        onChangeCloudIdentityEmail={controller.onChangeCloudIdentityEmail}
        onChangeCloudIdentityPassword={
          controller.onChangeCloudIdentityPassword
        }
        onSaveCloudConfig={controller.onSaveCloudConfig}
        onClearCloudConfig={controller.onClearCloudConfig}
        onConnectCloud={() =>
          controller.onConnectCloud().catch(e =>
            logActionError('BackupScreen.onConnectCloud', e),
          )
        }
        onSignInCloudAccount={() =>
          controller.onSignInCloudAccount().catch(e =>
            logActionError('BackupScreen.onSignInCloudAccount', e),
          )
        }
        onRequestCloudPasswordReset={() =>
          controller.onRequestCloudPasswordReset().catch(e =>
            logActionError('BackupScreen.onRequestCloudPasswordReset', e),
          )
        }
        onUpgradeCloudAccount={() =>
          controller.onUpgradeCloudAccount().catch(e =>
            logActionError('BackupScreen.onUpgradeCloudAccount', e),
          )
        }
        onDisconnectCloud={() =>
          controller.onDisconnectCloud().catch(e =>
            logActionError('BackupScreen.onDisconnectCloud', e),
          )
        }
        onRunCloudSync={() =>
          controller.onRunCloudSync().catch(e =>
            logActionError('BackupScreen.onRunCloudSync', e),
          )
        }
        onToggleCloudSync={controller.onToggleCloudSync}
        onDismissCloudActionFeedback={controller.clearCloudActionFeedback}
      />
      <Card style={styles.sectionCard}>
        <SectionHeader
          title={copy.backupStatusTitle}
          subtitle={copy.backupStatusDescription}
        />
        <SettingsActionRow
          title={copy.backupStatusToggleTitle}
          meta={
            showStatusDetails
              ? copy.backupStatusToggleMetaExpanded
              : copy.backupStatusToggleMetaCollapsed
          }
          value={showStatusDetails ? copy.toggleHide : copy.toggleShow}
          onPress={() => setShowStatusDetails(current => !current)}
        />
        {showStatusDetails ? (
          <>
            <View style={styles.restorePreviewBlock}>
              <Text style={styles.restoreLabel}>{copy.backupTimelineTitle}</Text>
              <Text style={styles.restoreHint}>{copy.backupTimelineDescription}</Text>
            </View>
            {controller.backupTimelineItems.map(item => (
              <SettingsActionRow
                key={item.key}
                title={item.title}
                meta={item.meta}
                value={item.value}
              />
            ))}

            {controller.latestLocalBackupPreview ? (
              <>
                <View style={styles.restorePreviewBlock}>
                  <Text style={styles.restoreLabel}>{copy.restorePreviewTitle}</Text>
                  <Text style={styles.restoreHint}>
                    {controller.latestLocalBackupPreviewMeta ?? copy.restoreDescription}
                  </Text>
                </View>
                <View style={styles.restorePreviewBlock}>
                  <SettingsMetaGrid items={controller.latestLocalBackupPreviewItems} />
                </View>
              </>
            ) : controller.latestLocalBackupPreviewError ? (
              <View style={styles.restoreEmptyBlock}>
                <Text style={styles.restoreEmptyTitle}>{copy.restoreErrorTitle}</Text>
                <Text style={styles.restoreHint}>
                  {controller.latestLocalBackupPreviewError}
                </Text>
              </View>
            ) : controller.isLoadingLatestLocalBackupPreview ? (
              <View style={styles.restoreEmptyBlock}>
                <Text style={styles.restoreEmptyTitle}>{copy.restoreLoading}</Text>
                <Text style={styles.restoreHint}>{copy.restoreLoadingAction}</Text>
              </View>
            ) : (
              <View style={styles.restoreEmptyBlock}>
                <Text style={styles.restoreEmptyTitle}>{copy.backupTimelineSnapshotMissing}</Text>
                <Text style={styles.restoreHint}>{copy.backupTimelineSnapshotMissingMeta}</Text>
              </View>
            )}

            <View style={styles.restorePreviewBlock}>
              <Text style={styles.restoreLabel}>{copy.backupContentTrustTitle}</Text>
              <Text style={styles.restoreHint}>{copy.backupContentTrustDescription}</Text>
            </View>
            {controller.backupContentTrustItems.map(item => (
              <SettingsActionRow
                key={item.key}
                title={item.title}
                meta={item.meta}
                value={item.value}
              />
            ))}
          </>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}
