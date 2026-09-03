import React from 'react';
import { Alert } from 'react-native';
import type {
  Dream,
  DreamIntensity,
  LucidPractice,
  Mood,
  NightmareSupport,
  SleepContext,
  WakeEmotion,
} from '../../model/dream';
import {
  DREAM_SAVE_VALIDATION,
  normalizeTags,
  validateDreamForSave,
} from '../../model/dreamRules';
import { getDreamsMeta, saveDream } from '../../repository/dreamsRepository';
import { clearDreamEditDraft } from '../../services/dreamDraftService';
import { createDreamId } from '../../utils/createDreamId';
import { logActionError } from '../../../../app/errorReporting';
import { trackDreamSaved } from '../../../../services/observability/events';
import { getCaptureSessionId } from '../../../../services/analytics/captureSession';
import { hapticSave } from '../../../../services/haptics/hapticService';
import type {
  DreamComposerCopy,
  DreamComposerEntryMode,
  DreamComposerMode,
} from '../DreamComposer.types';
import { getTodayDate, getComposerContentSignature } from './composerHelpers';

/** Just the strings a save needs, so a caller can be built in a test. */
type SaveCopy = Pick<
  DreamComposerCopy,
  | 'saveErrorTitle'
  | 'saveErrorDescription'
  | 'sleepDateInvalidTitle'
  | 'sleepDateInvalidDescription'
  | 'saveSuccessTitle'
  | 'saveSuccessDescription'
  | 'updateSuccessTitle'
  | 'updateSuccessDescription'
  | 'recordErrorTitle'
>;

type ComposerSaveFields = {
  title: string;
  text: string;
  sleepDate: string;
  audioUri?: string;
  tags: string[];
  mood?: Mood;
  dreamIntensity?: DreamIntensity;
  lucidity: Dream['lucidity'];
  wakeEmotions: WakeEmotion[];
};

type UseComposerSaveArgs = {
  mode: DreamComposerMode;
  entryMode: DreamComposerEntryMode;
  initialDream?: Dream;
  copy: SaveCopy;
  onSaved?: (dream: Dream) => void;
  fields: ComposerSaveFields;
  buildSleepContext: () => SleepContext | undefined;
  buildLucidPractice: () => LucidPractice | undefined;
  buildNightmare: () => NightmareSupport | undefined;
  resetForm: () => void;
  lastSavedSignatureRef: React.MutableRefObject<string | null>;
  setIsBusy: (value: boolean) => void;
  setHasTriedSave: (value: boolean) => void;
  setLastActionError: (value: string | null) => void;
};

/**
 * Validating and writing the dream, and the id minted for the dream being
 * composed. Shares the form's busy flag, tried-save flag and error line with
 * the recording lifecycle so the two cannot run at once.
 */
export function useComposerSave({
  mode,
  entryMode,
  initialDream,
  copy,
  onSaved,
  fields,
  buildSleepContext,
  buildLucidPractice,
  buildNightmare,
  resetForm,
  lastSavedSignatureRef,
  setIsBusy,
  setHasTriedSave,
  setLastActionError,
}: UseComposerSaveArgs) {
  const isEdit = mode === 'edit';

  /**
   * The composed dream's id, minted once. Minting it per Save press made two
   * fast taps upsert two dreams (same id → one dream). Replaced after a
   * successful create so the next dream gets its own id.
   */
  const composingDreamIdRef = React.useRef(initialDream?.id ?? createDreamId());

  // The signature check refuses a repeated identical save (which would re-fire
  // analytics and onSaved) but still allows a deliberate save after an edit.
  function onSave() {
    setHasTriedSave(true);
    setIsBusy(true);
    setLastActionError(null);

    const {
      title,
      text,
      sleepDate,
      audioUri,
      tags,
      mood,
      dreamIntensity,
      lucidity,
      wakeEmotions,
    } = fields;

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
        // captureId and dreamIndex describe a capture; an edit is not one, so
        // an edit sends neither. dreamIndex is read after the save so a create
        // is counted — it makes the 1→2 transition visible.
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

  return { onSave };
}
