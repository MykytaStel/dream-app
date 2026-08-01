import React from 'react';
import { Alert, Platform } from 'react-native';
import {
  Dream,
  DreamIntensity,
  LucidControlArea,
  LucidStabilizationAction,
  Mood,
  NightmareAftereffect,
  NightmareGroundingAction,
  PreSleepEmotion,
  WakeEmotion,
} from '../model/dream';
import {
  DREAM_SAVE_VALIDATION,
  hasDreamContent,
  normalizeTag,
  normalizeTags,
  validateDreamForSave,
} from '../model/dreamRules';
import { getDreamLucidityLevel } from '../model/dreamAnalytics';
import {
  hasSleepContextValues,
  useSleepContextFields,
} from './composer/useSleepContextFields';
import {
  hasLucidPracticeValues,
  useLucidPracticeFields,
} from './composer/useLucidPracticeFields';
import {
  hasNightmareValues,
  useNightmareFields,
} from './composer/useNightmareFields';
import { saveDream } from '../repository/dreamsRepository';
import { logActionError } from '../../../app/errorReporting';
import {
  cleanupOrphanedAudioFiles,
  startRecording,
  stopRecording,
} from '../services/audioService';
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
import { trackDreamSaved } from '../../../services/observability/events';
import {
  hapticSave,
  hapticImpactMedium,
} from '../../../services/haptics/hapticService';

export function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Adds a value to a multi-select, or removes it if it is already chosen.
 *
 * Exported because several of the extracted field groups drive multi-selects
 * with it, and it belongs to none of them in particular.
 */
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
  const initialDraft = React.useMemo(
    () => (mode === 'create' ? getDreamDraft() : null),
    [mode],
  );
  const isWakeMode = mode === 'create' && entryMode === 'wake';
  const isEdit = mode === 'edit';
  const initialLucidity = initialDream
    ? getDreamLucidityLevel(initialDream)
    : initialDraft
      ? getDreamLucidityLevel(initialDraft)
      : undefined;
  const initialHasMoodDetails =
    Boolean(initialDream?.mood ?? initialDraft?.mood) ||
    Boolean(initialDream?.dreamIntensity ?? initialDraft?.dreamIntensity) ||
    Boolean(
      initialDream?.wakeEmotions?.length ?? initialDraft?.wakeEmotions?.length,
    ) ||
    typeof initialLucidity === 'number';
  const initialHasContextDetails = hasSleepContextValues({
    stressLevel:
      initialDream?.sleepContext?.stressLevel ?? initialDraft?.stressLevel,
    preSleepEmotions:
      initialDream?.sleepContext?.preSleepEmotions ??
      initialDraft?.preSleepEmotions,
    alcoholTaken:
      initialDream?.sleepContext?.alcoholTaken ?? initialDraft?.alcoholTaken,
    caffeineLate:
      initialDream?.sleepContext?.caffeineLate ?? initialDraft?.caffeineLate,
    medications:
      initialDream?.sleepContext?.medications ?? initialDraft?.medications,
    importantEvents:
      initialDream?.sleepContext?.importantEvents ??
      initialDraft?.importantEvents,
    healthNotes:
      initialDream?.sleepContext?.healthNotes ?? initialDraft?.healthNotes,
  });
  const initialHasTags = Boolean(
    initialDream?.tags?.length ?? initialDraft?.tags?.length,
  );
  const initialHasLucidPractice = hasLucidPracticeValues({
    lucidTechnique:
      initialDream?.lucidPractice?.technique ?? initialDraft?.lucidTechnique,
    dreamSigns:
      initialDream?.lucidPractice?.dreamSigns ?? initialDraft?.dreamSigns,
    lucidTrigger:
      initialDream?.lucidPractice?.trigger ?? initialDraft?.lucidTrigger,
    controlAreas:
      initialDream?.lucidPractice?.controlAreas ?? initialDraft?.controlAreas,
    stabilizationActions:
      initialDream?.lucidPractice?.stabilizationActions ??
      initialDraft?.stabilizationActions,
    recallScore:
      initialDream?.lucidPractice?.recallScore ?? initialDraft?.recallScore,
  });
  const initialHasNightmare = hasNightmareValues({
    nightmareExplicit:
      initialDream?.nightmare?.explicit ?? initialDraft?.nightmareExplicit,
    nightmareDistress:
      initialDream?.nightmare?.distress ?? initialDraft?.nightmareDistress,
    nightmareRecurring:
      initialDream?.nightmare?.recurring ?? initialDraft?.nightmareRecurring,
    nightmareRecurringKey:
      initialDream?.nightmare?.recurringKey ??
      initialDraft?.nightmareRecurringKey,
    nightmareWokeFromDream:
      initialDream?.nightmare?.wokeFromDream ??
      initialDraft?.nightmareWokeFromDream,
    nightmareAftereffects:
      initialDream?.nightmare?.aftereffects ??
      initialDraft?.nightmareAftereffects,
    nightmareGroundingUsed:
      initialDream?.nightmare?.groundingUsed ??
      initialDraft?.nightmareGroundingUsed,
    nightmareRewrittenEnding:
      initialDream?.nightmare?.rewrittenEnding ??
      initialDraft?.nightmareRewrittenEnding,
    nightmareRescriptStatus:
      initialDream?.nightmare?.rescriptStatus ??
      initialDraft?.nightmareRescriptStatus,
  });

  const [title, setTitle] = React.useState(
    initialDream?.title ?? initialDraft?.title ?? '',
  );
  const [text, setText] = React.useState(
    initialDream?.text ?? initialDraft?.text ?? '',
  );
  const [sleepDate, setSleepDate] = React.useState(
    initialDream?.sleepDate ?? initialDraft?.sleepDate ?? getTodayDate(),
  );
  const [recording, setRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const recordingIntervalRef = React.useRef<ReturnType<
    typeof setInterval
  > | null>(null);
  const [audioUri, setAudioUri] = React.useState<string | undefined>(
    initialDream?.audioUri ?? initialDraft?.audioUri,
  );
  const [mood, setMood] = React.useState<Mood | undefined>(
    initialDream?.mood ?? initialDraft?.mood,
  );
  const [dreamIntensity, setDreamIntensity] = React.useState<
    DreamIntensity | undefined
  >(initialDream?.dreamIntensity ?? initialDraft?.dreamIntensity);
  const [lucidity, setLucidity] =
    React.useState<Dream['lucidity']>(initialLucidity);
  const [wakeEmotions, setWakeEmotions] = React.useState<WakeEmotion[]>(
    initialDream?.wakeEmotions ?? initialDraft?.wakeEmotions ?? [],
  );
  const {
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
    buildSleepContext,
    sleepContextDraftValues,
  } = useSleepContextFields(initialDream, initialDraft);
  const [tags, setTags] = React.useState<string[]>(
    normalizeTags(initialDream?.tags ?? initialDraft?.tags ?? []),
  );
  const {
    lucidTechnique,
    setLucidTechnique,
    dreamSignsInput,
    setDreamSignsInput,
    dreamSigns,
    lucidTrigger,
    setLucidTrigger,
    controlAreas,
    setControlAreas,
    stabilizationActions,
    setStabilizationActions,
    recallScore,
    setRecallScore,
    buildLucidPractice,
    lucidPracticeDraftValues,
  } = useLucidPracticeFields(initialDream, initialDraft);
  const {
    nightmareExplicit,
    setNightmareExplicit,
    nightmareDistress,
    setNightmareDistress,
    nightmareRecurring,
    setNightmareRecurring,
    nightmareRecurringKey,
    setNightmareRecurringKey,
    nightmareWokeFromDream,
    setNightmareWokeFromDream,
    nightmareAftereffects,
    setNightmareAftereffects,
    nightmareGroundingUsed,
    setNightmareGroundingUsed,
    nightmareRewrittenEnding,
    setNightmareRewrittenEnding,
    nightmareRescriptStatus,
    setNightmareRescriptStatus,
    buildNightmare,
    nightmareDraftValues,
  } = useNightmareFields(initialDream, initialDraft);
  const [tagInput, setTagInput] = React.useState('');
  const [isBusy, setIsBusy] = React.useState(false);
  const [hasTriedSave, setHasTriedSave] = React.useState(false);
  const [lastActionError, setLastActionError] = React.useState<string | null>(
    null,
  );
  const [showMoodSection, setShowMoodSection] = React.useState(
    isWakeMode || mode === 'edit' || initialHasMoodDetails,
  );
  const [showContextSection, setShowContextSection] = React.useState(
    mode === 'edit' || initialHasContextDetails,
  );
  const [showTagsSection, setShowTagsSection] = React.useState(
    mode === 'edit' || initialHasTags,
  );
  const [showLucidPracticeSection, setShowLucidPracticeSection] =
    React.useState(mode === 'edit' || initialHasLucidPractice);
  const [showNightmareSection, setShowNightmareSection] = React.useState(
    mode === 'edit' || initialHasNightmare,
  );
  const [showMetaSection, setShowMetaSection] = React.useState(
    mode === 'edit' || !isWakeMode,
  );
  const lastAutoStartKey = React.useRef<number | undefined>(undefined);

  const validationError = validateDreamForSave({
    text,
    audioUri,
    sleepDate,
  });
  const hasInvalidSleepDate =
    Boolean(sleepDate.trim()) &&
    validationError === DREAM_SAVE_VALIDATION.invalidSleepDate;
  const hasMissingContent =
    validationError === DREAM_SAVE_VALIDATION.missingContent;
  const hasRestoredDraft = mode === 'create' && Boolean(initialDraft);
  const hasContextSelections = hasSleepContextValues(sleepContextDraftValues);
  const hasMoodSelections =
    Boolean(mood) || Boolean(dreamIntensity) || wakeEmotions.length > 0;
  const hasLuciditySelection = typeof lucidity === 'number';
  const hasTagSelections = tags.length > 0;
  const hasLucidPracticeSelections = hasLucidPracticeValues(
    lucidPracticeDraftValues,
  );
  const hasNightmareSelections = hasNightmareValues(nightmareDraftValues);
  const todayDate = React.useMemo(() => getTodayDate(), []);
  const hasEditedMeta = Boolean(title.trim()) || sleepDate !== todayDate;
  const showMoodCard = isWakeMode || showMoodSection;
  const isEntryEmpty =
    !title.trim() &&
    !hasDreamContent({ text, audioUri }) &&
    !hasTagSelections &&
    !hasMoodSelections &&
    !hasLuciditySelection &&
    !hasContextSelections &&
    !hasLucidPracticeSelections &&
    !hasNightmareSelections;
  const saveDisabled = isBusy || recording || validationError !== null;
  const textWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  React.useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveDreamDraft({
        title,
        text,
        sleepDate,
        audioUri,
        entryMode,
        mood,
        dreamIntensity,
        lucidity,
        wakeEmotions,
        stressLevel,
        preSleepEmotions,
        alcoholTaken,
        caffeineLate,
        medications,
        importantEvents,
        healthNotes,
        tags,
        lucidTechnique,
        dreamSigns,
        lucidTrigger,
        controlAreas,
        stabilizationActions,
        recallScore,
        nightmareExplicit,
        nightmareDistress,
        nightmareRecurring,
        nightmareRecurringKey,
        nightmareWokeFromDream,
        nightmareAftereffects,
        nightmareGroundingUsed,
        nightmareRewrittenEnding,
        nightmareRescriptStatus,
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    alcoholTaken,
    audioUri,
    caffeineLate,
    dreamIntensity,
    dreamSigns,
    dreamSignsInput,
    entryMode,
    healthNotes,
    importantEvents,
    controlAreas,
    lucidity,
    lucidTechnique,
    lucidTrigger,
    medications,
    mode,
    mood,
    nightmareAftereffects,
    nightmareDistress,
    nightmareExplicit,
    nightmareGroundingUsed,
    nightmareRecurring,
    nightmareRecurringKey,
    nightmareRewrittenEnding,
    nightmareRescriptStatus,
    nightmareWokeFromDream,
    preSleepEmotions,
    recallScore,
    sleepDate,
    stabilizationActions,
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
        hapticImpactMedium();
        await startRecording();
        setRecording(true);
        setRecordingDuration(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(d => d + 1);
        }, 1000);
        return;
      }

      hapticImpactMedium();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      const uri = await stopRecording();
      setAudioUri(uri || undefined);
      setRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingDuration(0);
      setRecording(false);
      const code = (error as { code?: string })?.code;
      let message: string;
      if (code === 'audio-permission-denied') {
        message = copy.audioPermissionDenied;
      } else if (code === 'audio-permission-unavailable') {
        message = copy.audioPermissionUnavailable;
      } else {
        const rawMessage =
          error instanceof Error ? error.message : String(error);
        message =
          Platform.OS === 'ios'
            ? `${rawMessage}\n\n${copy.audioSimulatorHint}`
            : rawMessage;
      }
      setLastActionError(message);
      Alert.alert(copy.audioErrorTitle, message);
    } finally {
      setIsBusy(false);
    }
  }, [
    copy.audioErrorTitle,
    copy.audioPermissionDenied,
    copy.audioPermissionUnavailable,
    copy.audioSimulatorHint,
    recording,
  ]);

  React.useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    cleanupOrphanedAudioFiles(7).catch(e =>
      logActionError('useDreamComposerForm.cleanupOrphanedAudioFiles', e),
    );
  }, []);

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
    onToggleRecord().catch(e =>
      logActionError('useDreamComposerForm.autoStartRecording', e),
    );
  }, [
    audioUri,
    autoStartRecordingKey,
    isBusy,
    mode,
    onToggleRecord,
    recording,
  ]);

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
    setDreamIntensity(undefined);
    setLucidity(undefined);
    setWakeEmotions([]);
    setStressLevel(undefined);
    setPreSleepEmotions([]);
    setAlcoholTaken(undefined);
    setCaffeineLate(undefined);
    setMedications('');
    setImportantEvents('');
    setHealthNotes('');
    setTags([]);
    setLucidTechnique(undefined);
    setDreamSignsInput('');
    setLucidTrigger('');
    setControlAreas([]);
    setStabilizationActions([]);
    setRecallScore(undefined);
    setNightmareExplicit(undefined);
    setNightmareDistress(undefined);
    setNightmareRecurring(undefined);
    setNightmareRecurringKey('');
    setNightmareWokeFromDream(undefined);
    setNightmareAftereffects([]);
    setNightmareGroundingUsed([]);
    setNightmareRewrittenEnding('');
    setNightmareRescriptStatus(undefined);
    setTagInput('');
    setRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingDuration(0);
    setHasTriedSave(false);
    setLastActionError(null);
    clearDreamDraft();
  }

  function discardDraftAndReset() {
    resetForm();
    setShowMoodSection(isWakeMode);
    setShowContextSection(false);
    setShowTagsSection(false);
    setShowLucidPracticeSection(false);
    setShowNightmareSection(false);
    setShowMetaSection(!isWakeMode);
  }

  function onSave() {
    setHasTriedSave(true);
    setIsBusy(true);
    setLastActionError(null);

    try {
      const cleanTitle = title.trim();
      const cleanText = text.trim();
      const cleanSleepDate = sleepDate.trim();

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
        Alert.alert(
          copy.sleepDateInvalidTitle,
          copy.sleepDateInvalidDescription,
        );
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
        dreamIntensity,
        lucidity,
        wakeEmotions: wakeEmotions.length ? wakeEmotions : undefined,
        sleepContext: buildSleepContext(),
        lucidPractice: buildLucidPractice(),
        nightmare: buildNightmare(),
      };

      saveDream(dream);
      hapticSave();
      trackDreamSaved({
        mode: isEdit ? 'edit' : 'create',
        entryMode,
        hasAudio: Boolean(audioUri),
        hasText: Boolean(cleanText),
      });

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
    recordingDuration,
    audioUri,
    setAudioUri,
    mood,
    setMood,
    dreamIntensity,
    setDreamIntensity,
    lucidity,
    setLucidity,
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
    lucidTechnique,
    setLucidTechnique,
    dreamSignsInput,
    setDreamSignsInput,
    lucidTrigger,
    setLucidTrigger,
    controlAreas,
    setControlAreas,
    stabilizationActions,
    setStabilizationActions,
    recallScore,
    setRecallScore,
    nightmareExplicit,
    setNightmareExplicit,
    nightmareDistress,
    setNightmareDistress,
    nightmareRecurring,
    setNightmareRecurring,
    nightmareRecurringKey,
    setNightmareRecurringKey,
    nightmareWokeFromDream,
    setNightmareWokeFromDream,
    nightmareAftereffects,
    setNightmareAftereffects,
    nightmareGroundingUsed,
    setNightmareGroundingUsed,
    nightmareRewrittenEnding,
    setNightmareRewrittenEnding,
    nightmareRescriptStatus,
    setNightmareRescriptStatus,
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
    showLucidPracticeSection,
    setShowLucidPracticeSection,
    showNightmareSection,
    setShowNightmareSection,
    showMetaSection,
    setShowMetaSection,
    validationError,
    hasInvalidSleepDate,
    hasMissingContent,
    hasRestoredDraft,
    hasContextSelections,
    hasMoodSelections: hasMoodSelections || hasLuciditySelection,
    hasLucidPracticeSelections,
    hasNightmareSelections,
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
    discardDraftAndReset,
    toggleWakeEmotion: (value: WakeEmotion) =>
      setWakeEmotions(current => toggleSelection(current, value)),
    togglePreSleepEmotion: (value: PreSleepEmotion) =>
      setPreSleepEmotions(current => toggleSelection(current, value)),
    toggleControlArea: (value: LucidControlArea) =>
      setControlAreas(current => toggleSelection(current, value)),
    toggleStabilizationAction: (value: LucidStabilizationAction) =>
      setStabilizationActions(current => toggleSelection(current, value)),
    toggleNightmareAftereffect: (value: NightmareAftereffect) =>
      setNightmareAftereffects(current => toggleSelection(current, value)),
    toggleNightmareGrounding: (value: NightmareGroundingAction) =>
      setNightmareGroundingUsed(current => toggleSelection(current, value)),
  };
}
