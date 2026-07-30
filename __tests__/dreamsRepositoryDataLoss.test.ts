import {
  listDreams,
  saveDream,
} from '../src/features/dreams/repository/dreamsRepository';
import { DREAMS_STORAGE_KEY } from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';

/**
 * listDreams returns an empty array when the store cannot be parsed. That is
 * fine for reading — the screen can show nothing — but it must never turn into
 * a write, because saving then replaces the whole archive with one dream.
 */
describe('dreams repository must not overwrite an unreadable store', () => {
  const CORRUPTED = '[{"id":"dream-1","title":"The glass oce';

  beforeEach(() => {
    kv.clearAll();
  });

  test('reading an unreadable store yields nothing rather than throwing', () => {
    kv.set(DREAMS_STORAGE_KEY, CORRUPTED);

    expect(listDreams()).toEqual([]);
  });

  test('saving refuses while the store is unreadable', () => {
    kv.set(DREAMS_STORAGE_KEY, CORRUPTED);

    expect(() =>
      saveDream({
        id: 'dream-2',
        createdAt: Date.now(),
        title: 'A new dream',
        text: 'Something happened',
        tags: [],
      }),
    ).toThrow();
  });

  test('the unreadable value survives an attempted save', () => {
    kv.set(DREAMS_STORAGE_KEY, CORRUPTED);

    try {
      saveDream({
        id: 'dream-2',
        createdAt: Date.now(),
        title: 'A new dream',
        text: 'Something happened',
        tags: [],
      });
    } catch {
      // The throw is the point of the previous test; here we check the bytes.
    }

    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(CORRUPTED);
  });

  test('saving works normally once the store is readable', () => {
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));

    saveDream({
      id: 'dream-3',
      createdAt: Date.now(),
      title: 'A readable dream',
      text: 'Something happened',
      tags: [],
    });

    expect(listDreams().map(dream => dream.id)).toEqual(['dream-3']);
  });

  test('a store that recovers stops blocking saves', () => {
    kv.set(DREAMS_STORAGE_KEY, CORRUPTED);
    listDreams();

    // The user restores a backup, or the value is repaired some other way.
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([]));

    expect(() =>
      saveDream({
        id: 'dream-4',
        createdAt: Date.now(),
        title: 'After recovery',
        text: 'Something happened',
        tags: [],
      }),
    ).not.toThrow();
  });
});
