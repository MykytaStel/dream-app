import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { themes } from '../src/theme/theme';
import { StatsOverviewSections } from '../src/features/stats/components/StatsOverviewSections';
import { getStatsCopy } from '../src/constants/copy/stats';
import { createStatsScreenStyles } from '../src/features/stats/screens/StatsScreen.styles';

const copy = getStatsCopy('en');
const styles = createStatsScreenStyles(themes.kaleidoscope);

const baseProps: React.ComponentProps<typeof StatsOverviewSections> = {
  copy,
  styles,
  fingerprintLeadSignals: [],
  fingerprintFacets: [],
  selectedMode: 'snapshot',
  onSelectMode: () => {},
  canCompare: false,
  selectedRangeLabel: copy.rangeAll,
  compareOptions: [],
  compareMetrics: [],
  activityBars: [],
  emotionalTrendSeries: [],
  emotionalTrendInsight: '',
  lucidMetrics: [],
  lucidHistoryItems: [],
  nightmareMetrics: [],
  lucidProgressTitle: 'Lucid progress',
  lucidProgressDescription: '',
  nightmareRecoveryTitle: 'Nightmare recovery',
  nightmareRecoveryDescription: '',
  weeklyPatternCards: [],
  summaryTiles: [{ label: 'Total', value: 7 }],
  coverageItems: [],
  attentionItems: [],
  workQueueItems: [],
  importantDreamItems: [],
  savedSetItems: [],
  onOpenReviewWorkspace: () => {},
  onOpenLucidDream: () => {},
  onOpenPatternDetail: () => {},
};

function wrap(node: React.ReactElement) {
  return render(
    <ThemeProvider theme={themes.kaleidoscope}>{node}</ThemeProvider>,
  );
}

describe('StatsOverviewSections disclosure', () => {
  it('hides the inner toggle and shows the snapshot content when alwaysExpanded', async () => {
    const { queryByText } = await wrap(
      <StatsOverviewSections {...baseProps} alwaysExpanded />,
    );
    expect(queryByText(copy.detailsShow)).toBeNull();
    expect(queryByText(copy.detailsHide)).toBeNull();
    expect(queryByText(copy.snapshotTitle)).not.toBeNull();
  });

  it('still renders the toggle and respects isDetailsExpanded when alwaysExpanded is absent', async () => {
    const { queryByText, rerender } = await wrap(
      <StatsOverviewSections
        {...baseProps}
        isDetailsExpanded={false}
        onToggleDetails={() => {}}
      />,
    );
    expect(queryByText(copy.detailsShow)).not.toBeNull();
    expect(queryByText(copy.snapshotTitle)).toBeNull();

    await rerender(
      <ThemeProvider theme={themes.kaleidoscope}>
        <StatsOverviewSections
          {...baseProps}
          isDetailsExpanded
          onToggleDetails={() => {}}
        />
      </ThemeProvider>,
    );
    expect(queryByText(copy.snapshotTitle)).not.toBeNull();
  });
});
