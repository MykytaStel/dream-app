import React from 'react';
import { AppState } from 'react-native';
import { APP_NIGHT_CAPTURE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import { isNightCaptureWindow } from '../model/nightCapture';

export function getNightCaptureEnabled(): boolean {
  // On by default. Someone who opens this app at four in the morning is the
  // person it was built for, and they should not have to find a setting first.
  return kv.getBoolean(APP_NIGHT_CAPTURE_KEY) ?? true;
}

export function setNightCaptureEnabled(value: boolean) {
  kv.set(APP_NIGHT_CAPTURE_KEY, value);
}

/**
 * Whether a capture screen should render itself for a dark room.
 *
 * Re-checked when the app returns to the foreground rather than on a timer:
 * the hour only matters at the moment the screen is opened, and a phone that
 * has been asleep since yesterday evening will otherwise still believe it is
 * yesterday evening.
 */
export function useNightCapture(): boolean {
  const [active, setActive] = React.useState(
    () => getNightCaptureEnabled() && isNightCaptureWindow(),
  );

  React.useEffect(() => {
    const evaluate = () =>
      setActive(getNightCaptureEnabled() && isNightCaptureWindow());

    evaluate();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        evaluate();
      }
    });

    return () => subscription.remove();
  }, []);

  return active;
}
