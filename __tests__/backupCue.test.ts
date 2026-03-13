import {
  getReviewWorkspaceBackupCue,
} from '../src/features/settings/model/backupCue';

const copy = {
  backupCueOpenAction: 'Open backup',
  backupCueConnectTitle: 'Back up this archive',
  backupCueConnectDescription: 'Keep this archive available on another device.',
  backupCueSyncOffTitle: 'Backup is connected, but sync is off',
  backupCueSyncOffDescription: 'Turn sync back on before switching devices.',
  backupCueReviewPendingTitle: 'Saved review sets are newer here',
  backupCueReviewPendingDescription: 'Open backup and run sync.',
};

describe('backup cue model', () => {
  test('shows review pending cue when saved review state is not synced', () => {
    expect(
      getReviewWorkspaceBackupCue({
        cloudSession: {
          status: 'signed-in',
          provider: 'supabase',
          userId: 'user-1',
        },
        cloudSyncEnabled: true,
        hasReviewItems: true,
        reviewState: {
          updatedAt: 100,
          savedMonths: [{ monthKey: '2026-03', savedAt: 99 }],
          savedThreads: [],
          syncStatus: 'local',
        },
        copy,
      }),
    ).toMatchObject({
      title: copy.backupCueReviewPendingTitle,
      actionLabel: copy.backupCueOpenAction,
    });
  });

  test('shows sync-off cue when backup exists but auto sync is disabled', () => {
    expect(
      getReviewWorkspaceBackupCue({
        cloudSession: {
          status: 'signed-in',
          provider: 'supabase',
          userId: 'user-1',
        },
        cloudSyncEnabled: false,
        hasReviewItems: true,
        reviewState: {
          updatedAt: 100,
          savedMonths: [{ monthKey: '2026-03', savedAt: 99 }],
          savedThreads: [],
          syncStatus: 'synced',
        },
        copy,
      }),
    ).toMatchObject({
      title: copy.backupCueSyncOffTitle,
      actionLabel: copy.backupCueOpenAction,
    });
  });
});
