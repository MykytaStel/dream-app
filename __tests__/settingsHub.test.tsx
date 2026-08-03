import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SettingsScreen from '../src/features/settings/screens/SettingsScreen';
import { getSettingsCopy } from '../src/constants/copy/settings';
import { ROOT_ROUTE_NAMES } from '../src/app/navigation/routes';
import { themes } from '../src/theme/theme';

/**
 * Settings was nine sections in one scroll — language, theme, reminders,
 * backup, lock, privacy, analysis, transcription and a developer block — so
 * everything was equally far away and the reminder time sat directly above a
 * two-hundred-megabyte model download.
 *
 * What replaced it is a list of rooms, and these tests pin the two properties
 * that make that worth doing: the list stays short, and each row answers its
 * own question without being opened.
 */

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: () => ({ locale: 'en', setLocale: jest.fn() }),
}));

const mockController = {
  APP_VERSION_LABEL: 'v0.8.0',
  reminderSettings: { enabled: true, hour: 7, minute: 15, style: 'balanced' },
  reminderTime: '07:15',
  biometricLockEnabled: false,
  cloudSession: { status: 'signed-out' },
  cloudSummaryAccountValue: 'Not signed in',
  cloudSummaryStatusValue: 'Local only',
  cloudSyncMetaTitle: 'never',
  isApplyingReminder: false,
};

jest.mock('../src/features/settings/hooks/useSettingsScreenController', () => ({
  useSettingsScreenController: () => mockController,
}));

async function renderHub() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <SettingsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('the settings hub', () => {
  const copy = getSettingsCopy('en');

  beforeEach(() => {
    mockNavigate.mockClear();
    mockController.reminderSettings = {
      enabled: true,
      hour: 7,
      minute: 15,
      style: 'balanced',
    };
    mockController.biometricLockEnabled = false;
  });

  test('offers six rooms and no controls of its own', async () => {
    const { getByText } = await renderHub();

    for (const title of [
      copy.hubAppearanceTitle,
      copy.hubRemindersTitle,
      copy.hubBackupTitle,
      copy.hubSecurityTitle,
      copy.hubAnalysisTitle,
      copy.hubAboutTitle,
    ]) {
      expect(getByText(title)).toBeTruthy();
    }

    // The controls these rows lead to must not also be here. A hub that starts
    // absorbing the odd switch "because it is small" is the scroll again.
    expect(() => getByText(copy.themeTitle)).toThrow();
    expect(() => getByText(copy.transcriptionTitle)).toThrow();
  });

  test('a row answers its own question before it is opened', async () => {
    const { getByText } = await renderHub();

    // The two things someone checks settings for most often, readable without
    // opening anything.
    expect(getByText('07:15')).toBeTruthy();
    expect(getByText(copy.hubSecurityUnlocked)).toBeTruthy();
    expect(getByText(mockController.APP_VERSION_LABEL)).toBeTruthy();
  });

  test('a reminder that is off says so rather than showing a time', async () => {
    mockController.reminderSettings = {
      enabled: false,
      hour: 7,
      minute: 15,
      style: 'balanced',
    };

    const { getByText, queryByText } = await renderHub();

    expect(getByText(copy.hubRemindersOff)).toBeTruthy();
    // A stored time shown next to a disabled reminder reads as a promise the
    // app is not keeping.
    expect(queryByText('07:15')).toBeNull();
  });

  test('a locked app says so on the row', async () => {
    mockController.biometricLockEnabled = true;

    const { getByText } = await renderHub();

    expect(getByText(copy.hubSecurityLocked)).toBeTruthy();
  });

  test('each row opens its own screen', async () => {
    const { getByText } = await renderHub();

    const routes: Array<[string, string]> = [
      [copy.hubAppearanceTitle, ROOT_ROUTE_NAMES.SettingsAppearance],
      [copy.hubRemindersTitle, ROOT_ROUTE_NAMES.SettingsReminders],
      [copy.hubBackupTitle, ROOT_ROUTE_NAMES.Backup],
      [copy.hubSecurityTitle, ROOT_ROUTE_NAMES.SettingsSecurity],
      [copy.hubAnalysisTitle, ROOT_ROUTE_NAMES.SettingsAnalysis],
      [copy.hubAboutTitle, ROOT_ROUTE_NAMES.SettingsAbout],
    ];

    for (const [title, route] of routes) {
      mockNavigate.mockClear();
      fireEvent.press(getByText(title));
      expect(mockNavigate).toHaveBeenCalledWith(route);
    }
  });
});
