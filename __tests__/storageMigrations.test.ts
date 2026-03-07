import { runStorageMigrations } from '../src/services/storage/migrations';
import {
  APP_LOCALE_KEY,
  CURRENT_STORAGE_SCHEMA_VERSION,
  DREAM_ANALYSIS_SETTINGS_KEY,
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

  test('migrates transcript fields into schema v3 and normalizes stale processing state', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'voice-1',
          createdAt: 1710000000000,
          sleepDate: '2026-03-05',
          audioUri: 'file:///voice.m4a',
          transcript: '  Echoes in a station hall  ',
          transcriptStatus: 'ready',
          transcriptUpdatedAt: 1710000005000,
          tags: ['station'],
        },
        {
          id: 'voice-2',
          createdAt: 1710001000000,
          sleepDate: '2026-03-04',
          audioUri: 'file:///voice-2.m4a',
          transcriptStatus: 'processing',
          transcriptUpdatedAt: Date.now() - 1000 * 60 * 20,
          tags: [],
        },
      ]),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 2);

    runStorageMigrations();

    const migrated = JSON.parse(kv.getString(DREAMS_STORAGE_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(migrated[0]).toMatchObject({
      id: 'voice-1',
      transcript: 'Echoes in a station hall',
      transcriptStatus: 'ready',
      transcriptSource: 'generated',
    });
    expect(migrated[1]).toMatchObject({
      id: 'voice-2',
      transcriptStatus: 'error',
    });
  });

  test('migrates transcript source into schema v4 and infers generated source for legacy audio transcripts', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'voice-legacy',
          createdAt: 1710000000000,
          sleepDate: '2026-03-05',
          audioUri: 'file:///voice.m4a',
          transcript: '  Existing transcript  ',
          tags: [],
        },
        {
          id: 'text-edited',
          createdAt: 1710001000000,
          sleepDate: '2026-03-04',
          transcript: '  Manual transcript only  ',
          transcriptSource: 'edited',
          tags: [],
        },
      ]),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 3);

    runStorageMigrations();

    const migrated = JSON.parse(kv.getString(DREAMS_STORAGE_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(migrated[0]).toMatchObject({
      id: 'voice-legacy',
      transcript: 'Existing transcript',
      transcriptSource: 'generated',
    });
    expect(migrated[1]).toMatchObject({
      id: 'text-edited',
      transcript: 'Manual transcript only',
      transcriptSource: 'edited',
    });
  });

  test('migrates analysis record and analysis settings into schema v5', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'analysis-legacy',
          createdAt: 1710000000000,
          sleepDate: '2026-03-05',
          text: 'Dream body',
          tags: [],
          analysis: {
            provider: 'openai',
            status: 'ready',
            summary: '  Repeating fear of missing the train  ',
            themes: [' train ', 'Train', 'delay'],
            generatedAt: 1710000005000,
          },
        },
      ]),
    );
    kv.set(
      DREAM_ANALYSIS_SETTINGS_KEY,
      JSON.stringify({
        enabled: 1,
        provider: 'openai',
        allowNetwork: 0,
      }),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 4);

    runStorageMigrations();

    const migrated = JSON.parse(kv.getString(DREAMS_STORAGE_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(migrated[0]).toMatchObject({
      id: 'analysis-legacy',
      analysis: {
        provider: 'openai',
        status: 'ready',
        summary: 'Repeating fear of missing the train',
        themes: ['train', 'delay'],
        generatedAt: 1710000005000,
      },
    });
    expect(JSON.parse(kv.getString(DREAM_ANALYSIS_SETTINGS_KEY) ?? '{}')).toEqual({
      enabled: true,
      provider: 'openai',
      allowNetwork: false,
    });
  });

  test('migrates starred dreams into schema v6', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'starred-legacy',
          createdAt: 1710000000000,
          sleepDate: '2026-03-05',
          text: 'Saved dream',
          starredAt: 1710000005000,
          tags: [],
        },
      ]),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 5);

    runStorageMigrations();

    const migrated = JSON.parse(kv.getString(DREAMS_STORAGE_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(migrated[0]).toMatchObject({
      id: 'starred-legacy',
      starredAt: 1710000005000,
    });
  });

  test('migrates wake and pre-sleep emotions into schema v7', () => {
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'emotion-legacy',
          createdAt: 1710000000000,
          sleepDate: '2026-03-05',
          text: 'Saved dream',
          wakeEmotions: ['calm', 'calm', 'curious', 'unknown'],
          sleepContext: {
            preSleepEmotions: ['restless', 'hopeful', 'restless', 'invalid'],
          },
          tags: [],
        },
      ]),
    );
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 6);

    runStorageMigrations();

    const migrated = JSON.parse(kv.getString(DREAMS_STORAGE_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(migrated[0]).toMatchObject({
      id: 'emotion-legacy',
      wakeEmotions: ['calm', 'curious'],
      sleepContext: {
        preSleepEmotions: ['restless', 'hopeful'],
      },
    });
  });

  test('is idempotent when already on latest schema version', () => {
    kv.set(STORAGE_SCHEMA_VERSION_KEY, CURRENT_STORAGE_SCHEMA_VERSION);
    kv.set(APP_LOCALE_KEY, 'en');

    const result = runStorageMigrations();

    expect(result).toBe(CURRENT_STORAGE_SCHEMA_VERSION);
    expect(kv.getString(APP_LOCALE_KEY)).toBe('en');
  });
});
