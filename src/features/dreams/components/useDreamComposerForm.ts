import React from 'react';
import { Alert, Platform } from 'react-native';
import {
  Dream,
  DreamIntensity,
  LucidControlArea,
  LucidPracticeTechnique,
  LucidStabilizationAction,
  Mood,
  NightmareAftereffect,
  NightmareGroundingAction,
  NightmareRescriptStatus,
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
import { getDreamLucidityLevel } from '../model/dreamAnalytics';
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

function hasLucidPracticeValues(input: {
  lucidTechnique?: LucidPracticeTechnique;
  dreamSigns?: string[];
  lucidTrigger?: string;
  controlAreas?: LucidControlArea[];
  stabilizationActions?: LucidStabilizationAction[];
  recallScore?: 1 | 2 | 3 | 4 | 5;
}) {
  return (
    Boolean(input.lucidTechnique) ||
    Boolean(input.dreamSigns?.length) ||
    Boolean(input.lucidTrigger?.trim()) ||
    Boolean(input.controlAreas?.length) ||
    Boolean(input.stabilizationActions?.length) ||
    typeof input.recallScore === 'number'
  );
}

function hasNightmareValues(input: {
  nightmareExplicit?: boolean;
  nightmareDistress?: 1 | 2 | 3 | 4 | 5;
  nightmareRecurring?: boolean;
  nightmareRecurringKey?: string;
  nightmareWokeFromDream?: boolean;
  nightmareAftereffects?: NightmareAftereffect[];
  nightmareGroundingUsed?: NightmareGroundingAction[];
  nightmareRewrittenEnding?: string;
  nightmareRescriptStatus?: NightmareRescriptStatus;
}) {
  return (
    typeof input.nightmareExplicit === 'boolean' ||
    typeof input.nightmareDistress === 'number' ||
    typeof input.nightmareRecurring === 'boolean' ||
    Boolean(input.nightmareRecurringKey?.trim()) ||
    typeof input.nightmareWokeFromDream === 'boolean' ||
    Boolean(input.nightmareAftereffects?.length) ||
    Boolean(input.nightmareGroundingUsed?.length) ||
    Boolean(input.nightmareRewrittenEnding?.trim()) ||
    Boolean(input.nightmareRescriptStatus)
  );
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
  const initialLucidity =
    initialDream
      ? getDreamLucidityLevel(initialDream)
      : initialDraft
        ? getDreamLucidityLevel(initialDraft)
        : undefined;
  const initialHasMoodDetails =
    Boolean(initialDream?.mood ?? initialDraft?.mood) ||
    Boolean(initialDream?.dreamIntensity ?? initialDraft?.dreamIntensity) ||
    Boolean(initialDream?.wakeEmotions?.length ?? initialDraft?.wakeEmotions?.length) ||
    typeof initialLucidity === 'number';
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
  const initialHasLucidPractice = hasLucidPracticeValues({
    lucidTechnique: initialDream?.lucidPractice?.technique ?? initialDraft?.lucidTechnique,
    dreamSigns: initialDream?.lucidPractice?.dreamSigns ?? initialDraft?.dreamSigns,
    lucidTrigger: initialDream?.lucidPractice?.trigger ?? initialDraft?.lucidTrigger,
    controlAreas: initialDream?.lucidPractice?.controlAreas ?? initialDraft?.controlAreas,
    stabilizationActions:
      initialDream?.lucidPractice?.stabilizationActions ?? initialDraft?.stabilizationActions,
    recallScore: initialDream?.lucidPractice?.recallScore ?? initialDraft?.recallScore,
  });
  const initialHasNightmare = hasNightmareValues({
    nightmareExplicit: initialDream?.nightmare?.explicit ?? initialDraft?.nightmareExplicit,
    nightmareDistress: initialDream?.nightmare?.distress ?? initialDraft?.nightmareDistress,
    nightmareRecurring: initialDream?.nightmare?.recurring ?? initialDraft?.nightmareRecurring,
    nightmareRecurringKey:
      initialDream?.nightmare?.recurringKey ?? initialDraft?.nightmareRecurringKey,
    nightmareWokeFromDream:
      initialDream?.nightmare?.wokeFromDream ?? initialDraft?.nightmareWokeFromDream,
    nightmareAftereffects:
      initialDream?.nightmare?.aftereffects ?? initialDraft?.nightmareAftereffects,
    nightmareGroundingUsed:
      initialDream?.nightmare?.groundingUsed ?? initialDraft?.nightmareGroundingUsed,
    nightmareRewrittenEnding:
      initialDream?.nightmare?.rewrittenEnding ?? initialDraft?.nightmareRewrittenEnding,
    nightmareRescriptStatus:
      initialDream?.nightmare?.rescriptStatus ?? initialDraft?.nightmareRescriptStatus,
  });

  const [title, setTitle] = React.useState(initialDream?.title ?? initialDraft?.title ?? '');
  const [text, setText] = React.useState(initialDream?.text ?? initialDraft?.text ?? '');
  const [sleepDate, setSleepDate] = React.useState(
    initialDream?.sleepDate ?? initialDraft?.sleepDate ?? getTodayDate(),
  );
  const [recording, setRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const recordingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioUri, setAudioUri] = React.useState<string | undefined>(
    initialDream?.audioUri ?? initialDraft?.audioUri,
  );
  const [mood, setMood] = React.useState<Mood | undefined>(initialDream?.mood ?? initialDraft?.mood);
  const [dreamIntensity, setDreamIntensity] = React.useState<DreamIntensity | undefined>(
    initialDream?.dreamIntensity ?? initialDraft?.dreamIntensity,
  );
  const [lucidity, setLucidity] = React.useState<Dream['lucidity']>(initialLucidity);
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
  const [lucidTechnique, setLucidTechnique] = React.useState<LucidPracticeTechnique | undefined>(
    initialDream?.lucidPractice?.technique ?? initialDraft?.lucidTechnique,
  );
  const [dreamSignsInput, setDreamSignsInput] = React.useState(
    (initialDream?.lucidPractice?.dreamSigns ?? initialDraft?.dreamSigns ?? []).join(', '),
  );
  const [lucidTrigger, setLucidTrigger] = React.useState(
    initialDream?.lucidPractice?.trigger ?? initialDraft?.lucidTrigger ?? '',
  );
  const [controlAreas, setControlAreas] = React.useState<LucidControlArea[]>(
    initialDream?.lucidPractice?.controlAreas ?? initialDraft?.controlAreas ?? [],
  );
  const [stabilizationActions, setStabilizationActions] = React.useState<
    LucidStabilizationAction[]
  >(
    initialDream?.lucidPractice?.stabilizationActions ??
      initialDraft?.stabilizationActions ??
      [],
  );
  const [recallScore, setRecallScore] = React.useState<1 | 2 | 3 | 4 | 5 | undefined>(
    initialDream?.lucidPractice?.recallScore ?? initialDraft?.recallScore,
  );
  const [nightmareExplicit, setNightmareExplicit] = React.useState<boolean | undefined>(
    initialDream?.nightmare?.explicit ?? initialDraft?.nightmareExplicit,
  );
  const [nightmareDistress, setNightmareDistress] = React.useState<
    1 | 2 | 3 | 4 | 5 | undefined
  >(initialDream?.nightmare?.distress ?? initialDraft?.nightmareDistress);
  const [nightmareRecurring, setNightmareRecurring] = React.useState<boolean | undefined>(
    initialDream?.nightmare?.recurring ?? initialDraft?.nightmareRecurring,
  );
  const [nightmareRecurringKey, setNightmareRecurringKey] = React.useState(
    initialDream?.nightmare?.recurringKey ?? initialDraft?.nightmareRecurringKey ?? '',
  );
  const [nightmareWokeFromDream, setNightmareWokeFromDream] = React.useState<
    boolean | undefined
  >(initialDream?.nightmare?.wokeFromDream ?? initialDraft?.nightmareWokeFromDream);
  const [nightmareAftereffects, setNightmareAftereffects] = React.useState<
    NightmareAftereffect[]
  >(initialDream?.nightmare?.aftereffects ?? initialDraft?.nightmareAftereffects ?? []);
  const [nightmareGroundingUsed, setNightmareGroundingUsed] = React.useState<
    NightmareGroundingAction[]
  >(initialDream?.nightmare?.groundingUsed ?? initialDraft?.nightmareGroundingUsed ?? []);
  const [nightmareRewrittenEnding, setNightmareRewrittenEnding] = React.useState(
    initialDream?.nightmare?.rewrittenEnding ?? initialDraft?.nightmareRewrittenEnding ?? '',
  );
  const [nightmareRescriptStatus, setNightmareRescriptStatus] = React.useState<
    NightmareRescriptStatus | undefined
  >(initialDream?.nightmare?.rescriptStatus ?? initialDraft?.nightmareRescriptStatus);
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
  const [showLucidPracticeSection, setShowLucidPracticeSection] = React.useState(
    mode === 'edit' || initialHasLucidPractice,
  );
  const [showNightmareSection, setShowNightmareSection] = React.useState(
    mode === 'edit' || initialHasNightmare,
  );
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
  const dreamSigns = React.useMemo(
    () =>
      Array.from(
        new Set(
          dreamSignsInput
            .split(',')
            .map(value => value.trim())
            .filter(Boolean),
        ),
      ),
    [dreamSignsInput],
  );
  const hasMoodSelections = Boolean(mood) || Boolean(dreamIntensity) || wakeEmotions.length > 0;
  const hasLuciditySelection = typeof lucidity === 'number';
  const hasTagSelections = tags.length > 0;
  const hasLucidPracticeSelections = hasLucidPracticeValues({
    lucidTechnique,
    dreamSigns,
    lucidTrigger,
    controlAreas,
    stabilizationActions,
    recallScore,
  });
  const hasNightmareSelections = hasNightmareValues({
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
        await startRecording();
        setRecording(true);
        setRecordingDuration(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(d => d + 1);
        }, 1000);
        return;
      }

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
      if (code === 'android-audio-permission-denied') {
        message = copy.audioPermissionDenied;
      } else if (code === 'android-audio-permission-unavailable') {
        message = copy.audioPermissionUnavailable;
      } else {
        const rawMessage = error instanceof Error ? error.message : String(error);
        message =
          Platform.OS === 'ios' ? `${rawMessage}\n\n${copy.audioSimulatorHint}` : rawMessage;
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
        dreamIntensity,
        lucidity,
        wakeEmotions: wakeEmotions.length ? wakeEmotions : undefined,
        sleepContext: hasSleepContextValues(sleepContext) ? sleepContext : undefined,
        lucidPractice: hasLucidPracticeValues({
          lucidTechnique,
          dreamSigns,
          lucidTrigger,
          controlAreas,
          stabilizationActions,
          recallScore,
        })
          ? {
              technique: lucidTechnique,
              dreamSigns: dreamSigns.length ? dreamSigns : undefined,
              trigger: lucidTrigger.trim() || undefined,
              controlAreas: controlAreas.length ? controlAreas : undefined,
              stabilizationActions: stabilizationActions.length
                ? stabilizationActions
                : undefined,
              recallScore,
            }
          : undefined,
        nightmare: hasNightmareValues({
          nightmareExplicit,
          nightmareDistress,
          nightmareRecurring,
          nightmareRecurringKey,
          nightmareWokeFromDream,
          nightmareAftereffects,
          nightmareGroundingUsed,
          nightmareRewrittenEnding,
          nightmareRescriptStatus,
        })
          ? {
              explicit: nightmareExplicit,
              distress: nightmareDistress,
              recurring: nightmareRecurring,
              recurringKey: nightmareRecurringKey.trim() || undefined,
              wokeFromDream: nightmareWokeFromDream,
              aftereffects: nightmareAftereffects.length ? nightmareAftereffects : undefined,
              groundingUsed: nightmareGroundingUsed.length ? nightmareGroundingUsed : undefined,
              rewrittenEnding: nightmareRewrittenEnding.trim() || undefined,
              rescriptStatus: nightmareRescriptStatus,
            }
          : undefined,
      };

      saveDream(dream);
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
