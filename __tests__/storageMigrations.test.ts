import { runStorageMigrations } from '../src/services/storage/migrations';
import {
  APP_LOCALE_KEY,
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAMS_STORAGE_KEY,
  REMINDER_SETTINGS_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';

describe('storage migrations', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('migrates legacy dreams and keeps sorted normalized data', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'old-1',
          createdAt: 1710000000000,
          sleepDate: '2026-03-05',
          title: '  Night Bridge  ',
          tags: ['  Bridge ', 'bridge', 'night walk'],
          preSleep: { stress: 4, alcohol: true, majorEvent: ' Late exam ' },
        },
        {
          id: 'old-2',
          createdAt: 1710001000000,
          sleepDate: 'invalid-date',
          text: '  Raw note ',
          tags: [' City '],
          sleepContext: { caffeineLate: true, medications: '  melatonin  ' },
        },
      ]),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 1);

    runStorageMigrations();

    const raw = kv.getString(DREAMS_STORAGE_KEY);
    expect(raw).toBeDefined();
    const migrated = JSON.parse(raw ?? '[]') as Array<Record<string, unknown>>;
    expect(migrated).toHaveLength(2);

    expect(migrated[0].id).toBe('old-1');
    expect(migrated[0].tags).toEqual(['bridge', 'night-walk']);
    expect(migrated[0].title).toBe('Night Bridge');
    expect(migrated[0].sleepContext).toEqual({
      stressLevel: 3,
      alcoholTaken: true,
      importantEvents: 'Late exam',
    });

    expect(migrated[1].id).toBe('old-2');
    expect(migrated[1].text).toBe('Raw note');
    expect(migrated[1].tags).toEqual(['city']);
    expect(typeof migrated[1].sleepDate).toBe('string');
    expect((migrated[1].sleepDate as string)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('migrates locale and reminder settings', () => {
    kv.set(APP_LOCALE_KEY, 'uk-UA');
    kv.set(
      REMINDER_SETTINGS_KEY,
      JSON.stringify({
        enabled: 1,
        time: '08:45',
      }),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 1);

    runStorageMigrations();

    expect(kv.getString(APP_LOCALE_KEY)).toBe('uk');
    expect(JSON.parse(kv.getString(REMINDER_SETTINGS_KEY) ?? '{}')).toEqual({
      enabled: true,
      hour: 8,
      minute: 45,
    });
    expect(kv.getNumber(STORAGE_SCHEMA_VERSION_KEY)).toBe(CURRENT_STORAGE_SCHEMA_VERSION);
  });

  test('is idempotent when already on latest schema version', () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, CURRENT_STORAGE_SCHEMA_VERSION);
    kv.set(APP_LOCALE_KEY, 'en');

    const result = runStorageMigrations();

    expect(result).toBe(CURRENT_STORAGE_SCHEMA_VERSION);
    expect(kv.getString(APP_LOCALE_KEY)).toBe('en');
  });
});
