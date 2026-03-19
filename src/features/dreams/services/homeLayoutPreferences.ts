import { HOME_LAYOUT_PREFERENCES_STORAGE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import {
  getHomeLayoutPreferencesForPreset,
  sanitizeHomeLayoutPreferences,
  type HomeLayoutPreferences,
} from '../model/homeLayout';

export function getStoredHomeLayoutPreferences(): HomeLayoutPreferences {
  const raw = kv.getString(HOME_LAYOUT_PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return getHomeLayoutPreferencesForPreset('balanced');
  }

  try {
    return sanitizeHomeLayoutPreferences(JSON.parse(raw));
  } catch {
    return getHomeLayoutPreferencesForPreset('balanced');
  }
}

export function saveHomeLayoutPreferences(
  preferences: HomeLayoutPreferences,
) {
  kv.set(
    HOME_LAYOUT_PREFERENCES_STORAGE_KEY,
    JSON.stringify(sanitizeHomeLayoutPreferences(preferences)),
  );
}

export function resetHomeLayoutPreferences() {
  kv.remove(HOME_LAYOUT_PREFERENCES_STORAGE_KEY);
}
