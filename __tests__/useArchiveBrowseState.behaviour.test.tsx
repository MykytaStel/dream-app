import { act, renderHook } from '@testing-library/react-native';
import { useArchiveBrowseState } from '../src/features/dreams/hooks/useArchiveBrowseState';
import { getDreamCopy } from '../src/constants/copy/dreams';
import type { Dream } from '../src/features/dreams/model/dream';

/**
 * The state behind the archive screen, which had no tests at all.
 *
 * It is 435 lines deciding what the user sees — which month, which filters,
 * what survives them — and it is also the reason the archive is fast: it
 * narrows to one month before it searches or filters anything, so its cost
 * tracks the size of a month rather than the size of the archive
 * (`__tests__/archiveScalePerf.test.ts` measures that).
 *
 * Both of those make it worth pinning. The narrowing is a performance property
 * that a well-meaning refactor could lift out without changing a single
 * rendered pixel, and the filter interactions are the kind of thing that is
 * obvious while writing and surprising a month later.
 *
 * react-native-testing-library 14 renders asynchronously: renderHook returns a
 * promise, and anything that sets state goes through `act`.
 */

const copy = getDreamCopy('en');

function at(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 9, 0).getTime();
}

type DreamOverrides = Partial<Dream> & { id: string; createdAt: number };

/**
 * Archived by default, because the screen is.
 *
 * `DEFAULT_ARCHIVE_FILTER` is `archived`, so a dream without `archivedAt` is
 * invisible on arrival — which is correct, and confusing enough in a test
 * fixture to be worth stating once here rather than debugging three times.
 */
function makeDream({ id, createdAt, ...rest }: DreamOverrides): Dream {
  return {
    id,
    createdAt,
    archivedAt: createdAt,
    tags: [],
    ...rest,
  };
}

function renderArchive(dreams: Dream[]) {
  return renderHook(
    ({ items }: { items: Dream[] }) =>
      useArchiveBrowseState({ dreams: items, copy, locale: 'en' }),
    { initialProps: { dreams: [], items: dreams } as never },
  );
}

const march = makeDream({ id: 'march', createdAt: at(2026, 3, 12) });
const aprilFirst = makeDream({
  id: 'april-1',
  createdAt: at(2026, 4, 4),
  tags: ['ocean'],
});
const aprilSecond = makeDream({
  id: 'april-2',
  createdAt: at(2026, 4, 18),
  tags: ['forest'],
});

const threeMonths = [march, aprilFirst, aprilSecond];

describe('useArchiveBrowseState', () => {
  test('opens on the newest month that has anything in it', async () => {
    const { result } = await renderArchive(threeMonths);

    expect(result.current.selectedMonthKey).toBe('2026-04');
    expect(result.current.availableMonthKeys).toEqual(['2026-04', '2026-03']);
  });

  test('only the selected month is visible', async () => {
    // The narrowing that makes the screen cheap. If this ever returns all
    // three, the cost of every filter below it starts tracking the whole
    // archive instead of one month.
    const { result } = await renderArchive(threeMonths);

    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'april-2',
      'april-1',
    ]);
  });

  test('a month can be offered while showing nothing', async () => {
    // The months come from every dream, the contents from the ones the status
    // filter kept. So a month whose only dream is unarchived is still listed —
    // deliberately, since the user can switch the filter — and lands on an
    // empty screen until they do.
    const activeOnly = makeDream({
      id: 'may-active',
      createdAt: at(2026, 5, 2),
      archivedAt: undefined,
    });

    const { result } = await renderArchive([...threeMonths, activeOnly]);

    expect(result.current.availableMonthKeys).toContain('2026-05');
    expect(result.current.selectedMonthKey).toBe('2026-05');
    expect(result.current.visibleDreams).toHaveLength(0);
  });

  test('moving between months stops at both ends', async () => {
    const { result } = await renderArchive(threeMonths);

    expect(result.current.canGoNewer).toBe(false);
    expect(result.current.canGoOlder).toBe(true);

    await act(async () => result.current.moveMonth('older'));
    expect(result.current.selectedMonthKey).toBe('2026-03');
    expect(result.current.canGoOlder).toBe(false);
    expect(result.current.canGoNewer).toBe(true);

    // Asking for one past the end does nothing rather than clearing the month.
    await act(async () => result.current.moveMonth('older'));
    expect(result.current.selectedMonthKey).toBe('2026-03');
  });

  test('a day selection does not survive a change of month', async () => {
    // Otherwise the screen filters April by a date in March and shows nothing,
    // with both controls looking perfectly reasonable.
    const { result } = await renderArchive(threeMonths);

    await act(async () => result.current.selectCalendarDate('2026-04-18'));
    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'april-2',
    ]);

    await act(async () => result.current.selectMonth('2026-03'));
    expect(result.current.selectedDate).toBeNull();
    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'march',
    ]);
  });

  test('the month follows the data when the selected one empties', async () => {
    // Deleting the last dream of the open month is an ordinary thing to do,
    // and leaving the screen pointed at a month that no longer exists shows an
    // empty archive to someone who still has dreams.
    const { result, rerender } = await renderArchive(threeMonths);

    await act(async () => result.current.selectCalendarDate('2026-04-18'));
    expect(result.current.selectedMonthKey).toBe('2026-04');

    await act(async () => rerender({ items: [march] } as never));

    expect(result.current.selectedMonthKey).toBe('2026-03');
    // The day goes with it. A March screen filtered by an April date is empty
    // for a reason nothing on screen explains.
    expect(result.current.selectedDate).toBeNull();
    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'march',
    ]);
  });

  test('tapping the same tag twice clears it', async () => {
    const { result } = await renderArchive(threeMonths);

    await act(async () => result.current.selectTagFilter('ocean'));
    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'april-1',
    ]);

    await act(async () => result.current.selectTagFilter('ocean'));
    expect(result.current.tagFilter).toBeNull();
    expect(result.current.visibleDreams).toHaveLength(2);
  });

  test('tapping the same special filter twice clears it', async () => {
    const { result } = await renderArchive(threeMonths);

    await act(async () => result.current.selectSpecialFilter('lucid'));
    expect(result.current.specialFilter).toBe('lucid');

    await act(async () => result.current.selectSpecialFilter('lucid'));
    expect(result.current.specialFilter).toBe('all');
  });

  test('changing the status filter drops the refinements under it', async () => {
    // A tag or a day chosen inside "archived" usually means nothing inside
    // "starred", and leaving them applied is how a filter combination nobody
    // chose ends up showing an empty screen.
    const { result } = await renderArchive(threeMonths);

    await act(async () => result.current.selectTagFilter('ocean'));
    await act(async () => result.current.selectCalendarDate('2026-04-04'));
    await act(async () => result.current.selectSpecialFilter('lucid'));

    await act(async () => result.current.selectFilter('all'));

    expect(result.current.tagFilter).toBeNull();
    expect(result.current.selectedDate).toBeNull();
    expect(result.current.specialFilter).toBe('all');
    expect(result.current.filter).toBe('all');
  });

  test('reset clears the search box as well, and selectFilter does not', async () => {
    // The two are easy to confuse and behave differently on purpose: changing
    // a status filter keeps what the user typed, resetting the view does not.
    const { result } = await renderArchive(threeMonths);

    await act(async () => result.current.setSearchQuery('ocean'));
    await act(async () => result.current.selectFilter('all'));
    expect(result.current.searchQuery).toBe('ocean');

    await act(async () => result.current.resetArchiveView());
    expect(result.current.searchQuery).toBe('');
    expect(result.current.filter).toBe('archived');
  });

  test('a chosen day is resettable but is not a hard reset', async () => {
    // The two flags differ by exactly one term, `selectedDate`, and the
    // difference is the point: a day is undone by tapping it again on the
    // calendar that is already on screen, so it does not by itself justify
    // offering to clear everything.
    const { result } = await renderArchive(threeMonths);

    expect(result.current.hasResettableView).toBe(false);
    expect(result.current.hasHardReset).toBe(false);

    await act(async () => result.current.selectCalendarDate('2026-04-04'));

    expect(result.current.hasResettableView).toBe(true);
    expect(result.current.hasHardReset).toBe(false);

    await act(async () => result.current.selectTagFilter('ocean'));

    expect(result.current.hasHardReset).toBe(true);
  });

  test('an archive with nothing in it selects no month at all', async () => {
    const { result } = await renderArchive([]);

    expect(result.current.availableMonthKeys).toEqual([]);
    expect(result.current.selectedMonthKey).toBeNull();
    expect(result.current.visibleDreams).toHaveLength(0);
    expect(result.current.canGoOlder).toBe(false);
    expect(result.current.canGoNewer).toBe(false);
  });
});
