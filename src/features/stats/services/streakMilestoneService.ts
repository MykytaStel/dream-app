import { LAST_STREAK_CELEBRATED_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function getLastStreakCelebrated(): number {
  return kv.getNumber(LAST_STREAK_CELEBRATED_KEY) ?? 0;
}

export function saveLastStreakCelebrated(streak: number) {
  kv.set(LAST_STREAK_CELEBRATED_KEY, streak);
}
