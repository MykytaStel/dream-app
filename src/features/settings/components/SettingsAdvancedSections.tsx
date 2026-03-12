import React from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { type DreamImportMode, type LocalDreamExportFile } from '../services/dataImportService';
import { SettingsActionRow } from './SettingsActionRow';
import { SettingsMetaGrid, type SettingsMetaItem } from './SettingsMetaGrid';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SettingsSegmentedControl } from './SettingsSegmentedControl';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type SettingsStyles = ReturnType<typeof createSettingsScreenStyles>;
export function AnalysisSection({
  copy,
  styles,
  analysisSettings,
  onSave,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  analysisSettings: DreamAnalysisSettings;
  onSave: (next: DreamAnalysisSettings) => void;
}) {
  const t = useTheme<Theme>();
  const showNetworkControls = analysisSettings.provider === 'openai';

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.analysisTitle}
        description={copy.analysisDescription}
        trailing={
          <Switch
            value={analysisSettings.enabled}
            onValueChange={enabled => {
              onSave({
                ...analysisSettings,
                enabled,
              });
            }}
            trackColor={{ false: t.colors.switchTrackOff, true: t.colors.primary }}
            thumbColor={t.colors.text}
          />
        }
      />
      <View style={styles.settingControlBlock}>
        <Text style={styles.restoreLabel}>{copy.analysisProviderLabel}</Text>
        <SettingsSegmentedControl
          selectedValue={analysisSettings.provider}
          onChange={provider =>
            onSave({
              ...analysisSettings,
              provider,
              allowNetwork: provider === 'manual' ? false : analysisSettings.allowNetwork,
            })
          }
          options={[
            {
              value: 'manual',
              label: copy.analysisProviderManual,
            },
            {
              value: 'openai',
              label: copy.analysisProviderOpenAi,
            },
          ]}
        />
      </View>
      {showNetworkControls ? (
        <View style={styles.settingControlBlock}>
          <Text style={styles.restoreLabel}>{copy.analysisNetworkLabel}</Text>
          <SettingsSegmentedControl
            selectedValue={analysisSettings.allowNetwork ? 'allowed' : 'blocked'}
            onChange={value =>
              onSave({
                ...analysisSettings,
                allowNetwork: value === 'allowed',
              })
            }
            options={[
              {
                value: 'blocked',
                label: copy.analysisNetworkBlocked,
              },
              {
                value: 'allowed',
                label: copy.analysisNetworkAllowed,
              },
            ]}
          />
        </View>
      ) : (
        <SettingsActionRow
          title={copy.analysisNetworkLabel}
          meta={copy.analysisLocalNetworkHint}
          value={copy.analysisNetworkBlocked}
          variant="inline"
        />
      )}
    </Card>
  );
}

export function TranscriptionSection({
  copy,
  styles,
  highlights,
  isDownloading,
  isDeleting,
  downloadLabel,
  installed,
  onDownload,
  onDelete,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  highlights: SettingsMetaItem[];
  isDownloading: boolean;
  isDeleting: boolean;
  downloadLabel: string;
  installed: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.transcriptionTitle}
        description={copy.transcriptionDescription}
      />
      <SettingsMetaGrid items={highlights} />
      <View style={styles.buttonStack}>
        <Button
          title={downloadLabel}
          variant={installed ? 'ghost' : 'primary'}
          size="sm"
          style={styles.buttonStackButton}
          onPress={onDownload}
          disabled={isDownloading || installed}
        />
        {installed ? (
          <Button
            title={isDeleting ? copy.transcriptionDeleteButtonBusy : copy.transcriptionDeleteButton}
            variant="ghost"
            size="sm"
            style={styles.buttonStackButton}
            onPress={onDelete}
            disabled={isDeleting}
          />
        ) : (
          <Text style={styles.privacyFootnote}>{copy.transcriptionMissingHint}</Text>
        )}
      </View>
    </Card>
  );
}

export function ExportSection({
  copy,
  styles,
  highlights,
  isExportingJson,
  isExportingPdf,
  lastExportPath,
  onExportJson,
  onExportPdf,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  highlights: SettingsMetaItem[];
  isExportingJson: boolean;
  isExportingPdf: boolean;
  lastExportPath: string | null;
  onExportJson: () => void;
  onExportPdf: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader title={copy.exportTitle} description={copy.exportDescription} />
      {highlights.map(item => (
        <SettingsActionRow
          key={item.label}
          title={item.label}
          meta={item.value}
          variant="inline"
        />
      ))}
      {lastExportPath ? (
        <View style={styles.exportPathBlock}>
          <Text style={styles.exportPathLabel}>{copy.exportLatestPathLabel}</Text>
          <Text style={styles.exportPathValue}>{lastExportPath}</Text>
        </View>
      ) : null}
      <View style={styles.buttonRow}>
        <Button
          title={isExportingJson ? copy.exportButtonBusy : copy.exportButton}
          variant="primary"
          size="sm"
          style={styles.buttonRowButton}
          onPress={onExportJson}
          disabled={isExportingJson || isExportingPdf}
        />
        <Button
          title={isExportingPdf ? copy.exportPdfButtonBusy : copy.exportPdfButton}
          variant="ghost"
          size="sm"
          style={styles.buttonRowButton}
          onPress={onExportPdf}
          disabled={isExportingJson || isExportingPdf}
        />
      </View>
      <View style={styles.guidanceStack}>
        <Text style={styles.privacyFootnote}>{copy.exportJsonGuidance}</Text>
        <Text style={styles.privacyFootnote}>{copy.exportPdfGuidance}</Text>
      </View>
    </Card>
  );
}

export function RestoreSection({
  copy,
  styles,
  importMode,
  onChangeMode,
  localExportFiles,
  isLoadingLocalExports,
  selectedImportPath,
  onSelectImportFile,
  formatBackupListTitle,
  formatBackupListMeta,
  importPreviewError,
  selectedImportPreview,
  showRestorePreview,
  onToggleRestorePreview,
  restorePreviewMeta,
  restorePreviewItems,
  lastRestorePreview,
  restoreSuccessItems,
  isRestoringImport,
  isLoadingImportPreview,
  onRestoreImport,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  importMode: DreamImportMode;
  onChangeMode: (mode: DreamImportMode) => void;
  localExportFiles: LocalDreamExportFile[];
  isLoadingLocalExports: boolean;
  selectedImportPath: string | null;
  onSelectImportFile: (path: string) => void;
  formatBackupListTitle: (value: number) => string;
  formatBackupListMeta: (fileName: string) => string;
  importPreviewError: string | null;
  selectedImportPreview: unknown | null;
  showRestorePreview: boolean;
  onToggleRestorePreview: () => void;
  restorePreviewMeta: string | null;
  restorePreviewItems: SettingsMetaItem[];
  lastRestorePreview: unknown | null;
  restoreSuccessItems: SettingsMetaItem[];
  isRestoringImport: boolean;
  isLoadingImportPreview: boolean;
  onRestoreImport: () => void;
}) {
  const hasLocalBackups = localExportFiles.length > 0;
  const restoreReady = Boolean(
    selectedImportPath && selectedImportPreview && !isLoadingImportPreview && !isRestoringImport,
  );
  const restoreButtonTitle = isRestoringImport
    ? copy.restoreRestoreButtonBusy
    : !hasLocalBackups
      ? copy.restoreNoBackupAction
      : !selectedImportPath
        ? copy.restoreSelectBackupAction
        : isLoadingImportPreview
          ? copy.restoreLoadingAction
          : importMode === 'merge'
            ? copy.restoreMergeButton
            : copy.restoreRestoreButton;
  const restoreGuidance =
    importMode === 'merge' ? copy.restoreMergeGuidance : copy.restoreReplaceWarning;

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.restoreTitle}
        description={copy.restoreDescription}
      />

      <View style={styles.restoreModeWrap}>
        <Text style={styles.restoreLabel}>{copy.restoreModeLabel}</Text>
        <SettingsSegmentedControl
          selectedValue={importMode}
          onChange={onChangeMode}
          options={[
            {
              value: 'replace',
              label: copy.restoreModeReplace,
            },
            {
              value: 'merge',
              label: copy.restoreModeMerge,
            },
          ]}
        />
        <Text style={styles.restoreHint}>
          {importMode === 'merge' ? copy.restoreModeMergeHint : copy.restoreModeReplaceHint}
        </Text>
      </View>

      {localExportFiles.length ? (
        <>
          <Text style={styles.restoreLabel}>
            {`${copy.restoreAvailableLabel} (${localExportFiles.length})`}
          </Text>
          <View style={styles.restoreList}>
            {localExportFiles.slice(0, 4).map(file => (
              <SettingsActionRow
                key={file.filePath}
                title={formatBackupListTitle(file.modifiedAt)}
                meta={formatBackupListMeta(file.fileName)}
                value={selectedImportPath === file.filePath ? copy.restoreSelectedValue : undefined}
                onPress={() => onSelectImportFile(file.filePath)}
              />
            ))}
          </View>
        </>
      ) : isLoadingLocalExports ? (
        <Text style={styles.restoreHint}>{copy.restoreLoading}</Text>
      ) : (
        <View style={styles.restoreEmptyBlock}>
          <Text style={styles.restoreEmptyTitle}>{copy.restoreEmptyTitle}</Text>
          <Text style={styles.restoreHint}>{copy.restoreEmptyDescription}</Text>
        </View>
      )}

      {importPreviewError ? (
        <View style={styles.restoreEmptyBlock}>
          <Text style={styles.restoreEmptyTitle}>{copy.restoreErrorTitle}</Text>
          <Text style={styles.restoreHint}>{importPreviewError}</Text>
        </View>
      ) : null}

      {selectedImportPreview ? (
        <SettingsActionRow
          title={copy.restorePreviewTitle}
          meta={restorePreviewMeta ?? undefined}
          value={showRestorePreview ? copy.toggleHide : copy.toggleShow}
          onPress={onToggleRestorePreview}
        />
      ) : null}

      {selectedImportPreview && showRestorePreview ? (
        <View style={styles.restorePreviewBlock}>
          <SettingsMetaGrid items={restorePreviewItems} />
        </View>
      ) : null}

      {lastRestorePreview ? (
        <View style={styles.restorePreviewBlock}>
          <Text style={styles.restoreLabel}>{copy.restoreSuccessTitle}</Text>
          <SettingsMetaGrid items={restoreSuccessItems} />
        </View>
      ) : null}

      <View style={styles.buttonStack}>
        <Button
          title={restoreButtonTitle}
          variant={restoreReady ? (importMode === 'merge' ? 'primary' : 'danger') : 'ghost'}
          size="sm"
          style={styles.buttonStackButton}
          onPress={onRestoreImport}
          disabled={!restoreReady}
        />
        <Text style={styles.privacyFootnote}>{restoreGuidance}</Text>
      </View>
    </Card>
  );
}

export function DevSection({
  copy,
  styles,
  seedDreamCount,
  isUpdatingSeedDreams,
  onPreviewWakeFlow,
  onSeed250,
  onSeed1000,
  onPreviewMonthlyReport,
  onClearSeedDreams,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  seedDreamCount: number;
  isUpdatingSeedDreams: boolean;
  onPreviewWakeFlow: () => void;
  onSeed250: () => void;
  onSeed1000: () => void;
  onPreviewMonthlyReport: () => void;
  onClearSeedDreams: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.developerToolsTitle}
        description={copy.developerToolsDescription}
      />
      <SettingsActionRow
        title={copy.reminderPreviewWakeAction}
        meta={copy.reminderPreviewWakeMeta}
        variant="inline"
        onPress={onPreviewWakeFlow}
      />
      <SettingsActionRow
        title={copy.devPreviewMonthlyReport}
        variant="inline"
        onPress={onPreviewMonthlyReport}
      />
      <Text style={styles.restoreLabel}>{copy.scaleTestTitle}</Text>
      <SettingsActionRow
        title={copy.scaleTestSeededLabel}
        value={String(seedDreamCount)}
        variant="inline"
      />
      <View style={styles.buttonRow}>
        <Button
          title={isUpdatingSeedDreams ? copy.scaleTestBusy : copy.scaleTestAdd250}
          variant="ghost"
          size="sm"
          style={styles.buttonRowButton}
          onPress={onSeed250}
          disabled={isUpdatingSeedDreams}
        />
        <Button
          title={isUpdatingSeedDreams ? copy.scaleTestBusy : copy.scaleTestAdd1000}
          variant="primary"
          size="sm"
          style={styles.buttonRowButton}
          onPress={onSeed1000}
          disabled={isUpdatingSeedDreams}
        />
      </View>
      <View style={styles.buttonStack}>
        <Button
          title={copy.scaleTestClear}
          variant="ghost"
          size="sm"
          style={styles.buttonStackButton}
          onPress={onClearSeedDreams}
          disabled={isUpdatingSeedDreams || seedDreamCount === 0}
        />
      </View>
    </Card>
  );
}
