import { BACKUP_ONBOARDING_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenBackupOnboarding() {
  return kv.getBoolean(BACKUP_ONBOARDING_SEEN_KEY) === true;
}

export function markBackupOnboardingSeen() {
  kv.set(BACKUP_ONBOARDING_SEEN_KEY, true);
}

export function resetBackupOnboardingSeen() {
  kv.remove(BACKUP_ONBOARDING_SEEN_KEY);
}
