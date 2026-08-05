import {
  getHomeFeedCopy,
  getHomeFeedState,
  HOME_RECENT_DREAM_LIMIT,
  type HomeFeedItem,
} from '../src/features/dreams/model/homeFeed';

function item(
  id: string,
  createdAt: number,
  input: Partial<HomeFeedItem> = {},
): HomeFeedItem {
  return {
    id,
    createdAt,
    ...input,
  };
}

describe('homeFeed', () => {
  test('keeps only active dreams and limits Home to three recent entries', () => {
    const state = getHomeFeedState([
      item('five', 500, { sleepDate: '2026-08-05' }),
      item('four', 400, { sleepDate: '2026-08-04' }),
      item('archived', 900, {
        sleepDate: '2026-08-09',
        archivedAt: 901,
      }),
      item('three', 300, { sleepDate: '2026-08-03' }),
      item('two', 200, { sleepDate: '2026-08-02' }),
      item('one', 100, { sleepDate: '2026-08-01' }),
    ]);

    expect(HOME_RECENT_DREAM_LIMIT).toBe(3);
    expect(state.activeCount).toBe(5);
    expect(state.activeItems.map(entry => entry.id)).toEqual([
      'five',
      'four',
      'three',
      'two',
      'one',
    ]);
    expect(state.recentItems.map(entry => entry.id)).toEqual([
      'five',
      'four',
      'three',
    ]);
  });

  test('sorts by sleep date, then capture time, then id', () => {
    const state = getHomeFeedState([
      item('older-sleep', 900, { sleepDate: '2026-08-01' }),
      item('same-day-a', 200, { sleepDate: '2026-08-03' }),
      item('same-day-b', 200, { sleepDate: '2026-08-03' }),
      item('same-day-later', 300, { sleepDate: '2026-08-03' }),
    ]);

    expect(state.activeItems.map(entry => entry.id)).toEqual([
      'same-day-later',
      'same-day-b',
      'same-day-a',
      'older-sleep',
    ]);
  });

  test('does not mutate the source collection', () => {
    const source = [
      item('older', 100, { sleepDate: '2026-08-01' }),
      item('newer', 200, { sleepDate: '2026-08-02' }),
    ];

    getHomeFeedState(source);

    expect(source.map(entry => entry.id)).toEqual(['older', 'newer']);
  });

  test('provides a clear full-archive action in both locales', () => {
    expect(getHomeFeedCopy('uk').openArchiveAction).toBe(
      'Відкрити весь архів',
    );
    expect(getHomeFeedCopy('en').openArchiveAction).toBe('Open full archive');
  });
});
