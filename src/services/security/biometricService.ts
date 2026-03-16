import ReactNativeBiometrics from 'react-native-biometrics';
import { kv } from '../storage/mmkv';
import { BIOMETRIC_LOCK_ENABLED_KEY } from '../storage/keys';

const rnBiometrics = new ReactNativeBiometrics();

export type BiometricAvailability =
  | { available: false; reason: 'not-supported' | 'not-enrolled' | 'unknown' }
  | { available: true; biometryType: string };

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const { available, biometryType, error } =
      await rnBiometrics.isSensorAvailable();

    if (!available) {
      const reason =
        error?.includes('enrolled') || error?.includes('PasscodeNotSet')
          ? 'not-enrolled'
          : 'not-supported';
      return { available: false, reason };
    }

    return { available: true, biometryType: biometryType ?? 'Biometrics' };
  } catch {
    return { available: false, reason: 'unknown' };
  }
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    return success;
  } catch {
    return false;
  }
}

export function getBiometricLockEnabled(): boolean {
  return kv.getBoolean(BIOMETRIC_LOCK_ENABLED_KEY) ?? false;
}

export function setBiometricLockEnabled(enabled: boolean): void {
  kv.set(BIOMETRIC_LOCK_ENABLED_KEY, enabled);
}
