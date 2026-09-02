import { renderHook } from '@testing-library/react-native';
import { useStatsOverviewContent } from '../src/features/stats/hooks/useStatsOverviewContent';
import { getStatsCopy } from '../src/constants/copy/stats';
import {
  getLucidDreamStats,
  getNightmareStats,
} from '../src/features/dreams/model/dreamAnalytics';
import type { Dream } from '../src/features/dreams/model/dream';

/**
 * The two periods the overview compares, pinned before they are merged.
 *
 * The hook computes each statistic twice — once for the selected range and once
 * for the range before it — and each of those six memos carries its own
 * hand-written empty-state object for when the screen is not in overview mode.
 * The same nine-field nightmare literal appears twice, the same five-field
 * summary twice, the same four-field lucid record twice.
 *
 * Those literals are a copy of what the model already returns for no dreams,
 * maintained by hand, and nothing compares the two. Add a field to
 * `NightmareStats` and the fallbacks are wrong in a way that only shows up as a
 * number that is quietly absent on a screen nobody is looking at closely.
 *
 * So this pins both halves: that the model's empty answer is what the fallbacks
 * claim it is, and that the hook produces it in the case the fallbacks exist
 * for.
 */

const copy = getStatsCopy('en');

function makeDream(id: string, createdAt: number, overrides?: Partial<Dream>) {
  return { id, createdAt, tags: [], ...overrides } as Dream;
}

// The dreams below are placed relative to this instant, and the hook buckets
// them into "current" and "previous" windows against the system clock. Without
// freezing the clock to the same instant the windows drift with real time, and
// on any day more than ~30 days past this the previous-period count changes.
const now = Date.UTC(2026, 7, 2, 9);
const day = 24 * 60 * 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
});

afterEach(() => {
  jest.useRealTimers();
});

const dreams: Dream[] = [
  makeDream('recent-1', now - day, { text: 'a short one', audioUri: 'a.m4a' }),
  makeDream('recent-2', now - 2 * day, { text: 'two words here' }),
  makeDream('older-1', now - 40 * day, { text: 'from before' }),
];

function render(isOverviewMode: boolean) {
  return renderHook(() =>
    useStatsOverviewContent({
      locale: 'en',
      copy,
      dreams,
      scopedDreams: dreams.slice(0, 2),
      selectedRange: '30d',
      analysisSettings: { enabled: false, provider: 'manual' },
      savedMonths: [],
      savedThreadRecords: [],
      lucidityLabels: { 0: 'none', 1: 'faint', 2: 'clear', 3: 'full' },
      wakeEmotionLabels: {},
      moodLabels: {},
      preSleepEmotionLabels: {},
      openPatternDetail: jest.fn(),
      isOverviewMode,
      isThreadsMode: false,
    } as never),
  );
}

describe('stats overview periods', () => {
  test('the model already answers for no dreams, exactly as the fallbacks claim', () => {
    // The equivalence the whole simplification rests on. If a statistic gains a
    // field and its zero value is not set here, this is what notices.
    expect(getNightmareStats([])).toEqual({
      totalDreams: 0,
      nightmareCount: 0,
      taggedCount: 0,
      derivedCount: 0,
      recurringCount: 0,
      highDistressCount: 0,
      rescriptedCount: 0,
      rate: undefined,
      latestNightmareDream: null,
    });

    expect(getLucidDreamStats([])).toEqual({
      totalDreams: 0,
      lucidCount: 0,
      rate: undefined,
      latestLucidDream: null,
    });
  });

  test('in overview mode both periods reach the comparison', async () => {
    // `compareMetrics` is where the two periods meet, so it is the observable
    // proof that each was measured against its own window.
    const { result } = await render(true);

    const byLabel = Object.fromEntries(
      result.current.compareMetrics.map(metric => [metric.label, metric]),
    );

    expect(byLabel[copy.entries]).toEqual({
      label: copy.entries,
      current: 2,
      previous: 1,
    });
    expect(result.current.nightmareCount).toBe(0);
  });

  test('outside overview mode every derived comparison reads as zero', async () => {
    // The case the hand-written fallbacks exist for. Whatever replaces them has
    // to produce the same nothing.
    const { result } = await render(false);

    for (const metric of result.current.compareMetrics) {
      if (metric.label === copy.entries) {
        continue;
      }

      expect([metric.label, metric.current, metric.previous]).toEqual([
        metric.label,
        0,
        0,
      ]);
    }

    expect(result.current.nightmareCount).toBe(0);
  });

  test('the metric groups are built from the scoped stats', async () => {
    // Added before those two memos move into their own hook. They are the
    // largest blocks in the file, and nothing was watching what they produce.
    const { result } = await render(true);

    expect(result.current.lucidMetrics.length).toBeGreaterThan(0);
    expect(result.current.nightmareMetrics.length).toBeGreaterThan(0);

    for (const metric of [
      ...result.current.lucidMetrics,
      ...result.current.nightmareMetrics,
    ]) {
      // Every metric names itself and has something to show, even when the
      // number behind it is zero.
      expect([metric.label, typeof metric.value]).toEqual([
        metric.label,
        'string',
      ]);
    }
  });

  test('the saved shelves are empty when nothing has been saved', async () => {
    const { result } = await render(true);

    expect(result.current.savedMonthItems).toEqual([]);
    expect(result.current.savedOverviewThreadItems).toEqual([]);
    expect(result.current.savedSetItems).toEqual([]);
  });

  test('outside overview mode the shelves are skipped entirely', async () => {
    const { result } = await render(false);

    expect(result.current.savedMonthItems).toEqual([]);
    expect(result.current.importantDreamItems).toEqual([]);
  });

  test('the entries row is not guarded the way the others are', async () => {
    // Found by writing the test above, not by reading the hook. Every derived
    // statistic goes through a memo that returns an empty record outside
    // overview mode, but the entries row counts `scopedDreams` directly, so it
    // reports real numbers while every row beside it reports zero.
    //
    // Recorded rather than corrected: it is only reachable if the comparison is
    // rendered outside overview mode, and changing it is a behaviour decision
    // that does not belong inside a refactor.
    const { result } = await render(false);

    const entries = result.current.compareMetrics.find(
      metric => metric.label === copy.entries,
    );

    expect(entries).toEqual({ label: copy.entries, current: 2, previous: 0 });
  });
});
