import { getSettingsCopy } from '../src/constants/copy/settings';
import { buildValidatedRestorePreviewItems } from '../src/features/settings/model/dreamImportHealthPresentation';

const preview = {
  fileName: 'backup.json',
  filePath: '/exports/backup.json',
  exportedAt: '2026-08-06T00:00:00.000Z',
  appVersion: '1.0.0',
  locale: 'uk' as const,
  storageSchemaVersion: 12,
  version: 8,
  mode: 'replace' as const,
  settingsAction: 'replace' as const,
  draftAction: 'replace' as const,
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
  test('adds content-free warning aggregates to the restore preview grid', () => {
    const items = buildValidatedRestorePreviewItems(
      getSettingsCopy('uk'),
      preview,
      'uk',
    );

    expect(items).toEqual(
      expect.arrayContaining([
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
});
