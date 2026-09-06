import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { themes } from '../src/theme/theme';
import { getStatsCopy } from '../src/constants/copy/stats';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
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
    rangeOptions: [
      { key: 'all', label: 'All time' },
      { key: '30d', label: '30 days' },
      { key: '7d', label: '7 days' },
    ],
    selectedRange: 'all',
    setSelectedRange: jest.fn(),
    selectedMode: 'snapshot',
    setSelectedMode: jest.fn(),
    canCompare: false,
    selectedRangeLabel: 'All time',
    compareOptions: [],
    compareMetrics: [],
    activityBars: [],
    emotionalTrendSeries: [],
    emotionalTrendInsight: '',
    lucidMetrics: [],
    lucidHistoryItems: [],
    nightmareMetrics: [],
    weeklyPatternCards: [],
    summaryTiles: [{ label: 'Total', value: 7 }],
    coverageItems: [],
    attentionItems: [],
    workQueueItems: [],
    importantDreamItems: [],
    savedSetItems: [],
    fingerprintLeadSignals: [],
    fingerprintFacets: [],
  }),
}));

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const copy = getStatsCopy('en');

function renderScreen() {
  const MemoryTrendsScreen =
    require('../src/features/stats/screens/MemoryTrendsScreen').default;
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <MemoryTrendsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('MemoryTrendsScreen', () => {
  it('renders the trend content flat, with a range control and no disclosure toggle', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText(copy.rangeLabel)).not.toBeNull();
    expect(queryByText(copy.snapshotTitle)).not.toBeNull();
    expect(queryByText(copy.detailsShow)).toBeNull();
    expect(queryByText(copy.detailsHide)).toBeNull();
    // The dream fingerprint moved to the Memory landing.
    expect(queryByText(copy.fingerprintTitle)).toBeNull();
  });
});
