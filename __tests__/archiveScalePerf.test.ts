/**
 * What a large archive costs on the JavaScript thread.
 *
 * `docs/TECH-STACK.md` records FlashList as rejected until there is "measured
 * jank on a real archive, not a guess". This is the measurement, and it is
 * deliberately aimed one layer below the list: both lists are already
 * virtualized with `removeClippedSubviews` and bounded batch windows, so the
 * number of rows on screen does not grow with the archive. What does grow is
 * the pipeline that runs before the list — filtering, scoring and sorting every
 * dream — and that work happens on the JS thread, where it delays frames no
 * list component can rescue.
 *
 * Read the numbers as a floor, not as device timings. This runs on V8 on a
 * developer Mac; the app runs on Hermes on a phone, which is several times
 * slower. A stage that costs 15 ms here has already lost the 16.7 ms frame
 * budget on a real device. A stage that costs well under 1 ms here has room to
 * be several times slower and still not be the reason anything drops a frame.
 *
 * The thresholds below are ceilings that catch a change of complexity — an
 * accidental O(n²), a per-dream `JSON.parse`, a regex rebuilt inside a loop.
 * They are not targets, and they are loose enough that ordinary machine noise
 * cannot fail them.
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
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
} from '../src/features/dreams/model/homeTimeline';
import type { Dream } from '../src/features/dreams/model/dream';

const captured: Dream[][] = [];

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  listDreams: () => [],
  replaceAllDreams: (dreams: Dream[]) => {
    captured.push(dreams);
  },
}));

// Imported after the mock so the repository it closes over is the fake one.
// The app's own seed generator is reused on purpose: a benchmark against
// hand-written dreams measures whatever shape the benchmark author imagined,
// and the shape is most of the cost here.
const {
  seedDreamSamples,
} = require('../src/features/dreams/services/dreamSeedService');

function makeDreams(count: number): Dream[] {
  captured.length = 0;
  seedDreamSamples(count);
  return captured[0];
}

/**
 * The fastest of repeated runs, after a warm-up that lets the JIT settle.
 *
 * The fastest rather than the median because this suite does not run alone:
 * jest runs seventy-odd suites across parallel workers, so every sample carries
 * however much of a core it happened to get. Interference can only ever make a
 * run slower, so the minimum is the closest estimate of what the code costs,
 * and the one least moved by what else the machine is doing.
 *
 * `process.hrtime` rather than `performance.now`: under this jest environment
 * the latter is quantized to whole milliseconds, which reported every stage
 * cheaper than a millisecond as exactly `0.00` and every other one as a round
 * integer. Nanoseconds are the only resolution that can tell "fast" apart from
 * "not measured".
 */
function fastestMs(run: () => unknown, iterations = 9): number {
  for (let i = 0; i < 3; i += 1) {
    run();
  }

  let fastest = Infinity;
  for (let i = 0; i < iterations; i += 1) {
    const startedAt = process.hrtime.bigint();
    run();
    fastest = Math.min(
      fastest,
      Number(process.hrtime.bigint() - startedAt) / 1e6,
    );
  }

  return fastest;
}

const measurements: Array<{ stage: string; size: number; ms: number }> = [];

function measure(stage: string, size: number, run: () => unknown): number {
  const ms = fastestMs(run);
  measurements.push({ stage, size, ms });
  return ms;
}

/**
 * One frame at 60 Hz. Reported against, never asserted against.
 *
 * An absolute millisecond ceiling in a suite jest runs across parallel workers
 * measures how busy the machine is at least as much as it measures the code.
 * An earlier version of this file asserted one, passed on its own, and failed
 * five ways inside the full run — the worst outcome available, because a timing
 * test that fails sometimes gets muted rather than read.
 *
 * So the frame comparison lives in the log below and in `docs/TECH-STACK.md`,
 * where the numbers sit next to the decision they informed. What is asserted
 * here is only what stays true on a loaded machine: how the cost grows with the
 * archive, and how the stages compare to each other. Both are ratios measured
 * in the same worker under the same conditions, so interference cancels.
 */
const FRAME_BUDGET_MS = 16.7;

/**
 * 5000 dreams is not a person, it is a scaling probe — roughly fourteen years
 * of writing one down every night. It is here to show the shape of the curve.
 */
const PROBE_SIZE = 5000;

describe('archive at scale', () => {
  const sizes = [250, 1000, PROBE_SIZE];

  describe.each(sizes)('%i dreams', size => {
    const dreams = makeDreams(size);

    test('the seed spans enough months to be a real archive', () => {
      // Twelve hours apart, so 1000 dreams cover roughly sixteen months. If
      // this ever collapses to one month the archive numbers below stop
      // meaning anything, because the month scoping would have nothing to do.
      expect(dreams).toHaveLength(size);
      expect(getAvailableMonthKeys(dreams).length).toBeGreaterThan(
        size >= 1000 ? 12 : 3,
      );
    });

    test('the home timeline filters the whole archive', () => {
      const ms = measure('home timeline, no search', size, () =>
        applyHomeTimelineFilters(dreams, DEFAULT_HOME_TIMELINE_FILTERS),
      );

      expect(ms).toBeGreaterThan(0);
    });

    test('home search scores and re-sorts the whole archive', () => {
      // The heaviest path in the app: every dream is filtered, then scored,
      // then sorted a second time by score. It runs on each committed keystroke.
      const ms = measure('home timeline, search "ocean"', size, () =>
        applyHomeTimelineFilters(dreams, {
          ...DEFAULT_HOME_TIMELINE_FILTERS,
          searchQuery: 'ocean',
        }),
      );

      expect(ms).toBeGreaterThan(0);
    });

    test('the archive screen builds its sections', () => {
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

    test('stats aggregate the whole archive', () => {
      const ms = measure('stats aggregates', size, () => {
        getMoodCorrelationStats(dreams);
        getSleepContextStats(dreams);
        getNightmareStats(dreams);
      });

      expect(ms).toBeGreaterThan(0);
    });
  });

  test('the archive stays an order of magnitude cheaper than the timeline', () => {
    // This is the FlashList decision, written as an invariant rather than a
    // number. The archive is cheap because `useArchiveBrowseState` narrows to
    // the selected month before it searches or filters, so its cost tracks the
    // size of a month and not the size of the archive. Lose that — by hoisting
    // a filter above the month scoping, say — and this ratio collapses long
    // before anybody notices a dropped frame.
    for (const size of sizes) {
      const archive = measurements.find(
        entry =>
          entry.stage === 'archive month + sections' && entry.size === size,
      )!;
      const timeline = measurements.find(
        entry =>
          entry.stage === 'home timeline, no search' && entry.size === size,
      )!;

      expect([size, timeline.ms > archive.ms * 5]).toEqual([size, true]);
    }
  });

  test('every stage stays linear in the number of dreams', () => {
    // Twenty times the dreams must not cost far more than twenty times the
    // work. The allowance is generous — 40× for a 20× input — because it is
    // there to catch a change in complexity class, not to police constants.
    // Sub-millisecond stages are skipped: at that size the timer resolution,
    // not the algorithm, decides the ratio.
    const stages = [...new Set(measurements.map(entry => entry.stage))];

    for (const stage of stages) {
      const small = measurements.find(
        entry => entry.stage === stage && entry.size === 250,
      )!;
      const large = measurements.find(
        entry => entry.stage === stage && entry.size === PROBE_SIZE,
      )!;

      if (small.ms < 0.5) {
        continue;
      }

      // Paired with the stage name so a failure says which one changed shape,
      // rather than reporting a bare number with no way to find its owner.
      const growth = large.ms / small.ms;
      expect([stage, growth < 40]).toEqual([stage, true]);
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
      `\nJS-thread cost by archive size (V8 on this machine, not Hermes on a phone).\n` +
        `Reported, not asserted — see the note at the top of this file.\n${rows}\n`,
    );
  });
});
