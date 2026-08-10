import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  authenticateWithBiometrics,
  checkBiometricAvailability,
  getBiometricLockEnabled,
  setBiometricLockEnabled,
} from '../../../services/security/biometricService';
import { hapticUnlock } from '../../../services/haptics/hapticService';

export type BiometricLockAutoDisabledReason =
  | 'not-supported'
  | 'not-enrolled'
  | 'unknown';

export function useAppLockGate(promptMessage: string) {
  const [locked, setLocked] = React.useState(() => getBiometricLockEnabled());
  const [autoDisabledReason, setAutoDisabledReason] =
    React.useState<BiometricLockAutoDisabledReason | null>(null);
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const authInProgressRef = React.useRef(false);

  const triggerAuth = React.useCallback(async () => {
    if (authInProgressRef.current) {
      return false;
    }

    authInProgressRef.current = true;

    try {
      const success = await authenticateWithBiometrics(promptMessage);
      if (success) {
        hapticUnlock();
        setLocked(false);
        return true;
      }

      const availability = await checkBiometricAvailability();
      if (!availability.available) {
        // The device itself confirms biometric auth cannot succeed right
        // now (hardware/enrollment changed, e.g. after an OS update).
        // Continuing to require it would lock the user out of their own
        // journal permanently, and protects nothing — there's no attacker
        // to keep out if the OS can't verify anyone either. Disable the
        // lock instead of leaving them stuck.
        setBiometricLockEnabled(false);
        setLocked(false);
        setAutoDisabledReason(availability.reason);
      }
      return false;
    } finally {
      authInProgressRef.current = false;
    }
  }, [promptMessage]);

  const dismissAutoDisabledNotice = React.useCallback(() => {
    setAutoDisabledReason(null);
  }, []);

  // Auto-trigger on initial mount if locked
  React.useEffect(() => {
    if (!locked) {
      return;
    }

    triggerAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-lock when app returns to foreground from background
  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const prevState = appStateRef.current;
        appStateRef.current = nextState;

        const comingFromBackground =
          (prevState === 'background' || prevState === 'inactive') &&
          nextState === 'active';

        if (comingFromBackground && getBiometricLockEnabled()) {
          setLocked(true);
          triggerAuth();
        }
      },
    );

    return () => subscription.remove();
  }, [triggerAuth]);

  return {
    locked,
    triggerAuth,
    autoDisabledReason,
    dismissAutoDisabledNotice,
  };
}
