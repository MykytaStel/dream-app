import React from 'react';
import { View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { type DreamImportMode, type LocalDreamExportFile } from '../services/dataImportService';
import { SettingsActionRow } from './SettingsActionRow';
import { SettingsMetaGrid, type SettingsMetaItem } from './SettingsMetaGrid';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SettingsSegmentedControl } from './SettingsSegmentedControl';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type SettingsStyles = ReturnType<typeof createSettingsScreenStyles>;

function getRestoreActionState({
  copy,
  hasLocalBackups,
  selectedImportPath,
  selectedImportPreview,
  isLoadingImportPreview,
  isRestoringImport,
  importMode,
}: {
  copy: SettingsCopy;
  hasLocalBackups: boolean;
  selectedImportPath: string | null;
  selectedImportPreview: unknown | null;
  isLoadingImportPreview: boolean;
  isRestoringImport: boolean;
  importMode: DreamImportMode;
}) {
  const ready = Boolean(
    selectedImportPath && selectedImportPreview && !isLoadingImportPreview && !isRestoringImport,
  );

  const title = isRestoringImport
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

  return {
    ready,
    title,
    guidance: importMode === 'merge' ? copy.restoreMergeGuidance : copy.restoreReplaceWarning,
  };
}

export function ExportSection({
  copy,
  styles,
  isExportingJson,
  isExportingPdf,
  lastExportName,
  lastExportSummaryTitle,
  lastExportSummaryDescription,
  canOpenLastPdf,
  canShareLastExport,
  openLastPdfTitle,
  shareLastExportTitle,
  onExportJson,
  onExportPdf,
  onOpenLastPdf,
  onShareLastExport,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  isExportingJson: boolean;
  isExportingPdf: boolean;
  lastExportName: string | null;
  lastExportSummaryTitle: string | null;
  lastExportSummaryDescription: string | null;
  canOpenLastPdf: boolean;
  canShareLastExport: boolean;
  openLastPdfTitle: string;
  shareLastExportTitle: string;
  onExportJson: () => void;
  onExportPdf: () => void;
  onOpenLastPdf: () => void;
  onShareLastExport: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader title={copy.exportTitle} description={copy.exportDescription} />
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
      {lastExportName && lastExportSummaryTitle && lastExportSummaryDescription ? (
        <View style={styles.backupSuccessBlock}>
          <Text style={styles.backupSuccessTitle}>{lastExportSummaryTitle}</Text>
          <Text style={styles.backupSuccessText}>{lastExportSummaryDescription}</Text>
          <View style={styles.exportSummaryMeta}>
            <Text style={styles.exportPathLabel}>{copy.exportLatestPathLabel}</Text>
            <Text style={styles.exportPathValue}>{lastExportName}</Text>
          </View>
          {canOpenLastPdf || canShareLastExport ? (
            <View style={styles.buttonRow}>
              {canOpenLastPdf ? (
                <Button
                  title={openLastPdfTitle}
                  variant="ghost"
                  size="sm"
                  style={styles.buttonRowButton}
                  onPress={onOpenLastPdf}
                  disabled={isExportingJson || isExportingPdf}
                />
              ) : null}
              <Button
                title={shareLastExportTitle}
                variant="ghost"
                size="sm"
                style={styles.buttonRowButton}
                onPress={onShareLastExport}
                disabled={isExportingJson || isExportingPdf}
              />
            </View>
          ) : null}
        </View>
      ) : null}
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
  const hasLocalBackups = localExportFiles.length > 0;
  const restoreAction = getRestoreActionState({
    copy,
    hasLocalBackups,
    selectedImportPath,
    selectedImportPreview,
    isLoadingImportPreview,
    isRestoringImport,
    importMode,
  });

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader title={copy.restoreTitle} description={copy.restoreDescription} />

      <View style={styles.restoreModeWrap}>
        <Text style={styles.restoreLabel}>{copy.restoreModeLabel}</Text>
        <SettingsSegmentedControl
          selectedValue={importMode}
          onChange={onChangeMode}
          options={[
            { value: 'replace', label: copy.restoreModeReplace },
            { value: 'merge', label: copy.restoreModeMerge },
          ]}
        />
        <Text style={styles.restoreHint}>
          {importMode === 'merge' ? copy.restoreModeMergeHint : copy.restoreModeReplaceHint}
        </Text>
      </View>

      {localExportFiles.length ? (
        <>
          <Text style={styles.restoreLabel}>{`${copy.restoreAvailableLabel} (${localExportFiles.length})`}</Text>
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
          title={restoreAction.title}
          variant={restoreAction.ready ? (importMode === 'merge' ? 'primary' : 'danger') : 'ghost'}
          size="sm"
          style={styles.buttonStackButton}
          onPress={onRestoreImport}
          disabled={!restoreAction.ready}
        />
        <Text style={styles.privacyFootnote}>{restoreAction.guidance}</Text>
      </View>
    </Card>
  );
}
