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
import { getDreamsMeta, saveDream } from '../repository/dreamsRepository';
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
import { getCaptureSessionId } from '../../../services/analytics/captureSession';
import { hapticSave } from '../../../services/haptics/hapticService';

export function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Adds a value to a multi-select, or removes it if already chosen. */
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

/**
 * Content identity: title, body, sleep date, audio. `onSave` records it; the
 * autosave compares against it so a same-moment debounce does not re-persist a
 * draft of an already-saved dream.
 */
function getComposerContentSignature(input: {
  title?: string;
  text?: string;
  sleepDate?: string;
  audioUri?: string;
}) {
  return JSON.stringify([
    input.title?.trim() ?? '',
    input.text?.trim() ?? '',
    input.sleepDate?.trim() ?? '',
    input.audioUri ?? null,
  ]);
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
    // A draft older than the dream is a stale abandoned edit — restoring it
    // would undo a newer write (another device, a sync).
    const savedAt = initialDream.updatedAt ?? initialDream.createdAt;

    return editDraft && (editDraft.updatedAt ?? 0) > savedAt ? editDraft : null;
  }, [initialDream, mode]);

  /**
   * What the field initialisers read. Undefined once an edit draft is restored:
   * the draft owns every field, so merging the saved dream back in would drop
   * an unsaved change — including one the user cleared on purpose.
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
      // A recording still being written counts — the draft points at the file
      // if the app dies mid-recording.
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

  // Lets the listeners below read the newest draft without re-subscribing per keystroke.
  const draftPayloadRef = React.useRef(draftPayload);
  draftPayloadRef.current = draftPayload;

  // Last-saved content signature; the autosave checks it so it never re-creates
  // a draft of a saved dream. Set by onSave.
  const lastSavedSignatureRef = React.useRef<string | null>(null);

  /**
   * Create mode writes the one unfinished-dream draft (read by the widget and
   * Home); edit mode writes a per-dream draft so it is not seen as a new dream.
   */
  const persistDraft = React.useCallback(() => {
    // Runs every 400ms and on backgrounding, so a failed write (full disk) must
    // not throw — losing the draft is survivable, losing the ability to type is
    // not. Not surfaced here; the save itself alerts on a write failure.
    try {
      if (mode === 'create') {
        // A debounce armed by the last keystroke can fire after onSave cleared
        // the draft but before the reset render — draftPayloadRef still holds
        // the saved text. Writing it back is the "Continue draft" ghost.
        if (
          getComposerContentSignature(draftPayloadRef.current) ===
          lastSavedSignatureRef.current
        ) {
          clearDreamDraft();
          return;
        }

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

  // Flush the draft on backgrounding — the 400ms debounce means the last few
  // hundred ms exist only in memory, and the app may not get another turn.
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
   * The composed dream's id, minted once. Minting it per Save press made two
   * fast taps upsert two dreams (same id → one dream). Replaced after a
   * successful create so the next dream gets its own id.
   */
  const composingDreamIdRef = React.useRef(initialDream?.id ?? createDreamId());

  // The signature check below refuses a repeated identical save (which would
  // re-fire analytics and onSaved) but still allows a deliberate save after an
  // edit. lastSavedSignatureRef is declared above so the autosave can read it.

  function onSave() {
    setHasTriedSave(true);
    setIsBusy(true);
    setLastActionError(null);

    try {
      const cleanTitle = title.trim();
      const cleanText = text.trim();
      const cleanSleepDate = sleepDate.trim();

      const signature = getComposerContentSignature({
        title: cleanTitle,
        text: cleanText,
        sleepDate: cleanSleepDate,
        audioUri,
      });

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
      // Measurement only, and the dream is already saved — a repository hiccup
      // reading the counter must not become an error the person sees.
      try {
        // captureId and dreamIndex describe a capture; an edit is not one (no
        // capture_started to join, and the archive total is not the edited
        // dream's position), so an edit sends neither. dreamIndex is a count,
        // read after the save so a create is counted — it makes the 1→2
        // transition visible.
        trackDreamSaved({
          captureId: isEdit ? undefined : getCaptureSessionId(),
          mode: isEdit ? 'edit' : 'create',
          entryMode,
          hasAudio: Boolean(audioUri),
          hasText: Boolean(cleanText),
          dreamIndex: isEdit ? undefined : getDreamsMeta().totalCount,
        });
      } catch (error) {
        logActionError('dream_saved_analytics', error);
      }

      if (isEdit) {
        // The dream now holds everything the draft was protecting.
        clearDreamEditDraft(dream.id);
      } else {
        // New id for the next dream. resetForm keeps lastSavedSignatureRef:
        // its state clears do not land before a second press could arrive.
        composingDreamIdRef.current = createDreamId();
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
