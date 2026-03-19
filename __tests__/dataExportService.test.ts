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
  buildDreamReadableExportDocument,
  buildDreamExportSnapshot,
  createDreamReadableExportFileName,
  createDreamExportFileName,
  DREAM_EXPORT_VERSION,
  exportDreamReadableArchive,
  exportDreamDataSnapshot,
} from '../src/features/settings/services/dataExportService';
import { DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS } from '../src/features/reminders/services/dreamPracticeReminderService';

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
          updatedAt: 3,
          starredAt: 2,
          sleepDate: '2026-03-06',
          tags: [],
          wakeEmotions: ['calm', 'curious'],
          sleepContext: {
            preSleepEmotions: ['restless'],
          },
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
        wakeEmotions: ['calm'],
        preSleepEmotions: ['hopeful'],
        medications: '',
        importantEvents: '',
        healthNotes: '',
        tags: [],
      },
      reminderSettings: {
        enabled: true,
        hour: 7,
        minute: 30,
        style: 'balanced',
      },
      analysisSettings: {
        enabled: true,
        provider: 'manual',
        allowNetwork: false,
      },
      reviewState: {
        updatedAt: 10,
        savedMonths: [{ monthKey: '2026-03', savedAt: 9 }],
        savedThreads: [{ signal: 'bridge', kind: 'theme', savedAt: 8 }],
      },
    });

    expect(payload).toEqual({
      version: DREAM_EXPORT_VERSION,
      exportedAt: '2026-03-06T08:00:00.000Z',
      appVersion: 'v0.0.5',
      platform: 'ios',
      locale: 'uk',
      storageSchemaVersion: 5,
      practiceReminderSettings: DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS,
      summary: {
        dreamCount: 1,
        archivedDreamCount: 0,
        audioDreamCount: 0,
        transcribedDreamCount: 1,
        editedTranscriptCount: 1,
        analyzedDreamCount: 1,
        starredDreamCount: 1,
        draftIncluded: true,
      },
      dreams: [
        {
          id: 'dream-1',
          createdAt: 1,
          updatedAt: 3,
          starredAt: 2,
          sleepDate: '2026-03-06',
          tags: [],
          wakeEmotions: ['calm', 'curious'],
          sleepContext: {
            preSleepEmotions: ['restless'],
          },
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
        wakeEmotions: ['calm'],
        preSleepEmotions: ['hopeful'],
        medications: '',
        importantEvents: '',
        healthNotes: '',
        tags: [],
      },
      reminderSettings: {
        enabled: true,
        hour: 7,
        minute: 30,
        style: 'balanced',
      },
      analysisSettings: {
        enabled: true,
        provider: 'manual',
        allowNetwork: false,
      },
      reviewState: {
        updatedAt: 10,
        savedMonths: [{ monthKey: '2026-03', savedAt: 9 }],
        savedThreads: [{ signal: 'bridge', kind: 'theme', savedAt: 8 }],
      },
    });
  });

  test('creates a stable export filename from timestamp', () => {
    expect(createDreamExportFileName('2026-03-06T08:00:00.000Z')).toBe(
      'kaleidoskop-export-2026-03-06T08-00-00-000Z.json',
    );
  });

  test('creates stable readable export filenames from timestamp', () => {
    expect(createDreamReadableExportFileName('2026-03-06T08:00:00.000Z', 'markdown')).toBe(
      'kaleidoskop-dreams-2026-03-06T08-00-00-000Z.md',
    );
    expect(createDreamReadableExportFileName('2026-03-06T08:00:00.000Z', 'text')).toBe(
      'kaleidoskop-dreams-2026-03-06T08-00-00-000Z.txt',
    );
  });

  test('builds a readable markdown export with graceful audio and transcript states', () => {
    const payload = buildDreamExportSnapshot({
      exportedAt: '2026-03-06T08:00:00.000Z',
      appVersion: 'v0.0.5',
      storageSchemaVersion: 5,
      locale: 'en',
      platform: 'ios',
      dreams: [
        {
          id: 'dream-text',
          createdAt: 1,
          sleepDate: '2026-03-05',
          title: 'Blue hallway',
          text: 'Walked through a hallway of water.',
          tags: ['water', 'hallway'],
          wakeEmotions: ['curious'],
        },
        {
          id: 'dream-audio',
          createdAt: 2,
          title: 'Voice memo only',
          audioUri: 'file:///voice-only.m4a',
          transcriptStatus: 'processing',
          tags: [],
          wakeEmotions: [],
        },
        {
          id: 'dream-transcript',
          createdAt: 3,
          title: 'Transcript ready',
          audioUri: 'file:///voice-ready.m4a',
          transcript: 'A station with no exits.',
          transcriptSource: 'edited',
          transcriptUpdatedAt: 4,
          tags: [],
          wakeEmotions: [],
          analysis: {
            provider: 'manual',
            status: 'ready',
            summary: 'Recurring maze imagery.',
            themes: ['maze'],
            generatedAt: 5,
          },
        },
      ],
      draft: null,
      reminderSettings: {
        enabled: true,
        hour: 7,
        minute: 30,
        style: 'balanced',
      },
      analysisSettings: {
        enabled: true,
        provider: 'manual',
        allowNetwork: false,
      },
      reviewState: {
        updatedAt: 0,
        savedMonths: [],
        savedThreads: [],
      },
    });

    const document = buildDreamReadableExportDocument(payload, 'markdown');

    expect(document).toContain('# Dream export');
    expect(document).toContain('## Dream 1: Blue hallway');
    expect(document).toContain('- content: text');
    expect(document).toContain('### Dream text');
    expect(document).toContain('Walked through a hallway of water.');
    expect(document).toContain('## Dream 2: Voice memo only');
    expect(document).toContain('- transcript_status: processing');
    expect(document).toContain('Audio is attached. Transcript is still processing.');
    expect(document).toContain('## Dream 3: Transcript ready');
    expect(document).toContain('- transcript_source: edited');
    expect(document).toContain('### Transcript');
    expect(document).toContain('A station with no exits.');
    expect(document).toContain('#### Summary');
    expect(document).toContain('Recurring maze imagery.');
  });

  test('writes a local JSON export file with persisted data', async () => {
    kv.set(APP_LOCALE_KEY, 'en');
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'dream-2',
          createdAt: 2,
          updatedAt: 5,
          starredAt: 4,
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
        wakeEmotions: ['calm'],
        preSleepEmotions: ['hopeful'],
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
      starredDreamCount: 1,
      draftIncluded: true,
    });
    expect(result.payload.dreams).toEqual([
      {
        id: 'dream-2',
        createdAt: 2,
        updatedAt: 5,
        starredAt: 4,
        sleepDate: '2026-03-05',
        title: undefined,
        text: undefined,
        tags: ['ocean'],
        audioUri: 'file:///dream.m4a',
        wakeEmotions: undefined,
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
      wakeEmotions: ['calm'],
      preSleepEmotions: ['hopeful'],
      tags: ['stairs'],
      medications: '',
      importantEvents: '',
      healthNotes: '',
    });
    expect(result.payload.reminderSettings).toEqual({
      enabled: true,
      hour: 8,
      minute: 45,
      style: 'balanced',
    });
    expect(result.payload.analysisSettings).toEqual({
      enabled: true,
      provider: 'openai',
      allowNetwork: false,
    });
    expect(result.payload.reviewState).toEqual({
      updatedAt: 0,
      savedMonths: [],
      savedThreads: [],
    });
  });

  test('writes a local readable export file with persisted data', async () => {
    kv.set(APP_LOCALE_KEY, 'en');
    kv.set(
      DREAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'dream-readable',
          createdAt: 2,
          updatedAt: 5,
          sleepDate: '2026-03-05',
          title: 'Ocean station',
          text: 'Blue hallway and water.',
          audioUri: 'file:///dream.m4a',
          transcript: 'Blue hallway and water',
          transcriptSource: 'generated',
          tags: ['ocean'],
          wakeEmotions: ['calm'],
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

    const result = await exportDreamReadableArchive('text');

    expect(RNFS.mkdir).toHaveBeenCalledWith('/documents/exports');
    expect(RNFS.writeFile).toHaveBeenCalledTimes(1);
    expect(result.filePath).toMatch(/^\/documents\/exports\/kaleidoskop-dreams-.*\.txt$/);
    expect(result.document).toContain('DREAM EXPORT');
    expect(result.document).toContain('DREAM 1: Ocean station');
    expect(result.document).toContain('content: text + audio + transcript');
    expect(result.document).toContain('DREAM TEXT');
    expect(result.document).toContain('TRANSCRIPT');
  });
});
