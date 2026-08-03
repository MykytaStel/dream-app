import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useDreamComposerForm } from '../src/features/dreams/components/useDreamComposerForm';
import type { DreamComposerCopy } from '../src/features/dreams/components/DreamComposer.types';
import type { Dream } from '../src/features/dreams/model/dream';
import {
  clearDreamEditDraft,
  getDreamEditDraft,
  saveDreamDraft,
  saveDreamEditDraft,
} from '../src/features/dreams/services/dreamDraftService';

/**
 * The composer's half of edit drafts: which store it writes to, and when it
 * trusts a stored edit over the dream on disk.
 *
 * The storage itself is covered in dreamEditDraftService.test.ts. What matters
 * here is that editing never writes the one draft the home screen resumes, and
 * that a leftover draft cannot quietly undo a newer version of the dream.
 */

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  saveDream: jest.fn(),
}));

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn().mockResolvedValue(0),
  onRecordingInterrupted: jest.fn(() => ({ remove: jest.fn() })),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
}));

jest.mock('../src/features/dreams/services/dreamDraftService', () => ({
  clearDreamDraft: jest.fn(),
  clearDreamEditDraft: jest.fn(),
  getDreamDraft: jest.fn(() => null),
  getDreamEditDraft: jest.fn(() => null),
  saveDreamDraft: jest.fn(),
  saveDreamEditDraft: jest.fn(),
}));

jest.mock('../src/services/observability/events', () => ({
  trackDreamSaved: jest.fn(),
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

const SAVED_AT = 1_762_000_000_000;

const DREAM: Dream = {
  id: 'dream-1',
  createdAt: SAVED_AT - 10_000,
  updatedAt: SAVED_AT,
  sleepDate: '2026-08-01',
  title: 'The house with no stairs',
  text: 'As it was when I last saved it.',
  tags: [],
};

/** A stored edit, as the service would hand it back. */
function storedEdit(overrides: { text: string; updatedAt: number }) {
  return {
    title: DREAM.title ?? '',
    text: overrides.text,
    sleepDate: DREAM.sleepDate ?? '',
    medications: '',
    importantEvents: '',
    healthNotes: '',
    tags: [],
    updatedAt: overrides.updatedAt,
  };
}

describe('the composer editing a dream that already exists', () => {
  let latestForm: ReturnType<typeof useDreamComposerForm> | null = null;
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  function Harness() {
    latestForm = useDreamComposerForm({
      mode: 'edit',
      entryMode: 'default',
      initialDream: DREAM,
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

  function render() {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
  }

  function background() {
    ReactTestRenderer.act(() => {
      const listener = (AppState.addEventListener as jest.Mock).mock.calls.find(
        ([event]) => event === 'change',
      )?.[1];
      listener?.('background');
    });
  }

  beforeEach(() => {
    latestForm = null;
    renderer = null;
    jest.clearAllMocks();
    jest.useFakeTimers();
    (getDreamEditDraft as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
    }
    jest.useRealTimers();
  });

  test('an edit is written against the dream, not into the resume draft', () => {
    render();

    ReactTestRenderer.act(() => {
      form().setText('Half a new sentence');
    });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(saveDreamEditDraft).toHaveBeenCalledWith(
      DREAM.id,
      expect.objectContaining({ text: 'Half a new sentence' }),
    );
    // Writing the shared key would put "continue where you left off" on the
    // home screen for a dream the person is already inside of.
    expect(saveDreamDraft).not.toHaveBeenCalled();
  });

  test('leaving the foreground mid-edit writes it without waiting', () => {
    render();

    ReactTestRenderer.act(() => {
      form().setText('Interrupted here');
    });

    expect(saveDreamEditDraft).not.toHaveBeenCalled();

    background();

    expect(saveDreamEditDraft).toHaveBeenCalledWith(
      DREAM.id,
      expect.objectContaining({ text: 'Interrupted here' }),
    );
  });

  test('an edit newer than the dream is what the screen opens with', () => {
    (getDreamEditDraft as jest.Mock).mockReturnValue(
      storedEdit({
        text: 'What I was in the middle of',
        updatedAt: SAVED_AT + 1,
      }),
    );

    render();

    expect(form().text).toBe('What I was in the middle of');
  });

  test('an edit older than the dream is left alone', () => {
    (getDreamEditDraft as jest.Mock).mockReturnValue(
      storedEdit({ text: 'Abandoned months ago', updatedAt: SAVED_AT - 1 }),
    );

    render();

    // Something wrote the dream after this draft was abandoned — another
    // device, a sync, an edit that did get saved. Restoring would undo it.
    expect(form().text).toBe(DREAM.text);
  });

  test('saving the edit lets go of the draft protecting it', async () => {
    render();

    ReactTestRenderer.act(() => {
      form().setText('Finished at last');
    });

    await ReactTestRenderer.act(async () => {
      await form().onSave();
    });

    expect(clearDreamEditDraft).toHaveBeenCalledWith(DREAM.id);
  });
});
