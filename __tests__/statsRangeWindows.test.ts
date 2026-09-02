import type { Dream } from '../src/features/dreams/model/dream';
import {
  filterDreamsByRange,
  getPreviousRangeDreams,
} from '../src/features/stats/model/statsScreenModel';

/**
 * The date-window maths behind the Memory overview's period comparison.
 *
 * Both functions read the system clock, so the tests freeze it. The current
 * window is the last `N` days including today; the previous window is the `N`
 * days immediately before that, with no overlap and no gap.
 */

function dreamOn(id: string, sleepDate: string): Dream {
  return {
    id,
    createdAt: Date.parse(`${sleepDate}T09:00:00`),
    sleepDate,
    tags: [],
  };
}

const dreams: Dream[] = [
  dreamOn('today', '2026-08-02'),
  dreamOn('in-30d', '2026-07-20'),
  dreamOn('edge-30d', '2026-07-04'), // 29 days before today — first day still in
  dreamOn('in-prev-30d', '2026-06-15'),
  dreamOn('edge-prev-30d', '2026-06-04'), // first day of the previous window
  dreamOn('too-old', '2026-05-01'),
  dreamOn('in-7d', '2026-07-28'),
];

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('filterDreamsByRange', () => {
  it('returns everything for the all range', () => {
    expect(filterDreamsByRange(dreams, 'all')).toHaveLength(dreams.length);
  });

  it('keeps the last 30 days including the 29-day-ago edge', () => {
    const ids = filterDreamsByRange(dreams, '30d').map(d => d.id);
    expect(ids).toEqual(
      expect.arrayContaining(['today', 'in-30d', 'edge-30d', 'in-7d']),
    );
    expect(ids).not.toContain('in-prev-30d');
    expect(ids).not.toContain('too-old');
  });

  it('keeps only the last 7 days for the 7d range', () => {
    const ids = filterDreamsByRange(dreams, '7d').map(d => d.id);
    expect(ids).toEqual(expect.arrayContaining(['today', 'in-7d']));
    expect(ids).not.toContain('in-30d');
  });
});

describe('getPreviousRangeDreams', () => {
  it('is empty for the all range', () => {
    expect(getPreviousRangeDreams(dreams, 'all')).toEqual([]);
  });

  it('returns the 30 days immediately before the current window, no overlap', () => {
    const ids = getPreviousRangeDreams(dreams, '30d').map(d => d.id);
    expect(ids).toEqual(
      expect.arrayContaining(['in-prev-30d', 'edge-prev-30d']),
    );
    // current-window dreams and older-than-both dreams are excluded
    expect(ids).not.toContain('today');
    expect(ids).not.toContain('edge-30d');
    expect(ids).not.toContain('too-old');
  });
});
