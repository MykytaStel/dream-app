import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  authenticateWithBiometrics,
  checkBiometricAvailability,
  getBiometricLockEnabled,
  setBiometricLockEnabled,
} from '../../../services/security/biometricService';
import { shouldAutoDisableBiometricLock } from '../model/biometricLockAutoDisable';
import { hapticUnlock } from '../../../services/haptics/hapticService';

export function useAppLockGate(promptMessage: string) {
  const [locked, setLocked] = React.useState(() => getBiometricLockEnabled());
  const [autoDisabled, setAutoDisabled] = React.useState(false);
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
      if (shouldAutoDisableBiometricLock(availability)) {
        // No biometrics are enrolled on this device at all — continuing to
        // require them would lock the user out of their own journal
        // permanently. Deliberately narrow: `available: false` can also
        // mean a transient state (e.g. a biometric lockout after repeated
        // failed attempts, which an attacker could trigger on purpose), so
        // only this one durable, unambiguous reason auto-disables the lock
        // — see shouldAutoDisableBiometricLock for why the other reasons
        // must not.
        setBiometricLockEnabled(false);
        setLocked(false);
        setAutoDisabled(true);
      }
      return false;
    } finally {
      authInProgressRef.current = false;
    }
  }, [promptMessage]);

  const dismissAutoDisabledNotice = React.useCallback(() => {
    setAutoDisabled(false);
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
    autoDisabled,
    dismissAutoDisabledNotice,
  };
}
