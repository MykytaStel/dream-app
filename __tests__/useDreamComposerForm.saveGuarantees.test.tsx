import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useDreamComposerForm } from '../src/features/dreams/components/useDreamComposerForm';
import type { DreamComposerCopy } from '../src/features/dreams/components/DreamComposer.types';
import { saveDream } from '../src/features/dreams/repository/dreamsRepository';
import { saveDreamDraft } from '../src/features/dreams/services/dreamDraftService';

/**
 * What happens to a dream when Save is pressed more than once.
 *
 * `saveDream` is synchronous and so is `onSave`, so a second press does not
 * interrupt the first — it runs afterwards, in full. The busy flag that looks
 * like it guards this is a piece of React state: it is set inside `onSave` and
 * never read there, and the re-render that would disable the button happens
 * after both presses have already been handled. There are also two Save
 * buttons on the screen, which makes two presses cheaper than they look.
 *
 * In create mode each run mints a fresh id, so the archive gets two dreams
 * from one dream.
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

describe('pressing Save twice', () => {
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
    (saveDreamDraft as jest.Mock).mockImplementation(() => undefined);
    (saveDream as jest.Mock).mockImplementation(() => undefined);

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      form().setText('A corridor that kept getting longer');
    });
  });

  test('writes one dream, not two', () => {
    // Both presses inside one act, which is what two taps in the same frame
    // and two Save buttons on one screen actually produce.
    ReactTestRenderer.act(() => {
      form().onSave();
      form().onSave();
    });

    expect(saveDream).toHaveBeenCalledTimes(1);
  });

  test('and does not mint a second id for the same dream', () => {
    ReactTestRenderer.act(() => {
      form().onSave();
      form().onSave();
    });

    const ids = (saveDream as jest.Mock).mock.calls.map(([dream]) => dream.id);

    expect(new Set(ids).size).toBe(1);
  });

  test('a draft write that fails does not take the composer with it', () => {
    // A full disk is the realistic cause. This runs from a timer every 400ms
    // while someone types, so a throw here would fire repeatedly outside any
    // render — the draft is expendable, the ability to keep typing is not.
    (saveDreamDraft as jest.Mock).mockImplementation(() => {
      throw new Error('no space left on device');
    });

    expect(() => {
      ReactTestRenderer.act(() => {
        form().setText('Still typing while the disk is full');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(400);
      });
    }).not.toThrow();
  });

  test('but a failed save is shown, because that is when it matters', () => {
    (saveDream as jest.Mock).mockImplementation(() => {
      throw new Error('no space left on device');
    });

    ReactTestRenderer.act(() => {
      form().onSave();
    });

    // Silence here would let someone close the app believing the dream was
    // written down.
    expect(form().lastActionError).toBe('no space left on device');
  });

  test('a later, deliberate save still works', () => {
    ReactTestRenderer.act(() => {
      form().onSave();
    });

    ReactTestRenderer.act(() => {
      form().setText('A different dream entirely');
    });
    ReactTestRenderer.act(() => {
      form().onSave();
    });

    // The guard is against one press arriving twice, not against saving twice.
    expect(saveDream).toHaveBeenCalledTimes(2);
  });
});
