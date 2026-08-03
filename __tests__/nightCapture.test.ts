import {
  NIGHT_CAPTURE_END_HOUR,
  NIGHT_CAPTURE_START_HOUR,
  isNightCaptureWindow,
} from '../src/features/dreams/model/nightCapture';
import { isWakeCaptureWindow } from '../src/features/dreams/model/homeOverview';

/**
 * A window that wraps around midnight is the kind of thing that reads as
 * correct and is off by one at exactly the hour nobody tests.
 */
function at(hour: number) {
  return new Date(2026, 7, 3, hour, 30, 0);
}

describe('the night capture window', () => {
  test('covers the dark hours on both sides of midnight', () => {
    for (const hour of [22, 23, 0, 1, 3, 5, 6]) {
      expect(isNightCaptureWindow(at(hour))).toBe(true);
    }
  });

  test('leaves daylight alone', () => {
    for (const hour of [7, 9, 12, 15, 18, 21]) {
      expect(isNightCaptureWindow(at(hour))).toBe(false);
    }
  });

  test('the boundaries are inclusive at the start and exclusive at the end', () => {
    expect(isNightCaptureWindow(at(NIGHT_CAPTURE_START_HOUR))).toBe(true);
    expect(isNightCaptureWindow(at(NIGHT_CAPTURE_START_HOUR - 1))).toBe(false);
    expect(isNightCaptureWindow(at(NIGHT_CAPTURE_END_HOUR - 1))).toBe(true);
    expect(isNightCaptureWindow(at(NIGHT_CAPTURE_END_HOUR))).toBe(false);
  });

  test('midnight itself is night', () => {
    // The hour the wrap-around gets wrong when it is written as a range.
    expect(isNightCaptureWindow(new Date(2026, 7, 3, 0, 0, 0))).toBe(true);
  });

  test('it overlaps the wake window where waking actually happens', () => {
    // Four to seven is both: probably just awake, and still dark. Neither
    // window is a substitute for the other, so this pins that they agree here.
    for (const hour of [4, 5, 6]) {
      expect(isNightCaptureWindow(at(hour))).toBe(true);
      expect(isWakeCaptureWindow(at(hour))).toBe(true);
    }

    // And that they part company by mid-morning.
    expect(isWakeCaptureWindow(at(9))).toBe(true);
    expect(isNightCaptureWindow(at(9))).toBe(false);
  });
});
