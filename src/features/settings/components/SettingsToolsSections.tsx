import React from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
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
            { value: 'manual', label: copy.analysisProviderManual },
            { value: 'openai', label: copy.analysisProviderOpenAi },
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
              { value: 'blocked', label: copy.analysisNetworkBlocked },
              { value: 'allowed', label: copy.analysisNetworkAllowed },
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
