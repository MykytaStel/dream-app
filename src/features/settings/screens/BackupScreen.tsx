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
  ExportSection,
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

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: copy.backupScreenTitle,
    });
  }, [copy.backupScreenTitle, navigation]);

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Text style={styles.restoreHint}>{copy.backupScreenSubtitle}</Text>
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
          title={copy.backupTimelineTitle}
          subtitle={copy.backupTimelineDescription}
        />
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
      </Card>
      <Card style={styles.sectionCard}>
        <SectionHeader
          title={copy.backupContentTrustTitle}
          subtitle={copy.backupContentTrustDescription}
        />
        {controller.backupContentTrustItems.map(item => (
          <SettingsActionRow
            key={item.key}
            title={item.title}
            meta={item.meta}
            value={item.value}
          />
        ))}
      </Card>
      <ExportSection
        copy={copy}
        styles={styles}
        isExportingJson={controller.isExportingJson}
        isExportingPdf={controller.isExportingPdf}
        lastExportName={controller.lastExportName}
        lastExportSummaryTitle={controller.lastExportSummaryTitle}
        lastExportSummaryDescription={controller.lastExportSummaryDescription}
        canOpenLastPdf={controller.canOpenLastPdf}
        canShareLastExport={controller.canShareLastExport}
        openLastPdfTitle={controller.openLastPdfTitle}
        shareLastExportTitle={controller.shareLastExportTitle}
        onExportJson={() =>
          controller.onExportData().catch(e =>
            logActionError('BackupScreen.onExportData', e),
          )
        }
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
        onShareLastExport={() =>
          controller.onShareLastExport().catch(e =>
            logActionError('BackupScreen.onShareLastExport', e),
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
    </ScreenContainer>
  );
}
