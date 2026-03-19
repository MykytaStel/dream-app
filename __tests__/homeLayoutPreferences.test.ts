import { HOME_LAYOUT_PREFERENCES_STORAGE_KEY } from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import {
  getHomeLayoutPreferencesForPreset,
  moveHomeLayoutSection,
  sanitizeHomeLayoutPreferences,
  toggleHomeLayoutSectionVisibility,
} from '../src/features/dreams/model/homeLayout';
import {
  getStoredHomeLayoutPreferences,
  saveHomeLayoutPreferences,
} from '../src/features/dreams/services/homeLayoutPreferences';

describe('homeLayoutPreferences', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  it('returns opinionated defaults for calm and insight presets', () => {
    expect(getHomeLayoutPreferencesForPreset('calm')).toEqual({
      preset: 'calm',
      sectionOrder: ['shortcuts', 'spotlight', 'weeklyPatterns'],
      hiddenSections: ['spotlight', 'weeklyPatterns'],
    });

    expect(getHomeLayoutPreferencesForPreset('insight')).toEqual({
      preset: 'insight',
      sectionOrder: ['spotlight', 'weeklyPatterns', 'shortcuts'],
      hiddenSections: [],
    });
  });

  it('sanitizes unknown sections and restores missing ones', () => {
    expect(
      sanitizeHomeLayoutPreferences({
        preset: 'insight',
        sectionOrder: ['weeklyPatterns', 'unknown', 'weeklyPatterns'],
        hiddenSections: ['spotlight', 'missing'],
      }),
    ).toEqual({
      preset: 'insight',
      sectionOrder: ['weeklyPatterns', 'shortcuts', 'spotlight'],
      hiddenSections: ['spotlight'],
    });
  });

  it('moves sections up and down without breaking order', () => {
    const next = moveHomeLayoutSection(
      getHomeLayoutPreferencesForPreset('balanced'),
      'weeklyPatterns',
      'up',
    );

    expect(next.sectionOrder).toEqual([
      'shortcuts',
      'weeklyPatterns',
      'spotlight',
    ]);
    expect(
      moveHomeLayoutSection(next, 'shortcuts', 'up').sectionOrder,
    ).toEqual(['shortcuts', 'weeklyPatterns', 'spotlight']);
  });

  it('toggles section visibility and persists sanitized preferences', () => {
    const hidden = toggleHomeLayoutSectionVisibility(
      getHomeLayoutPreferencesForPreset('balanced'),
      'spotlight',
    );

    expect(hidden.hiddenSections).toEqual(['spotlight']);

    saveHomeLayoutPreferences({
      ...hidden,
      sectionOrder: ['spotlight', 'shortcuts', 'weeklyPatterns'],
    });

    expect(kv.getString(HOME_LAYOUT_PREFERENCES_STORAGE_KEY)).toBeTruthy();
    expect(getStoredHomeLayoutPreferences()).toEqual({
      preset: 'balanced',
      sectionOrder: ['spotlight', 'shortcuts', 'weeklyPatterns'],
      hiddenSections: ['spotlight'],
    });
  });
});
