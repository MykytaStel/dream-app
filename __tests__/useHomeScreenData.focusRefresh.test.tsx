import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useHomeScreenData } from '../src/features/dreams/hooks/useHomeScreenData';

const mockListDreams = jest.fn();
const mockListDreamListItems = jest.fn();
const mockGetDreamDraft = jest.fn();
const mockGetHomeSearchPresets = jest.fn();
const mockGetLastViewedDream = jest.fn();
const mockIsLastViewedDreamFresh = jest.fn();
const mockTrackLocalSurfaceLoad = jest.fn();
let mockFocusCallback: (() => void) | null = null;

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
}));

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  listDreams: (...args: unknown[]) => mockListDreams(...args),
  listDreamListItems: (...args: unknown[]) => mockListDreamListItems(...args),
}));

jest.mock('../src/features/dreams/services/dreamDraftService', () => ({
  getDreamDraft: (...args: unknown[]) => mockGetDreamDraft(...args),
}));

jest.mock('../src/features/dreams/services/homeSearchPresetService', () => ({
  getHomeSearchPresets: (...args: unknown[]) =>
    mockGetHomeSearchPresets(...args),
}));

jest.mock('../src/features/dreams/services/lastViewedDreamService', () => ({
  getLastViewedDream: (...args: unknown[]) => mockGetLastViewedDream(...args),
  isLastViewedDreamFresh: (...args: unknown[]) =>
    mockIsLastViewedDreamFresh(...args),
}));

jest.mock('../src/services/observability/perf', () => ({
  trackLocalSurfaceLoad: (...args: unknown[]) =>
    mockTrackLocalSurfaceLoad(...args),
}));

type HomeState = ReturnType<typeof useHomeScreenData>;

let latestState: HomeState | null = null;
let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

function Harness() {
  latestState = useHomeScreenData();
  return null;
}

function state() {
  if (!latestState) {
    throw new Error('Home data hook has not rendered.');
  }

  return latestState;
}

const firstDream = {
  id: 'dream-1',
  createdAt: 1_775_000_000_000,
  sleepDate: '2026-08-03',
  title: 'First dream',
  text: 'First dream text',
};

const secondDream = {
  id: 'dream-2',
  createdAt: 1_775_000_100_000,
  sleepDate: '2026-08-03',
  title: 'Second dream',
  text: 'Second dream text',
};

function toListItem(dream: typeof firstDream) {
  return {
    id: dream.id,
    createdAt: dream.createdAt,
    sleepDate: dream.sleepDate,
    title: dream.title,
    textPreview: dream.text,
    hasAudio: false,
  };
}

describe('Home data refresh on focus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    latestState = null;
    mockFocusCallback = null;
    mockGetDreamDraft.mockReturnValue(null);
    mockGetHomeSearchPresets.mockReturnValue([]);
    mockGetLastViewedDream.mockReturnValue(null);
    mockIsLastViewedDreamFresh.mockReturnValue(false);
    mockListDreamListItems.mockReturnValue([toListItem(firstDream)]);
    mockListDreams.mockReturnValue([firstDream]);

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    renderer = null;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('re-reads storage after returning from capture or dev tools', () => {
    expect(mockFocusCallback).not.toBeNull();

    ReactTestRenderer.act(() => {
      jest.runAllTimers();
    });

    expect(state().dreamListItems).toHaveLength(1);
    expect(state().dreams).toHaveLength(1);
    expect(mockListDreamListItems).toHaveBeenCalledTimes(1);

    mockListDreamListItems.mockReturnValue([
      toListItem(secondDream),
      toListItem(firstDream),
    ]);
    mockListDreams.mockReturnValue([secondDream, firstDream]);

    ReactTestRenderer.act(() => {
      mockFocusCallback?.();
      jest.runAllTimers();
    });

    expect(mockListDreamListItems).toHaveBeenCalledTimes(2);
    expect(state().dreamListItems.map(dream => dream.id)).toEqual([
      'dream-2',
      'dream-1',
    ]);
    expect(state().dreams.map(dream => dream.id)).toEqual([
      'dream-2',
      'dream-1',
    ]);
    expect(state().loading).toBe(false);
  });
});
