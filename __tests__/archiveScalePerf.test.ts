/**
 * What the current large-journal pipelines cost on the JavaScript thread.
 *
 * The lists themselves are virtualized. This suite measures the model work
 * performed before rendering: selecting the Home recent list, scoping and
 * searching one Archive month, and calculating whole-journal statistics.
 *
 * These are V8 timings from the Jest process, not Hermes device timings. The
 * suite therefore guards the shape of the work rather than a fixed frame-time
 * promise: a larger journal must not accidentally turn a linear or n log n
 * path into quadratic work.
 */

import {
  applyArchiveStatusFilter,
  buildArchiveSections,
  getAvailableMonthKeys,
  getMonthKey,
  searchArchiveMonthDreams,
} from '../src/features/dreams/model/archiveBrowser';
import {
  getMoodCorrelationStats,
  getNightmareStats,
  getSleepContextStats,
} from '../src/features/dreams/model/dreamAnalytics';
import {
  isDreamArchived,
  sortDreamsNewestFirst,
} from '../src/features/dreams/model/dreamList';
import type { Dream } from '../src/features/dreams/model/dream';

const captured: Dream[][] = [];

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  listDreams: () => [],
  replaceAllDreams: (dreams: Dream[]) => {
    captured.push(dreams);
  },
}));

// Imported after the mock so the repository it closes over is the fake one.
// Reusing the app's seed generator keeps the benchmark aligned with the real
// Dream shape rather than a hand-written approximation.
const {
  seedDreamSamples,
} = require('../src/features/dreams/services/dreamSeedService');

function makeDreams(count: number): Dream[] {
  captured.length = 0;
  seedDreamSamples(count);
  return captured[0];
}

/**
 * Measure a batch large enough to rise above scheduler and timer noise, then
 * keep the fastest repeated sample because interference can only slow a run.
 */
const MIN_BATCH_MS = 4;
const MAX_BATCH = 512;

function elapsedMs(run: () => unknown, times: number): number {
  const startedAt = process.hrtime.bigint();
  for (let i = 0; i < times; i += 1) {
    run();
  }
  return Number(process.hrtime.bigint() - startedAt) / 1e6;
}

function fastestMs(run: () => unknown, iterations = 7): number {
  for (let i = 0; i < 3; i += 1) {
    run();
  }

  let batch = 1;
  while (batch < MAX_BATCH && elapsedMs(run, batch) < MIN_BATCH_MS) {
    batch *= 2;
  }

  let fastest = Infinity;
  for (let i = 0; i < iterations; i += 1) {
    fastest = Math.min(fastest, elapsedMs(run, batch) / batch);
  }

  return fastest;
}

const measurements: Array<{ stage: string; size: number; ms: number }> = [];

function measure(stage: string, size: number, run: () => unknown): number {
  const ms = fastestMs(run);
  measurements.push({ stage, size, ms });
  return ms;
}

const FRAME_BUDGET_MS = 16.7;
const PROBE_SIZE = 5000;

function buildHomeRecentList(dreams: Dream[]) {
  return sortDreamsNewestFirst(
    dreams.filter(dream => !isDreamArchived(dream)),
  ).slice(0, 12);
}

describe('journal pipelines at scale', () => {
  const sizes = [250, 1000, PROBE_SIZE];

  describe.each(sizes)('%i dreams', size => {
    const dreams = makeDreams(size);

    test('the seed spans enough months to be a real archive', () => {
      expect(dreams).toHaveLength(size);
      expect(getAvailableMonthKeys(dreams).length).toBeGreaterThan(
        size >= 1000 ? 12 : 3,
      );
    });

    test('Home builds its bounded recent list', () => {
      const ms = measure('home recent list', size, () =>
        buildHomeRecentList(dreams),
      );

      expect(ms).toBeGreaterThan(0);
      expect(buildHomeRecentList(dreams).length).toBeLessThanOrEqual(12);
    });

    test('Archive scopes one month and builds its sections', () => {
      const monthKey = getAvailableMonthKeys(dreams)[0];

      const ms = measure('archive month + sections', size, () => {
        const scoped = applyArchiveStatusFilter(dreams, 'archived');
        const monthDreams = scoped.filter(
          dream => getMonthKey(dream) === monthKey,
        );
        const searched = searchArchiveMonthDreams(monthDreams, '');
        return buildArchiveSections(searched, monthKey, 'en-US', null);
      });

      expect(ms).toBeGreaterThan(0);
    });

    test('Stats aggregate the whole journal', () => {
      const ms = measure('stats aggregates', size, () => {
        getMoodCorrelationStats(dreams);
        getSleepContextStats(dreams);
        getNightmareStats(dreams);
      });

      expect(ms).toBeGreaterThan(0);
    });
  });

  test('measured stages do not change complexity class', () => {
    const stages = [...new Set(measurements.map(entry => entry.stage))];

    for (const stage of stages) {
      const small = measurements.find(
        entry => entry.stage === stage && entry.size === 250,
      )!;
      const large = measurements.find(
        entry => entry.stage === stage && entry.size === PROBE_SIZE,
      )!;

      // Very small measurements remain ratio-sensitive even with batching.
      if (small.ms < 0.1) {
        continue;
      }

      // The input grows 20x. A 60x allowance catches a complexity regression
      // without turning shared-runner noise into a flaky build.
      const growth = large.ms / small.ms;
      expect([stage, growth < 60]).toEqual([stage, true]);
    }
  });

  afterAll(() => {
    const rows = measurements
      .map(({ stage, size, ms }) => {
        const frames = (ms / FRAME_BUDGET_MS).toFixed(2);
        return (
          `  ${String(size).padStart(5)} dreams  ${ms.toFixed(2).padStart(7)} ms  ` +
          `${frames.padStart(5)} frame  ${stage}`
        );
      })
      .join('\n');

    console.log(
      `\nJS-thread cost by journal size (V8 here, not Hermes on a phone).\n` +
        `Reported, not used as a device frame-time promise.\n${rows}\n`,
    );
  });
});
