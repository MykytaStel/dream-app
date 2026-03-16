import { kv } from '../../../services/storage/mmkv';
import { ONBOARDING_SEEN_KEY } from '../../../services/storage/keys';

export function hasSeenOnboarding(): boolean {
  return kv.getBoolean(ONBOARDING_SEEN_KEY) === true;
}

export function markOnboardingSeen(): void {
  kv.set(ONBOARDING_SEEN_KEY, true);
}
