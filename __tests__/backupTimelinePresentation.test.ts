import { getSettingsCopy } from '../src/constants/copy/settings';
import {
  buildBackupContentTrustItems,
  buildBackupTimelineItems,
  buildRestorePreviewItems,
} from '../src/features/settings/model/settingsPresentation';

describe('backup timeline presentation', () => {
  const copy = getSettingsCopy('en');

  test('shows caught-up device state when sync is current and a snapshot exists', () => {
    const items = buildBackupTimelineItems({
      copy,
      locale: 'en',
      snapshot: {
        status: 'success',
        lastSuccessAt: Date.UTC(2026, 2, 12, 8, 30),
        lastFinishedAt: Date.UTC(2026, 2, 12, 8, 30),
        uploadedCount: 4,
        pulledCount: 2,
        skippedCount: 0,
        conflictsResolvedCount: 0,
        localWinsCount: 0,
        remoteWinsCount: 0,
        failedCount: 0,
        pendingCount: 0,
      },
      dreams: [
        {
          id: 'dream-1',
          createdAt: Date.UTC(2026, 2, 12, 7, 0),
          updatedAt: Date.UTC(2026, 2, 12, 7, 10),
          syncStatus: 'synced',
          tags: [],
        },
      ],
      session: {
        status: 'signed-in',
        provider: 'supabase',
        userId: 'user-1',
        email: 'hello@example.com',
        isAnonymous: false,
      },
      latestBackupFile: {
        fileName: 'dream-backup-2026-03-12.json',
        filePath: '/tmp/dream-backup-2026-03-12.json',
        modifiedAt: Date.UTC(2026, 2, 12, 8, 31),
      },
      latestBackupPreview: {
        fileName: 'dream-backup-2026-03-12.json',
        filePath: '/tmp/dream-backup-2026-03-12.json',
        exportedAt: new Date(Date.UTC(2026, 2, 12, 8, 31)).toISOString(),
        appVersion: 'v0.5.1',
        locale: 'en',
        storageSchemaVersion: 8,
        version: 5,
        mode: 'replace',
        settingsAction: 'replace',
        draftAction: 'replace',
        summary: {
          dreamCount: 12,
          archivedDreamCount: 2,
          audioDreamCount: 3,
          transcribedDreamCount: 1,
          editedTranscriptCount: 0,
          analyzedDreamCount: 0,
          starredDreamCount: 1,
          draftIncluded: false,
        },
        diff: {
          currentDreamCount: 12,
          importDreamCount: 12,
          overlappingDreamCount: 12,
          newDreamCount: 0,
          resultingDreamCount: 12,
        },
      },
    });

    expect(items).toHaveLength(3);
    expect(items[0].title).toBe(copy.backupTimelineSyncTitle);
    expect(items[1].title).toBe(copy.backupTimelineSnapshotTitle);
    expect(items[2]).toMatchObject({
      title: copy.backupTimelineDeviceTitle,
      value: copy.backupTimelineDeviceCaughtUp,
    });
  });

  test('shows local-only snapshot state when no backup file exists and local changes are ahead', () => {
    const items = buildBackupTimelineItems({
      copy,
      locale: 'en',
      snapshot: {
        status: 'idle',
        uploadedCount: 0,
        pulledCount: 0,
        skippedCount: 0,
        conflictsResolvedCount: 0,
        localWinsCount: 0,
        remoteWinsCount: 0,
        failedCount: 0,
        pendingCount: 2,
      },
      dreams: [
        {
          id: 'dream-1',
          createdAt: Date.UTC(2026, 2, 12, 7, 0),
          updatedAt: Date.UTC(2026, 2, 12, 9, 0),
          syncStatus: 'local',
          tags: [],
        },
        {
          id: 'dream-2',
          createdAt: Date.UTC(2026, 2, 12, 8, 0),
          updatedAt: Date.UTC(2026, 2, 12, 9, 15),
          syncStatus: 'local',
          tags: [],
        },
      ],
      session: {
        status: 'signed-in',
        provider: 'supabase',
        userId: 'user-1',
        email: 'hello@example.com',
        isAnonymous: false,
      },
      latestBackupFile: null,
      latestBackupPreview: null,
    });

    expect(items[1]).toMatchObject({
      value: copy.backupTimelineSnapshotMissing,
      meta: copy.backupTimelineSnapshotMissingMeta,
    });
    expect(items[2].value).toBe(
      copy.backupTimelineDeviceAheadPlural.replace('{count}', '2'),
    );
  });
});

describe('backup content trust presentation', () => {
  const copy = getSettingsCopy('en');

  test('shows audio and transcript cloud trust when content is caught up', () => {
    const items = buildBackupContentTrustItems({
      copy,
      session: {
        status: 'signed-in',
        provider: 'supabase',
        userId: 'user-1',
        email: 'hello@example.com',
        isAnonymous: false,
      },
      dreams: [
        {
          id: 'dream-1',
          createdAt: Date.UTC(2026, 2, 12, 7, 0),
          updatedAt: Date.UTC(2026, 2, 12, 7, 10),
          audioUri: 'file:///tmp/dream-1.m4a',
          audioRemotePath: 'dream-audio/user-1/dream-1.m4a',
          transcript: 'A saved transcript',
          transcriptStatus: 'ready',
          transcriptSource: 'edited',
          transcriptUpdatedAt: Date.UTC(2026, 2, 12, 7, 10),
          syncStatus: 'synced',
          lastSyncedAt: Date.UTC(2026, 2, 12, 7, 11),
          tags: [],
        },
      ],
    });

    expect(items).toEqual([
      expect.objectContaining({
        key: 'audio',
        value: copy.backupContentTrustAudioAllBackedUp,
      }),
      expect.objectContaining({
        key: 'transcript',
        value: copy.backupContentTrustTranscriptCaughtUp,
      }),
    ]);
  });

  test('shows local-only attachment and transcript state before cloud connect', () => {
    const items = buildBackupContentTrustItems({
      copy,
      session: {
        status: 'signed-out',
      },
      dreams: [
        {
          id: 'dream-1',
          createdAt: Date.UTC(2026, 2, 12, 7, 0),
          audioUri: 'file:///tmp/dream-1.m4a',
          transcript: 'Draft transcript',
          transcriptStatus: 'ready',
          transcriptUpdatedAt: Date.UTC(2026, 2, 12, 7, 5),
          tags: [],
        },
      ],
    });

    expect(items[0]).toMatchObject({
      key: 'audio',
      value: copy.backupContentTrustLocalOnly,
    });
    expect(items[1]).toMatchObject({
      key: 'transcript',
      value: copy.backupContentTrustLocalOnly,
    });
  });
});

describe('compact restore preview presentation', () => {
  const copy = getSettingsCopy('en');

  test('keeps only decision-first fields for compact backup preview', () => {
    const items = buildRestorePreviewItems(
      copy,
      {
        fileName: 'dream-backup-2026-03-12.json',
        filePath: '/tmp/dream-backup-2026-03-12.json',
        exportedAt: new Date(Date.UTC(2026, 2, 12, 8, 31)).toISOString(),
        appVersion: 'v0.5.2',
        locale: 'en',
        storageSchemaVersion: 8,
        version: 5,
        mode: 'replace',
        settingsAction: 'replace',
        draftAction: 'replace',
        summary: {
          dreamCount: 12,
          archivedDreamCount: 2,
          audioDreamCount: 3,
          transcribedDreamCount: 1,
          editedTranscriptCount: 0,
          analyzedDreamCount: 0,
          starredDreamCount: 1,
          draftIncluded: false,
        },
        diff: {
          currentDreamCount: 10,
          importDreamCount: 12,
          overlappingDreamCount: 8,
          newDreamCount: 4,
          resultingDreamCount: 14,
        },
      },
      'en',
      { compact: true },
    );

    expect(items.map(item => item.label)).toEqual([
      copy.restoreDreamCountLabel,
      copy.restoreNewCountLabel,
      copy.restoreResultCountLabel,
      copy.restoreDraftLabel,
      copy.restoreSettingsLabel,
      copy.restoreExportedAtLabel,
    ]);
  });
});
