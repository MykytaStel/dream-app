jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
}));

jest.mock('../src/features/reminders/services/dreamReminderService', () => ({
  applyDreamReminderSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/features/analysis/services/dreamAnalysisSettingsService', () => ({
  saveDreamAnalysisSettings: jest.fn(),
}));

jest.mock('../src/i18n/localeStore', () => ({
  saveLocale: jest.fn(),
}));

import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import { saveDream } from '../src/features/dreams/repository/dreamsRepository';
import {
  getSavedMonthlyReportMonths,
  toggleSavedMonthlyReportMonth,
} from '../src/features/stats/services/monthlyReportShelfService';
import { getDerivedReviewStateSnapshot } from '../src/features/stats/services/reviewShelfStateService';
import { toggleSavedDreamThread } from '../src/features/stats/services/dreamThreadShelfService';
import { saveSavedReviewStateSnapshot } from '../src/features/stats/services/reviewStateStorageService';
import { restoreDreamImportFromFile } from '../src/features/settings/services/dataImportService';
import { DREAM_EXPORT_VERSION } from '../src/features/settings/services/dataExportService';
import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';

describe('data import service', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
  });

  test('reconciles stale saved review months after replace restore', async () => {
    saveDream({
      id: 'march-local',
      createdAt: new Date('2026-03-04T08:00:00Z').getTime(),
      sleepDate: '2026-03-04',
      text: 'Local march dream',
      tags: [],
    });
    toggleSavedMonthlyReportMonth('2026-03');
    toggleSavedDreamThread('bridge', 'theme');
    expect(getSavedMonthlyReportMonths()).toHaveLength(1);

    (RNFS.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({
        version: DREAM_EXPORT_VERSION,
        exportedAt: '2026-04-10T08:00:00.000Z',
        appVersion: '0.6.0',
        platform: 'ios',
        locale: 'en',
        storageSchemaVersion: 8,
        summary: {
          dreamCount: 1,
          archivedDreamCount: 0,
          audioDreamCount: 0,
          transcribedDreamCount: 0,
          editedTranscriptCount: 0,
          analyzedDreamCount: 0,
          starredDreamCount: 0,
          draftIncluded: false,
        },
        dreams: [
          {
            id: 'april-remote',
            createdAt: new Date('2026-04-01T08:00:00Z').getTime(),
            sleepDate: '2026-04-01',
            text: 'Imported april dream',
            tags: [],
          },
        ],
        draft: null,
        reminderSettings: {
          enabled: false,
          hour: 7,
          minute: 30,
        },
        analysisSettings: {
          enabled: true,
          provider: 'manual',
          allowNetwork: false,
        },
        reviewState: {
          updatedAt: 123,
          savedMonths: [{ monthKey: '2026-04', savedAt: 122 }],
          savedThreads: [{ signal: 'april', kind: 'theme', savedAt: 121 }],
        },
      }),
    );

    await restoreDreamImportFromFile('/documents/exports/import.json', 'replace');

    expect(getSavedMonthlyReportMonths()).toEqual([{ monthKey: '2026-04', savedAt: 122 }]);
    expect(getDerivedReviewStateSnapshot()).toMatchObject({
      savedThreads: [{ signal: 'april', kind: 'theme', savedAt: 121 }],
    });
  });

  test('preserves newer local review metadata during merge restore', async () => {
    saveDream({
      id: 'local-dream',
      createdAt: new Date('2026-03-04T08:00:00Z').getTime(),
      sleepDate: '2026-03-04',
      text: 'Local march dream',
      tags: [],
    });
    saveSavedReviewStateSnapshot({
      updatedAt: 500,
      savedMonths: [{ monthKey: '2026-03', savedAt: 450 }],
      savedThreads: [],
    });

    (RNFS.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({
        version: DREAM_EXPORT_VERSION,
        exportedAt: '2026-04-10T08:00:00.000Z',
        appVersion: '0.6.0',
        platform: 'ios',
        locale: 'en',
        storageSchemaVersion: 8,
        summary: {
          dreamCount: 1,
          archivedDreamCount: 0,
          audioDreamCount: 0,
          transcribedDreamCount: 0,
          editedTranscriptCount: 0,
          analyzedDreamCount: 0,
          starredDreamCount: 0,
          draftIncluded: false,
        },
        dreams: [
          {
            id: 'april-remote',
            createdAt: new Date('2026-04-01T08:00:00Z').getTime(),
            sleepDate: '2026-04-01',
            text: 'Imported april dream',
            tags: [],
          },
        ],
        draft: null,
        reminderSettings: {
          enabled: false,
          hour: 7,
          minute: 30,
        },
        analysisSettings: {
          enabled: true,
          provider: 'manual',
          allowNetwork: false,
        },
        reviewState: {
          updatedAt: 123,
          savedMonths: [{ monthKey: '2026-04', savedAt: 122 }],
          savedThreads: [],
        },
      }),
    );

    await restoreDreamImportFromFile('/documents/exports/import.json', 'merge');

    expect(getDerivedReviewStateSnapshot()).toMatchObject({
      updatedAt: 500,
      savedMonths: [
        { monthKey: '2026-03', savedAt: 450 },
        { monthKey: '2026-04', savedAt: 122 },
      ],
      syncStatus: 'local',
    });
    expect(kv.getNumber(STORAGE_SCHEMA_VERSION_KEY)).toBe(CURRENT_STORAGE_SCHEMA_VERSION);
  });
});
