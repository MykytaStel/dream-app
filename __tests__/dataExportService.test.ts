jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  ExternalDirectoryPath: '/external',
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

import RNFS from 'react-native-fs';
import {
  APP_LOCALE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  REMINDER_SETTINGS_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import {
  buildDreamExportSnapshot,
  createDreamExportFileName,
  DREAM_EXPORT_VERSION,
  exportDreamDataSnapshot,
} from '../src/features/settings/services/dataExportService';

describe('data export service', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
  });

  test('builds a versioned export payload', () => {
    const payload = buildDreamExportSnapshot({
      exportedAt: '2026-03-06T08:00:00.000Z',
      appVersion: 'v0.0.5',
      storageSchemaVersion: 5,
      locale: 'uk',
      platform: 'ios',
      dreams: [
        {
          id: 'dream-1',
          createdAt: 1,
          sleepDate: '2026-03-06',
          tags: [],
          transcript: 'Edited transcript',
          transcriptSource: 'edited',
          analysis: {
            provider: 'manual',
            status: 'ready',
            summary: 'Pattern around unfinished travel',
            themes: ['travel', 'delay'],
            generatedAt: 2,
          },
        },
      ],
      draft: {
        title: 'Draft',
        text: 'Partial capture',
        sleepDate: '2026-03-06',
        medications: '',
        importantEvents: '',
        healthNotes: '',
        tags: [],
      },
      reminderSettings: {
        enabled: true,
        hour: 7,
        minute: 30,
      },
      analysisSettings: {
        enabled: true,
        provider: 'manual',
        allowNetwork: false,
      },
    });

    expect(payload).toEqual({
      version: DREAM_EXPORT_VERSION,
      exportedAt: '2026-03-06T08:00:00.000Z',
      appVersion: 'v0.0.5',
      platform: 'ios',
      locale: 'uk',
      storageSchemaVersion: 5,
      summary: {
        dreamCount: 1,
        archivedDreamCount: 0,
        audioDreamCount: 0,
        transcribedDreamCount: 1,
        editedTranscriptCount: 1,
        analyzedDreamCount: 1,
        draftIncluded: true,
      },
      dreams: [
        {
          id: 'dream-1',
          createdAt: 1,
          sleepDate: '2026-03-06',
          tags: [],
          transcript: 'Edited transcript',
          transcriptSource: 'edited',
          analysis: {
            provider: 'manual',
            status: 'ready',
            summary: 'Pattern around unfinished travel',
            themes: ['travel', 'delay'],
            generatedAt: 2,
          },
        },
      ],
      draft: {
        title: 'Draft',
        text: 'Partial capture',
        sleepDate: '2026-03-06',
        medications: '',
        importantEvents: '',
        healthNotes: '',
        tags: [],
      },
      reminderSettings: {
        enabled: true,
        hour: 7,
        minute: 30,
      },
      analysisSettings: {
        enabled: true,
        provider: 'manual',
        allowNetwork: false,
      },
    });
  });

  test('creates a stable export filename from timestamp', () => {
    expect(createDreamExportFileName('2026-03-06T08:00:00.000Z')).toBe(
      'kaleidoskop-export-2026-03-06T08-00-00-000Z.json',
    );
  });

  test('writes a local JSON export file with persisted data', async () => {
    kv.set(APP_LOCALE_KEY, 'en');
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'dream-2',
          createdAt: 2,
          sleepDate: '2026-03-05',
          tags: ['ocean'],
          audioUri: 'file:///dream.m4a',
          transcript: 'Blue hallway and water',
          analysis: {
            provider: 'manual',
            status: 'ready',
            summary: 'Recurring water corridor',
            themes: ['water', 'corridor'],
            generatedAt: 3,
          },
        },
      ]),
    );
    kv.set(
      REMINDER_SETTINGS_KEY,
      JSON.stringify({
        enabled: true,
        hour: 8,
        minute: 45,
      }),
    );
    kv.set(
      DREAM_ANALYSIS_SETTINGS_KEY,
      JSON.stringify({
        enabled: true,
        provider: 'openai',
        allowNetwork: false,
      }),
    );
    kv.set(
      DREAM_DRAFT_STORAGE_KEY,
      JSON.stringify({
        title: 'Half-remembered staircase',
        text: 'Blue hallway and water.',
        sleepDate: '2026-03-06',
        tags: ['stairs'],
        medications: '',
        importantEvents: '',
        healthNotes: '',
      }),
    );

    const result = await exportDreamDataSnapshot();

    expect(RNFS.mkdir).toHaveBeenCalledWith('/documents/exports');
    expect(RNFS.writeFile).toHaveBeenCalledTimes(1);
    expect(result.filePath).toMatch(/^\/documents\/exports\/kaleidoskop-export-.*\.json$/);
    expect(result.payload.version).toBe(DREAM_EXPORT_VERSION);
    expect(result.payload.appVersion).toMatch(/^v/);
    expect(result.payload.locale).toBe('en');
    expect(result.payload.summary).toEqual({
      dreamCount: 1,
      archivedDreamCount: 0,
      audioDreamCount: 1,
      transcribedDreamCount: 1,
      editedTranscriptCount: 0,
      analyzedDreamCount: 1,
      draftIncluded: true,
    });
    expect(result.payload.dreams).toEqual([
      {
        id: 'dream-2',
        createdAt: 2,
        sleepDate: '2026-03-05',
        title: undefined,
        text: undefined,
        tags: ['ocean'],
        audioUri: 'file:///dream.m4a',
        sleepContext: undefined,
        transcript: 'Blue hallway and water',
        transcriptStatus: 'ready',
        transcriptSource: 'generated',
        transcriptUpdatedAt: undefined,
        analysis: {
          provider: 'manual',
          status: 'ready',
          summary: 'Recurring water corridor',
          themes: ['water', 'corridor'],
          generatedAt: 3,
        },
      },
    ]);
    expect(result.payload.draft).toEqual({
      title: 'Half-remembered staircase',
      text: 'Blue hallway and water.',
      sleepDate: '2026-03-06',
      tags: ['stairs'],
      medications: '',
      importantEvents: '',
      healthNotes: '',
    });
    expect(result.payload.reminderSettings).toEqual({
      enabled: true,
      hour: 8,
      minute: 45,
    });
    expect(result.payload.analysisSettings).toEqual({
      enabled: true,
      provider: 'openai',
      allowNetwork: false,
    });
  });
});
