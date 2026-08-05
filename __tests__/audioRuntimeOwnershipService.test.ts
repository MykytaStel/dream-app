import {
  __unsafeResetAudioRuntimeOwnershipForTests,
  acknowledgePersistedAudioOwnership,
  getAudioRuntimeOwnershipSnapshot,
  markAudioRecordingFailed,
  markAudioRecordingInterrupted,
  markAudioRecordingStarted,
  markAudioRecordingStarting,
  markAudioRecordingStopped,
  releasePendingAudioOwnership,
  subscribeToAudioRuntimeOwnership,
} from '../src/features/dreams/services/audioRuntimeOwnershipService';

describe('audioRuntimeOwnershipService', () => {
  beforeEach(() => {
    __unsafeResetAudioRuntimeOwnershipForTests();
  });

  test('blocks maintenance from recording startup through native stop', () => {
    markAudioRecordingStarting();
    expect(getAudioRuntimeOwnershipSnapshot()).toEqual({
      recordingActive: true,
      activeRecordingUri: null,
      pendingRecordingUri: null,
    });

    markAudioRecordingStarted('file:///active.m4a');
    expect(getAudioRuntimeOwnershipSnapshot()).toEqual({
      recordingActive: true,
      activeRecordingUri: 'file:///active.m4a',
      pendingRecordingUri: null,
    });

    markAudioRecordingStopped('file:///active.m4a');
    expect(getAudioRuntimeOwnershipSnapshot()).toEqual({
      recordingActive: false,
      activeRecordingUri: null,
      pendingRecordingUri: 'file:///active.m4a',
    });
  });

  test('keeps an interrupted file pending until durable ownership takes over', () => {
    markAudioRecordingStarting();
    markAudioRecordingStarted('file:///partial.m4a');
    markAudioRecordingInterrupted('file:///partial.m4a');

    expect(getAudioRuntimeOwnershipSnapshot()).toMatchObject({
      recordingActive: false,
      pendingRecordingUri: 'file:///partial.m4a',
    });

    acknowledgePersistedAudioOwnership('file:///different.m4a');
    expect(getAudioRuntimeOwnershipSnapshot().pendingRecordingUri).toBe(
      'file:///partial.m4a',
    );

    acknowledgePersistedAudioOwnership('file:///partial.m4a');
    expect(getAudioRuntimeOwnershipSnapshot().pendingRecordingUri).toBeNull();
  });

  test('a startup failure ends the recording guard without dropping older pending audio', () => {
    markAudioRecordingStopped('file:///older.m4a');
    markAudioRecordingStarting();
    markAudioRecordingFailed();

    expect(getAudioRuntimeOwnershipSnapshot()).toEqual({
      recordingActive: false,
      activeRecordingUri: null,
      pendingRecordingUri: 'file:///older.m4a',
    });
  });

  test('deliberate release clears only the matching pending URI', () => {
    markAudioRecordingStopped('file:///discarded.m4a');

    releasePendingAudioOwnership(undefined);
    releasePendingAudioOwnership('file:///other.m4a');
    expect(getAudioRuntimeOwnershipSnapshot().pendingRecordingUri).toBe(
      'file:///discarded.m4a',
    );

    releasePendingAudioOwnership('file:///discarded.m4a');
    expect(getAudioRuntimeOwnershipSnapshot().pendingRecordingUri).toBeNull();
  });

  test('subscribers receive snapshots and can unsubscribe', () => {
    const listener = jest.fn();
    const subscription = subscribeToAudioRuntimeOwnership(listener);

    markAudioRecordingStarting();
    expect(listener).toHaveBeenLastCalledWith({
      recordingActive: true,
      activeRecordingUri: null,
      pendingRecordingUri: null,
    });

    subscription.remove();
    markAudioRecordingFailed();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('a broken subscriber cannot break recording state or later subscribers', () => {
    subscribeToAudioRuntimeOwnership(() => {
      throw new Error('listener-failed');
    });
    const healthyListener = jest.fn();
    subscribeToAudioRuntimeOwnership(healthyListener);

    expect(() => markAudioRecordingStarting()).not.toThrow();
    expect(getAudioRuntimeOwnershipSnapshot().recordingActive).toBe(true);
    expect(healthyListener).toHaveBeenCalledWith(
      expect.objectContaining({ recordingActive: true }),
    );
  });
});
