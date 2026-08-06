jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
  exists: jest.fn().mockResolvedValue(false),
}));

jest.mock('../src/features/reminders/services/dreamReminderService', () => ({
  applyDreamReminderSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  '../src/features/analysis/services/dreamAnalysisSettingsService',
  () => ({
    saveDreamAnalysisSettings: jest.fn(),
  }),
);

jest.mock('../src/i18n/localeStore', () => ({
  saveLocale: jest.fn(),
}));

import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import {
  buildDreamExportSnapshot,
  DREAM_EXPORT_VERSION,
} from '../src/features/settings/services/dataExportService';
import {
  loadDreamImportPreview,
  readDreamImportPayload,
} from '../src/features/settings/services/dataImportService';
import { attachDreamBackupIntegrity } from '../src/features/settings/services/dreamBackupIntegrityService';

function backupPayload() {
  return buildDreamExportSnapshot({
    exportedAt: '2026-08-06T10:00:00.000Z',
    appVersion: 'v1.0.0',
    locale: 'uk',
    platform: 'ios',
    storageSchemaVersion: 12,
    dreams: [
      {
        id: 'dream-1',
        createdAt: 1_800_000_000_000,
        updatedAt: 1_800_000_100_000,
        title: 'Міст',
        text: 'Я переходив через міст.',
        sleepDate: '2027-01-15',
        tags: ['міст'],
      },
    ],
    draft: null,
    reminderSettings: {
      enabled: false,
      hour: 8,
      minute: 0,
      style: 'balanced',
    },
    analysisSettings: {
      enabled: false,
      provider: 'manual',
      allowNetwork: false,
    },
    reviewState: {
      updatedAt: 0,
      savedMonths: [],
      savedThreads: [],
    },
  });
}

describe('dream backup import integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
  });

  test('verifies a current backup before producing a preview', async () => {
    const signed = attachDreamBackupIntegrity(backupPayload());
    (RNFS.readFile as jest.Mock).mockResolvedValue(JSON.stringify(signed));

    await expect(
      readDreamImportPayload('/exports/current.json'),
    ).resolves.toMatchObject({
      version: DREAM_EXPORT_VERSION,
      integrityStatus: 'verified',
      integrity: {
        algorithm: 'sha256',
        digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    });

    await expect(
      loadDreamImportPreview('/exports/current.json', 'replace'),
    ).resolves.toMatchObject({
      integrityStatus: 'verified',
      integrityAlgorithm: 'sha256',
      summary: { dreamCount: 1 },
    });
  });

  test('keeps version eight backups readable without claiming verification', async () => {
    const legacy = { ...backupPayload(), version: 8 };
    (RNFS.readFile as jest.Mock).mockResolvedValue(JSON.stringify(legacy));

    await expect(
      loadDreamImportPreview('/exports/legacy.json', 'merge'),
    ).resolves.toMatchObject({
      version: 8,
      integrityStatus: 'legacy-unverified',
      integrityAlgorithm: null,
    });
  });

  test('requires an integrity manifest for the current format', async () => {
    (RNFS.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(backupPayload()),
    );

    await expect(
      readDreamImportPayload('/exports/missing-integrity.json'),
    ).rejects.toMatchObject({
      code: 'integrity-missing',
    });
  });

  test('rejects a changed payload even when its JSON remains structurally valid', async () => {
    const signed = attachDreamBackupIntegrity(backupPayload());
    const changed = {
      ...signed,
      dreams: signed.dreams.map(dream => ({
        ...dream,
        text: 'Payload changed after export.',
      })),
    };
    (RNFS.readFile as jest.Mock).mockResolvedValue(JSON.stringify(changed));

    await expect(
      readDreamImportPayload('/exports/changed.json'),
    ).rejects.toMatchObject({
      code: 'integrity-mismatch',
    });
  });
});
