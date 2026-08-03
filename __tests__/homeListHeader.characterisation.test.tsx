import React from 'react';
import { render } from '@testing-library/react-native';
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

function renderHeader(overrides?: Record<string, unknown>) {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <HomeListHeader
          copy={copy}
          styles={styles}
          visibleDreamCount={4}
          archiveScopedCount={4}
          lastViewedDreamTitle="Ocean room"
          lastViewedDreamMeta="Yesterday"
          onOpenLastDream={jest.fn()}
          spotlightPattern="stairs"
          spotlightPatternKind="word"
          spotlightCountLabel="in 3 dreams"
          revisitCue={null}
          attentionValue="1 voice note"
          attentionHint="Transcripts would make them easier to revisit."
          onOpenRevisitDream={jest.fn()}
          onOpenPatternDetail={jest.fn()}
          {...overrides}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('home list header', () => {
  test('shows one data-led return reason before the timeline', () => {
    const { getByText } = renderHeader();

    expect(getByText('stairs')).toBeTruthy();
    expect(getByText('1 voice note')).toBeTruthy();
    expect(getByText(copy.homeSectionLabel)).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
  });

  test('a spotlight signal suppresses the last-viewed shortcut', () => {
    const { queryByText } = renderHeader();

    expect(queryByText(copy.homeLastDreamLabel)).toBeNull();
    expect(queryByText('Ocean room')).toBeNull();
  });

  test('falls back to the last-viewed dream when no spotlight signal exists', () => {
    const { getByText, queryByText } = renderHeader({
      spotlightPattern: '',
      spotlightPatternKind: null,
      attentionValue: copy.homeSpotlightAttentionClear,
      attentionHint: '',
    });

    expect(getByText(copy.homeLastDreamLabel)).toBeTruthy();
    expect(getByText('Ocean room')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    expect(queryByText('stairs')).toBeNull();
  });

  test('does not render legacy browsing and practice controls', () => {
    const { queryByText } = renderHeader({
      practiceShortcutTitle: 'Practice lucidity',
      onOpenPractice: jest.fn(),
      nightmareShortcutTitle: 'After a nightmare',
      onOpenNightmarePractice: jest.fn(),
      weeklyPatternCards: [
        {
          key: 'rhythm',
          label: 'RHYTHM',
          title: '3 entries this week',
          hint: '+1 vs previous 7 days',
        },
      ],
      sortOptions: [
        { key: 'newest', label: 'Newest first' },
        { key: 'oldest', label: 'Oldest first' },
      ],
    });

    expect(queryByText('Practice lucidity')).toBeNull();
    expect(queryByText('After a nightmare')).toBeNull();
    expect(queryByText('RHYTHM')).toBeNull();
    expect(queryByText('Newest first')).toBeNull();
    expect(queryByText('Oldest first')).toBeNull();
  });

  test('shows the active-journal empty state when no dreams exist', () => {
    const { getByText, queryByText } = renderHeader({
      visibleDreamCount: 0,
      archiveScopedCount: 0,
      lastViewedDreamTitle: null,
      onOpenLastDream: null,
      spotlightPattern: '',
      spotlightPatternKind: null,
      attentionValue: copy.homeSpotlightAttentionClear,
      attentionHint: '',
    });

    expect(getByText(copy.emptyActiveTitle)).toBeTruthy();
    expect(getByText(copy.emptyActiveDescription)).toBeTruthy();
    expect(queryByText('4')).toBeNull();
  });
});
