import { Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { kv } from '../storage/mmkv';
import { BIOMETRIC_LOCK_ENABLED_KEY } from '../storage/keys';

const rnBiometrics = new ReactNativeBiometrics();

export type BiometricAvailability =
  | { available: false; reason: 'not-supported' | 'not-enrolled' | 'unknown' }
  | { available: true; biometryType: string };

// iOS LAError codes (LocalAuthentication). These are the numeric `Code=`
// values embedded — unlocalized — in NSError's default `%@` description,
// ahead of the (localized) human-readable message. Matching on the number
// keeps this correct on non-English devices, unlike matching English words
// in the message itself. Anchored to the LocalAuthentication error domain so
// an unrelated error that happens to carry the same number never matches —
// an unqualified number match would fail *open* (misclassifying something as
// durably "not enrolled"), the one direction this classifier must not fail in.
const IOS_ERROR_CODE_BIOMETRY_NOT_ENROLLED = -7;
const IOS_ERROR_CODE_PASSCODE_NOT_SET = -5;
const IOS_LOCAL_AUTHENTICATION_ERROR = /Domain=com\.apple\.LocalAuthentication\s+Code=(-?\d+)/;

function isNotEnrolledError(error: string): boolean {
  if (Platform.OS === 'android') {
    // react-native-biometrics writes the literal BiometricManager constant
    // name, not a localized message, so this is stable across locales. Must
    // check the exact constant, not a lowercase substring —
    // 'BIOMETRIC_ERROR_NONE_ENROLLED' does not contain 'enrolled'.
    return error.includes('NONE_ENROLLED');
  }

  if (Platform.OS === 'ios') {
    const match = IOS_LOCAL_AUTHENTICATION_ERROR.exec(error);
    if (!match) {
      return false;
    }
    const code = Number(match[1]);
    return (
      code === IOS_ERROR_CODE_BIOMETRY_NOT_ENROLLED ||
      code === IOS_ERROR_CODE_PASSCODE_NOT_SET
    );
  }

  return false;
}

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const { available, biometryType, error } =
      await rnBiometrics.isSensorAvailable();

    if (!available) {
      const reason =
        error && isNotEnrolledError(error) ? 'not-enrolled' : 'not-supported';
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
