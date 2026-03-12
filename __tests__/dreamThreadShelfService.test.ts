import { kv } from '../src/services/storage/mmkv';
import {
  getSavedDreamThreads,
  isDreamThreadSaved,
  reconcileSavedDreamThreads,
  toggleSavedDreamThread,
} from '../src/features/stats/services/dreamThreadShelfService';

describe('dreamThreadShelfService', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('toggles a saved thread on and off', () => {
    expect(getSavedDreamThreads()).toEqual([]);
    expect(isDreamThreadSaved('bridge', 'theme')).toBe(false);

    const added = toggleSavedDreamThread('bridge', 'theme');

    expect(added).toHaveLength(1);
    expect(added[0].signal).toBe('bridge');
    expect(added[0].kind).toBe('theme');
    expect(isDreamThreadSaved('bridge', 'theme')).toBe(true);

    const removed = toggleSavedDreamThread('bridge', 'theme');

    expect(removed).toEqual([]);
    expect(isDreamThreadSaved('bridge', 'theme')).toBe(false);
  });

  test('normalizes spacing and keeps newest saved thread first', () => {
    toggleSavedDreamThread('  bridge  ', 'theme');
    toggleSavedDreamThread('mirror', 'symbol');

    const records = getSavedDreamThreads();

    expect(records.map(item => item.signal)).toEqual(['mirror', 'bridge']);
    expect(records[1].signal).toBe('bridge');
    expect(isDreamThreadSaved('bridge', 'theme')).toBe(true);
  });

  test('treats signal case and hyphen variants as the same saved thread', () => {
    toggleSavedDreamThread('Hello-World', 'theme');

    expect(isDreamThreadSaved('hello world', 'theme')).toBe(true);

    const removed = toggleSavedDreamThread('hello world', 'theme');

    expect(removed).toEqual([]);
    expect(isDreamThreadSaved('HELLO-WORLD', 'theme')).toBe(false);
  });

  test('reconciles away saved threads that no longer match any dream', () => {
    toggleSavedDreamThread('bridge', 'theme');
    toggleSavedDreamThread('mirror', 'symbol');

    const next = reconcileSavedDreamThreads([
      {
        id: 'dream-1',
        createdAt: Date.UTC(2026, 2, 12, 8, 0),
        sleepDate: '2026-03-12',
        title: 'Bridge dream',
        tags: ['bridge'],
      },
    ]);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      signal: 'bridge',
      kind: 'theme',
    });
    expect(isDreamThreadSaved('mirror', 'symbol')).toBe(false);
  });
});
