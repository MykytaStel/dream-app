import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { Button } from '../../../../components/ui/Button';
import { TagChip } from '../../../../components/ui/TagChip';
import { InfoRow } from '../../../../components/ui/InfoRow';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import type { Theme } from '../../../../theme/theme';
import { formatMetaTimestamp } from '../../model/dreamDetailPresentation';
import type { DreamAnalysisSettings } from '../../../analysis/model/dreamAnalysis';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type {
  DreamDetailCopy,
  DreamDetailViewModel,
} from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

/**
 * What the analysis layer made of this dream, or why it has not.
 *
 * Fourth section out of `DreamDetailSections`. Whether the settings need
 * attention is decided here — it is a question about the settings this section
 * is already given, and the parent had no other use for the answer.
 */

type DreamAnalysisSectionProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  analysisSettings: DreamAnalysisSettings;
  isGeneratingAnalysis: boolean;
  onGenerateAnalysis: () => void;
  onClearAnalysis: () => void;
  onOpenSettingsForAnalysis: () => void;
};

export function DreamAnalysisSection({
  dream,
  copy,
  styles,
  viewModel,
  analysisSettings,
  isGeneratingAnalysis,
  onGenerateAnalysis,
  onClearAnalysis,
  onOpenSettingsForAnalysis,
}: DreamAnalysisSectionProps) {
  const theme = useTheme<Theme>();
  const analysisNeedsSettings =
    !analysisSettings.enabled || analysisSettings.provider === 'openai';

  /** Whether there is anything to show, as opposed to only a reason there is not. */
  const hasAnalysisContent = Boolean(
    dream.analysis?.summary ||
    dream.analysis?.themes?.length ||
    dream.analysis?.generatedAt ||
    dream.analysis?.status === 'error',
  );

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetHeading}>{copy.detailAnalysisTitle}</Text>

      {analysisNeedsSettings ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.settingsNotice,
            pressed ? styles.settingsNoticePressed : null,
          ]}
          onPress={onOpenSettingsForAnalysis}
        >
          <View style={styles.settingsNoticeCopy}>
            <Text style={styles.settingsNoticeTitle}>
              {copy.detailAnalysisOpenSettings}
            </Text>
            <Text style={styles.settingsNoticeBody}>
              {analysisSettings.enabled
                ? copy.detailAnalysisOpenAiUnavailable
                : copy.detailAnalysisDisabled}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textDim}
          />
        </Pressable>
      ) : (
        <Text style={styles.supportText}>{viewModel.analysisStateText}</Text>
      )}

      {dream.analysis?.summary ? (
        <View style={styles.featuredPanel}>
          <Text style={styles.featuredEyebrow}>
            {copy.detailAnalysisSummaryLabel}
          </Text>
          <Text style={styles.featuredBody}>{dream.analysis.summary}</Text>
        </View>
      ) : !analysisNeedsSettings ? (
        <Text style={styles.supportText}>{copy.detailAnalysisEmpty}</Text>
      ) : null}

      {dream.analysis?.themes?.length ? (
        <View style={styles.tagsRow}>
          {dream.analysis.themes.map(themeValue => (
            <TagChip key={themeValue} label={themeValue} />
          ))}
        </View>
      ) : null}

      {!analysisNeedsSettings || hasAnalysisContent ? (
        <View style={styles.utilityRows}>
          <InfoRow
            label={copy.detailAnalysisStatusLabel}
            value={viewModel.analysisStatusLabel}
          />
          <InfoRow
            label={copy.detailAnalysisProviderLabel}
            value={viewModel.analysisProviderLabel}
          />
          {dream.analysis?.generatedAt ? (
            <InfoRow
              label={copy.detailAnalysisUpdatedLabel}
              value={formatMetaTimestamp(dream.analysis.generatedAt)}
            />
          ) : null}
        </View>
      ) : null}

      {dream.analysis?.status === 'error' && dream.analysis.errorMessage ? (
        <Text style={styles.statusErrorText}>
          {dream.analysis.errorMessage}
        </Text>
      ) : null}

      {!analysisNeedsSettings || dream.analysis ? (
        <View style={styles.actionGroup}>
          {analysisSettings.enabled ? (
            <Button
              title={
                isGeneratingAnalysis
                  ? copy.detailAnalysisGenerating
                  : dream.analysis?.status === 'ready'
                    ? copy.detailAnalysisRegenerate
                    : copy.detailAnalysisGenerate
              }
              variant={dream.analysis?.status === 'ready' ? 'ghost' : 'primary'}
              onPress={onGenerateAnalysis}
              disabled={isGeneratingAnalysis}
              icon={
                dream.analysis?.status === 'ready'
                  ? 'refresh-outline'
                  : 'sparkles-outline'
              }
            />
          ) : null}
          {dream.analysis ? (
            <Button
              title={copy.detailAnalysisClear}
              variant="danger"
              onPress={onClearAnalysis}
              disabled={isGeneratingAnalysis}
              icon="trash-outline"
              size="sm"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
