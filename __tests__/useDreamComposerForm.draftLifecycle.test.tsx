import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useDreamComposerForm } from '../src/features/dreams/components/useDreamComposerForm';
import type { DreamComposerCopy } from '../src/features/dreams/components/DreamComposer.types';
import { saveDream } from '../src/features/dreams/repository/dreamsRepository';
import {
  clearDreamDraft,
  getDreamDraft,
} from '../src/features/dreams/services/dreamDraftService';

/**
 * What happens to the working draft once the dream is saved.
 *
 * The composer autosaves a draft every 400ms so nothing is lost mid-sentence.
 * After a successful create save that draft has done its job — the dream is in
 * the archive — and it must not linger, or Home shows "Continue draft" for a
 * dream that is already saved and re-opening the composer restores its text.
 *
 * This exercises the real dreamDraftService against the in-memory MMKV mock, so
 * the assertion is on the stored draft rather than on which functions were
 * called.
 */

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  saveDream: jest.fn(),
  getDreamsMeta: jest.fn(() => ({ totalCount: 1 })),
}));

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn().mockResolvedValue(0),
  onRecordingInterrupted: jest.fn(() => ({ remove: jest.fn() })),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
}));

jest.mock('../src/services/observability/events', () => ({
  trackDreamSaved: jest.fn(),
}));

jest.mock('../src/features/widgets/services/dreamWidgetSyncService', () => ({
  scheduleDreamWidgetSync: jest.fn(),
}));

const copy = {
  saveErrorTitle: 'Could not save',
  saveErrorDescription: 'Missing content',
  sleepDateInvalidTitle: 'Invalid date',
  sleepDateInvalidDescription: 'Invalid date',
  saveSuccessTitle: 'Saved',
  saveSuccessDescription: 'Saved',
  updateSuccessTitle: 'Updated',
  updateSuccessDescription: 'Updated',
  recordErrorTitle: 'Error',
} as unknown as DreamComposerCopy;

describe('the working draft after a create save', () => {
  let latestForm: ReturnType<typeof useDreamComposerForm> | null = null;

  function Harness() {
    latestForm = useDreamComposerForm({
      mode: 'create',
      entryMode: 'default',
      onSaved: jest.fn(),
      copy,
    });
    return null;
  }

  function form() {
    if (!latestForm) {
      throw new Error('The harness has not rendered yet.');
    }
    return latestForm;
  }

  beforeEach(() => {
    latestForm = null;
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    clearDreamDraft(); // reset any draft left by a prior test

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Harness />);
    });
  });

  function typeAndAutosave(value: string) {
    ReactTestRenderer.act(() => {
      form().setText(value);
    });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(400);
    });
  }

  it('leaves no stored draft once the dream is saved', () => {
    typeAndAutosave('a long corridor that kept getting longer as I walked');
    expect(getDreamDraft()?.text?.trim()).toBeTruthy();

    ReactTestRenderer.act(() => {
      form().onSave();
    });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(saveDream).toHaveBeenCalledTimes(1);
    expect(getDreamDraft()).toBeNull();
    expect(form().text).toBe('');
  });

  it('leaves no stored draft when Save follows the last keystroke immediately', () => {
    typeAndAutosave('a corridor');
    // one more keystroke arms a fresh debounce that has not fired yet
    ReactTestRenderer.act(() => {
      form().setText('a corridor that kept getting longer as I walked in');
    });

    ReactTestRenderer.act(() => {
      form().onSave();
    });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getDreamDraft()).toBeNull();
  });

  it('leaves no stored draft when the autosave fires in the same tick as the save', () => {
    // A debounce armed by the last keystroke fires before React has committed
    // the reset render — so it still sees the typed text. This is the sequence
    // that leaves "Continue draft" on Home for a dream that is already saved.
    ReactTestRenderer.act(() => {
      form().setText('a corridor that kept getting longer as I walked');
    });

    ReactTestRenderer.act(() => {
      form().onSave();
      jest.advanceTimersByTime(2000);
    });

    expect(getDreamDraft()).toBeNull();
  });
});
