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
 * claims that are easy to quietly break.
 *
 * Until sync was encrypted, the pinned claim here was the admission that it was
 * not. That admission is now false and has been replaced — but the test was not
 * simply deleted, because the temptation it guards against did not go away, it
 * inverted. "Encrypted" invites a page that says only the flattering half. What
 * is pinned now is the unflattering half: that the server still learns how many
 * dreams there are and when they changed.
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

  test('says the content is encrypted, and that the key never reaches the server', async () => {
    const { getByText } = await renderScreen();

    expect(getByText(copy.privacyCloudBody)).toBeTruthy();
    const body = copy.privacyCloudBody.toLowerCase();

    expect(body).toContain('encrypted');
    expect(body).toContain('key the server never receives');
    // The claim it replaced was an admission. A page that no longer admits
    // anything is a page that started selling.
    expect(body).not.toContain('unencrypted');
  });

  test('still admits what the server does learn', async () => {
    // Encryption hides the content, not the shape of the archive. Sync rows
    // keep `updated_at` in the clear so conflicts can be resolved before
    // anything is decrypted, which means the timing is genuinely visible.
    const body = copy.privacyCloudBody.toLowerCase();

    expect(body).toContain('how many dreams');
    expect(body).toContain('when you last changed');
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
