import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeListHeader } from '../src/features/dreams/components/home/HomeListHeader';
import { createHomeScreenStyles } from '../src/features/dreams/screens/HomeScreen.styles';
import { getDreamCopy } from '../src/constants/copy/dreams';
import { DEFAULT_HOME_TIMELINE_FILTERS } from '../src/features/dreams/model/homeTimeline';
import { themes } from '../src/theme/theme';

/**
 * What the top of the home screen puts on the page, pinned before it is split.
 *
 * `HomeListHeader` is 883 lines, forty-four props and no test coverage. Most of
 * its length is three `useMemo` blocks that each build a whole section as a
 * value — shortcuts, spotlight, weekly patterns — which are then ordered by the
 * user's layout preferences and rendered by a single map.
 *
 * Building JSX inside a memo is what hides them: they read as data while being
 * components, so none of the three has a name you can search for, a prop list,
 * or a boundary.
 *
 * This asserts on what a reader sees, section by section, so a section that
 * becomes its own component has to keep showing the same things. The ordering
 * is pinned too, because it is the one piece of logic that stays behind.
 */

const copy = getDreamCopy('en');
const styles = createHomeScreenStyles(themes.kaleidoscope);

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const weeklyPatternCards = [
  {
    key: 'rhythm' as const,
    label: 'RHYTHM',
    title: '3 entries this week',
    hint: '+1 vs previous 7 days',
  },
];

function renderHeader(overrides?: Record<string, unknown>) {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <HomeListHeader
          copy={copy}
          styles={styles}
          timelineFilters={DEFAULT_HOME_TIMELINE_FILTERS}
          activeFilterChips={[]}
          visibleDreamCount={4}
          archiveScopedCount={4}
          searchResultsLabel="4 dreams"
          isSearchPending={false}
          isFilterMutationPending={false}
          hasSearchQuery={false}
          hasNonSearchRefinements={false}
          savedSearchPresets={[]}
          activeSearchPresetId={null}
          canSaveSearchPreset={false}
          sortOptions={[
            { key: 'newest', label: 'Newest first' },
            { key: 'oldest', label: 'Oldest first' },
          ]}
          spotlightPattern="stairs"
          spotlightPatternKind="word"
          spotlightCountLabel="in 3 dreams"
          revisitCue={null}
          weeklyPatternCards={weeklyPatternCards}
          attentionValue="1 voice note"
          attentionHint="Transcripts would make them easier to revisit."
          practiceShortcutTitle="Practice lucidity"
          practiceShortcutHint="Recall, dream signs, and awareness for tonight."
          nightmareShortcutTitle="After a nightmare"
          nightmareShortcutHint="Ground, log lightly, and rewrite when ready."
          homeLayoutPreferences={{
            preset: 'balanced',
            sectionOrder: ['shortcuts', 'spotlight', 'weeklyPatterns'],
            hiddenSections: [],
          }}
          onOpenPractice={jest.fn()}
          onOpenNightmarePractice={jest.fn()}
          onOpenRevisitDream={jest.fn()}
          onOpenPatternDetail={jest.fn()}
          onOpenFilterSheet={jest.fn()}
          onOpenHomeCustomizationSheet={jest.fn()}
          onClearFilters={jest.fn()}
          onClearSearch={jest.fn()}
          onSaveSearchPreset={jest.fn()}
          onApplySearchPreset={jest.fn()}
          onDeleteSearchPreset={jest.fn()}
          updateTimelineFilters={jest.fn()}
          {...overrides}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('home list header', () => {
  test('the shortcut section offers both practices', async () => {
    const { getByText } = await renderHeader();

    expect(getByText('Practice lucidity')).toBeTruthy();
    expect(getByText('After a nightmare')).toBeTruthy();
  });

  test('the spotlight section names the pattern and what needs attention', async () => {
    const { getByText } = await renderHeader();

    expect(getByText('stairs')).toBeTruthy();
    expect(getByText('1 voice note')).toBeTruthy();
  });

  test('the weekly patterns section shows the cards it is given', async () => {
    const { getByText } = await renderHeader();

    expect(getByText('RHYTHM')).toBeTruthy();
    expect(getByText('3 entries this week')).toBeTruthy();
  });

  test('the search and sort controls are present', async () => {
    const { getByText } = await renderHeader();

    expect(getByText('Newest first')).toBeTruthy();
    expect(getByText('Oldest first')).toBeTruthy();
  });

  test('a hidden section is not rendered', async () => {
    // The ordering is the logic that stays in the parent when the sections
    // leave, so it is pinned separately from what each section draws.
    const { queryByText } = await renderHeader({
      homeLayoutPreferences: {
        preset: 'balanced',
        sectionOrder: ['spotlight', 'weeklyPatterns'],
        hiddenSections: ['shortcuts'],
      },
    });

    expect(queryByText('Practice lucidity')).toBeNull();
    expect(queryByText('RHYTHM')).toBeTruthy();
  });
});
