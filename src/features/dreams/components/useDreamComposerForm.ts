import React from 'react';
import { Alert, Platform } from 'react-native';
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
import {
  DreamComposerCopy,
  DreamComposerEntryMode,
  DreamComposerMode,
} from './DreamComposer.types';

export function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function hasSleepContextValues(context: SleepContext) {
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

export function toggleSelection<T extends string>(values: T[], nextValue: T) {
  return values.includes(nextValue)
    ? values.filter(value => value !== nextValue)
    : [...values, nextValue];
}

export function formatLocalAssetName(path?: string) {
  if (!path) {
    return undefined;
  }

  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] || path;
}

type UseDreamComposerFormArgs = {
  mode: DreamComposerMode;
  entryMode: DreamComposerEntryMode;
  initialDream?: Dream;
  onSaved?: (dream: Dream) => void;
  autoStartRecordingKey?: number;
  copy: DreamComposerCopy;
};

export function useDreamComposerForm({
  mode,
  entryMode,
  initialDream,
  onSaved,
  autoStartRecordingKey,
  copy,
}: UseDreamComposerFormArgs) {
  const initialDraft = React.useMemo(() => (mode === 'create' ? getDreamDraft() : null), [mode]);
  const isWakeMode = mode === 'create' && entryMode === 'wake';
  const isEdit = mode === 'edit';
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
    isWakeMode || mode === 'edit' || initialHasMoodDetails,
  );
  const [showContextSection, setShowContextSection] = React.useState(
    mode === 'edit' || initialHasContextDetails,
  );
  const [showTagsSection, setShowTagsSection] = React.useState(mode === 'edit' || initialHasTags);
  const [showMetaSection, setShowMetaSection] = React.useState(mode === 'edit' || !isWakeMode);
  const lastAutoStartKey = React.useRef<number | undefined>(undefined);

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
  const hasEditedMeta = Boolean(title.trim()) || sleepDate !== getTodayDate();
  const showMoodCard = isWakeMode || showMoodSection;
  const isEntryEmpty =
    !title.trim() &&
    !hasDreamContent({ text, audioUri }) &&
    !hasTagSelections &&
    !hasMoodSelections &&
    !hasContextSelections;
  const saveDisabled = isBusy || recording || validationError !== null;
  const textWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

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
    } catch (error) {
      setRecording(false);
      const rawMessage = error instanceof Error ? error.message : String(error);
      const message =
        Platform.OS === 'ios' ? `${rawMessage}\n\n${copy.audioSimulatorHint}` : rawMessage;
      setLastActionError(message);
      Alert.alert(copy.audioErrorTitle, message);
    } finally {
      setIsBusy(false);
    }
  }, [copy.audioErrorTitle, copy.audioSimulatorHint, recording]);

  React.useEffect(() => {
    if (mode !== 'create' || !autoStartRecordingKey) {
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

  React.useEffect(() => {
    if (!isWakeMode) {
      return;
    }

    setShowMoodSection(true);
  }, [isWakeMode]);

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
    setLastActionError(null);
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

  return {
    initialDraft,
    isWakeMode,
    isEdit,
    title,
    setTitle,
    text,
    setText,
    sleepDate,
    setSleepDate,
    recording,
    audioUri,
    setAudioUri,
    mood,
    setMood,
    wakeEmotions,
    setWakeEmotions,
    stressLevel,
    setStressLevel,
    preSleepEmotions,
    setPreSleepEmotions,
    alcoholTaken,
    setAlcoholTaken,
    caffeineLate,
    setCaffeineLate,
    medications,
    setMedications,
    importantEvents,
    setImportantEvents,
    healthNotes,
    setHealthNotes,
    tags,
    setTags,
    tagInput,
    setTagInput,
    isBusy,
    hasTriedSave,
    lastActionError,
    setLastActionError,
    showMoodSection,
    setShowMoodSection,
    showContextSection,
    setShowContextSection,
    showTagsSection,
    setShowTagsSection,
    showMetaSection,
    setShowMetaSection,
    validationError,
    hasInvalidSleepDate,
    hasMissingContent,
    hasRestoredDraft,
    hasContextSelections,
    hasMoodSelections,
    hasTagSelections,
    hasEditedMeta,
    showMoodCard,
    isEntryEmpty,
    saveDisabled,
    textWordCount,
    onToggleRecord,
    addTag,
    removeTag,
    onSave,
    toggleWakeEmotion: (value: WakeEmotion) =>
      setWakeEmotions(current => toggleSelection(current, value)),
    togglePreSleepEmotion: (value: PreSleepEmotion) =>
      setPreSleepEmotions(current => toggleSelection(current, value)),
  };
}
