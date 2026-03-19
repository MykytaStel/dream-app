import { APP_THEME_KEY } from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import { DEFAULT_THEME_ID } from '../src/theme/theme';
import { getStoredThemeId, saveThemeId } from '../src/theme/themePreferences';

describe('themePreferences', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  it('falls back to the default theme', () => {
    expect(getStoredThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it('persists a valid theme id', () => {
    saveThemeId('ember');

    expect(kv.getString(APP_THEME_KEY)).toBe('ember');
    expect(getStoredThemeId()).toBe('ember');
  });

  it('ignores unsupported stored theme ids', () => {
    kv.set(APP_THEME_KEY, 'unknown-theme');

    expect(getStoredThemeId()).toBe(DEFAULT_THEME_ID);
  });
});
