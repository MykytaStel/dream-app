import React from 'react';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { useSettingsSpoke } from './useSettingsSpoke';
import {
  SettingsHeroSection,
  ThemeSection,
} from '../components/SettingsTopSections';

/**
 * Palette and language.
 *
 * Two controls that were the first thing the settings tab showed, at the cost
 * of everything else starting below them. They are here together because they
 * are the same question — how the app should look and sound to this person —
 * and neither is asked more than a handful of times.
 */
export default function SettingsAppearanceScreen() {
  const { copy, styles, controller, locale } = useSettingsSpoke();

  return (
    <ScreenContainer scroll>
      <SettingsHeroSection
        copy={copy}
        locale={locale}
        isApplyingReminder={controller.isApplyingReminder}
        onSelectLocale={controller.onSelectLocale}
        styles={styles}
      />

      <ThemeSection
        copy={copy}
        styles={styles}
        themeId={controller.themeId}
        onSelectTheme={controller.onSelectTheme}
      />
    </ScreenContainer>
  );
}
