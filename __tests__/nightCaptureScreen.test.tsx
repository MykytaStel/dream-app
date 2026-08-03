import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useNightCapture } from '../src/features/dreams/hooks/useNightCapture';
import { kv } from '../src/services/storage/mmkv';
import { APP_NIGHT_CAPTURE_KEY } from '../src/services/storage/keys';

/**
 * The two inputs that decide whether a capture screen dims itself.
 *
 * The screen's own half of this is one conditional wrapper and reads as what
 * it is. The part worth pinning is here: an hour, a preference, and a default
 * that has to be "on" — someone opening this app at four in the morning is
 * the person it was built for, and asking them to find a setting first would
 * be the whole feature failing at the only moment it matters.
 */

const mockIsNightCaptureWindow = jest.fn();

jest.mock('../src/features/dreams/model/nightCapture', () => ({
  ...jest.requireActual('../src/features/dreams/model/nightCapture'),
  isNightCaptureWindow: () => mockIsNightCaptureWindow(),
}));

function read(): boolean {
  let value = false;

  function Probe() {
    value = useNightCapture();
    return null;
  }

  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  return value;
}

describe('whether a capture screen dims itself', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
  });

  test('it dims during the dark hours', () => {
    mockIsNightCaptureWindow.mockReturnValue(true);

    expect(read()).toBe(true);
  });

  test('it leaves the theme alone during the day', () => {
    mockIsNightCaptureWindow.mockReturnValue(false);

    expect(read()).toBe(false);
  });

  test('it is on before anyone has been asked', () => {
    // No stored preference at all — a first launch, at night.
    mockIsNightCaptureWindow.mockReturnValue(true);

    expect(kv.getBoolean(APP_NIGHT_CAPTURE_KEY)).toBeUndefined();
    expect(read()).toBe(true);
  });

  test('turning it off wins over the hour', () => {
    mockIsNightCaptureWindow.mockReturnValue(true);
    kv.set(APP_NIGHT_CAPTURE_KEY, false);

    expect(read()).toBe(false);
  });

  test('turning it on does not override the hour', () => {
    // On means "dim when it is dark", not "dim always".
    mockIsNightCaptureWindow.mockReturnValue(false);
    kv.set(APP_NIGHT_CAPTURE_KEY, true);

    expect(read()).toBe(false);
  });
});
