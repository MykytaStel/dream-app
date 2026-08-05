import {
  DreamImportPreflightError,
  prepareDreamImport,
} from '../src/features/settings/services/dreamImportPreflight';

function dream(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dream-1',
    createdAt: 1_800_000_000_000,
    updatedAt: 1_800_000_000_000,
    title: 'Night walk',
    text: 'I walked through a quiet city.',
    ...overrides,
  };
}

describe('dream import preflight', () => {
  test('normalizes recoverable legacy fields and reports aggregate warnings', () => {
    const result = prepareDreamImport([
      dream({
        sleepDate: '2026-02-31',
        transcriptStatus: 'processing',
        transcriptUpdatedAt: 1,
        audioUri: 'file:///old-device/audio/dream.m4a',
      }),
    ]);

    expect(result.dreams).toHaveLength(1);
    expect(result.dreams[0].sleepDate).not.toBe('2026-02-31');
    expect(result.dreams[0].transcriptStatus).toBe('error');
    expect(result.health).toMatchObject({
      canRestore: true,
      invalidSleepDateCount: 1,
      staleTranscriptCount: 1,
      deviceBoundAudioReferenceCount: 1,
    });
    expect(result.health.warningCount).toBeGreaterThanOrEqual(3);
  });

  test('blocks duplicate identities without putting a dream id in the error', () => {
    const sensitiveId = 'private-dream-id-123';

    expect(() =>
      prepareDreamImport([
        dream({ id: sensitiveId }),
        dream({ id: sensitiveId, text: 'Another record' }),
      ]),
    ).toThrow(DreamImportPreflightError);

    try {
      prepareDreamImport([
        dream({ id: sensitiveId }),
        dream({ id: sensitiveId, text: 'Another record' }),
      ]);
    } catch (error) {
      expect(error).toMatchObject({ code: 'duplicate-dream-id' });
      expect(String((error as Error).message)).not.toContain(sensitiveId);
    }
  });

  test('blocks malformed and unsaveable records before restore', () => {
    expect(() => prepareDreamImport([null])).toThrow(
      'Backup dream at position 1 is not an object.',
    );
    expect(() =>
      prepareDreamImport([dream({ title: '', text: '', audioUri: undefined })]),
    ).toThrow(/not saveable/);
  });
});
