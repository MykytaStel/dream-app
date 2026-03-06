import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Pulse } from '../../../components/animation/Pulse';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import {
  getDreamCopy,
  getDreamMoods,
  getDreamStressLevels,
} from '../../../constants/copy/dreams';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from './ScreenStateCard';
import { Dream, Mood, SleepContext, StressLevel } from '../model/dream';
import {
  DREAM_SAVE_VALIDATION,
  hasDreamContent,
  normalizeTag,
  normalizeTags,
  validateDreamForSave,
} from '../model/dreamRules';
import { saveDream } from '../repository/dreamsRepository';
import { startRecording, stopRecording } from '../services/audioService';
import {
  clearDreamDraft,
  getDreamDraft,
  saveDreamDraft,
} from '../services/dreamDraftService';
import { createDreamId } from '../utils/createDreamId';
import { createNewDreamScreenStyles } from '../screens/NewDreamScreen.styles';

function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function hasSleepContextValues(context: SleepContext) {
  return (
    typeof context.stressLevel === 'number' ||
    typeof context.alcoholTaken === 'boolean' ||
    typeof context.caffeineLate === 'boolean' ||
    Boolean(context.medications?.trim()) ||
    Boolean(context.importantEvents?.trim()) ||
    Boolean(context.healthNotes?.trim())
  );
}

type DreamComposerProps = {
  mode: 'create' | 'edit';
  initialDream?: Dream;
  onSaved?: (dream: Dream) => void;
};

export function DreamComposer({
  mode,
  initialDream,
  onSaved,
}: DreamComposerProps) {
  const initialDraft = React.useMemo(
    () => (mode === 'create' ? getDreamDraft() : null),
    [mode],
  );
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moods = React.useMemo(() => getDreamMoods(locale), [locale]);
  const stressLevels = React.useMemo(() => getDreamStressLevels(locale), [locale]);
  const [title, setTitle] = React.useState(initialDream?.title ?? initialDraft?.title ?? '');
  const [text, setText] = React.useState(initialDream?.text ?? initialDraft?.text ?? '');
  const [sleepDate, setSleepDate] = React.useState(
    initialDream?.sleepDate ?? initialDraft?.sleepDate ?? getTodayDate(),
  );
  const [recording, setRecording] = React.useState(false);
  const [audioUri, setAudioUri] = React.useState<string | undefined>(
    initialDream?.audioUri ?? initialDraft?.audioUri,
  );
  const [mood, setMood] = React.useState<Mood | undefined>(initialDream?.mood ?? initialDraft?.mood);
  const [stressLevel, setStressLevel] = React.useState<StressLevel | undefined>(
    initialDream?.sleepContext?.stressLevel ?? initialDraft?.stressLevel,
  );
  const [alcoholTaken, setAlcoholTaken] = React.useState<boolean | undefined>(
    initialDream?.sleepContext?.alcoholTaken ?? initialDraft?.alcoholTaken,
  );
  const [caffeineLate, setCaffeineLate] = React.useState<boolean | undefined>(
    initialDream?.sleepContext?.caffeineLate ?? initialDraft?.caffeineLate,
  );
  const [medications, setMedications] = React.useState(
    initialDream?.sleepContext?.medications ?? initialDraft?.medications ?? '',
  );
  const [importantEvents, setImportantEvents] = React.useState(
    initialDream?.sleepContext?.importantEvents ?? initialDraft?.importantEvents ?? '',
  );
  const [healthNotes, setHealthNotes] = React.useState(
    initialDream?.sleepContext?.healthNotes ?? initialDraft?.healthNotes ?? '',
  );
  const [tags, setTags] = React.useState<string[]>(
    normalizeTags(initialDream?.tags ?? initialDraft?.tags ?? []),
  );
  const [tagInput, setTagInput] = React.useState('');
  const [isBusy, setIsBusy] = React.useState(false);
  const [hasTriedSave, setHasTriedSave] = React.useState(false);
  const [lastActionError, setLastActionError] = React.useState<string | null>(null);
  const baseStyles = createNewDreamScreenStyles(t, false);
  const isEdit = mode === 'edit';
  const validationError = validateDreamForSave({
    text,
    audioUri,
    sleepDate,
  });
  const hasInvalidSleepDate =
    Boolean(sleepDate.trim()) &&
    validationError === DREAM_SAVE_VALIDATION.invalidSleepDate;
  const hasMissingContent = validationError === DREAM_SAVE_VALIDATION.missingContent;
  const hasRestoredDraft = mode === 'create' && Boolean(initialDraft);
  const isEntryEmpty =
    !title.trim() &&
    !hasDreamContent({ text, audioUri }) &&
    tags.length === 0 &&
    !mood;
  const saveDisabled = isBusy || recording || validationError !== null;

  React.useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    saveDreamDraft({
      title,
      text,
      sleepDate,
      audioUri,
      mood,
      stressLevel,
      alcoholTaken,
      caffeineLate,
      medications,
      importantEvents,
      healthNotes,
      tags,
    });
  }, [
    alcoholTaken,
    audioUri,
    caffeineLate,
    healthNotes,
    importantEvents,
    medications,
    mode,
    mood,
    sleepDate,
    stressLevel,
    tags,
    text,
    title,
  ]);

  async function onToggleRecord() {
    setIsBusy(true);
    setLastActionError(null);

    try {
      if (!recording) {
        await startRecording();
        setRecording(true);
        return;
      }

      const uri = await stopRecording();
      setAudioUri(uri || undefined);
      setRecording(false);
    } catch (e) {
      setRecording(false);
      setLastActionError(String(e));
      Alert.alert(copy.audioErrorTitle, String(e));
    } finally {
      setIsBusy(false);
    }
  }

  function addTag() {
    const next = normalizeTag(tagInput);
    if (!next) {
      return;
    }

    if (tags.includes(next)) {
      setTagInput('');
      return;
    }

    setTags(current => [...current, next]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(current => current.filter(value => value !== tag));
  }

  function resetForm() {
    setTitle('');
    setText('');
    setSleepDate(getTodayDate());
    setAudioUri(undefined);
    setMood(undefined);
    setStressLevel(undefined);
    setAlcoholTaken(undefined);
    setCaffeineLate(undefined);
    setMedications('');
    setImportantEvents('');
    setHealthNotes('');
    setTags([]);
    setTagInput('');
    setRecording(false);
    setHasTriedSave(false);
    clearDreamDraft();
  }

  function onSave() {
    setHasTriedSave(true);
    setIsBusy(true);
    setLastActionError(null);

    try {
      const cleanTitle = title.trim();
      const cleanText = text.trim();
      const cleanSleepDate = sleepDate.trim();
      const cleanMedications = medications.trim();
      const cleanImportantEvents = importantEvents.trim();
      const cleanHealthNotes = healthNotes.trim();

      const sleepContext: SleepContext = {
        stressLevel,
        alcoholTaken,
        caffeineLate,
        medications: cleanMedications || undefined,
        importantEvents: cleanImportantEvents || undefined,
        healthNotes: cleanHealthNotes || undefined,
      };

      const validationError = validateDreamForSave({
        text: cleanText,
        audioUri,
        sleepDate: cleanSleepDate,
      });

      if (validationError === DREAM_SAVE_VALIDATION.missingContent) {
        setLastActionError(copy.saveErrorDescription);
        Alert.alert(copy.saveErrorTitle, copy.saveErrorDescription);
        return;
      }

      if (validationError === DREAM_SAVE_VALIDATION.invalidSleepDate) {
        setLastActionError(copy.sleepDateInvalidDescription);
        Alert.alert(copy.sleepDateInvalidTitle, copy.sleepDateInvalidDescription);
        return;
      }

      const dream: Dream = {
        id: initialDream?.id ?? createDreamId(),
        createdAt: initialDream?.createdAt ?? Date.now(),
        archivedAt: initialDream?.archivedAt,
        sleepDate: cleanSleepDate || getTodayDate(),
        title: cleanTitle || undefined,
        text: cleanText || undefined,
        audioUri,
        tags: normalizeTags(tags),
        mood,
        sleepContext: hasSleepContextValues(sleepContext) ? sleepContext : undefined,
      };

      saveDream(dream);

      if (!isEdit) {
        resetForm();
      }

      Alert.alert(
        isEdit ? copy.updateSuccessTitle : copy.saveSuccessTitle,
        isEdit ? copy.updateSuccessDescription : copy.saveSuccessDescription,
      );
      onSaved?.(dream);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastActionError(message);
      Alert.alert(copy.recordErrorTitle, message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <ScreenContainer scroll keyboardShouldPersistTaps="handled">
      <Card style={baseStyles.heroCard}>
        <View style={baseStyles.heroTopRow}>
          <View style={baseStyles.heroCopy}>
            <Text style={baseStyles.heroEyebrow}>
              {isEdit ? copy.editTitle : copy.createTitle}
            </Text>
            <SectionHeader
              title={isEdit ? copy.editHeroTitle : copy.createHeroTitle}
              subtitle={isEdit ? copy.editSubtitle : copy.createSubtitle}
              large
            />
            <Text style={baseStyles.heroDescription}>
              {isEdit ? copy.editHeroDescription : copy.createHeroDescription}
            </Text>
          </View>
          <View style={baseStyles.pulseShell}>
            <Pulse size={44} active={recording} />
          </View>
        </View>

        <View style={baseStyles.helperChipsRow}>
          <View style={baseStyles.helperChip}>
            <Text style={baseStyles.helperChipLabel}>{sleepDate}</Text>
          </View>
          <View style={baseStyles.helperChip}>
            <Text style={baseStyles.helperChipLabel}>
              {audioUri ? copy.attachedAudioTitle : copy.voiceIdleHint}
            </Text>
          </View>
          {hasRestoredDraft ? (
            <View style={baseStyles.helperChip}>
              <Text style={baseStyles.helperChipLabel}>{copy.recordDraftRestoredTitle}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      {isBusy ? (
        <ScreenStateCard
          variant="loading"
          title={copy.recordLoadingTitle}
          subtitle={copy.recordLoadingDescription}
        />
      ) : null}

      {!isBusy && lastActionError ? (
        <ScreenStateCard
          variant="error"
          title={copy.recordErrorTitle}
          subtitle={lastActionError}
          actionLabel={copy.clearErrorAction}
          onAction={() => setLastActionError(null)}
        />
      ) : null}

      {!isBusy && !lastActionError && isEntryEmpty ? (
        <ScreenStateCard
          variant="empty"
          title={hasRestoredDraft ? copy.recordDraftRestoredTitle : copy.recordEmptyTitle}
          subtitle={
            hasRestoredDraft
              ? copy.recordDraftRestoredDescription
              : copy.recordEmptyDescription
          }
        />
      ) : null}

      <Card style={baseStyles.card}>
        <SectionHeader
          title={copy.coreTitle}
          subtitle={copy.coreDescription}
        />
        <FormField
          label={copy.titleLabel}
          placeholder={copy.titlePlaceholder}
          value={title}
          onChangeText={setTitle}
        />
        <FormField
          label={copy.sleepDateLabel}
          placeholder={copy.sleepDatePlaceholder}
          value={sleepDate}
          onChangeText={setSleepDate}
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
          onChangeText={setText}
          multiline
          inputStyle={baseStyles.textInput}
          helperText={
            hasTriedSave && hasMissingContent
              ? copy.saveErrorDescription
              : text.trim()
              ? `${text.trim().split(/\s+/).length} ${copy.wordsUnit}`
              : `0 ${copy.wordsUnit}`
          }
          helperTone={hasTriedSave && hasMissingContent ? 'error' : 'default'}
          invalid={hasTriedSave && hasMissingContent}
        />
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={copy.moodTitle}
          subtitle={copy.moodDescription}
        />

        <View style={baseStyles.moodRow}>
          {moods.map(option => {
            const selected = mood === option.value;
            const styles = createNewDreamScreenStyles(t, selected);
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setMood(current =>
                    current === option.value ? undefined : option.value,
                  )
                }
                style={styles.moodOption}
              >
                <Text style={styles.moodLabel}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={copy.sleepContextTitle}
          subtitle={copy.sleepContextDescription}
        />

        <View style={baseStyles.contextBlock}>
          <Text style={baseStyles.contextFieldLabel}>{copy.stressLabel}</Text>
          <View style={baseStyles.contextOptionsRow}>
            {stressLevels.map(option => {
              const selected = stressLevel === option.value;
              const styles = createNewDreamScreenStyles(t, selected);
              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    setStressLevel(current => (current === option.value ? undefined : option.value))
                  }
                  style={styles.contextOption}
                >
                  <Text
                    style={styles.contextOptionLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={baseStyles.contextBlock}>
          <Text style={baseStyles.contextFieldLabel}>{copy.alcoholLabel}</Text>
          <View style={baseStyles.contextOptionsRow}>
            {[
              { label: copy.boolNo, value: false },
              { label: copy.boolYes, value: true },
            ].map(option => {
              const selected = alcoholTaken === option.value;
              const styles = createNewDreamScreenStyles(t, selected);
              return (
                <Pressable
                  key={`alcohol-${option.label}`}
                  onPress={() =>
                    setAlcoholTaken(current => (current === option.value ? undefined : option.value))
                  }
                  style={styles.contextOption}
                >
                  <Text style={styles.contextOptionLabel} numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={baseStyles.contextBlock}>
          <Text style={baseStyles.contextFieldLabel}>{copy.caffeineLabel}</Text>
          <View style={baseStyles.contextOptionsRow}>
            {[
              { label: copy.boolNo, value: false },
              { label: copy.boolYes, value: true },
            ].map(option => {
              const selected = caffeineLate === option.value;
              const styles = createNewDreamScreenStyles(t, selected);
              return (
                <Pressable
                  key={`caffeine-${option.label}`}
                  onPress={() =>
                    setCaffeineLate(current => (current === option.value ? undefined : option.value))
                  }
                  style={styles.contextOption}
                >
                  <Text style={styles.contextOptionLabel} numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormField
          label={copy.medicationsLabel}
          placeholder={copy.medicationsPlaceholder}
          value={medications}
          onChangeText={setMedications}
          multiline
          inputStyle={baseStyles.contextTextInput}
        />

        <FormField
          label={copy.eventsLabel}
          placeholder={copy.eventsPlaceholder}
          value={importantEvents}
          onChangeText={setImportantEvents}
          multiline
          inputStyle={baseStyles.contextTextInput}
        />

        <FormField
          label={copy.healthNotesLabel}
          placeholder={copy.healthNotesPlaceholder}
          value={healthNotes}
          onChangeText={setHealthNotes}
          multiline
          inputStyle={baseStyles.contextTextInput}
        />
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={copy.tagsTitle}
          subtitle={copy.tagsDescription}
        />

        <View style={baseStyles.tagsInputRow}>
          <FormField
            label=""
            placeholder={copy.tagsPlaceholder}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            inputStyle={baseStyles.tagInput}
          />
          <Button title={copy.addTag} onPress={addTag} style={baseStyles.tagButton} />
        </View>

        <View style={baseStyles.tagsWrap}>
          {tags.length ? (
            tags.map(tag => (
              <TagChip key={tag} label={`${tag} x`} onPress={() => removeTag(tag)} />
            ))
          ) : (
            <Text style={baseStyles.emptyTags}>{copy.tagsEmpty}</Text>
          )}
        </View>
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={copy.voiceTitle}
          subtitle={copy.voiceDescription}
        />

        <Button
          title={recording ? copy.stopRecording : copy.startRecording}
          onPress={onToggleRecord}
        />

        {recording ? (
          <Text style={baseStyles.recordingHint}>{copy.recordingHint}</Text>
        ) : null}

        {audioUri ? (
          <View style={baseStyles.attachedAudioCard}>
            <Text style={baseStyles.attachedAudioTitle}>{copy.attachedAudioTitle}</Text>
            <Text style={baseStyles.attachedAudioUri}>{audioUri}</Text>
            <Button
              title={copy.removeAudio}
              variant="ghost"
              onPress={() => setAudioUri(undefined)}
            />
          </View>
        ) : null}
      </Card>

      <Button
        title={isEdit ? copy.updateDream : copy.saveDream}
        onPress={onSave}
        disabled={saveDisabled}
      />
    </ScreenContainer>
  );
}
