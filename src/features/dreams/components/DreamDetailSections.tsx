import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { InfoRow } from '../../../components/ui/InfoRow';
import { DreamAnalysisSection } from './detail/DreamAnalysisSection';
import { DreamLucidSection } from './detail/DreamLucidSection';
import { DreamRelatedSection } from './detail/DreamRelatedSection';
import { DreamStateSection } from './detail/DreamStateSection';
import { DreamNightmareSection } from './detail/DreamNightmareSection';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import type { Dream } from '../model/dream';
import type { RelatedDream } from '../model/relatedDreams';
import {
  formatMetaTimestamp,
  formatTranscriptionProgress,
  type DreamDetailCopy,
  type DreamDetailSectionsState,
  type DreamDetailViewModel,
} from '../model/dreamDetailPresentation';
import type { DreamTranscriptionProgress } from '../services/dreamTranscriptionService';
import type { DreamDetailScreenStyles } from '../screens/DreamDetailScreen.styles';
import { formatPlaybackTime, useAudioPlayback } from './audio/useAudioPlayback';

const detailLayoutTransition = LinearTransition.duration(160);

type AudioPlayerWidgetProps = {
  uri: string;
  styles: DreamDetailScreenStyles;
  playbackErrorTitle: string;
  playLabel: string;
  pauseLabel: string;
};

function AudioPlayerWidget({
  uri,
  styles,
  playbackErrorTitle,
  playLabel,
  pauseLabel,
}: AudioPlayerWidgetProps) {
  const theme = useTheme<Theme>();
  const { isPlaying, positionMs, durationMs, error, toggle, reset } =
    useAudioPlayback(uri);

  // Stops when the screen goes away rather than only when it unmounts: a stack
  // screen stays mounted underneath the one pushed on top of it, and a
  // recording playing from a screen the user has navigated past is a small
  // horror of its own.
  useFocusEffect(React.useCallback(() => reset, [reset]));

  const onToggle = React.useCallback(async () => {
    const message = await toggle();
    if (message) {
      Alert.alert(playbackErrorTitle, message);
    }
  }, [playbackErrorTitle, toggle]);

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
          accessibilityRole="button"
          // Icon only, and the icon changes with state, so the label has to say
          // which action pressing it performs right now.
          accessibilityLabel={isPlaying ? pauseLabel : playLabel}
        >
          <View
            style={
              isPlaying
                ? styles.audioPlayIconPlaying
                : styles.audioPlayIconPaused
            }
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={theme.colors.background}
            />
          </View>
        </Pressable>
        <View style={styles.audioProgressShell}>
          <View style={styles.audioProgressTrack}>
            <View
              style={[
                styles.audioProgressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <View style={styles.audioTimeRow}>
            <Text style={styles.audioTimeLabel}>
              {formatPlaybackTime(positionMs)}
            </Text>
            {durationMs > 0 ? (
              <Text style={styles.audioTimeLabel}>
                {formatPlaybackTime(durationMs)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {error ? <Text style={styles.statusErrorText}>{error}</Text> : null}
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
  practiceCopy: {
    openLucid: string;
    openNightmares: string;
    quickNightmareRewrite: string;
    nightmareRewritePrompt: string;
    nightmareGroundingTitle: string;
    nightmareGroundingBody: string;
    lucidDreamSignsLabel: string;
    lucidTriggerLabel: string;
    lucidRecallLabel: string;
    lucidStabilizationLabel: string;
    nightmareWokeLabel: string;
    nightmareAftereffectsLabel: string;
    nightmareRewriteStatusLabel: string;
  };
  lucidTechniqueLabels: Record<string, string>;
  lucidControlLabels: Record<string, string>;
  lucidStabilizationLabels: Record<string, string>;
  nightmareAftereffectLabels: Record<string, string>;
  nightmareGroundingLabels: Record<string, string>;
  nightmareRescriptLabels: Record<string, string>;
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
  onOpenDreamPractice: (focus: 'lucid' | 'nightmares') => void;
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
  practiceCopy,
  lucidTechniqueLabels,
  lucidControlLabels,
  lucidStabilizationLabels,
  nightmareAftereffectLabels,
  nightmareGroundingLabels,
  nightmareRescriptLabels,
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
  onOpenDreamPractice,
}: DreamDetailSectionsProps) {
  const theme = useTheme<Theme>();
  const rawCaptureText = dream.text?.trim();
  const leadPrompt =
    viewModel.followUpPrompt ?? viewModel.reflectionPrompts[0] ?? null;
  const supportingPrompts = viewModel.followUpPrompt
    ? viewModel.reflectionPrompts
    : viewModel.reflectionPrompts.slice(1);
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
            <Text
              style={
                rawCaptureText || dream.transcript
                  ? styles.featuredBody
                  : styles.featuredMutedBody
              }
            >
              {primaryCaptureBody}
            </Text>
          </View>

          {dream.audioUri || dream.transcript || isEditingTranscript ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {copy.detailGeneratedTranscriptTitle}
              </Text>

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
                    : viewModel.transcriptStatus === 'processing' ||
                        isTranscribingAudio
                      ? copy.detailGeneratedTranscriptProcessing
                      : viewModel.transcriptStatus === 'error'
                        ? copy.detailGeneratedTranscriptError
                        : copy.detailGeneratedTranscriptEmpty}
                </Text>
              )}

              {viewModel.transcriptSyncHint ? (
                <View style={styles.syncNoteCard}>
                  <Text style={styles.syncNoteText}>
                    {viewModel.transcriptSyncHint}
                  </Text>
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
                            ? (formatTranscriptionProgress(
                                transcriptionProgress,
                                copy,
                              ) ?? copy.detailTranscribeInProgress)
                            : dream.transcript
                              ? copy.detailGeneratedTranscriptReplace
                              : viewModel.transcriptStatus === 'error'
                                ? copy.detailTranscribeRetry
                                : copy.detailTranscribeAudio
                        }
                        variant={
                          dream.transcript ||
                          viewModel.transcriptStatus === 'error'
                            ? 'ghost'
                            : 'primary'
                        }
                        onPress={onTranscribeAudio}
                        disabled={isTranscribingAudio}
                        icon={
                          dream.transcript
                            ? 'refresh-outline'
                            : 'sparkles-outline'
                        }
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
                  <Text style={styles.syncNoteText}>
                    {viewModel.audioSyncHint}
                  </Text>
                </View>
              ) : null}
              <AudioPlayerWidget
                uri={dream.audioUri}
                styles={styles}
                playbackErrorTitle={copy.detailAudioPlaybackErrorTitle}
                playLabel={copy.audioPlayAction}
                pauseLabel={copy.audioPauseAction}
              />
            </View>
          ) : dream.audioRemotePath && !dream.audioUri ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>{copy.voiceTitle}</Text>
              <View style={styles.syncNoteCard}>
                <Text style={styles.syncNoteText}>
                  {copy.detailAudioCloudOnlyHint}
                </Text>
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
            <Text style={styles.sheetHeading}>
              {copy.detailReflectionTitle}
            </Text>
            <View style={styles.revisitPanel}>
              <Text style={styles.featuredTitle}>{leadPrompt.title}</Text>
              <Text style={styles.featuredBody}>{leadPrompt.body}</Text>
              {leadPrompt.actionKind !== 'analysis' ? (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.featuredAction,
                    pressed ? styles.featuredActionPressed : null,
                  ]}
                  onPress={() => {
                    if (
                      leadPrompt.actionKind === 'related' &&
                      relatedDreams[0]
                    ) {
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
                  <Text style={styles.featuredActionText}>
                    {leadPrompt.actionLabel}
                  </Text>
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
                    <Text style={styles.supportingPromptTitle}>
                      {prompt.title}
                    </Text>
                    <Text style={styles.supportingPromptBody}>
                      {prompt.body}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sheetDivider} />
        <DreamRelatedSection
          dream={dream}
          copy={copy}
          styles={styles}
          relatedDreams={relatedDreams}
          onOpenRelatedDream={onOpenRelatedDream}
        />

        <View style={styles.sheetDivider} />
        <DreamAnalysisSection
          dream={dream}
          copy={copy}
          styles={styles}
          viewModel={viewModel}
          analysisSettings={analysisSettings}
          isGeneratingAnalysis={isGeneratingAnalysis}
          onGenerateAnalysis={onGenerateAnalysis}
          onClearAnalysis={onClearAnalysis}
          onOpenSettingsForAnalysis={onOpenSettingsForAnalysis}
        />

        <View style={styles.sheetDivider} />
        <DreamLucidSection
          dream={dream}
          viewModel={viewModel}
          copy={copy}
          styles={styles}
          practiceCopy={practiceCopy}
          lucidTechniqueLabels={lucidTechniqueLabels}
          lucidControlLabels={lucidControlLabels}
          lucidStabilizationLabels={lucidStabilizationLabels}
          onOpenDreamPractice={onOpenDreamPractice}
        />

        <View style={styles.sheetDivider} />
        <DreamNightmareSection
          dream={dream}
          copy={copy}
          styles={styles}
          practiceCopy={practiceCopy}
          nightmareAftereffectLabels={nightmareAftereffectLabels}
          nightmareGroundingLabels={nightmareGroundingLabels}
          nightmareRescriptLabels={nightmareRescriptLabels}
          onOpenDreamPractice={onOpenDreamPractice}
          onEditDream={onEditDream}
        />

        <View style={styles.sheetDivider} />
        <DreamStateSection
          dream={dream}
          copy={copy}
          styles={styles}
          viewModel={viewModel}
          stressLabels={stressLabels}
          wakeEmotionLabels={wakeEmotionLabels}
          preSleepEmotionLabels={preSleepEmotionLabels}
        />
      </Card>
    </Animated.View>
  );
}
