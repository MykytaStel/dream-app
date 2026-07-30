import { runStorageMigrations } from '../src/services/storage/migrations';
import {
  DREAMS_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';

/**
 * The dream archive is the product. A migration may refuse to run, but it may
 * never destroy what it could not read: unreadable is recoverable, overwritten
 * is not.
 */
describe('storage migrations must not destroy unreadable dreams', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('keeps the raw value when the stored dreams cannot be parsed', () => {
    // A truncated write — the shape a crash or a full disk leaves behind.
    const corrupted = '[{"id":"dream-1","title":"The glass oce';
    kv.set(DREAMS_STORAGE_KEY, corrupted);

    runStorageMigrations();

    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(corrupted);
  });

  test('keeps the raw value when the stored dreams are not an array', () => {
    const unexpected = JSON.stringify({ dreams: [{ id: 'dream-1' }] });
    kv.set(DREAMS_STORAGE_KEY, unexpected);

    runStorageMigrations();

    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(unexpected);
  });

  test('does not advance the schema version past a failed dream migration', () => {
    kv.set(DREAMS_STORAGE_KEY, '{ not json at all');

    runStorageMigrations();

    // Advancing would mean the next launch skips the migration entirely and
    // treats the unreadable value as already migrated.
    expect(kv.getNumber(STORAGE_SCHEMA_VERSION_KEY)).toBeUndefined();
  });

  test('still migrates normally when the stored dreams are readable', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        { id: 'dream-1', createdAt: 1710000000000, title: 'Readable' },
      ]),
    );

    runStorageMigrations();

    const stored = JSON.parse(kv.getString(DREAMS_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('dream-1');
  });
});
