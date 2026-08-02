import { act, renderHook } from '@testing-library/react-native';

/**
 * The playback machinery both audio players now share.
 *
 * It existed twice — once in the composer, once on the detail screen — and the
 * duplication had already cost a repair: the bug where a recording showed no
 * length until played through once was present in both copies and fixed in each
 * separately.
 *
 * These pin the parts that are easy to get subtly wrong and invisible when they
 * are: the busy guard, and the rule that a progress event reporting zero does
 * not erase a length already read from the file.
 */

const mockPlay = jest.fn();
const mockStop = jest.fn();
const mockGetDuration = jest.fn();

jest.mock('../src/features/dreams/services/audioService', () => ({
  play: (uri: string, callbacks?: unknown) => mockPlay(uri, callbacks),
  stop: () => mockStop(),
  getDuration: (uri: string) => mockGetDuration(uri),
}));

const {
  formatPlaybackTime,
  useAudioPlayback,
} = require('../src/features/dreams/components/audio/useAudioPlayback');

type Callbacks = {
  onFinished?: () => void;
  onProgress?: (positionMs: number, durationMs: number) => void;
};

/** The callbacks the component handed to `play`. */
function playbackCallbacks(): Callbacks {
  return mockPlay.mock.calls[0][1] as Callbacks;
}

beforeEach(() => {
  mockPlay.mockReset().mockResolvedValue(undefined);
  mockStop.mockReset().mockResolvedValue(undefined);
  mockGetDuration.mockReset().mockResolvedValue(0);
});

describe('useAudioPlayback', () => {
  test('asks the file how long it is before anything is played', async () => {
    mockGetDuration.mockResolvedValue(38_000);

    const { result } = await renderHook(() =>
      useAudioPlayback('file:///dream.m4a'),
    );

    await act(async () => {});

    expect(mockGetDuration).toHaveBeenCalledWith('file:///dream.m4a');
    expect(result.current.durationMs).toBe(38_000);
    expect(result.current.isPlaying).toBe(false);
  });

  test('a progress event reporting no duration leaves the known one alone', async () => {
    // The failure this prevents: the length is read from the file, playback
    // starts, the first progress event carries a zero because the container has
    // no stored duration, and the label falls back to `--:--` mid-play.
    mockGetDuration.mockResolvedValue(38_000);

    const { result } = await renderHook(() =>
      useAudioPlayback('file:///dream.m4a'),
    );
    await act(async () => {});
    await act(async () => {
      result.current.toggle();
    });

    await act(async () => {
      playbackCallbacks().onProgress?.(1_000, 0);
    });

    expect(result.current.durationMs).toBe(38_000);
    expect(result.current.positionMs).toBe(1_000);
  });

  test('a progress event that does know the duration updates it', async () => {
    const { result } = await renderHook(() =>
      useAudioPlayback('file:///dream.m4a'),
    );
    await act(async () => {
      result.current.toggle();
    });

    await act(async () => {
      playbackCallbacks().onProgress?.(2_000, 41_000);
    });

    expect(result.current.durationMs).toBe(41_000);
  });

  test('reaching the end rewinds without needing a stop', async () => {
    const { result } = await renderHook(() =>
      useAudioPlayback('file:///dream.m4a'),
    );
    await act(async () => {
      result.current.toggle();
    });
    await act(async () => {
      playbackCallbacks().onProgress?.(30_000, 41_000);
    });

    await act(async () => {
      playbackCallbacks().onFinished?.();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.positionMs).toBe(0);
  });

  test('toggling while playing stops it', async () => {
    const { result } = await renderHook(() =>
      useAudioPlayback('file:///dream.m4a'),
    );
    await act(async () => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(true);

    await act(async () => {
      result.current.toggle();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.positionMs).toBe(0);
  });

  test('a second tap during the first is ignored, not queued', async () => {
    // Without the guard, two taps arriving before the native call answers start
    // playback twice — and the second `play` leaves the first one's listeners
    // attached to a player that is no longer the current one.
    let releaseFirstPlay: (() => void) | null = null;
    mockPlay.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          releaseFirstPlay = () => resolve();
        }),
    );

    const { result } = await renderHook(() =>
      useAudioPlayback('file:///dream.m4a'),
    );

    await act(async () => {
      result.current.toggle();
      result.current.toggle();
    });

    expect(mockPlay).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseFirstPlay?.();
    });
  });

  test('a failure to play is reported rather than thrown', async () => {
    // The caller shows it in an alert with its own wording, so it comes back as
    // a value. Throwing would take the screen down over a recording that will
    // not open.
    mockPlay.mockRejectedValue(new Error('file is gone'));

    const { result } = await renderHook(() =>
      useAudioPlayback('file:///gone.m4a'),
    );

    let returned: string | null = null;
    await act(async () => {
      returned = await result.current.toggle();
    });

    expect(returned).toBe('file is gone');
    expect(result.current.error).toBe('file is gone');
    expect(result.current.isPlaying).toBe(false);
  });
});

describe('formatPlaybackTime', () => {
  test.each([
    [0, '0:00'],
    [7_400, '0:07'],
    [61_000, '1:01'],
    [600_000, '10:00'],
  ])('%i ms reads as %s', (ms, expected) => {
    expect(formatPlaybackTime(ms)).toBe(expected);
  });
});
