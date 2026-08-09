import { ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenArchiveKeyStrandedDisclosure() {
  return kv.getBoolean(ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY) === true;
}

export function markArchiveKeyStrandedDisclosureSeen() {
  kv.set(ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY, true);
}

export function resetArchiveKeyStrandedDisclosureSeen() {
  kv.remove(ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY);
}
