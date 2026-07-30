import {
  applyArchiveStatusFilter,
  buildCalendarCells,
  buildCalendarRows,
  formatArchiveActiveDaysCount,
  formatArchiveEntryCount,
  getAvailableMonthKeys,
  getDistinctDayCount,
  getMonthKey,
  getMonthKeyForDate,
  getQuickJumpMonthKeys,
  getTopArchiveTags,
  searchArchiveMonthDreams,
  toLocalDateKey,
} from '../src/features/dreams/model/archiveBrowser';
import { Dream } from '../src/features/dreams/model/dream';

function dream(overrides: Partial<Dream> & { id: string }): Dream {
  return {
    createdAt: Date.parse('2026-03-15T09:00:00'),
    tags: [],
    ...overrides,
  };
}

describe('date keys', () => {
  test('a local date key keeps the local day, not the UTC one', () => {
    // Late evening is already tomorrow in UTC at positive offsets, but the
    // archive groups by the day the dreamer actually lived.
    const lateEvening = new Date(2026, 2, 15, 23, 30);

    expect(toLocalDateKey(lateEvening)).toBe('2026-03-15');
  });

  test('month keys pad single digit months', () => {
    expect(getMonthKeyForDate(new Date(2026, 0, 5))).toBe('2026-01');
    expect(getMonthKeyForDate(new Date(2026, 11, 5))).toBe('2026-12');
  });

  test('a dream is filed under its sleep date, not its creation time', () => {
    const recorded = dream({
      id: 'd1',
      createdAt: Date.parse('2026-04-02T07:00:00'),
      sleepDate: '2026-03-31',
    });

    expect(getMonthKey(recorded)).toBe('2026-03');
  });

  test('available months are listed newest first, without duplicates', () => {
    const dreams = [
      dream({ id: 'a', sleepDate: '2026-01-10' }),
      dream({ id: 'b', sleepDate: '2026-03-02' }),
      dream({ id: 'c', sleepDate: '2026-01-22' }),
    ];

    expect(getAvailableMonthKeys(dreams)).toEqual(['2026-03', '2026-01']);
  });

  test('distinct days count days, not entries', () => {
    const dreams = [
      dream({ id: 'a', sleepDate: '2026-03-01' }),
      dream({ id: 'b', sleepDate: '2026-03-01' }),
      dream({ id: 'c', sleepDate: '2026-03-02' }),
    ];

    expect(getDistinctDayCount(dreams)).toBe(2);
  });
});

describe('counts read naturally in both languages', () => {
  test.each([
    [1, '1 entry'],
    [2, '2 entries'],
    [11, '11 entries'],
  ])('English: %i', (count, expected) => {
    expect(formatArchiveEntryCount(count, 'en')).toBe(expected);
  });

  // Ukrainian picks one of three forms. The 11-14 range is where naive
  // implementations break: 11 takes the same form as 5, not as 1.
  test.each([
    [1, '1 запис'],
    [2, '2 записи'],
    [4, '4 записи'],
    [5, '5 записів'],
    [11, '11 записів'],
    [12, '12 записів'],
    [14, '14 записів'],
    [21, '21 запис'],
    [22, '22 записи'],
    [25, '25 записів'],
    [111, '111 записів'],
    [0, '0 записів'],
  ])('Ukrainian: %i', (count, expected) => {
    expect(formatArchiveEntryCount(count, 'uk')).toBe(expected);
  });

  test('active days follow the same rules', () => {
    expect(formatArchiveActiveDaysCount(1, 'uk')).toBe('1 активний день');
    expect(formatArchiveActiveDaysCount(3, 'uk')).toBe('3 активні дні');
    expect(formatArchiveActiveDaysCount(11, 'uk')).toBe('11 активних днів');
    expect(formatArchiveActiveDaysCount(1, 'en')).toBe('1 active day');
    expect(formatArchiveActiveDaysCount(2, 'en')).toBe('2 active days');
  });
});

describe('calendar grid', () => {
  test('a month starts on the right weekday and fills whole weeks', () => {
    // 1 March 2026 is a Sunday, so a Monday-first grid needs six leading pads.
    const cells = buildCalendarCells('2026-03', []);

    expect(cells.slice(0, 6).every(cell => cell.date === null)).toBe(true);
    expect(cells[6].date).toBe('2026-03-01');
    expect(cells.length % 7).toBe(0);
  });

  test('every day of the month appears exactly once', () => {
    const days = buildCalendarCells('2026-02', []).filter(
      cell => cell.date !== null,
    );

    expect(days).toHaveLength(28);
    expect(days[0].date).toBe('2026-02-01');
    expect(days[days.length - 1].date).toBe('2026-02-28');
  });

  test('a leap February has twenty-nine days', () => {
    const days = buildCalendarCells('2024-02', []).filter(
      cell => cell.date !== null,
    );

    expect(days).toHaveLength(29);
  });

  test('cells carry the number of dreams recorded that day', () => {
    const cells = buildCalendarCells('2026-03', [
      dream({ id: 'a', sleepDate: '2026-03-05' }),
      dream({ id: 'b', sleepDate: '2026-03-05' }),
      dream({ id: 'c', sleepDate: '2026-03-06' }),
    ]);

    const byDate = new Map(cells.map(cell => [cell.date, cell.count]));
    expect(byDate.get('2026-03-05')).toBe(2);
    expect(byDate.get('2026-03-06')).toBe(1);
    expect(byDate.get('2026-03-07')).toBe(0);
  });

  test('the most frequent mood of a day wins', () => {
    const cells = buildCalendarCells('2026-03', [
      dream({ id: 'a', sleepDate: '2026-03-05', mood: 'peaceful' }),
      dream({ id: 'b', sleepDate: '2026-03-05', mood: 'peaceful' }),
      dream({ id: 'c', sleepDate: '2026-03-05', mood: 'anxious' }),
    ]);

    expect(cells.find(cell => cell.date === '2026-03-05')?.dominantMood).toBe(
      'peaceful',
    );
  });

  test('dreams from other months are ignored', () => {
    const cells = buildCalendarCells('2026-03', [
      dream({ id: 'a', sleepDate: '2026-04-05' }),
    ]);

    expect(cells.every(cell => cell.count === 0)).toBe(true);
  });

  test('rows are always seven cells wide', () => {
    const rows = buildCalendarRows(buildCalendarCells('2026-03', []));

    expect(rows.every(row => row.length === 7)).toBe(true);
  });
});

describe('quick jump window', () => {
  const months = ['2026-06', '2026-05', '2026-04', '2026-03', '2026-02'];

  test('no months means no window', () => {
    expect(getQuickJumpMonthKeys([], 0)).toEqual([]);
  });

  test('an unknown selection falls back to the newest months', () => {
    expect(getQuickJumpMonthKeys(months, -1)).toEqual(months.slice(0, 4));
  });

  test('the window always contains the selected month', () => {
    for (let index = 0; index < months.length; index += 1) {
      expect(getQuickJumpMonthKeys(months, index)).toContain(months[index]);
    }
  });

  test('the window never runs past the end', () => {
    expect(getQuickJumpMonthKeys(months, months.length - 1)).toEqual(
      months.slice(1),
    );
  });

  test('a list shorter than the window is returned whole', () => {
    expect(getQuickJumpMonthKeys(['2026-06'], 0)).toEqual(['2026-06']);
  });
});

describe('status filter', () => {
  const active = dream({ id: 'active' });
  const archived = dream({ id: 'archived', archivedAt: 1 });
  const starred = dream({ id: 'starred', starredAt: 1 });
  const all = [active, archived, starred];

  test('all keeps everything', () => {
    expect(applyArchiveStatusFilter(all, 'all')).toHaveLength(3);
  });

  test('active excludes archived entries', () => {
    expect(applyArchiveStatusFilter(all, 'active').map(d => d.id)).toEqual([
      'active',
      'starred',
    ]);
  });

  test('archived keeps only archived entries', () => {
    expect(applyArchiveStatusFilter(all, 'archived').map(d => d.id)).toEqual([
      'archived',
    ]);
  });

  test('starred keeps only starred entries', () => {
    expect(applyArchiveStatusFilter(all, 'starred').map(d => d.id)).toEqual([
      'starred',
    ]);
  });
});

describe('search within a month', () => {
  const dreams = [
    dream({
      id: 'ocean',
      sleepDate: '2026-03-01',
      title: 'Glass ocean',
      text: 'Falling slowly',
    }),
    dream({
      id: 'bridge',
      sleepDate: '2026-03-02',
      title: 'Night bridge',
      text: 'Walking across water',
    }),
  ];

  test('an empty query returns everything, newest first', () => {
    expect(searchArchiveMonthDreams(dreams, '').map(d => d.id)).toEqual([
      'bridge',
      'ocean',
    ]);
  });

  test('whitespace counts as an empty query', () => {
    expect(searchArchiveMonthDreams(dreams, '   ')).toHaveLength(2);
  });

  test('a query matches the title', () => {
    expect(searchArchiveMonthDreams(dreams, 'ocean').map(d => d.id)).toEqual([
      'ocean',
    ]);
  });

  test('matching ignores case', () => {
    expect(searchArchiveMonthDreams(dreams, 'GLASS').map(d => d.id)).toEqual([
      'ocean',
    ]);
  });

  test('a query that matches nothing returns nothing', () => {
    expect(searchArchiveMonthDreams(dreams, 'volcano')).toEqual([]);
  });
});

describe('top tags', () => {
  test('a tag seen once is not a signal', () => {
    expect(getTopArchiveTags([dream({ id: 'a', tags: ['water'] })])).toEqual(
      [],
    );
  });

  test('tags are counted across dreams regardless of case and padding', () => {
    const dreams = [
      dream({ id: 'a', tags: ['Water'] }),
      dream({ id: 'b', tags: ['  water '] }),
    ];

    const top = getTopArchiveTags(dreams);
    expect(top).toHaveLength(1);
    expect(top[0].count).toBe(2);
    expect(top[0].tag.toLowerCase()).toContain('water');
  });

  test('more frequent tags come first', () => {
    const dreams = [
      dream({ id: 'a', tags: ['water', 'flight'] }),
      dream({ id: 'b', tags: ['water', 'flight'] }),
      dream({ id: 'c', tags: ['water'] }),
    ];

    expect(getTopArchiveTags(dreams).map(entry => entry.count)).toEqual([3, 2]);
  });

  test('the limit is respected', () => {
    const dreams = [
      dream({ id: 'a', tags: ['one', 'two', 'three'] }),
      dream({ id: 'b', tags: ['one', 'two', 'three'] }),
    ];

    expect(getTopArchiveTags(dreams, 2)).toHaveLength(2);
  });

  test('blank tags are ignored', () => {
    const dreams = [
      dream({ id: 'a', tags: ['', '   '] }),
      dream({ id: 'b', tags: ['', '   '] }),
    ];

    expect(getTopArchiveTags(dreams)).toEqual([]);
  });
});
