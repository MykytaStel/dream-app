import { kv } from '../src/services/storage/mmkv';
import {
  getSavedDreamThreads,
  isDreamThreadSaved,
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
});
