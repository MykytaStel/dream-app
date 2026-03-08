import { kv } from '../../../services/storage/mmkv';
import { LAST_VIEWED_DREAM_STORAGE_KEY } from '../../../services/storage/keys';

type LastViewedDreamRecord = {
  dreamId: string;
  viewedAt: number;
};

function normalizeLastViewedDream(
  value: Partial<LastViewedDreamRecord> | null | undefined,
): LastViewedDreamRecord | null {
  if (!value?.dreamId || typeof value.dreamId !== 'string') {
    return null;
  }

  return {
    dreamId: value.dreamId,
    viewedAt:
      typeof value.viewedAt === 'number' && Number.isFinite(value.viewedAt)
        ? value.viewedAt
        : Date.now(),
  };
}

export function getLastViewedDream() {
  const raw = kv.getString(LAST_VIEWED_DREAM_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeLastViewedDream(JSON.parse(raw) as Partial<LastViewedDreamRecord>);
  } catch {
    return null;
  }
}

export function saveLastViewedDream(dreamId: string) {
  const value = normalizeLastViewedDream({
    dreamId,
    viewedAt: Date.now(),
  });

  if (!value) {
    return null;
  }

  kv.set(LAST_VIEWED_DREAM_STORAGE_KEY, JSON.stringify(value));
  return value;
}

export function clearLastViewedDream(dreamId?: string) {
  if (!dreamId) {
    kv.remove(LAST_VIEWED_DREAM_STORAGE_KEY);
    return;
  }

  const current = getLastViewedDream();
  if (current?.dreamId === dreamId) {
    kv.remove(LAST_VIEWED_DREAM_STORAGE_KEY);
  }
}
