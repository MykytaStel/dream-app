import { getSettingsCopy } from '../src/constants/copy/settings';
import { buildValidatedRestorePreviewItems } from '../src/features/settings/model/dreamImportHealthPresentation';

const preview = {
  fileName: 'backup.json',
  filePath: '/exports/backup.json',
  exportedAt: '2026-08-06T00:00:00.000Z',
  appVersion: '1.0.0',
  locale: 'uk' as const,
  storageSchemaVersion: 12,
  version: 9,
  mode: 'replace' as const,
  settingsAction: 'replace' as const,
  draftAction: 'replace' as const,
  integrityStatus: 'verified' as const,
  integrityAlgorithm: 'sha256' as const,
  summary: {
    dreamCount: 2,
    archivedDreamCount: 0,
    audioDreamCount: 1,
    transcribedDreamCount: 0,
    editedTranscriptCount: 0,
    analyzedDreamCount: 0,
    starredDreamCount: 0,
    draftIncluded: false,
  },
  diff: {
    currentDreamCount: 1,
    importDreamCount: 2,
    overlappingDreamCount: 0,
    newDreamCount: 2,
    resultingDreamCount: 2,
  },
  health: {
    canRestore: true as const,
    warningCount: 4,
    normalizedDreamCount: 1,
    invalidSleepDateCount: 1,
    staleTranscriptCount: 1,
    deviceBoundAudioReferenceCount: 1,
  },
};

describe('restore preflight presentation', () => {
  test('adds integrity and content-free warning aggregates to the grid', () => {
    const items = buildValidatedRestorePreviewItems(
      getSettingsCopy('uk'),
      preview,
      'uk',
    );

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Цілісність backup',
          value: 'Перевірено SHA-256',
        }),
        expect.objectContaining({
          label: 'Попередження preflight',
          value: '4',
        }),
        expect.objectContaining({
          label: 'Локальні аудіопосилання',
          value: '1',
        }),
      ]),
    );
    expect(JSON.stringify(items)).not.toContain('dream-');
    expect(JSON.stringify(items)).not.toContain('/exports/backup.json');
  });

  test('labels legacy backups without claiming cryptographic verification', () => {
    const items = buildValidatedRestorePreviewItems(
      getSettingsCopy('en'),
      {
        ...preview,
        version: 8,
        integrityStatus: 'legacy-unverified',
        integrityAlgorithm: null,
      },
      'en',
    );

    expect(items).toContainEqual(
      expect.objectContaining({
        label: 'Backup integrity',
        value: 'Legacy backup without embedded verification',
      }),
    );
  });
});
