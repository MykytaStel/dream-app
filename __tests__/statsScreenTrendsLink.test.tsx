import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { themes } from '../src/theme/theme';
import { getStatsCopy } from '../src/constants/copy/stats';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn(), navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [effect]);
  },
}));

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: () => ({ locale: 'en' }),
}));

jest.mock('../src/features/stats/hooks/useStatsScreenController', () => ({
  useStatsScreenController: () => ({
    loading: false,
    loadError: null,
    meta: {
      totalCount: 25,
      activeCount: 25,
      archivedCount: 0,
      starredCount: 0,
      audioOnlyCount: 0,
      monthKeys: ['2026-09'],
    },
    scopedDreams: [{ id: 'a', createdAt: Date.now(), tags: [] }],
    rangeOptions: [
      { key: 'all', label: 'All time' },
      { key: '30d', label: '30 days' },
      { key: '7d', label: '7 days' },
    ],
    selectedRange: 'all',
    setSelectedRange: jest.fn(),
    selectedMode: 'snapshot',
    setSelectedMode: jest.fn(),
    isDetailsExpanded: false,
    setIsDetailsExpanded: jest.fn(),
    canCompare: false,
    selectedRangeLabel: 'All time',
    compareOptions: [],
    compareMetrics: [],
    activityBars: [],
    emotionalTrendSeries: [],
    emotionalTrendInsight: '',
    memoryNudge: null,
    coverageGap: null,
    nightmareCount: 0,
    nightmareMetrics: [],
    latestMonthlyReport: null,
    latestMonthlyReportTitle: '',
    monthlyReportPreviewSignals: [],
    fingerprintLeadSignals: [],
    fingerprintFacets: [],
    patternGroups: [],
    summaryTiles: [],
    weeklyPatternCards: [],
    coverageItems: [],
    attentionItems: [],
    workQueueItems: [],
    importantDreamItems: [],
    lucidHistoryItems: [],
    lucidMetrics: [],
    savedSetItems: [],
    savedThreadItems: [],
  }),
}));

jest.mock('../src/features/stats/model/memoryPattern', () => ({
  ...jest.requireActual('../src/features/stats/model/memoryPattern'),
  getPrimaryMemoryPattern: () => null,
}));

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const copy = getStatsCopy('en');

function renderScreen() {
  const StatsScreen =
    require('../src/features/stats/screens/StatsScreen').default;
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <StatsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('StatsScreen → MemoryTrends link', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('shows a Trends row instead of a Detailed-analysis toggle and navigates to MemoryTrends', async () => {
    const { queryByText, getByText } = await renderScreen();

    expect(queryByText(copy.memoryTrendsTitle)).not.toBeNull();
    expect(queryByText(copy.detailsShow)).toBeNull();
    expect(queryByText(copy.detailsHide)).toBeNull();

    fireEvent.press(getByText(copy.memoryTrendsTitle));
    expect(mockNavigate).toHaveBeenCalledWith('MemoryTrends');
  });
});
