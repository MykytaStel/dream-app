import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WakeEntryScreen from '../src/features/dreams/screens/WakeEntryScreen';
import { getDreamCopy } from '../src/constants/copy/dreams';
import { themes } from '../src/theme/theme';

/**
 * The wake screen offered the same action twice.
 *
 * With no draft saved, the primary card is "speak" and the row beneath it also
 * rendered a "speak" card — same label, same hint, same handler, one directly
 * under the other. Beside it, the "write" card was written as two branches,
 * `hasDraft` and `!hasDraft`, holding byte-identical JSX: thirty-five lines
 * duplicated to express "always".
 *
 * Neither is visible while reading the file, because the two speak cards are
 * ninety lines apart and the two write cards look like a deliberate
 * distinction until you diff them. It is visible immediately on the screen,
 * which is where it was found.
 *
 * This counts what the screen renders rather than inspecting the source: a
 * rewrite that reorganises the JSX should still be held to "one way to start a
 * voice capture".
 */

const copy = getDreamCopy('en');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Mocked because it calls `createNavigationContainerRef` at import time, and
// the real navigation package ships ESM that this jest config does not
// transform. Stubbing the ref module keeps the untransformable import out of
// the graph entirely, which is less fragile than widening
// transformIgnorePatterns for one screen test.
jest.mock('../src/app/navigation/navigationRef', () => ({
  openNewDreamTab: jest.fn(),
}));

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: () => ({ locale: 'en' }),
}));

const mockDraftSnapshot = {
  resumeMode: 'wake' as const,
  hasAudio: false,
  hasText: true,
  wordCount: 12,
  hasWakeSignals: false,
  hasContext: false,
  hasTags: false,
  updatedAt: Date.UTC(2026, 7, 1),
};

let mockDraft: typeof mockDraftSnapshot | null = null;

jest.mock('../src/features/dreams/services/dreamDraftService', () => ({
  getDreamDraft: () => (mockDraft ? { text: 'something' } : null),
  getDreamDraftSnapshot: () => mockDraft,
}));

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderWake() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <WakeEntryScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('wake entry actions', () => {
  beforeEach(() => {
    // No draft is the case the duplicate appeared in, so it is the default.
    mockDraft = null;
  });

  test('a voice capture is offered exactly once', async () => {
    const { getAllByText } = await renderWake();

    expect(getAllByText(copy.wakeEntrySpeakAction)).toHaveLength(1);
  });

  test('writing is offered exactly once', async () => {
    const { getAllByText } = await renderWake();

    expect(getAllByText(copy.wakeEntryWriteAction)).toHaveLength(1);
  });

  test('both ways in are still reachable without a draft', async () => {
    // The fix removes a card. This is the check that it removed the duplicate
    // and not the only route to one of the two.
    const { getByText } = await renderWake();

    expect(getByText(copy.wakeEntrySpeakAction)).toBeTruthy();
    expect(getByText(copy.wakeEntryWriteAction)).toBeTruthy();
  });

  test('with a draft, resuming it leads and speaking is still offered', async () => {
    // The other half of the condition. With a draft the primary card is the
    // draft, so the secondary speak card is the only way to start a voice
    // capture and has to stay — removing it outright would have passed every
    // test above.
    mockDraft = mockDraftSnapshot;

    const { getAllByText, getByText } = await renderWake();

    expect(getByText(copy.wakeEntryDraftAction)).toBeTruthy();
    expect(getAllByText(copy.wakeEntrySpeakAction)).toHaveLength(1);
    expect(getAllByText(copy.wakeEntryWriteAction)).toHaveLength(1);
  });
});
