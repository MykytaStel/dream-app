import React from 'react';
import { getDuration, play, stop } from '../../services/audioService';

/**
 * Playing one recording, without saying anything about how it looks.
 *
 * There were two of these: one in the composer and one on the detail screen.
 * They rendered differently — a single button with a time label against a play
 * button with a progress bar — but the machinery underneath was the same
 * fifty lines twice, down to the ref that stops a second tap arriving mid-await.
 *
 * The cost was not the duplication itself. It was that a fix had to be applied
 * twice: the bug where a recording showed no length until it had been played
 * through once existed in both, was found once, and was repaired in each copy
 * separately. The second repair only happened because someone remembered the
 * second copy was there.
 *
 * So the behaviour lives here and the two screens keep their own markup, which
 * is the part that genuinely differs.
 *
 * Milliseconds throughout. The composer used to hold seconds and the detail
 * screen milliseconds, which meant two formatters for one format.
 */

export type AudioPlaybackState = {
  isPlaying: boolean;
  positionMs: number;
  /** Zero when unknown — a missing file, or a container with no stored length. */
  durationMs: number;
  /** The last playback failure, or null. Rendered inline by callers that show it. */
  error: string | null;
  /** Starts, or stops if already playing. Resolves to an error message or null. */
  toggle: () => Promise<string | null>;
  /** Stops and rewinds, for a screen that is being navigated away from. */
  reset: () => void;
};

export function useAudioPlayback(uri: string): AudioPlaybackState {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [positionMs, setPositionMs] = React.useState(0);
  const [durationMs, setDurationMs] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Guards the gap between a tap and the native call answering.
   *
   * A ref rather than state because a second tap has to be rejected during the
   * same render, and a state update would not have landed by then.
   */
  const isBusyRef = React.useRef(false);

  // The length, read from the file rather than waited for. Without this a saved
  // recording reads `--:--` until it has been played all the way through once.
  React.useEffect(() => {
    let cancelled = false;

    getDuration(uri).then(ms => {
      if (!cancelled && ms > 0) {
        setDurationMs(ms);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  // Audio outlives the component that started it, so leaving without stopping
  // means a recording playing under a screen that is no longer there.
  React.useEffect(() => {
    return () => {
      stop().catch(() => {});
    };
  }, []);

  const reset = React.useCallback(() => {
    stop().catch(() => {});
    setIsPlaying(false);
    setPositionMs(0);
  }, []);

  const toggle = React.useCallback(async (): Promise<string | null> => {
    if (isBusyRef.current) {
      return null;
    }

    isBusyRef.current = true;

    try {
      if (isPlaying) {
        await stop();
        setIsPlaying(false);
        setPositionMs(0);
        return null;
      }

      setError(null);
      setPositionMs(0);

      await play(uri, {
        onFinished: () => {
          setIsPlaying(false);
          setPositionMs(0);
        },
        onProgress: (position, duration) => {
          setPositionMs(position);
          // Only when the player actually knows. A container without a stored
          // length reports zero, and overwriting a duration already read from
          // the file with that zero would put `--:--` back on screen.
          if (duration > 0) {
            setDurationMs(duration);
          }
        },
      });

      setIsPlaying(true);
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setIsPlaying(false);
      setPositionMs(0);
      setError(message);
      return message;
    } finally {
      isBusyRef.current = false;
    }
  }, [isPlaying, uri]);

  return { isPlaying, positionMs, durationMs, error, toggle, reset };
}

/** `m:ss`, from milliseconds. One format, one place. */
export function formatPlaybackTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
