import React from 'react';
import { AppState } from 'react-native';
import type { Dream } from '../../model/dream';
import type { DreamComposerMode } from '../DreamComposer.types';
import {
  clearDreamDraft,
  saveDreamDraft,
  saveDreamEditDraft,
  type DreamDraft,
} from '../../services/dreamDraftService';
import { logActionError } from '../../../../app/errorReporting';
import { getComposerContentSignature } from './composerContentSignature';

type DraftPayload = Omit<DreamDraft, 'updatedAt'>;

type UseComposerDraftAutosaveArgs = {
  mode: DreamComposerMode;
  initialDream?: Dream;
  draftPayload: DraftPayload;
  lastSavedSignatureRef: React.MutableRefObject<string | null>;
};

/**
 * Writes the composer's draft on a 400ms debounce and on backgrounding.
 *
 * Create mode writes the one unfinished-dream draft (read by the widget and
 * Home); edit mode writes a per-dream draft so it is not seen as a new dream.
 * A failed write must not throw — losing the draft is survivable, losing the
 * ability to type is not; the save itself alerts on a write failure.
 */
export function useComposerDraftAutosave({
  mode,
  initialDream,
  draftPayload,
  lastSavedSignatureRef,
}: UseComposerDraftAutosaveArgs) {
  const draftPayloadRef = React.useRef(draftPayload);
  draftPayloadRef.current = draftPayload;

  const persistDraft = React.useCallback(() => {
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
  }, [initialDream, mode, lastSavedSignatureRef]);

  React.useEffect(() => {
    const timeoutId = setTimeout(persistDraft, 400);

    return () => clearTimeout(timeoutId);
  }, [draftPayload, persistDraft]);

  // Flush on backgrounding — the debounce leaves the last few hundred ms only
  // in memory, and the app may not get another turn.
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        persistDraft();
      }
    });

    return () => subscription.remove();
  }, [persistDraft]);
}
