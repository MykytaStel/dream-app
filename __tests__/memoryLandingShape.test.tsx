import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { themes } from '../src/theme/theme';
import { getStatsCopy } from '../src/constants/copy/stats';
import { useStatsScreenController } from '../src/features/stats/hooks/useStatsScreenController';
import { getPrimaryMemoryPattern } from '../src/features/stats/model/memoryPattern';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn(), navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(() => {
      effect();
    }, []);
  },
}));

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: () => ({ locale: 'en' }),
}));

jest.mock('../src/features/stats/hooks/useStatsScreenController');
jest.mock('../src/features/stats/model/memoryPattern', () => ({
  ...jest.requireActual('../src/features/stats/model/memoryPattern'),
  getPrimaryMemoryPattern: jest.fn(),
}));

const controllerMock = useStatsScreenController as unknown as jest.Mock;
const patternMock = getPrimaryMemoryPattern as unknown as jest.Mock;

function controller(overrides: Record<string, unknown> = {}) {
  return {
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
    rangeOptions: [{ key: 'all', label: 'All time' }],
    selectedRange: 'all',
    setSelectedRange: jest.fn(),
    selectedMode: 'snapshot',
    setSelectedMode: jest.fn(),
    memoryNudge: null,
    nightmareCount: 0,
    ...overrides,
  } as any;
}

const nudge = {
  dreamId: 'd1',
  dreamTitle: 'Glass hallway',
  reason: 'Theme still pulling focus.',
  badgeLabel: 'Theme',
  actionLabel: 'Open dream',
  focusSection: 'reflection' as const,
  icon: 'sparkles-outline',
};

const pattern = {
  key: 'theme:kaleidoscope',
  signal: 'kaleidoscope',
  kind: 'theme' as const,
  displayTitle: 'Kaleidoscope',
  dreamCount: 12,
  confirmed: false,
  evidence: [],
};

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

beforeEach(() => {
  mockNavigate.mockClear();
  controllerMock.mockReturnValue(controller());
  patternMock.mockReturnValue(null);
});

describe('Memory landing shape', () => {
  it('has no Section segmented control and no Range chips', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText(copy.memoryModeThreads)).toBeNull();
    expect(queryByText(copy.rangeLabel)).toBeNull();
    expect(queryByText(copy.range7Days)).toBeNull();
  });

  it('offers Monthly and Trends as link rows', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText(copy.memoryModeMonthly));
    expect(mockNavigate).toHaveBeenCalledWith('MonthlyReport');

    await fireEvent.press(getByText(copy.memoryTrendsTitle));
    expect(mockNavigate).toHaveBeenCalledWith('MemoryTrends');
  });

  it('shows the revisit nudge when there is no confirmed pattern', async () => {
    patternMock.mockReturnValue(null);
    controllerMock.mockReturnValue(controller({ memoryNudge: nudge }));

    const { getByText, queryByText } = await renderScreen();
    expect(queryByText('Glass hallway')).not.toBeNull();
    expect(queryByText(copy.memoryNudgeLabel)).not.toBeNull();

    await fireEvent.press(getByText('Open dream'));
    expect(mockNavigate).toHaveBeenCalledWith(
      'DreamDetail',
      expect.objectContaining({ dreamId: 'd1', source: 'stats' }),
    );
  });

  it('shows the pattern card, not the nudge, when a pattern is present', async () => {
    patternMock.mockReturnValue(pattern as any);
    controllerMock.mockReturnValue(controller({ memoryNudge: nudge }));

    const { queryByText } = await renderScreen();
    expect(queryByText('Glass hallway')).toBeNull();
    expect(queryByText('Kaleidoscope')).not.toBeNull();
  });
});
