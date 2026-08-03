import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useRecordingLifecycle } from '../src/features/dreams/components/composer/useRecordingLifecycle';

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockOnRecordingInterrupted = jest.fn();

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn().mockResolvedValue(0),
  onRecordingInterrupted: (...args: unknown[]) =>
    mockOnRecordingInterrupted(...args),
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
}));

jest.mock('../src/services/haptics/hapticService', () => ({
  hapticImpactMedium: jest.fn(),
}));

jest.mock('../src/app/errorReporting', () => ({
  logActionError: jest.fn(),
}));

const copy = {
  audioErrorTitle: 'Audio unavailable',
  audioInterruptedLost: 'The interrupted recording could not be kept.',
  audioInterruptedSaved: 'The recording ended, but the captured part is safe.',
  audioPermissionDenied:
    'Microphone access was denied. You can still type the dream.',
  audioPermissionUnavailable:
    'Microphone access is unavailable. You can still type the dream.',
  audioSimulatorHint: 'Use a physical device.',
};

type Lifecycle = ReturnType<typeof useRecordingLifecycle>;

let latestLifecycle: Lifecycle | null = null;
let latestError: string | null = null;
let interruptionListener: ((uri: string) => void) | null = null;

function Harness() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  latestError = error;
  latestLifecycle = useRecordingLifecycle({
    mode: 'create',
    copy,
    isBusy: busy,
    setIsBusy: setBusy,
    setLastActionError: setError,
  });

  return null;
}

function lifecycle() {
  if (!latestLifecycle) {
    throw new Error('The recording lifecycle has not rendered.');
  }

  return latestLifecycle;
}

describe('capture fallbacks', () => {
  beforeEach(() => {
    latestLifecycle = null;
    latestError = null;
    interruptionListener = null;
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockOnRecordingInterrupted.mockImplementation(
      (listener: (uri: string) => void) => {
        interruptionListener = listener;
        return { remove: jest.fn() };
      },
    );

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Harness />);
    });
  });

  test(
    'a refused microphone is explained without breaking the composer',
    async () => {
      mockStartRecording.mockRejectedValue(
        Object.assign(new Error('permission denied'), {
          code: 'audio-permission-denied',
        }),
      );

      await ReactTestRenderer.act(async () => {
        await lifecycle().onToggleRecord();
      });

      expect(lifecycle().recording).toBe(false);
      expect(lifecycle().audioUri).toBeUndefined();
      expect(latestError).toBe(copy.audioPermissionDenied);
      expect(Alert.alert).toHaveBeenCalledWith(
        copy.audioErrorTitle,
        copy.audioPermissionDenied,
      );
    },
  );

  test(
    'an unavailable microphone uses the distinct recovery copy',
    async () => {
      mockStartRecording.mockRejectedValue(
        Object.assign(new Error('microphone unavailable'), {
          code: 'audio-permission-unavailable',
        }),
      );

      await ReactTestRenderer.act(async () => {
        await lifecycle().onToggleRecord();
      });

      expect(latestError).toBe(copy.audioPermissionUnavailable);
      expect(lifecycle().recording).toBe(false);
    },
  );

  test('a system interruption adopts the partial recording', async () => {
    mockStartRecording.mockResolvedValue('file:///audio/dream-partial.m4a');

    await ReactTestRenderer.act(async () => {
      await lifecycle().onToggleRecord();
    });

    expect(lifecycle().recording).toBe(true);
    expect(lifecycle().pendingAudioUri).toBe(
      'file:///audio/dream-partial.m4a',
    );
    expect(interruptionListener).not.toBeNull();

    ReactTestRenderer.act(() => {
      interruptionListener?.('file:///audio/dream-partial.m4a');
    });

    expect(lifecycle().recording).toBe(false);
    expect(lifecycle().pendingAudioUri).toBeUndefined();
    expect(lifecycle().audioUri).toBe('file:///audio/dream-partial.m4a');
    expect(latestError).toBe(copy.audioInterruptedSaved);
  });

  test(
    'an interruption with no recoverable file stops recording visibly',
    async () => {
      mockStartRecording.mockResolvedValue('file:///audio/dream-partial.m4a');

      await ReactTestRenderer.act(async () => {
        await lifecycle().onToggleRecord();
      });

      ReactTestRenderer.act(() => {
        interruptionListener?.('');
      });

      expect(lifecycle().recording).toBe(false);
      expect(lifecycle().audioUri).toBeUndefined();
      expect(latestError).toBe(copy.audioInterruptedLost);
    },
  );
});
