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
import { restoreDreamImportFromFile } from '../src/features/settings/services/dataImportService';
import { DREAM_EXPORT_VERSION } from '../src/features/settings/services/dataExportService';

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
    expect(getSavedMonthlyReportMonths()).toHaveLength(1);

    (RNFS.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({
        version: DREAM_EXPORT_VERSION,
        exportedAt: '2026-04-10T08:00:00.000Z',
        appVersion: '0.5.6',
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
      }),
    );

    await restoreDreamImportFromFile('/documents/exports/import.json', 'replace');

    expect(getSavedMonthlyReportMonths()).toEqual([]);
  });
});
