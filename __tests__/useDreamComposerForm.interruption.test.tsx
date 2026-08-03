import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useDreamComposerForm } from '../src/features/dreams/components/useDreamComposerForm';
import type { DreamComposerCopy } from '../src/features/dreams/components/DreamComposer.types';
import {
  onRecordingInterrupted,
  startRecording,
  stopRecording,
} from '../src/features/dreams/services/audioService';
import { saveDreamDraft } from '../src/features/dreams/services/dreamDraftService';

/**
 * What happens to a dream someone is part-way through saying out loud when the
 * phone rings.
 *
 * Every case here used to end the same way: the composer went on drawing a
 * running timer over a recorder the system had already stopped, and the audio
 * sat in the app's audio directory with nothing referring to it. The recording
 * was not corrupt — it was finished and playable — it was simply lost, because
 * the only thing that had ever known its path was a promise that never
 * resolved.
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
  getDreamDraft: jest.fn(() => null),
  saveDreamDraft: jest.fn(),
}));

jest.mock('../src/services/observability/events', () => ({
  trackDreamSaved: jest.fn(),
}));

const copy = {
  audioErrorTitle: 'Audio error',
  audioPermissionDenied: 'Denied',
  audioPermissionUnavailable: 'Unavailable',
  audioSimulatorHint: 'Simulator hint',
  audioInterruptedSaved: 'Interrupted, kept',
  audioInterruptedLost: 'Interrupted, lost',
};

const RECORDING_URI = 'file:///audio/dream_audio_1.m4a';

describe('a recording the system ends', () => {
  let latestForm: ReturnType<typeof useDreamComposerForm> | null = null;
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  function Harness() {
    latestForm = useDreamComposerForm({
      mode: 'create',
      entryMode: 'voice',
      onSaved: jest.fn(),
      // Only the strings these cases assert on; the hook reads no others.
      copy: copy as unknown as DreamComposerCopy,
    });

    return null;
  }

  /** The form after a render, narrowed — the harness always assigns it. */
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

  async function beginRecording() {
    await ReactTestRenderer.act(async () => {
      await form().onToggleRecord();
    });
  }

  /** Runs the listener the composer handed to the native module. */
  function interrupt(uri: string) {
    const listener = (onRecordingInterrupted as jest.Mock).mock.calls.at(
      -1,
    )?.[0];

    if (!listener) {
      throw new Error('Nothing subscribed to interruptions.');
    }

    ReactTestRenderer.act(() => {
      listener(uri);
    });
  }

  beforeEach(() => {
    latestForm = null;
    renderer = null;
    jest.clearAllMocks();
    jest.useFakeTimers();
    (startRecording as jest.Mock).mockResolvedValue(RECORDING_URI);
    (stopRecording as jest.Mock).mockResolvedValue(RECORDING_URI);
    (onRecordingInterrupted as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });
  });

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
    }
    jest.useRealTimers();
  });

  test('the file is in the draft before the recording finishes', async () => {
    render();
    await beginRecording();

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(400);
    });

    // The point of writing it this early: a process the system kills outright
    // never gets an event to react to, so the draft is the only thing left
    // holding the path.
    expect(saveDreamDraft).toHaveBeenCalledWith(
      expect.objectContaining({ audioUri: RECORDING_URI }),
    );
  });

  test('what was said before the interruption becomes the recording', async () => {
    render();
    await beginRecording();

    interrupt(RECORDING_URI);

    expect(form().recording).toBe(false);
    expect(form().recordingDuration).toBe(0);
    expect(form().audioUri).toBe(RECORDING_URI);
    expect(form().lastActionError).toBe(copy.audioInterruptedSaved);
  });

  test('an interruption with nothing to keep still stops the timer', async () => {
    render();
    await beginRecording();

    interrupt('');

    expect(form().recording).toBe(false);
    expect(form().audioUri).toBeUndefined();
    // Saying so matters more than the empty state does: the person watched a
    // timer run and is owed an answer about where that went.
    expect(form().lastActionError).toBe(copy.audioInterruptedLost);
  });

  test('nothing is subscribed while no recording is running', () => {
    render();

    expect(onRecordingInterrupted).not.toHaveBeenCalled();
  });

  test('leaving the foreground writes the draft without waiting', () => {
    render();

    ReactTestRenderer.act(() => {
      form().setText('I was walking through a house I had never seen');
    });

    expect(saveDreamDraft).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      const listener = (AppState.addEventListener as jest.Mock).mock.calls.find(
        ([event]) => event === 'change',
      )?.[1];
      listener?.('background');
    });

    // No timer was advanced. The debounce is what makes typing cheap, but the
    // moment the app leaves the foreground it may never get another turn.
    expect(saveDreamDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'I was walking through a house I had never seen',
      }),
    );
  });

  test('the duration follows the clock, not the number of ticks', async () => {
    const startedAt = Date.now();
    render();
    await beginRecording();

    // A backgrounded app stops firing timers, so the clock and the tick count
    // come apart. Here the clock jumps 46 seconds while nothing fires, then a
    // single tick lands: a counter incremented per tick would report 1.
    jest.setSystemTime(startedAt + 46_000);
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(form().recordingDuration).toBe(47);
  });
});
