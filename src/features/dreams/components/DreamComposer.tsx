import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
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
  getDreamPreSleepEmotions,
  getDreamStressLevels,
  getDreamWakeEmotions,
} from '../../../constants/copy/dreams';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from './ScreenStateCard';
import {
  Dream,
  Mood,
  PreSleepEmotion,
  SleepContext,
  StressLevel,
  WakeEmotion,
} from '../model/dream';
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
    Boolean(context.preSleepEmotions?.length) ||
    typeof context.alcoholTaken === 'boolean' ||
    typeof context.caffeineLate === 'boolean' ||
    Boolean(context.medications?.trim()) ||
    Boolean(context.importantEvents?.trim()) ||
    Boolean(context.healthNotes?.trim())
  );
}

function toggleSelection<T extends string>(values: T[], nextValue: T) {
  return values.includes(nextValue)
    ? values.filter(value => value !== nextValue)
    : [...values, nextValue];
}

function formatLocalAssetName(path?: string) {
  if (!path) {
    return undefined;
  }

  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] || path;
}

type DreamComposerProps = {
  mode: 'create' | 'edit';
  initialDream?: Dream;
  onSaved?: (dream: Dream) => void;
  autoStartRecordingKey?: number;
};

export function DreamComposer({
  mode,
  initialDream,
  onSaved,
  autoStartRecordingKey,
}: DreamComposerProps) {
  const initialDraft = React.useMemo(
    () => (mode === 'create' ? getDreamDraft() : null),
    [mode],
  );
  const initialHasMoodDetails =
    Boolean(initialDream?.mood ?? initialDraft?.mood) ||
    Boolean(initialDream?.wakeEmotions?.length ?? initialDraft?.wakeEmotions?.length);
  const initialHasContextDetails = hasSleepContextValues({
    stressLevel: initialDream?.sleepContext?.stressLevel ?? initialDraft?.stressLevel,
    preSleepEmotions:
      initialDream?.sleepContext?.preSleepEmotions ?? initialDraft?.preSleepEmotions,
    alcoholTaken: initialDream?.sleepContext?.alcoholTaken ?? initialDraft?.alcoholTaken,
    caffeineLate: initialDream?.sleepContext?.caffeineLate ?? initialDraft?.caffeineLate,
    medications: initialDream?.sleepContext?.medications ?? initialDraft?.medications,
    importantEvents:
      initialDream?.sleepContext?.importantEvents ?? initialDraft?.importantEvents,
    healthNotes: initialDream?.sleepContext?.healthNotes ?? initialDraft?.healthNotes,
  });
  const initialHasTags = Boolean(initialDream?.tags?.length ?? initialDraft?.tags?.length);
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moods = React.useMemo(() => getDreamMoods(locale), [locale]);
  const stressLevels = React.useMemo(() => getDreamStressLevels(locale), [locale]);
  const wakeEmotionOptions = React.useMemo(() => getDreamWakeEmotions(locale), [locale]);
  const preSleepEmotionOptions = React.useMemo(
    () => getDreamPreSleepEmotions(locale),
    [locale],
  );
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
  const [wakeEmotions, setWakeEmotions] = React.useState<WakeEmotion[]>(
    initialDream?.wakeEmotions ?? initialDraft?.wakeEmotions ?? [],
  );
  const [stressLevel, setStressLevel] = React.useState<StressLevel | undefined>(
    initialDream?.sleepContext?.stressLevel ?? initialDraft?.stressLevel,
  );
  const [preSleepEmotions, setPreSleepEmotions] = React.useState<PreSleepEmotion[]>(
    initialDream?.sleepContext?.preSleepEmotions ?? initialDraft?.preSleepEmotions ?? [],
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
  const [showMoodSection, setShowMoodSection] = React.useState(
    mode === 'edit' || initialHasMoodDetails,
  );
  const [showContextSection, setShowContextSection] = React.useState(
    mode === 'edit' || initialHasContextDetails,
  );
  const [showTagsSection, setShowTagsSection] = React.useState(
    mode === 'edit' || initialHasTags,
  );
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
  const hasContextSelections = hasSleepContextValues({
    stressLevel,
    preSleepEmotions,
    alcoholTaken,
    caffeineLate,
    medications,
    importantEvents,
    healthNotes,
  });
  const hasMoodSelections = Boolean(mood) || wakeEmotions.length > 0;
  const hasTagSelections = tags.length > 0;
  const isEntryEmpty =
    !title.trim() &&
    !hasDreamContent({ text, audioUri }) &&
    !hasTagSelections &&
    !hasMoodSelections &&
    !hasContextSelections;
  const saveDisabled = isBusy || recording || validationError !== null;
  const lastAutoStartKey = React.useRef<number | undefined>(undefined);

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
      wakeEmotions,
      stressLevel,
      preSleepEmotions,
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
    preSleepEmotions,
    sleepDate,
    stressLevel,
    tags,
    text,
    title,
    wakeEmotions,
  ]);

  const onToggleRecord = React.useCallback(async () => {
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
  }, [copy.audioErrorTitle, recording]);

  React.useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    if (!autoStartRecordingKey) {
      return;
    }

    if (lastAutoStartKey.current === autoStartRecordingKey) {
      return;
    }

    if (recording || audioUri) {
      lastAutoStartKey.current = autoStartRecordingKey;
      return;
    }

    if (isBusy) {
      return;
    }

    lastAutoStartKey.current = autoStartRecordingKey;
    onToggleRecord().catch(() => undefined);
  }, [audioUri, autoStartRecordingKey, isBusy, mode, onToggleRecord, recording]);

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
    setWakeEmotions([]);
    setStressLevel(undefined);
    setPreSleepEmotions([]);
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
        preSleepEmotions: preSleepEmotions.length ? preSleepEmotions : undefined,
        alcoholTaken,
        caffeineLate,
        medications: cleanMedications || undefined,
        importantEvents: cleanImportantEvents || undefined,
        healthNotes: cleanHealthNotes || undefined,
      };

      const saveValidationError = validateDreamForSave({
        text: cleanText,
        audioUri,
        sleepDate: cleanSleepDate,
      });

      if (saveValidationError === DREAM_SAVE_VALIDATION.missingContent) {
        setLastActionError(copy.saveErrorDescription);
        Alert.alert(copy.saveErrorTitle, copy.saveErrorDescription);
        return;
      }

      if (saveValidationError === DREAM_SAVE_VALIDATION.invalidSleepDate) {
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
        wakeEmotions: wakeEmotions.length ? wakeEmotions : undefined,
        sleepContext: hasSleepContextValues(sleepContext) ? sleepContext : undefined,
      };

      saveDream(dream);

      if (!isEdit) {
        resetForm();
      }

      if (onSaved) {
        onSaved(dream);
      } else {
        Alert.alert(
          isEdit ? copy.updateSuccessTitle : copy.saveSuccessTitle,
          isEdit ? copy.updateSuccessDescription : copy.saveSuccessDescription,
        );
      }
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
        <View pointerEvents="none" style={baseStyles.heroGlowLarge} />
        <View pointerEvents="none" style={baseStyles.heroGlowSmall} />
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
          </View>
          <View style={baseStyles.kaleidoscopeShell}>
            <View style={[baseStyles.kaleidoscopeFacet, baseStyles.kaleidoscopeFacetPrimary]} />
            <View style={[baseStyles.kaleidoscopeFacet, baseStyles.kaleidoscopeFacetAccent]} />
            <View style={[baseStyles.kaleidoscopeFacet, baseStyles.kaleidoscopeFacetAlt]} />
          </View>
        </View>

        <View style={baseStyles.helperChipsRow}>
          <View style={baseStyles.helperChip}>
            <Text style={baseStyles.helperChipLabel}>{sleepDate}</Text>
          </View>
          {audioUri ? (
            <View style={baseStyles.helperChip}>
              <Text style={baseStyles.helperChipLabel}>{copy.attachedAudioTitle}</Text>
            </View>
          ) : null}
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

      <Card style={baseStyles.card}>
        <View style={baseStyles.sectionAccentRow}>
          <View style={baseStyles.sectionAccentPrimary} />
          <View style={baseStyles.sectionAccentSecondary} />
        </View>
        <SectionHeader
          title={copy.voiceTitle}
          subtitle={audioUri ? undefined : copy.voiceDescription}
        />

        <View style={baseStyles.voiceStatusRow}>
          <View style={baseStyles.voiceStatusPill}>
            <Text style={baseStyles.voiceStatusLabel}>
              {recording
                ? copy.recordingHint
                : audioUri
                  ? copy.attachedAudioTitle
                  : copy.voiceIdleHint}
            </Text>
          </View>
          {audioUri ? (
            <Text style={baseStyles.voiceFileLabel}>{formatLocalAssetName(audioUri)}</Text>
          ) : null}
        </View>

        <Button
          title={recording ? copy.stopRecording : copy.startRecording}
          onPress={onToggleRecord}
          icon={recording ? 'stop-circle-outline' : 'mic-outline'}
          size="md"
        />

        {audioUri ? (
          <View style={baseStyles.attachedAudioCard}>
            <Text style={baseStyles.attachedAudioTitle}>{copy.attachedAudioTitle}</Text>
            <Text style={baseStyles.attachedAudioUri}>{formatLocalAssetName(audioUri)}</Text>
            <Button
              title={copy.removeAudio}
              variant="ghost"
              size="sm"
              onPress={() => setAudioUri(undefined)}
            />
          </View>
        ) : null}
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={copy.coreTitle}
          subtitle={
            isEntryEmpty && !hasRestoredDraft ? copy.recordEmptyDescription : copy.coreDescription
          }
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
        <SectionHeader title={copy.refineTitle} subtitle={copy.refineDescription} />

        <View style={baseStyles.refineActionsRow}>
          {[
            {
              key: 'mood',
              label: showMoodSection ? copy.refineHideAction : copy.refineMoodAction,
              active: showMoodSection || hasMoodSelections,
              onPress: () => setShowMoodSection(current => !current),
            },
            {
              key: 'context',
              label: showContextSection ? copy.refineHideAction : copy.refineContextAction,
              active: showContextSection || hasContextSelections,
              onPress: () => setShowContextSection(current => !current),
            },
            {
              key: 'tags',
              label: showTagsSection ? copy.refineHideAction : copy.refineTagsAction,
              active: showTagsSection || hasTagSelections,
              onPress: () => setShowTagsSection(current => !current),
            },
          ].map(action => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              style={[
                baseStyles.refineActionChip,
                action.active ? baseStyles.refineActionChipActive : null,
              ]}
            >
              <Text
                style={[
                  baseStyles.refineActionLabel,
                  action.active ? baseStyles.refineActionLabelActive : null,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={baseStyles.refineHint}>{copy.refineReadyHint}</Text>
      </Card>

      {showMoodSection ? (
        <Card style={baseStyles.card}>
          <View style={baseStyles.sectionAccentRow}>
            <View style={baseStyles.sectionAccentPrimary} />
            <View style={[baseStyles.sectionAccentSecondary, baseStyles.sectionAccentAlt]} />
          </View>
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

          <View style={baseStyles.contextBlock}>
            <Text style={baseStyles.contextFieldLabel}>{copy.wakeEmotionsTitle}</Text>
            <Text style={baseStyles.contextHint}>{copy.wakeEmotionsDescription}</Text>
            <View style={baseStyles.tagsWrap}>
              {wakeEmotionOptions.map(option => (
                <TagChip
                  key={option.value}
                  label={option.label}
                  selected={wakeEmotions.includes(option.value)}
                  onPress={() =>
                    setWakeEmotions(current => toggleSelection(current, option.value))
                  }
                />
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      {showContextSection ? (
        <Card style={baseStyles.card}>
          <View style={baseStyles.sectionAccentRow}>
            <View style={baseStyles.sectionAccentPrimary} />
            <View style={[baseStyles.sectionAccentSecondary, baseStyles.sectionAccentMuted]} />
          </View>
          <SectionHeader
            title={copy.sleepContextTitle}
            subtitle={copy.sleepContextDescription}
          />

          <View style={baseStyles.contextBlock}>
            <Text style={baseStyles.contextFieldLabel}>{copy.preSleepEmotionsLabel}</Text>
            <View style={baseStyles.tagsWrap}>
              {preSleepEmotionOptions.map(option => (
                <TagChip
                  key={option.value}
                  label={option.label}
                  selected={preSleepEmotions.includes(option.value)}
                  onPress={() =>
                    setPreSleepEmotions(current => toggleSelection(current, option.value))
                  }
                />
              ))}
            </View>
          </View>

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
                      setStressLevel(current =>
                        current === option.value ? undefined : option.value,
                      )
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
                      setAlcoholTaken(current =>
                        current === option.value ? undefined : option.value,
                      )
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
                      setCaffeineLate(current =>
                        current === option.value ? undefined : option.value,
                      )
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
      ) : null}

      {showTagsSection ? (
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
              containerStyle={baseStyles.tagField}
              inputStyle={baseStyles.tagInput}
            />
            <Button title={copy.addTag} size="sm" onPress={addTag} style={baseStyles.tagButton} />
          </View>

          <View style={baseStyles.tagsWrap}>
            {tags.length ? (
              tags.map(tag => (
                <TagChip
                  key={tag}
                  label={tag}
                  removable
                  onPress={() => removeTag(tag)}
                />
              ))
            ) : (
              <Text style={baseStyles.emptyTags}>{copy.tagsEmpty}</Text>
            )}
          </View>
        </Card>
      ) : null}

      <Button
        title={isEdit ? copy.updateDream : copy.saveDream}
        onPress={onSave}
        disabled={saveDisabled}
      />
    </ScreenContainer>
  );
}
