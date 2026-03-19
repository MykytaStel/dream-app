import { APP_THEME_KEY } from '../services/storage/keys';
import { kv } from '../services/storage/mmkv';
import { DEFAULT_THEME_ID, isAppThemeId, type AppThemeId } from './theme';

export function getStoredThemeId(): AppThemeId {
  const raw = kv.getString(APP_THEME_KEY);
  if (isAppThemeId(raw)) {
    return raw;
  }

  return DEFAULT_THEME_ID;
}

export function saveThemeId(themeId: AppThemeId) {
  kv.set(APP_THEME_KEY, themeId);
}
