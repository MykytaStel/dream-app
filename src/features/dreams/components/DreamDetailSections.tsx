import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { InfoRow } from '../../../components/ui/InfoRow';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import type { Dream } from '../model/dream';
import { getRelatedSignalSummaries, type RelatedDream } from '../model/relatedDreams';
import {
  formatMetaTimestamp,
  formatTranscriptionProgress,
  type DreamDetailCopy,
  type DreamDetailSectionsState,
  type DreamDetailViewModel,
} from '../model/dreamDetailPresentation';
import type { DreamTranscriptionProgress } from '../services/dreamTranscriptionService';
import type { DreamDetailScreenStyles } from '../screens/DreamDetailScreen.styles';
import { DreamDetailSectionCard } from './DreamDetailSectionCard';

const detailLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

function getAudioFileLabel(audioUri: string) {
  const filename = audioUri.split('/').filter(Boolean).pop();
  return filename ? decodeURIComponent(filename) : audioUri;
}

type DreamDetailSectionsProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  relatedDreams: RelatedDream[];
  sections: DreamDetailSectionsState;
  isPlayingAudio: boolean;
  isTranscribingAudio: boolean;
  isEditingTranscript: boolean;
  transcriptDraft: string;
  transcriptionProgress: DreamTranscriptionProgress | null;
  analysisSettings: DreamAnalysisSettings;
  isGeneratingAnalysis: boolean;
  stressLabels: Record<number, string>;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
  setTranscriptDraft: (value: string) => void;
  onToggleSection: (section: keyof DreamDetailSectionsState) => void;
  onToggleStateSections: () => void;
  onStartTranscriptEdit: () => void;
  onCancelTranscriptEdit: () => void;
  onSaveTranscriptEdit: () => void;
  onClearTranscript: () => void;
  onTranscribeAudio: () => void;
  onGenerateAnalysis: () => void;
  onClearAnalysis: () => void;
  onToggleAudioPlayback: () => void;
  onOpenRelatedDream: (dreamId: string) => void;
  onOpenSettingsForAnalysis: () => void;
};

export function DreamDetailSections({
  dream,
  copy,
  styles,
  viewModel,
  relatedDreams,
  sections,
  isPlayingAudio,
  isTranscribingAudio,
  isEditingTranscript,
  transcriptDraft,
  transcriptionProgress,
  analysisSettings,
  isGeneratingAnalysis,
  stressLabels,
  wakeEmotionLabels,
  preSleepEmotionLabels,
  setTranscriptDraft,
  onToggleSection,
  onToggleStateSections,
  onStartTranscriptEdit,
  onCancelTranscriptEdit,
  onSaveTranscriptEdit,
  onClearTranscript,
  onTranscribeAudio,
  onGenerateAnalysis,
  onClearAnalysis,
  onToggleAudioPlayback,
  onOpenRelatedDream,
  onOpenSettingsForAnalysis,
}: DreamDetailSectionsProps) {
  const theme = useTheme<Theme>();
  const rawCaptureText = dream.text?.trim();
  const captureBody =
    rawCaptureText || (dream.audioUri ? copy.audioOnlyPreview : copy.detailCaptureEmpty);
  const audioFileLabel = React.useMemo(
    () => (dream.audioUri ? getAudioFileLabel(dream.audioUri) : null),
    [dream.audioUri],
  );
  const relatedSignalSummaries = React.useMemo(
    () => getRelatedSignalSummaries(relatedDreams, 5),
    [relatedDreams],
  );

  return (
    <>
      <Animated.View entering={FadeInDown.delay(70).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailCaptureTitle}
          meta={viewModel.notesMetaLabel}
          expanded={sections.written}
          onToggle={() => onToggleSection('written')}
        >
          <Text style={rawCaptureText ? styles.bodyText : styles.mutedText}>
            {captureBody}
          </Text>
        </DreamDetailSectionCard>
      </Animated.View>

      {dream.audioUri ? (
        <Animated.View entering={FadeInDown.delay(90).duration(220)} layout={detailLayoutTransition}>
          <DreamDetailSectionCard
            title={copy.voiceTitle}
            meta={copy.detailAudioAttachedMeta}
            expanded={sections.audio}
            onToggle={() => onToggleSection('audio')}
          >
            <View style={styles.audioCard}>
              <Text style={styles.bodyText}>{copy.detailAudioDescription}</Text>
              <InfoRow label={copy.detailAudioPathLabel} value={audioFileLabel ?? dream.audioUri} />
              <Text style={styles.mutedText}>{copy.detailAudioPlaybackHint}</Text>
              <Button
                title={isPlayingAudio ? copy.detailAudioStop : copy.detailAudioPlay}
                variant={isPlayingAudio ? 'ghost' : 'primary'}
                onPress={onToggleAudioPlayback}
                icon={isPlayingAudio ? 'stop-circle-outline' : 'play-outline'}
                size="sm"
              />
            </View>
          </DreamDetailSectionCard>
        </Animated.View>
      ) : null}

      {viewModel.hasTranscriptSurface ? (
        <Animated.View entering={FadeInDown.delay(110).duration(220)} layout={detailLayoutTransition}>
          <DreamDetailSectionCard
            title={copy.detailGeneratedTranscriptTitle}
            meta={viewModel.transcriptMetaLabel}
            expanded={sections.transcript}
            onToggle={() => onToggleSection('transcript')}
          >
            {transcriptionProgress ? (
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeLabel}>
                  {formatTranscriptionProgress(transcriptionProgress, copy)}
                </Text>
              </View>
            ) : null}

            {isEditingTranscript ? (
              <FormField
                value={transcriptDraft}
                onChangeText={setTranscriptDraft}
                multiline
                inputStyle={styles.transcriptEditorInput}
                helperText={`${transcriptDraft.trim() ? transcriptDraft.trim().split(/\s+/).length : 0} ${copy.wordsUnit}`}
              />
            ) : dream.transcript ? (
              <Text style={styles.bodyText}>{dream.transcript}</Text>
            ) : viewModel.transcriptStatus === 'processing' || isTranscribingAudio ? (
              <Text style={styles.statusText}>{copy.detailGeneratedTranscriptProcessing}</Text>
            ) : viewModel.transcriptStatus === 'error' ? (
              <Text style={styles.statusErrorText}>{copy.detailGeneratedTranscriptError}</Text>
            ) : (
              <Text style={styles.mutedText}>{copy.detailGeneratedTranscriptEmpty}</Text>
            )}

            {dream.transcript ? (
              <View style={styles.transcriptMetaCard}>
                <InfoRow
                  label={copy.detailGeneratedTranscriptSourceLabel}
                  value={viewModel.transcriptSourceLabel}
                />
                {dream.transcriptUpdatedAt ? (
                  <InfoRow
                    label={copy.detailGeneratedTranscriptUpdatedLabel}
                    value={formatMetaTimestamp(dream.transcriptUpdatedAt)}
                  />
                ) : null}
              </View>
            ) : null}

            {viewModel.transcriptStatus === 'processing' && dream.transcript ? (
              <Text style={styles.statusText}>{copy.detailGeneratedTranscriptProcessing}</Text>
            ) : null}

            {viewModel.transcriptStatus === 'error' && dream.transcript ? (
              <Text style={styles.statusErrorText}>
                {copy.detailGeneratedTranscriptReplaceError}
              </Text>
            ) : null}

            <View style={styles.transcriptActions}>
              {isEditingTranscript ? (
                <>
                  <Button
                    title={copy.detailGeneratedTranscriptSave}
                    onPress={onSaveTranscriptEdit}
                    icon="save-outline"
                    size="sm"
                  />
                  <Button
                    title={copy.detailGeneratedTranscriptCancel}
                    variant="ghost"
                    icon="close-outline"
                    size="sm"
                    onPress={onCancelTranscriptEdit}
                  />
                </>
              ) : (
                <>
                  {dream.transcript ? (
                    <>
                      <Button
                        title={copy.detailGeneratedTranscriptEdit}
                        variant="ghost"
                        icon="create-outline"
                        size="sm"
                        onPress={onStartTranscriptEdit}
                      />
                      <Button
                        title={copy.detailGeneratedTranscriptClear}
                        variant="danger"
                        icon="close-circle-outline"
                        size="sm"
                        onPress={onClearTranscript}
                      />
                    </>
                  ) : null}

                  {dream.audioUri ? (
                    <Button
                      title={
                        isTranscribingAudio
                          ? formatTranscriptionProgress(transcriptionProgress, copy) ??
                            copy.detailTranscribeInProgress
                          : dream.transcript
                            ? copy.detailGeneratedTranscriptReplace
                            : viewModel.transcriptStatus === 'error'
                              ? copy.detailTranscribeRetry
                              : copy.detailTranscribeAudio
                      }
                      variant={
                        dream.transcript || viewModel.transcriptStatus === 'error'
                          ? 'ghost'
                          : 'primary'
                      }
                      onPress={onTranscribeAudio}
                      disabled={isTranscribingAudio}
                      icon={dream.transcript ? 'refresh-outline' : 'sparkles-outline'}
                    />
                  ) : null}
                </>
              )}
            </View>
          </DreamDetailSectionCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(130).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailRelatedTitle}
          meta={viewModel.relatedMetaLabel}
          expanded={sections.related}
          onToggle={() => onToggleSection('related')}
        >
          {relatedSignalSummaries.length ? (
            <>
              <Text style={styles.subsectionLabel}>{copy.detailRelatedRecurringLabel}</Text>
              <View style={styles.tagsRow}>
                {relatedSignalSummaries.map(signal => (
                  <TagChip
                    key={signal.label}
                    label={signal.count > 1 ? `${signal.label} x${signal.count}` : signal.label}
                  />
                ))}
              </View>
            </>
          ) : null}

          {relatedDreams.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.relatedCarousel}
              contentContainerStyle={styles.relatedCarouselContent}
            >
              {relatedDreams.map(item => (
                <Pressable
                  key={item.dream.id}
                  style={({ pressed }) => [
                    styles.relatedCard,
                    pressed ? styles.relatedCardPressed : null,
                  ]}
                  onPress={() => onOpenRelatedDream(item.dream.id)}
                >
                  <View style={styles.relatedHeader}>
                    <View style={styles.relatedCopy}>
                      <Text style={styles.relatedTitle}>{item.dream.title || copy.untitled}</Text>
                      <Text style={styles.relatedMeta}>
                        {item.dream.sleepDate ||
                          new Date(item.dream.createdAt).toISOString().slice(0, 10)}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={18}
                      color={theme.colors.textDim}
                    />
                  </View>

                  {item.sharedSignals.length ? (
                    <View style={styles.tagsRow}>
                      {item.sharedSignals.slice(0, 3).map(signal => (
                        <TagChip key={`${item.dream.id}-${signal}`} label={signal} />
                      ))}
                    </View>
                  ) : null}

                  <Text style={styles.relatedSharedLabel}>{copy.detailRelatedSharedLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.mutedText}>{copy.detailRelatedEmpty}</Text>
          )}
        </DreamDetailSectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailAnalysisTitle}
          meta={viewModel.analysisMetaLabel}
          expanded={sections.analysis}
          onToggle={() => onToggleSection('analysis')}
        >
          <View style={styles.analysisStateCard}>
            <Text style={styles.analysisStateLabel}>{copy.detailAnalysisStateLabel}</Text>
            <Text style={styles.analysisStateText}>{viewModel.analysisStateText}</Text>
            {!analysisSettings.enabled || analysisSettings.provider === 'openai' ? (
              <Button
                title={copy.detailAnalysisOpenSettings}
                variant="ghost"
                size="sm"
                icon="settings-outline"
                onPress={onOpenSettingsForAnalysis}
              />
            ) : null}
          </View>

          {dream.analysis?.summary ? (
            <>
              <Text style={styles.subsectionLabel}>{copy.detailAnalysisSummaryLabel}</Text>
              <Text style={styles.bodyText}>{dream.analysis.summary}</Text>
            </>
          ) : (
            <Text style={styles.mutedText}>
              {analysisSettings.enabled ? copy.detailAnalysisEmpty : copy.detailAnalysisDisabled}
            </Text>
          )}

          <View style={styles.transcriptMetaCard}>
            <InfoRow label={copy.detailAnalysisStatusLabel} value={viewModel.analysisStatusLabel} />
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

          {dream.analysis?.themes?.length ? (
            <>
              <Text style={styles.subsectionLabel}>{copy.detailAnalysisThemesLabel}</Text>
              <View style={styles.tagsRow}>
                {dream.analysis.themes.map(themeValue => (
                  <TagChip key={themeValue} label={themeValue} />
                ))}
              </View>
            </>
          ) : null}

          {dream.analysis?.status === 'error' && dream.analysis.errorMessage ? (
            <Text style={styles.statusErrorText}>{dream.analysis.errorMessage}</Text>
          ) : null}

          {analysisSettings.enabled ? (
            <View style={styles.analysisActionsRow}>
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
                icon={dream.analysis?.status === 'ready' ? 'refresh-outline' : 'sparkles-outline'}
              />
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
        </DreamDetailSectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.tagsTitle}
          meta={viewModel.tagCountLabel}
          expanded={sections.tags}
          onToggle={() => onToggleSection('tags')}
        >
          <View style={styles.tagsRow}>
            {dream.tags.length ? (
              dream.tags.map(tag => <TagChip key={tag} label={tag} />)
            ) : (
              <Text style={styles.mutedText}>{copy.detailTagsEmpty}</Text>
            )}
          </View>
        </DreamDetailSectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(190).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailStateTitle}
          meta={viewModel.stateMetaLabel}
          expanded={sections.context || sections.emotions}
          onToggle={onToggleStateSections}
        >
          {!viewModel.hasContext && !viewModel.hasEmotions ? (
            <Text style={styles.mutedText}>{copy.detailStateEmpty}</Text>
          ) : (
            <View style={styles.contextRows}>
              {dream.wakeEmotions?.length ? (
                <>
                  <Text style={styles.subsectionLabel}>{copy.detailWakeEmotionsLabel}</Text>
                  <View style={styles.tagsRow}>
                    {dream.wakeEmotions.map(emotion => (
                      <TagChip key={emotion} label={wakeEmotionLabels[emotion] ?? emotion} />
                    ))}
                  </View>
                </>
              ) : null}
              {dream.sleepContext?.preSleepEmotions?.length ? (
                <>
                  <Text style={styles.subsectionLabel}>{copy.detailPreSleepEmotionsLabel}</Text>
                  <View style={styles.tagsRow}>
                    {dream.sleepContext.preSleepEmotions.map(emotion => (
                      <TagChip
                        key={emotion}
                        label={preSleepEmotionLabels[emotion] ?? emotion}
                      />
                    ))}
                  </View>
                </>
              ) : null}
              {typeof dream.sleepContext?.stressLevel === 'number' ? (
                <InfoRow
                  label={copy.stressLabel}
                  value={stressLabels[dream.sleepContext.stressLevel] ?? String(dream.sleepContext.stressLevel)}
                />
              ) : null}
              {typeof dream.sleepContext?.alcoholTaken === 'boolean' ? (
                <InfoRow
                  label={copy.alcoholLabel}
                  value={dream.sleepContext.alcoholTaken ? copy.boolYes : copy.boolNo}
                />
              ) : null}
              {typeof dream.sleepContext?.caffeineLate === 'boolean' ? (
                <InfoRow
                  label={copy.caffeineLabel}
                  value={dream.sleepContext.caffeineLate ? copy.boolYes : copy.boolNo}
                />
              ) : null}
              {dream.sleepContext?.medications ? (
                <InfoRow label={copy.medicationsLabel} value={dream.sleepContext.medications} />
              ) : null}
              {dream.sleepContext?.importantEvents ? (
                <InfoRow label={copy.eventsLabel} value={dream.sleepContext.importantEvents} />
              ) : null}
              {dream.sleepContext?.healthNotes ? (
                <InfoRow label={copy.healthNotesLabel} value={dream.sleepContext.healthNotes} />
              ) : null}
            </View>
          )}
        </DreamDetailSectionCard>
      </Animated.View>
    </>
  );
}
