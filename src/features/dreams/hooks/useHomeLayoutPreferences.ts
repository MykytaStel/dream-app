import React from 'react';
import {
  getHomeLayoutPreferencesForPreset,
  moveHomeLayoutSection,
  sanitizeHomeLayoutPreferences,
  toggleHomeLayoutSectionVisibility,
  type HomeLayoutPreferences,
  type HomeLayoutPreset,
  type HomeLayoutSection,
} from '../model/homeLayout';
import {
  getStoredHomeLayoutPreferences,
  saveHomeLayoutPreferences,
} from '../services/homeLayoutPreferences';

export function useHomeLayoutPreferences() {
  const [preferences, setPreferences] = React.useState<HomeLayoutPreferences>(
    () => getStoredHomeLayoutPreferences(),
  );

  const updatePreferences = React.useCallback(
    (updater: (current: HomeLayoutPreferences) => HomeLayoutPreferences) => {
      setPreferences(current => {
        const next = sanitizeHomeLayoutPreferences(updater(current));
        saveHomeLayoutPreferences(next);
        return next;
      });
    },
    [],
  );

  const applyPreset = React.useCallback(
    (preset: HomeLayoutPreset) => {
      updatePreferences(() => getHomeLayoutPreferencesForPreset(preset));
    },
    [updatePreferences],
  );

  const toggleSectionVisibility = React.useCallback(
    (section: HomeLayoutSection) => {
      updatePreferences(current =>
        toggleHomeLayoutSectionVisibility(current, section),
      );
    },
    [updatePreferences],
  );

  const reorderSection = React.useCallback(
    (section: HomeLayoutSection, direction: 'up' | 'down') => {
      updatePreferences(current =>
        moveHomeLayoutSection(current, section, direction),
      );
    },
    [updatePreferences],
  );

  const resetToDefault = React.useCallback(() => {
    updatePreferences(() => getHomeLayoutPreferencesForPreset('balanced'));
  }, [updatePreferences]);

  return {
    preferences,
    applyPreset,
    toggleSectionVisibility,
    reorderSection,
    resetToDefault,
  };
}
