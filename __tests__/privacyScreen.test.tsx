import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PrivacyScreen from '../src/features/settings/screens/PrivacyScreen';
import { getSettingsCopy } from '../src/constants/copy/settings';
import { themes } from '../src/theme/theme';

// ScreenContainer reads safe-area insets, so the screen needs the provider and
// a known frame to render outside the app shell.
const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: () => ({ locale: 'en' }),
}));

/**
 * A privacy screen is only worth having if it is accurate. These tests pin the
 * claims that are easy to quietly break — above all the admission that cloud
 * sync is currently unencrypted, which is the one a rewrite would be tempted to
 * soften.
 */
async function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <PrivacyScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('PrivacyScreen', () => {
  const copy = getSettingsCopy('en');

  test('names each of the three ways data can leave the device', async () => {
    const { getByText } = await renderScreen();

    expect(getByText(copy.privacyCloudTitle)).toBeTruthy();
    expect(getByText(copy.privacyCrashTitle)).toBeTruthy();
    expect(getByText(copy.privacyModelTitle)).toBeTruthy();
  });

  test('says plainly that cloud sync is not encrypted', async () => {
    const { getByText } = await renderScreen();

    expect(getByText(copy.privacyCloudBody)).toBeTruthy();
    expect(copy.privacyCloudBody.toLowerCase()).toContain('unencrypted');
  });

  test('states that crash reports exclude dream content', async () => {
    const { getByText } = await renderScreen();

    expect(getByText(copy.privacyCrashBody)).toBeTruthy();
    expect(copy.privacyCrashBody.toLowerCase()).toContain('stripped');
  });

  test('does not claim the lock encrypts anything', async () => {
    const { getByText } = await renderScreen();

    expect(getByText(copy.privacyLockBody)).toBeTruthy();
    expect(copy.privacyLockBody.toLowerCase()).toContain('does not encrypt');
  });

  test('explains what deleting the app leaves behind', async () => {
    const { getByText } = await renderScreen();

    expect(getByText(copy.privacyDeleteBody)).toBeTruthy();
  });

  test('is written in both languages', () => {
    const uk = getSettingsCopy('uk');

    expect(uk.privacyCloudBody).not.toBe(copy.privacyCloudBody);
    expect(uk.privacyScreenIntro).not.toBe(copy.privacyScreenIntro);
  });
});
