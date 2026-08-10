import { REMINDER_ONBOARDING_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenReminderOnboarding() {
  return kv.getBoolean(REMINDER_ONBOARDING_SEEN_KEY) === true;
}

export function markReminderOnboardingSeen() {
  kv.set(REMINDER_ONBOARDING_SEEN_KEY, true);
}

export function resetReminderOnboardingSeen() {
  kv.remove(REMINDER_ONBOARDING_SEEN_KEY);
}
