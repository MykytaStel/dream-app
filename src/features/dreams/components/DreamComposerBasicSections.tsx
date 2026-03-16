import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { DreamComposerCopy, DreamComposerStyles } from './DreamComposer.types';
import { play, stop } from '../services/audioService';

type HeroCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  isEdit: boolean;
  isWakeMode: boolean;
  sleepDate: string;
  hasAudio: boolean;
  hasRestoredDraft: boolean;
};

export function DreamComposerHeroCard({
  styles,
  copy,
  isEdit,
  isWakeMode,
  sleepDate,
  hasAudio,
  hasRestoredDraft,
}: HeroCardProps) {
  const helperChips = (
    <View style={styles.helperChipsRow}>
      <View style={styles.helperChip}>
        <Text style={styles.helperChipLabel}>{sleepDate}</Text>
      </View>
      {hasAudio ? (
        <View style={styles.helperChip}>
          <Text style={styles.helperChipLabel}>{copy.attachedAudioTitle}</Text>
        </View>
      ) : null}
      {hasRestoredDraft ? (
        <View style={styles.helperChip}>
          <Text style={styles.helperChipLabel}>{copy.recordDraftRestoredTitle}</Text>
        </View>
      ) : null}
    </View>
  );

  if (isWakeMode) {
    return (
      <Card style={[styles.heroCard, styles.heroCardCompact]}>
        <View style={styles.heroCopyCompact}>
          <Text style={styles.heroEyebrow}>{copy.quickAddWakeAction}</Text>
          <SectionHeader title={copy.wakeHeroTitle} />
        </View>
        {helperChips}
      </Card>
    );
  }

  return (
    <Card style={styles.heroCard}>
      <View pointerEvents="none" style={styles.heroGlowLarge} />
      <View pointerEvents="none" style={styles.heroGlowSmall} />
      <View style={styles.heroTopRow}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{isEdit ? copy.editTitle : copy.createTitle}</Text>
          <SectionHeader
            title={isEdit ? copy.editHeroTitle : copy.createHeroTitle}
            subtitle={isEdit ? copy.editSubtitle : copy.createSubtitle}
            large
          />
        </View>
        <View style={styles.kaleidoscopeShell}>
          <View style={[styles.kaleidoscopeFacet, styles.kaleidoscopeFacetPrimary]} />
          <View style={[styles.kaleidoscopeFacet, styles.kaleidoscopeFacetAccent]} />
          <View style={[styles.kaleidoscopeFacet, styles.kaleidoscopeFacetAlt]} />
        </View>
      </View>

      {helperChips}
    </Card>
  );
}

function ComposerAudioPlayback({
  uri,
  styles,
  errorTitle,
}: {
  uri: string;
  styles: DreamComposerStyles;
  errorTitle: string;
}) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [positionSec, setPositionSec] = React.useState(0);
  const [durationSec, setDurationSec] = React.useState(0);
  const isBusyRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      stop().catch(() => {});
    };
  }, []);

  const onToggle = React.useCallback(async () => {
    if (isBusyRef.current) {
      return;
    }
    isBusyRef.current = true;
    try {
      if (isPlaying) {
        await stop();
        setIsPlaying(false);
        setPositionSec(0);
        return;
      }
      setPositionSec(0);
      setDurationSec(0);
      await play(uri, {
        onFinished: () => {
          setIsPlaying(false);
          setPositionSec(0);
        },
        onProgress: (posMs, durMs) => {
          setPositionSec(Math.floor(posMs / 1000));
          setDurationSec(Math.floor(durMs / 1000));
        },
      });
      setIsPlaying(true);
    } catch (e) {
      setIsPlaying(false);
      setPositionSec(0);
      Alert.alert(errorTitle, e instanceof Error ? e.message : String(e));
    } finally {
      isBusyRef.current = false;
    }
  }, [errorTitle, isPlaying, uri]);

  const timeLabel =
    durationSec > 0
      ? `${formatRecordingDuration(positionSec)} / ${formatRecordingDuration(durationSec)}`
      : isPlaying
        ? formatRecordingDuration(positionSec)
        : '--:--';

  return (
    <View style={styles.composerAudioPlayback}>
      <Button
        title={timeLabel}
        onPress={onToggle}
        icon={isPlaying ? 'stop-circle-outline' : 'play-outline'}
        variant="ghost"
        size="sm"
      />
    </View>
  );
}

function formatRecordingDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type VoiceCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  isWakeMode: boolean;
  recording: boolean;
  recordingDuration?: number;
  audioUri?: string;
  audioFileLabel?: string;
  isBusy?: boolean;
  onToggleRecord: () => void;
  onRemoveAudio: () => void;
};

export function DreamComposerVoiceCard({
  styles,
  copy,
  isWakeMode,
  recording,
  recordingDuration,
  audioUri,
  isBusy,
  onToggleRecord,
  onRemoveAudio,
}: VoiceCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View style={styles.sectionAccentSecondary} />
      </View>
      <SectionHeader
        title={copy.voiceTitle}
        subtitle={audioUri || recording ? undefined : isWakeMode ? copy.wakeVoiceDescription : copy.voiceDescription}
      />

      {recording ? (
        <>
          <View style={styles.voiceStatusRow}>
            <View style={styles.voiceStatusPill}>
              <Text style={[styles.voiceStatusLabel, styles.recordingHint]}>{copy.recordingHint}</Text>
            </View>
          </View>
          <Button
            title={copy.stopRecording}
            onPress={onToggleRecord}
            icon="stop-circle-outline"
            size="md"
            disabled={isBusy}
          />
          {recordingDuration != null ? (
            <Text style={styles.voiceRecordingTimer}>{formatRecordingDuration(recordingDuration)}</Text>
          ) : null}
        </>
      ) : audioUri ? (
        <View style={styles.attachedAudioCard}>
          <ComposerAudioPlayback uri={audioUri} styles={styles} errorTitle={copy.audioErrorTitle} />
          <View style={styles.attachedAudioActions}>
            <Button
              title={copy.startRecording}
              onPress={onToggleRecord}
              icon="mic-outline"
              variant="ghost"
              size="sm"
              disabled={isBusy}
            />
            <Button title={copy.removeAudio} variant="ghost" size="sm" onPress={onRemoveAudio} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.voiceStatusRow}>
            <View style={styles.voiceStatusPill}>
              <Text style={styles.voiceStatusLabel}>{copy.voiceIdleHint}</Text>
            </View>
          </View>
          <Button
            title={copy.startRecording}
            onPress={onToggleRecord}
            icon="mic-outline"
            size="md"
            disabled={isBusy}
          />
        </>
      )}
    </Card>
  );
}

type WakeCaptureCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  recording: boolean;
  recordingDuration?: number;
  audioUri?: string;
  audioFileLabel?: string;
  isBusy?: boolean;
  onToggleRecord: () => void;
  onRemoveAudio: () => void;
  text: string;
  onChangeText: (value: string) => void;
  hasTriedSave: boolean;
  hasMissingContent: boolean;
  textWordCount: number;
};

export function DreamComposerWakeCaptureCard({
  styles,
  copy,
  recording,
  recordingDuration,
  audioUri,
  isBusy,
  onToggleRecord,
  onRemoveAudio,
  text,
  onChangeText,
  hasTriedSave,
  hasMissingContent,
  textWordCount,
}: WakeCaptureCardProps) {
  const helperText =
    hasTriedSave && hasMissingContent
      ? copy.saveErrorDescription
      : `${textWordCount} ${copy.wordsUnit}`;
  const helperTone = hasTriedSave && hasMissingContent ? 'error' : 'default';

  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View style={styles.sectionAccentSecondary} />
      </View>
      <SectionHeader title={copy.wakeCaptureTitle} subtitle={copy.wakeCaptureDescription} />

      <FormField
        label={copy.wakeTextLabel}
        placeholder={copy.wakeTextPlaceholder}
        value={text}
        onChangeText={onChangeText}
        autoFocus={!audioUri}
        multiline
        inputStyle={styles.textInput}
        helperText={helperText}
        helperTone={helperTone}
        invalid={hasTriedSave && hasMissingContent}
      />
      <Text style={styles.refineHint}>{copy.wakeReadyHint}</Text>

      <View style={styles.captureAlternateBlock}>
        <Text style={styles.captureAlternateLabel}>{copy.wakeCaptureAlternateTitle}</Text>

        {recording ? (
          <>
            <View style={styles.voiceStatusRow}>
              <View style={styles.voiceStatusPill}>
                <Text style={[styles.voiceStatusLabel, styles.recordingHint]}>{copy.recordingHint}</Text>
              </View>
            </View>
            <Button
              title={copy.stopRecording}
              onPress={onToggleRecord}
              icon="stop-circle-outline"
              size="md"
              disabled={isBusy}
            />
            {recordingDuration != null ? (
              <Text style={styles.voiceRecordingTimer}>{formatRecordingDuration(recordingDuration)}</Text>
            ) : null}
          </>
        ) : audioUri ? (
          <View style={styles.attachedAudioCard}>
            <ComposerAudioPlayback uri={audioUri} styles={styles} errorTitle={copy.audioErrorTitle} />
            <View style={styles.attachedAudioActions}>
              <Button
                title={copy.startRecording}
                onPress={onToggleRecord}
                icon="mic-outline"
                variant="ghost"
                size="sm"
                disabled={isBusy}
              />
              <Button title={copy.removeAudio} variant="ghost" size="sm" onPress={onRemoveAudio} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.voiceStatusRow}>
              <View style={styles.voiceStatusPill}>
                <Text style={styles.voiceStatusLabel}>{copy.wakeCaptureVoiceHint}</Text>
              </View>
            </View>
            <Button
              title={copy.startRecording}
              onPress={onToggleRecord}
              icon="mic-outline"
              size="md"
              disabled={isBusy}
            />
          </>
        )}
      </View>
    </Card>
  );
}

type CoreCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  isWakeMode: boolean;
  isEntryEmpty: boolean;
  hasRestoredDraft: boolean;
  title: string;
  onChangeTitle: (value: string) => void;
  sleepDate: string;
  onChangeSleepDate: (value: string) => void;
  text: string;
  onChangeText: (value: string) => void;
  hasInvalidSleepDate: boolean;
  hasTriedSave: boolean;
  hasMissingContent: boolean;
  textWordCount: number;
};

export function DreamComposerCoreCard({
  styles,
  copy,
  isWakeMode,
  isEntryEmpty,
  hasRestoredDraft,
  title,
  onChangeTitle,
  sleepDate,
  onChangeSleepDate,
  text,
  onChangeText,
  hasInvalidSleepDate,
  hasTriedSave,
  hasMissingContent,
  textWordCount,
}: CoreCardProps) {
  const helperText =
    hasTriedSave && hasMissingContent
      ? copy.saveErrorDescription
      : `${textWordCount} ${copy.wordsUnit}`;
  const helperTone = hasTriedSave && hasMissingContent ? 'error' : 'default';

  return (
    <Card style={styles.card}>
      <SectionHeader
        title={isWakeMode ? copy.wakeCoreTitle : copy.coreTitle}
        subtitle={
          isEntryEmpty && !hasRestoredDraft
            ? copy.recordEmptyDescription
            : isWakeMode
              ? copy.wakeCoreDescription
              : copy.coreDescription
        }
      />
      {isWakeMode ? (
        <>
          <FormField
            label={copy.wakeTextLabel}
            placeholder={copy.wakeTextPlaceholder}
            value={text}
            onChangeText={onChangeText}
            multiline
            inputStyle={styles.textInput}
            helperText={helperText}
            helperTone={helperTone}
            invalid={hasTriedSave && hasMissingContent}
          />
          <Text style={styles.refineHint}>{copy.wakeReadyHint}</Text>
        </>
      ) : (
        <>
          <FormField
            label={copy.titleLabel}
            placeholder={copy.titlePlaceholder}
            value={title}
            onChangeText={onChangeTitle}
          />
          <FormField
            label={copy.sleepDateLabel}
            placeholder={copy.sleepDatePlaceholder}
            value={sleepDate}
            onChangeText={onChangeSleepDate}
            autoCapitalize="none"
            autoCorrect={false}
            invalid={hasInvalidSleepDate}
            helperText={hasInvalidSleepDate ? copy.sleepDateInvalidDescription : undefined}
            helperTone={hasInvalidSleepDate ? 'error' : 'default'}
          />
          <FormField
            label={copy.textLabel}
            placeholder={copy.textPlaceholder}
            value={text}
            onChangeText={onChangeText}
            multiline
            inputStyle={styles.textInput}
            helperText={helperText}
            helperTone={helperTone}
            invalid={hasTriedSave && hasMissingContent}
          />
        </>
      )}
    </Card>
  );
}

type RefineAction = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
};

type RefineCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  isWakeMode: boolean;
  actions: RefineAction[];
};

export function DreamComposerRefineCard({
  styles,
  copy,
  isWakeMode,
  actions,
}: RefineCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader
        title={isWakeMode ? copy.wakeRefineTitle : copy.refineTitle}
        subtitle={isWakeMode ? copy.wakeRefineDescription : copy.refineDescription}
      />

      <View style={styles.refineActionsRow}>
        {actions.map(action => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={[
              styles.refineActionChip,
              action.active ? styles.refineActionChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.refineActionLabel,
                action.active ? styles.refineActionLabelActive : null,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.refineHint}>
        {isWakeMode ? copy.wakeReadyHint : copy.refineReadyHint}
      </Text>
    </Card>
  );
}

type WakeMetaCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  title: string;
  onChangeTitle: (value: string) => void;
  sleepDate: string;
  onChangeSleepDate: (value: string) => void;
  hasInvalidSleepDate: boolean;
};

export function DreamComposerWakeMetaCard({
  styles,
  copy,
  title,
  onChangeTitle,
  sleepDate,
  onChangeSleepDate,
  hasInvalidSleepDate,
}: WakeMetaCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title={copy.wakeMetaTitle} subtitle={copy.wakeMetaDescription} />
      <FormField
        label={copy.titleLabel}
        placeholder={copy.titlePlaceholder}
        value={title}
        onChangeText={onChangeTitle}
      />
      <FormField
        label={copy.sleepDateLabel}
        placeholder={copy.sleepDatePlaceholder}
        value={sleepDate}
        onChangeText={onChangeSleepDate}
        autoCapitalize="none"
        autoCorrect={false}
        invalid={hasInvalidSleepDate}
        helperText={hasInvalidSleepDate ? copy.sleepDateInvalidDescription : undefined}
        helperTone={hasInvalidSleepDate ? 'error' : 'default'}
      />
    </Card>
  );
}
