import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { InfoRow } from '../../../components/ui/InfoRow';
import { Card } from '../../../components/ui/Card';
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
import { play, stop } from '../services/audioService';

const detailLayoutTransition = LinearTransition.duration(160);

function getAudioFileLabel(audioUri: string) {
  const filename = audioUri.split('/').filter(Boolean).pop();
  return filename ? decodeURIComponent(filename) : audioUri;
}

function formatPlaybackTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type AudioPlayerWidgetProps = {
  uri: string;
  styles: DreamDetailScreenStyles;
  playbackErrorTitle: string;
};

function AudioPlayerWidget({ uri, styles, playbackErrorTitle }: AudioPlayerWidgetProps) {
  const theme = useTheme<Theme>();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [positionMs, setPositionMs] = React.useState(0);
  const [durationMs, setDurationMs] = React.useState(0);
  const [playError, setPlayError] = React.useState<string | null>(null);
  const isBusyRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stop().catch(() => {});
        setIsPlaying(false);
        setPositionMs(0);
      };
    }, []),
  );

  const onToggle = React.useCallback(async () => {
    if (isBusyRef.current) {
      return;
    }
    isBusyRef.current = true;
    try {
      if (isPlaying) {
        await stop();
        setIsPlaying(false);
        setPositionMs(0);
        return;
      }

      setPlayError(null);
      setPositionMs(0);
      setDurationMs(0);
      await play(uri, {
        onFinished: () => {
          setIsPlaying(false);
          setPositionMs(0);
        },
        onProgress: (pos, dur) => {
          setPositionMs(pos);
          setDurationMs(dur);
        },
      });
      setIsPlaying(true);
    } catch (e) {
      setIsPlaying(false);
      setPositionMs(0);
      const msg = e instanceof Error ? e.message : String(e);
      setPlayError(msg);
      Alert.alert(playbackErrorTitle, msg);
    } finally {
      isBusyRef.current = false;
    }
  }, [isPlaying, playbackErrorTitle, uri]);

  const progressPercent =
    durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <View style={styles.audioPlayer}>
      <View style={styles.audioPlayerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.audioPlayButton,
            pressed ? styles.audioPlayButtonPressed : null,
          ]}
          onPress={onToggle}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={theme.colors.background}
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </Pressable>
        <View style={styles.audioProgressShell}>
          <View style={styles.audioProgressTrack}>
            <View
              style={[styles.audioProgressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <View style={styles.audioTimeRow}>
            <Text style={styles.audioTimeLabel}>{formatPlaybackTime(positionMs)}</Text>
            {durationMs > 0 ? (
              <Text style={styles.audioTimeLabel}>{formatPlaybackTime(durationMs)}</Text>
            ) : null}
          </View>
        </View>
      </View>
      {playError ? (
        <Text style={styles.statusErrorText}>{playError}</Text>
      ) : null}
    </View>
  );
}

type DreamDetailSectionsProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  relatedDreams: RelatedDream[];
  sections: DreamDetailSectionsState;
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
  isDownloadingAudio: boolean;
  onDownloadAudio: () => void;
  onEditDream: () => void;
  onOpenRelatedDream: (dreamId: string) => void;
  onOpenSettingsForAnalysis: () => void;
};

export function DreamDetailSections({
  dream,
  copy,
  styles,
  viewModel,
  relatedDreams,
  sections: _sections,
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
  onToggleSection: _onToggleSection,
  onToggleStateSections: _onToggleStateSections,
  onStartTranscriptEdit,
  onCancelTranscriptEdit,
  onSaveTranscriptEdit,
  onClearTranscript,
  onTranscribeAudio,
  onGenerateAnalysis,
  onClearAnalysis,
  isDownloadingAudio,
  onDownloadAudio,
  onEditDream,
  onOpenRelatedDream,
  onOpenSettingsForAnalysis,
}: DreamDetailSectionsProps) {
  const theme = useTheme<Theme>();
  const rawCaptureText = dream.text?.trim();
  const audioFileLabel = React.useMemo(
    () => (dream.audioUri ? getAudioFileLabel(dream.audioUri) : null),
    [dream.audioUri],
  );
  const relatedSignalSummaries = React.useMemo(
    () => getRelatedSignalSummaries(relatedDreams, 5),
    [relatedDreams],
  );
  const leadPrompt = viewModel.followUpPrompt ?? viewModel.reflectionPrompts[0] ?? null;
  const supportingPrompts = viewModel.followUpPrompt
    ? viewModel.reflectionPrompts
    : viewModel.reflectionPrompts.slice(1);
  const wakeEmotionChips = React.useMemo(() => {
    const moodLabel = viewModel.moodLabel?.toLowerCase();
    return (dream.wakeEmotions ?? [])
      .map(emotion => wakeEmotionLabels[emotion] ?? emotion)
      .filter(label => label.toLowerCase() !== moodLabel);
  }, [dream.wakeEmotions, viewModel.moodLabel, wakeEmotionLabels]);
  const analysisNeedsSettings =
    !analysisSettings.enabled || analysisSettings.provider === 'openai';
  const hasAnalysisContent = Boolean(
    dream.analysis?.summary ||
      dream.analysis?.themes?.length ||
      dream.analysis?.generatedAt ||
      dream.analysis?.status === 'error',
  );
  const primaryCaptureTitle = rawCaptureText
    ? copy.detailTranscriptTitle
    : dream.transcript
      ? copy.detailGeneratedTranscriptTitle
      : dream.audioUri
        ? copy.voiceTitle
        : copy.detailCaptureTitle;
  const primaryCaptureBody = rawCaptureText
    ? rawCaptureText
    : dream.transcript
      ? dream.transcript
      : dream.audioUri
        ? copy.detailAudioDescription
        : copy.detailCaptureEmpty;

  return (
    <Animated.View layout={detailLayoutTransition}>
      <Card style={styles.detailSheet}>
        <View style={styles.sheetSection}>
          <Text style={styles.sheetHeading}>{copy.detailCaptureTitle}</Text>

          <View style={styles.featuredPanel}>
            <Text style={styles.featuredEyebrow}>{primaryCaptureTitle}</Text>
            <Text style={rawCaptureText || dream.transcript ? styles.featuredBody : styles.featuredMutedBody}>
              {primaryCaptureBody}
            </Text>
          </View>

          {dream.audioUri || dream.transcript || isEditingTranscript ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>{copy.detailGeneratedTranscriptTitle}</Text>

              {dream.transcript ? (
                <View style={styles.utilityRows}>
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

              {isEditingTranscript ? (
                <FormField
                  value={transcriptDraft}
                  onChangeText={setTranscriptDraft}
                  multiline
                  inputStyle={styles.transcriptEditorInput}
                  helperText={`${transcriptDraft.trim() ? transcriptDraft.trim().split(/\s+/).length : 0} ${copy.wordsUnit}`}
                />
              ) : (
                <Text
                  style={
                    viewModel.transcriptStatus === 'error'
                      ? styles.statusErrorText
                      : styles.supportText
                  }
                >
                  {dream.transcript
                    ? viewModel.transcriptSourceLabel
                    : viewModel.transcriptStatus === 'processing' || isTranscribingAudio
                      ? copy.detailGeneratedTranscriptProcessing
                      : viewModel.transcriptStatus === 'error'
                        ? copy.detailGeneratedTranscriptError
                        : copy.detailGeneratedTranscriptEmpty}
                </Text>
              )}

              {viewModel.transcriptSyncHint ? (
                <View style={styles.syncNoteCard}>
                  <Text style={styles.syncNoteText}>{viewModel.transcriptSyncHint}</Text>
                </View>
              ) : null}

              <View style={styles.actionGroup}>
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
            </View>
          ) : null}

          {dream.audioUri ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>{copy.voiceTitle}</Text>
              {viewModel.audioSyncHint ? (
                <View style={styles.syncNoteCard}>
                  <Text style={styles.syncNoteText}>{viewModel.audioSyncHint}</Text>
                </View>
              ) : null}
              <AudioPlayerWidget
                uri={dream.audioUri}
                styles={styles}
                playbackErrorTitle={copy.detailAudioPlaybackErrorTitle}
              />
            </View>
          ) : dream.audioRemotePath && !dream.audioUri ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>{copy.voiceTitle}</Text>
              <View style={styles.syncNoteCard}>
                <Text style={styles.syncNoteText}>{copy.detailAudioCloudOnlyHint}</Text>
              </View>
              <Button
                title={
                  isDownloadingAudio
                    ? copy.detailAudioDownloading
                    : copy.detailAudioDownload
                }
                onPress={onDownloadAudio}
                disabled={isDownloadingAudio}
                variant="ghost"
                icon="cloud-download-outline"
                size="sm"
              />
            </View>
          ) : null}
        </View>

        {leadPrompt ? <View style={styles.sheetDivider} /> : null}
        {leadPrompt ? (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetHeading}>{copy.detailReflectionTitle}</Text>
            <View style={styles.revisitPanel}>
              <Text style={styles.featuredTitle}>{leadPrompt.title}</Text>
              <Text style={styles.featuredBody}>{leadPrompt.body}</Text>
              {leadPrompt.actionKind !== 'analysis' ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.featuredAction,
                    pressed ? styles.featuredActionPressed : null,
                  ]}
                  onPress={() => {
                    if (leadPrompt.actionKind === 'related' && relatedDreams[0]) {
                      onOpenRelatedDream(relatedDreams[0].dream.id);
                      return;
                    }

                    if (leadPrompt.actionKind === 'transcript') {
                      if (dream.transcript?.trim()) {
                        onStartTranscriptEdit();
                        return;
                      }

                      if (dream.audioUri) {
                        onTranscribeAudio();
                        return;
                      }
                    }

                    onEditDream();
                  }}
                >
                  <Text style={styles.featuredActionText}>{leadPrompt.actionLabel}</Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={14}
                    color={theme.colors.accent}
                  />
                </Pressable>
              ) : null}
            </View>

            {supportingPrompts.length ? (
              <View style={styles.supportingPromptList}>
                {supportingPrompts.map(prompt => (
                  <View key={prompt.key} style={styles.supportingPromptRow}>
                    <Text style={styles.supportingPromptTitle}>{prompt.title}</Text>
                    <Text style={styles.supportingPromptBody}>{prompt.body}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sheetDivider} />
        <View style={styles.sheetSection}>
          <Text style={styles.sheetHeading}>{copy.detailRelatedTitle}</Text>

          {relatedSignalSummaries.length ? (
            <View style={styles.tagsRow}>
              {relatedSignalSummaries.map(signal => (
                <TagChip
                  key={signal.label}
                  label={signal.count > 1 ? `${signal.label} x${signal.count}` : signal.label}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.supportText}>{copy.detailRelatedEmpty}</Text>
          )}

          {relatedDreams.length ? (
            <View style={styles.relatedList}>
              {relatedDreams.map(item => (
                <Pressable
                  key={item.dream.id}
                  style={({ pressed }) => [
                    styles.relatedRow,
                    pressed ? styles.relatedRowPressed : null,
                  ]}
                  onPress={() => onOpenRelatedDream(item.dream.id)}
                >
                  <View style={styles.relatedCopy}>
                    <Text style={styles.relatedTitle}>{item.dream.title || copy.untitled}</Text>
                    <Text style={styles.relatedMeta}>
                      {item.dream.sleepDate ||
                        new Date(item.dream.createdAt).toISOString().slice(0, 10)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textDim}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.supportBlock}>
            <Text style={styles.supportHeading}>{copy.tagsTitle}</Text>
            <View style={styles.tagsRow}>
              {dream.tags.length ? (
                dream.tags.map(tag => <TagChip key={tag} label={tag} />)
              ) : (
                <Text style={styles.supportText}>{copy.detailTagsEmpty}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.sheetDivider} />
        <View style={styles.sheetSection}>
          <Text style={styles.sheetHeading}>{copy.detailAnalysisTitle}</Text>

          {analysisNeedsSettings ? (
            <Pressable
              style={({ pressed }) => [
                styles.settingsNotice,
                pressed ? styles.settingsNoticePressed : null,
              ]}
              onPress={onOpenSettingsForAnalysis}
            >
              <View style={styles.settingsNoticeCopy}>
                <Text style={styles.settingsNoticeTitle}>{copy.detailAnalysisOpenSettings}</Text>
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
              <Text style={styles.featuredEyebrow}>{copy.detailAnalysisSummaryLabel}</Text>
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
            <Text style={styles.statusErrorText}>{dream.analysis.errorMessage}</Text>
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
                    dream.analysis?.status === 'ready' ? 'refresh-outline' : 'sparkles-outline'
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

        <View style={styles.sheetDivider} />
        <View style={styles.sheetSection}>
          <Text style={styles.sheetHeading}>{copy.detailStateTitle}</Text>

          {!viewModel.hasContext && !viewModel.hasEmotions ? (
            <Text style={styles.supportText}>{copy.detailStateEmpty}</Text>
          ) : (
            <>
              {dream.wakeEmotions?.length ? (
                <View style={styles.supportBlock}>
                  <Text style={styles.supportHeading}>{copy.detailWakeEmotionsLabel}</Text>
                  {wakeEmotionChips.length ? (
                    <View style={styles.tagsRow}>
                      {wakeEmotionChips.map(label => (
                        <TagChip key={label} label={label} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.supportText}>{viewModel.moodLabel}</Text>
                  )}
                </View>
              ) : null}

              {dream.sleepContext?.preSleepEmotions?.length ? (
                <View style={styles.supportBlock}>
                  <Text style={styles.supportHeading}>{copy.detailPreSleepEmotionsLabel}</Text>
                  <View style={styles.tagsRow}>
                    {dream.sleepContext.preSleepEmotions.map(emotion => (
                      <TagChip
                        key={emotion}
                        label={preSleepEmotionLabels[emotion] ?? emotion}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.contextFactsCard}>
                <View style={styles.utilityRows}>
                  {typeof dream.sleepContext?.stressLevel === 'number' ? (
                    <InfoRow
                      label={copy.stressLabel}
                      value={
                        stressLabels[dream.sleepContext.stressLevel] ??
                        String(dream.sleepContext.stressLevel)
                      }
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
                </View>
              </View>

              {dream.sleepContext?.medications ? (
                <View style={styles.contextNoteCard}>
                  <Text style={styles.supportHeading}>{copy.medicationsLabel}</Text>
                  <Text style={styles.contextNoteText}>{dream.sleepContext.medications}</Text>
                </View>
              ) : null}

              {dream.sleepContext?.importantEvents ? (
                <View style={styles.contextNoteCard}>
                  <Text style={styles.supportHeading}>{copy.eventsLabel}</Text>
                  <Text style={styles.contextNoteText}>{dream.sleepContext.importantEvents}</Text>
                </View>
              ) : null}

              {dream.sleepContext?.healthNotes ? (
                <View style={styles.contextNoteCard}>
                  <Text style={styles.supportHeading}>{copy.healthNotesLabel}</Text>
                  <Text style={styles.contextNoteText}>{dream.sleepContext.healthNotes}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}
