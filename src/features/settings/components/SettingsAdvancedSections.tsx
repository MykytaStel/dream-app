import React from 'react';
import { Switch, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { type DreamImportMode, type LocalDreamExportFile } from '../services/dataImportService';
import { SettingsActionRow } from './SettingsActionRow';
import { SettingsMetaGrid, type SettingsMetaItem } from './SettingsMetaGrid';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SettingsSegmentedControl } from './SettingsSegmentedControl';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type SettingsStyles = ReturnType<typeof createSettingsScreenStyles>;

export function AdvancedToggleSection({
  copy,
  styles,
  showAdvanced,
  onToggle,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  showAdvanced: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.advancedToggleWrap}>
      <SettingsActionRow
        title={copy.advancedTitle}
        meta={copy.advancedDescription}
        value={showAdvanced ? copy.advancedHide : copy.advancedShow}
        onPress={onToggle}
      />
    </View>
  );
}

export function AnalysisSection({
  copy,
  styles,
  analysisSettings,
  analysisHighlights,
  onSave,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  analysisSettings: DreamAnalysisSettings;
  analysisHighlights: SettingsMetaItem[];
  onSave: (next: DreamAnalysisSettings) => void;
}) {
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
            trackColor={{ false: '#444B5A', true: '#7CC8FF' }}
            thumbColor="#F7F9FF"
          />
        }
      />
      <SettingsMetaGrid items={analysisHighlights} />
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
          variant="primary"
          size="sm"
          style={styles.buttonStackButton}
          onPress={onDownload}
          disabled={isDownloading || installed}
        />
        <Button
          title={isDeleting ? copy.transcriptionDeleteButtonBusy : copy.transcriptionDeleteButton}
          variant="ghost"
          size="sm"
          style={styles.buttonStackButton}
          onPress={onDelete}
          disabled={isDeleting || !installed}
        />
      </View>
    </Card>
  );
}

export function ExportSection({
  copy,
  styles,
  highlights,
  isExporting,
  lastExportPath,
  onExport,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  highlights: SettingsMetaItem[];
  isExporting: boolean;
  lastExportPath: string | null;
  onExport: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader title={copy.exportTitle} description={copy.exportDescription} />
      <SettingsMetaGrid items={highlights} />
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
          style={styles.buttonStackButton}
          onPress={onExport}
          disabled={isExporting}
        />
      </View>
      <Text style={styles.privacyFootnote}>{copy.exportFootnote}</Text>
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
          value={showRestorePreview ? copy.advancedHide : copy.advancedShow}
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
          title={
            isRestoringImport
              ? copy.restoreRestoreButtonBusy
              : importMode === 'merge'
                ? copy.restoreMergeButton
                : copy.restoreRestoreButton
          }
          variant={importMode === 'merge' ? 'ghost' : 'primary'}
          size="sm"
          style={styles.buttonStackButton}
          onPress={onRestoreImport}
          disabled={
            !selectedImportPath || isLoadingImportPreview || isRestoringImport || !selectedImportPreview
          }
        />
      </View>
    </Card>
  );
}

export function DevSection({
  copy,
  styles,
  seedDreamCount,
  isUpdatingSeedDreams,
  onSeed250,
  onSeed1000,
  onPreviewMonthlyReport,
  onClearSeedDreams,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  seedDreamCount: number;
  isUpdatingSeedDreams: boolean;
  onSeed250: () => void;
  onSeed1000: () => void;
  onPreviewMonthlyReport: () => void;
  onClearSeedDreams: () => void;
}) {
  return (
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
          title={copy.devPreviewMonthlyReport}
          variant="ghost"
          size="sm"
          style={styles.buttonStackButton}
          onPress={onPreviewMonthlyReport}
        />
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
