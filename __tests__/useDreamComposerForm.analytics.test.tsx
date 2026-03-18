import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useDreamComposerForm } from '../src/features/dreams/components/useDreamComposerForm';
import { trackDreamSaved } from '../src/services/observability/events';

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  saveDream: jest.fn(),
}));

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn().mockResolvedValue(0),
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

describe('useDreamComposerForm analytics', () => {
  let latestForm: ReturnType<typeof useDreamComposerForm> | null = null;
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  const copy = {
    saveErrorDescription: 'Missing content',
    saveErrorTitle: 'Could not save',
    sleepDateInvalidDescription: 'Invalid date',
    sleepDateInvalidTitle: 'Invalid date',
    updateSuccessTitle: 'Updated',
    updateSuccessDescription: 'Updated',
    saveSuccessTitle: 'Saved',
    saveSuccessDescription: 'Saved',
    recordErrorTitle: 'Error',
    audioPermissionDenied: 'Denied',
    audioPermissionUnavailable: 'Unavailable',
    audioSimulatorHint: 'Simulator hint',
    audioErrorTitle: 'Audio error',
  } as any;

  function Harness() {
    latestForm = useDreamComposerForm({
      mode: 'create',
      entryMode: 'voice',
      onSaved: jest.fn(),
      copy,
    });

    return null;
  }

  beforeEach(() => {
    latestForm = null;
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
    }
    renderer = null;
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
    }
    renderer = null;
  });

  test('tracks a privacy-safe dream_saved event on successful save', () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(latestForm).not.toBeNull();

    ReactTestRenderer.act(() => {
      latestForm?.setText('A vivid dream about a staircase');
      latestForm?.setAudioUri('file:///dream.m4a');
    });

    ReactTestRenderer.act(() => {
      latestForm?.onSave();
    });

    expect(trackDreamSaved).toHaveBeenCalledWith({
      mode: 'create',
      entryMode: 'voice',
      hasAudio: true,
      hasText: true,
    });
    expect(trackDreamSaved).not.toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.anything(),
        transcript: expect.anything(),
        tags: expect.anything(),
      }),
    );
  });
});
