import React from 'react';
import { Alert, AppState } from 'react-native';
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
import { useRecordingLifecycle } from './composer/useRecordingLifecycle';
import { saveDream } from '../repository/dreamsRepository';
import { logActionError } from '../../../app/errorReporting';
import {
  clearDreamDraft,
  clearDreamEditDraft,
  getDreamDraft,
  getDreamEditDraft,
  saveDreamDraft,
  saveDreamEditDraft,
} from '../services/dreamDraftService';
import { createDreamId } from '../utils/createDreamId';
import {
  DreamComposerCopy,
  DreamComposerEntryMode,
  DreamComposerMode,
} from './DreamComposer.types';
import { trackDreamSaved } from '../../../services/observability/events';
import { hapticSave } from '../../../services/haptics/hapticService';

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
  const initialDraft = React.useMemo(() => {
    if (mode === 'create') {
      return getDreamDraft();
    }

    if (!initialDream) {
      return null;
    }

    const editDraft = getDreamEditDraft(initialDream.id);
    // A draft older than the dream is left over from an edit that was
    // abandoned before something else wrote the dream — another device, a
    // sync, an edit that did get saved. Restoring it would undo that.
    const savedAt = initialDream.updatedAt ?? initialDream.createdAt;

    return editDraft && (editDraft.updatedAt ?? 0) > savedAt ? editDraft : null;
  }, [initialDream, mode]);

  /**
   * The dream as the field initialisers should read it.
   *
   * Undefined once an edit draft has been restored. The draft carries every
   * field the composer owns, so letting the saved dream win any of them would
   * discard the unsaved change the draft exists to preserve — including a
   * field the person had deliberately cleared, which is the one case a merge
   * cannot tell apart from an absent value.
   */
  const initialDreamFields =
    mode === 'edit' && initialDraft ? undefined : initialDream;
  const isWakeMode = mode === 'create' && entryMode === 'wake';
  const isEdit = mode === 'edit';
  const initialLucidity = initialDreamFields
    ? getDreamLucidityLevel(initialDreamFields)
    : initialDraft
      ? getDreamLucidityLevel(initialDraft)
      : undefined;
  const initialHasMoodDetails =
    Boolean(initialDreamFields?.mood ?? initialDraft?.mood) ||
    Boolean(
      initialDreamFields?.dreamIntensity ?? initialDraft?.dreamIntensity,
    ) ||
    Boolean(
      initialDreamFields?.wakeEmotions?.length ??
      initialDraft?.wakeEmotions?.length,
    ) ||
    typeof initialLucidity === 'number';
  const initialHasContextDetails = hasSleepContextValues({
    stressLevel:
      initialDreamFields?.sleepContext?.stressLevel ??
      initialDraft?.stressLevel,
    preSleepEmotions:
      initialDreamFields?.sleepContext?.preSleepEmotions ??
      initialDraft?.preSleepEmotions,
    alcoholTaken:
      initialDreamFields?.sleepContext?.alcoholTaken ??
      initialDraft?.alcoholTaken,
    caffeineLate:
      initialDreamFields?.sleepContext?.caffeineLate ??
      initialDraft?.caffeineLate,
    medications:
      initialDreamFields?.sleepContext?.medications ??
      initialDraft?.medications,
    importantEvents:
      initialDreamFields?.sleepContext?.importantEvents ??
      initialDraft?.importantEvents,
    healthNotes:
      initialDreamFields?.sleepContext?.healthNotes ??
      initialDraft?.healthNotes,
  });
  const initialHasTags = Boolean(
    initialDreamFields?.tags?.length ?? initialDraft?.tags?.length,
  );
  const initialHasLucidPractice = hasLucidPracticeValues({
    lucidTechnique:
      initialDreamFields?.lucidPractice?.technique ??
      initialDraft?.lucidTechnique,
    dreamSigns:
      initialDreamFields?.lucidPractice?.dreamSigns ?? initialDraft?.dreamSigns,
    lucidTrigger:
      initialDreamFields?.lucidPractice?.trigger ?? initialDraft?.lucidTrigger,
    controlAreas:
      initialDreamFields?.lucidPractice?.controlAreas ??
      initialDraft?.controlAreas,
    stabilizationActions:
      initialDreamFields?.lucidPractice?.stabilizationActions ??
      initialDraft?.stabilizationActions,
    recallScore:
      initialDreamFields?.lucidPractice?.recallScore ??
      initialDraft?.recallScore,
  });
  const initialHasNightmare = hasNightmareValues({
    nightmareExplicit:
      initialDreamFields?.nightmare?.explicit ??
      initialDraft?.nightmareExplicit,
    nightmareDistress:
      initialDreamFields?.nightmare?.distress ??
      initialDraft?.nightmareDistress,
    nightmareRecurring:
      initialDreamFields?.nightmare?.recurring ??
      initialDraft?.nightmareRecurring,
    nightmareRecurringKey:
      initialDreamFields?.nightmare?.recurringKey ??
      initialDraft?.nightmareRecurringKey,
    nightmareWokeFromDream:
      initialDreamFields?.nightmare?.wokeFromDream ??
      initialDraft?.nightmareWokeFromDream,
    nightmareAftereffects:
      initialDreamFields?.nightmare?.aftereffects ??
      initialDraft?.nightmareAftereffects,
    nightmareGroundingUsed:
      initialDreamFields?.nightmare?.groundingUsed ??
      initialDraft?.nightmareGroundingUsed,
    nightmareRewrittenEnding:
      initialDreamFields?.nightmare?.rewrittenEnding ??
      initialDraft?.nightmareRewrittenEnding,
    nightmareRescriptStatus:
      initialDreamFields?.nightmare?.rescriptStatus ??
      initialDraft?.nightmareRescriptStatus,
  });

  const [title, setTitle] = React.useState(
    initialDreamFields?.title ?? initialDraft?.title ?? '',
  );
  const [text, setText] = React.useState(
    initialDreamFields?.text ?? initialDraft?.text ?? '',
  );
  const [sleepDate, setSleepDate] = React.useState(
    initialDreamFields?.sleepDate ?? initialDraft?.sleepDate ?? getTodayDate(),
  );
  const [mood, setMood] = React.useState<Mood | undefined>(
    initialDreamFields?.mood ?? initialDraft?.mood,
  );
  const [dreamIntensity, setDreamIntensity] = React.useState<
    DreamIntensity | undefined
  >(initialDreamFields?.dreamIntensity ?? initialDraft?.dreamIntensity);
  const [lucidity, setLucidity] =
    React.useState<Dream['lucidity']>(initialLucidity);
  const [wakeEmotions, setWakeEmotions] = React.useState<WakeEmotion[]>(
    initialDreamFields?.wakeEmotions ?? initialDraft?.wakeEmotions ?? [],
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
  } = useSleepContextFields(initialDreamFields, initialDraft);
  const [tags, setTags] = React.useState<string[]>(
    normalizeTags(initialDreamFields?.tags ?? initialDraft?.tags ?? []),
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
  } = useLucidPracticeFields(initialDreamFields, initialDraft);
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
  } = useNightmareFields(initialDreamFields, initialDraft);
  const [tagInput, setTagInput] = React.useState('');
  const [isBusy, setIsBusy] = React.useState(false);
  const [hasTriedSave, setHasTriedSave] = React.useState(false);
  const [lastActionError, setLastActionError] = React.useState<string | null>(
    null,
  );
  const {
    recording,
    recordingDuration,
    audioUri,
    setAudioUri,
    pendingAudioUri,
    onToggleRecord,
    resetRecording,
  } = useRecordingLifecycle({
    initialAudioUri: initialDreamFields?.audioUri ?? initialDraft?.audioUri,
    mode,
    autoStartRecordingKey,
    copy,
    isBusy,
    setIsBusy,
    setLastActionError,
  });
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

  const draftPayload = React.useMemo(
    () => ({
      title,
      text,
      sleepDate,
      // A recording still being written counts: the draft is what will point
      // at the file if the app never gets a chance to finish the recording.
      audioUri: audioUri ?? pendingAudioUri,
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
    }),
    [
      alcoholTaken,
      audioUri,
      pendingAudioUri,
      caffeineLate,
      dreamIntensity,
      dreamSigns,
      entryMode,
      healthNotes,
      importantEvents,
      controlAreas,
      lucidity,
      lucidTechnique,
      lucidTrigger,
      medications,
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
    ],
  );

  /**
   * Read by the listeners below, which need the newest draft without being
   * torn down and rebuilt every keystroke to capture it.
   */
  const draftPayloadRef = React.useRef(draftPayload);
  draftPayloadRef.current = draftPayload;

  /**
   * Where this composer's draft belongs.
   *
   * Creating writes the one unfinished-dream draft, which the widget and the
   * home screen read. Editing writes a draft of its own, keyed by the dream,
   * so an edit in progress never reads as a new dream waiting to be finished.
   */
  const persistDraft = React.useCallback(() => {
    // A failed draft write must not take the composer with it. This runs from
    // a timer every 400ms while someone types and from the background
    // listener, so a storage failure — a full disk is the realistic one —
    // would otherwise throw outside any render, repeatedly, on the one screen
    // the product cannot afford to lose. Losing the draft is survivable;
    // losing the ability to keep typing is not.
    //
    // Nothing is shown here on purpose. The place a write failure has to be
    // visible is the save itself, which alerts, and which is the moment the
    // person believes their dream is safe.
    try {
      if (mode === 'create') {
        saveDreamDraft(draftPayloadRef.current);
        return;
      }

      if (initialDream) {
        saveDreamEditDraft(initialDream.id, draftPayloadRef.current);
      }
    } catch (error) {
      logActionError('useDreamComposerForm.persistDraft', error);
    }
  }, [initialDream, mode]);

  React.useEffect(() => {
    const timeoutId = setTimeout(persistDraft, 400);

    return () => clearTimeout(timeoutId);
  }, [draftPayload, persistDraft]);

  /**
   * Writes the draft the moment the app leaves the foreground.
   *
   * The debounce above is what makes typing cheap, but it also means the last
   * few hundred milliseconds of writing exist only in memory — and leaving the
   * foreground is exactly when the system may never give this screen another
   * turn. A call arriving mid-sentence should not cost the sentence.
   */
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        persistDraft();
      }
    });

    return () => subscription.remove();
  }, [persistDraft]);

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
    resetRecording();
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

  /**
   * The identity of the dream being composed, decided once.
   *
   * This used to be `createDreamId()` inside the save, which made the id a
   * property of the button press rather than of the dream. Two presses meant
   * two ids, and since the repository upserts by id, two dreams. Everything
   * from the press to the write is synchronous, so the second press is not
   * interrupted by the first — it runs afterwards, in full, and the busy flag
   * that looks like it guards this is set inside the save and never read
   * there.
   *
   * Held in a ref and replaced after a successful create, so the next dream
   * does not overwrite the one just saved.
   */
  const composingDreamIdRef = React.useRef(initialDream?.id ?? createDreamId());

  /**
   * What was last written, so the same content is not written twice.
   *
   * The id alone keeps the archive correct — a repeated save upserts the same
   * dream — but it would still do the work, fire the analytics event and call
   * `onSaved` a second time. Comparing content also draws the line in the
   * right place: a second press is refused, and a deliberate save after an
   * edit is not.
   */
  const lastSavedSignatureRef = React.useRef<string | null>(null);

  function onSave() {
    setHasTriedSave(true);
    setIsBusy(true);
    setLastActionError(null);

    try {
      const cleanTitle = title.trim();
      const cleanText = text.trim();
      const cleanSleepDate = sleepDate.trim();

      const signature = JSON.stringify([
        cleanTitle,
        cleanText,
        cleanSleepDate,
        audioUri ?? null,
      ]);

      if (lastSavedSignatureRef.current === signature) {
        return;
      }

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
        id: composingDreamIdRef.current,
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
      lastSavedSignatureRef.current = signature;
      hapticSave();
      trackDreamSaved({
        mode: isEdit ? 'edit' : 'create',
        entryMode,
        hasAudio: Boolean(audioUri),
        hasText: Boolean(cleanText),
      });

      if (isEdit) {
        // The dream now holds everything the draft was protecting.
        clearDreamEditDraft(dream.id);
      } else {
        // A new identity for whatever is written next, so the following dream
        // does not upsert over the one just saved.
        composingDreamIdRef.current = createDreamId();
        // The signature is deliberately kept. resetForm empties the fields
        // through state, which does not take effect before a second press
        // arrives — clearing it here would hand that press an open door.
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
