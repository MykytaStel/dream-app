import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  authenticateWithBiometrics,
  getBiometricLockEnabled,
} from '../../../services/security/biometricService';

export function useAppLockGate(promptMessage: string) {
  const [locked, setLocked] = React.useState(() => getBiometricLockEnabled());
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
        setLocked(false);
      }
      return success;
    } finally {
      authInProgressRef.current = false;
    }
  }, [promptMessage]);

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

  return { locked, triggerAuth };
}
