import React from 'react';
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
import { useComposerDraftAutosave } from './composer/useComposerDraftAutosave';
import { useComposerSave } from './composer/useComposerSave';
import { useComposerSections } from './composer/useComposerSections';
import { getTodayDate, toggleSelection } from './composer/composerHelpers';
import {
  clearDreamDraft,
  getDreamDraft,
  getDreamEditDraft,
} from '../services/dreamDraftService';
import {
  DreamComposerCopy,
  DreamComposerEntryMode,
  DreamComposerMode,
} from './DreamComposer.types';

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
  const {
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
    resetSections,
  } = useComposerSections({
    mode,
    isWakeMode,
    initialDreamFields,
    initialDraft,
    initialLucidity,
  });

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

  // Last-saved content signature; the autosave checks it so it never re-creates
  // a draft of a saved dream. Set by onSave.
  const lastSavedSignatureRef = React.useRef<string | null>(null);

  useComposerDraftAutosave({
    mode,
    initialDream,
    draftPayload,
    lastSavedSignatureRef,
  });

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
    resetSections();
  }

  const { onSave } = useComposerSave({
    mode,
    entryMode,
    initialDream,
    copy,
    onSaved,
    fields: {
      title,
      text,
      sleepDate,
      audioUri,
      tags,
      mood,
      dreamIntensity,
      lucidity,
      wakeEmotions,
    },
    buildSleepContext,
    buildLucidPractice,
    buildNightmare,
    resetForm,
    lastSavedSignatureRef,
    setIsBusy,
    setHasTriedSave,
    setLastActionError,
  });

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
