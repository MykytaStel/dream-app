import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeListHeader } from '../src/features/dreams/components/home/HomeListHeader';
import { createHomeScreenStyles } from '../src/features/dreams/screens/HomeScreen.styles';
import { getDreamCopy } from '../src/constants/copy/dreams';
import { themes } from '../src/theme/theme';

const copy = getDreamCopy('en');
const styles = createHomeScreenStyles(themes.kaleidoscope);

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderHeader(
  overrides: Partial<React.ComponentProps<typeof HomeListHeader>> = {},
): ReturnType<typeof render> {
  const props: React.ComponentProps<typeof HomeListHeader> = {
    copy,
    styles,
    recentDreamCount: 3,
    activeDreamCount: 4,
    archiveActionLabel: 'Open full archive',
    revisitCue: null,
    onOpenRevisitDream: jest.fn(),
    onOpenArchive: jest.fn(),
    ...overrides,
  };

  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <HomeListHeader {...props} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('home list header', () => {
  test('shows the focused recent-dream header and full Archive action', () => {
    const { getByText } = renderHeader();

    expect(getByText(copy.homeSectionLabel)).toBeTruthy();
    expect(getByText(copy.homeRecentLimitHint)).toBeTruthy();
    expect(getByText('Open full archive')).toBeTruthy();
  });

  test('opens Archive from the explicit action', () => {
    const onOpenArchive = jest.fn();
    const { getByText } = renderHeader({ onOpenArchive });

    fireEvent.press(getByText('Open full archive'));

    expect(onOpenArchive).toHaveBeenCalledTimes(1);
  });

  test('hides the recent-limit explanation when all active dreams fit', () => {
    const { queryByText } = renderHeader({
      recentDreamCount: 3,
      activeDreamCount: 3,
    });

    expect(queryByText(copy.homeRecentLimitHint)).toBeNull();
  });

  test('shows the active-journal empty state when no dreams exist', () => {
    const { getByText } = renderHeader({
      recentDreamCount: 0,
      activeDreamCount: 0,
    });

    expect(getByText(copy.emptyActiveTitle)).toBeTruthy();
    expect(getByText(copy.emptyActiveDescription)).toBeTruthy();
  });

  test('does not render removed spotlight and last-viewed content', () => {
    const { queryByText } = renderHeader();

    expect(queryByText(copy.homeSpotlightPatternLabel)).toBeNull();
    expect(queryByText(copy.homeSpotlightAttentionLabel)).toBeNull();
    expect(queryByText(copy.homeLastDreamLabel)).toBeNull();
  });
});
