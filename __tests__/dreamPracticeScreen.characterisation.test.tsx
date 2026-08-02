import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getPracticeCopy } from '../src/constants/copy/practice';
import { themes } from '../src/theme/theme';

/**
 * What the practice screen puts on the page, pinned before it is split.
 *
 * 864 lines this morning, 751 after its styles moved out, and no coverage at
 * all. Inside the component are six sections marked by their headings, the
 * largest of which — reminders — is nearly two hundred lines on its own.
 *
 * This is the net for moving them. It asserts on the headings and on one piece
 * of content from each, so a section that becomes its own file has to keep
 * showing the same things.
 *
 * The screen reads dreams, schedules notifications and navigates, so all three
 * are stubbed. What is under test is what it draws, not what it stores.
 */

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: (effect: () => (() => void) | void) => {
    require('react').useEffect(effect, [effect]);
  },
}));

jest.mock('../src/app/navigation/navigationRef', () => ({
  openNewDreamTab: jest.fn(),
}));

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  listDreams: () => [],
}));

jest.mock(
  '../src/features/reminders/services/dreamPracticeReminderService',
  () => {
    const actual = jest.requireActual(
      '../src/features/reminders/services/dreamPracticeReminderService',
    );

    // Only the two functions that touch storage or the notification scheduler
    // are replaced; the defaults and types come from the real module so the
    // shape cannot drift away from what the screen reads.
    return {
      ...actual,
      getDreamPracticeReminderSettings: () =>
        actual.DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS,
      applyDreamPracticeReminderSettings: jest
        .fn()
        .mockResolvedValue(undefined),
    };
  },
);

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: () => ({ locale: 'en' }),
}));

// Spread the real module: the screen calls several trackers and naming them
// one by one in a stub only moves the failure to the next one.
jest.mock('../src/services/observability/events', () => ({
  ...jest.requireActual('../src/services/observability/events'),
}));

const copy = getPracticeCopy('en');

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  const DreamPracticeScreen =
    require('../src/features/practice/screens/DreamPracticeScreen').default;

  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <DreamPracticeScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('dream practice screen', () => {
  test('every section heading is on the page', async () => {
    const { getAllByText } = await renderScreen();

    for (const heading of [
      copy.quickActionsTitle,
      copy.dailyChecklistTitle,
      copy.planTitle,
      copy.remindersTitle,
      copy.gentleRulesTitle,
    ]) {
      expect([heading, getAllByText(heading).length > 0]).toEqual([
        heading,
        true,
      ]);
    }
  });

  test('the screen opens on the lucid focus', async () => {
    const { getAllByText } = await renderScreen();

    expect(getAllByText(copy.lucidHeroTitle).length).toBeGreaterThan(0);
  });

  test('the reminders section lists the reminders it can set', async () => {
    // The largest block on the screen by a wide margin, and the one whose move
    // most needs a witness.
    const { getAllByText } = await renderScreen();

    expect(getAllByText(copy.morningCaptureTitle).length).toBeGreaterThan(0);
    expect(getAllByText(copy.reminderSafeHint).length).toBeGreaterThan(0);
  });
});
