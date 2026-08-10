import { BIOMETRIC_ONBOARDING_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenBiometricOnboarding() {
  return kv.getBoolean(BIOMETRIC_ONBOARDING_SEEN_KEY) === true;
}

export function markBiometricOnboardingSeen() {
  kv.set(BIOMETRIC_ONBOARDING_SEEN_KEY, true);
}

export function resetBiometricOnboardingSeen() {
  kv.remove(BIOMETRIC_ONBOARDING_SEEN_KEY);
}
