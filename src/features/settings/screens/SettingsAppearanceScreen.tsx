import React from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { useCalmMode } from '../../../app/CalmModeProvider';
import { useSettingsSpoke } from './useSettingsSpoke';
import {
  LanguageSection,
  ThemeSection,
} from '../components/SettingsTopSections';

/**
 * Palette, language, and how much the app explains itself.
 *
 * The first two were the first thing the settings tab showed, at the cost of
 * everything else starting below them. Calm mode joins them because it is the
 * same question — how the app should look and sound to this person — and none
 * of the three is asked more than a handful of times.
 */
export default function SettingsAppearanceScreen() {
  const { copy, styles, controller, locale } = useSettingsSpoke();
  const theme = useTheme<Theme>();
  const { calmMode, setCalmMode } = useCalmMode();

  return (
    <ScreenContainer scroll withTopInset={false}>
      <LanguageSection
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

      <Card style={styles.sectionCard}>
        <View style={styles.calmModeRow}>
          <View style={styles.calmModeCopy}>
            <Text style={styles.calmModeTitle}>{copy.calmModeTitle}</Text>
            {/*
              This hint is the one the switch is about, so it stays on when
              calm mode is on — hiding the description of the control that
              hides descriptions would leave a switch with no explanation and
              no way to ask for one.
            */}
            <Text style={styles.calmModeHint}>{copy.calmModeHint}</Text>
          </View>
          <Switch
            accessibilityLabel={copy.calmModeTitle}
            value={calmMode}
            onValueChange={setCalmMode}
            trackColor={{
              false: theme.colors.switchTrackOff,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.switchThumb}
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}
