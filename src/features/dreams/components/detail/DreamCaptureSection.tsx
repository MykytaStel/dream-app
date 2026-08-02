import React from 'react';
import { Alert, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import { useFocusEffect } from '@react-navigation/native';
import type { Theme } from '../../../../theme/theme';
import { Pressable } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { InfoRow } from '../../../../components/ui/InfoRow';
import {
  formatPlaybackTime,
  useAudioPlayback,
} from '../audio/useAudioPlayback';
import {
  formatMetaTimestamp,
  formatTranscriptionProgress,
} from '../../model/dreamDetailPresentation';
import type { DreamTranscriptionProgress } from '../../services/dreamTranscriptionService';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type {
  DreamDetailCopy,
  DreamDetailViewModel,
} from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

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

/**
 * What the dream actually is: the words, the recording, the transcript.
 *
 * The last and largest section out of `DreamDetailSections`, and the only one
 * that owns a piece of interaction rather than only displaying — the transcript
 * editor and the audio player both live here.
 *
 * The player came with it. It was declared in the parent and used by nothing
 * else, so leaving it behind would have kept a hundred lines in a file for the
 * sake of one caller in another.
 *
 * `primaryCaptureTitle` and `primaryCaptureBody` decide what leads the panel:
 * written text if there is any, then the transcript, then a note that there is
 * audio, then that there is nothing. Only one of them is shown, which is why a
 * dream with both text and a transcript displays the text.
 */

type DreamCaptureSectionProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  isTranscribingAudio: boolean;
  isEditingTranscript: boolean;
  transcriptDraft: string;
  transcriptionProgress: DreamTranscriptionProgress | null;
  isDownloadingAudio: boolean;
  setTranscriptDraft: (value: string) => void;
  onStartTranscriptEdit: () => void;
  onCancelTranscriptEdit: () => void;
  onSaveTranscriptEdit: () => void;
  onClearTranscript: () => void;
  onTranscribeAudio: () => void;
  onDownloadAudio: () => void;
};

export function DreamCaptureSection({
  dream,
  copy,
  styles,
  viewModel,
  isTranscribingAudio,
  isEditingTranscript,
  transcriptDraft,
  transcriptionProgress,
  isDownloadingAudio,
  setTranscriptDraft,
  onStartTranscriptEdit,
  onCancelTranscriptEdit,
  onSaveTranscriptEdit,
  onClearTranscript,
  onTranscribeAudio,
  onDownloadAudio,
}: DreamCaptureSectionProps) {
  const rawCaptureText = dream.text?.trim();
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
                      dream.transcript || viewModel.transcriptStatus === 'error'
                        ? 'ghost'
                        : 'primary'
                    }
                    onPress={onTranscribeAudio}
                    disabled={isTranscribingAudio}
                    icon={
                      dream.transcript ? 'refresh-outline' : 'sparkles-outline'
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
              <Text style={styles.syncNoteText}>{viewModel.audioSyncHint}</Text>
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
  );
}
