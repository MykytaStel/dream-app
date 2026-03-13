import type { CloudSession } from '../../../services/auth/session';
import type { SavedReviewStateSnapshot } from '../../stats/services/reviewStateStorageService';

export type BackupCue = {
  title: string;
  description: string;
  actionLabel: string;
  icon: string;
};

type BackupCueCopy = {
  backupCueOpenAction: string;
  backupCueConnectTitle: string;
  backupCueConnectDescription: string;
  backupCueSyncOffTitle: string;
  backupCueSyncOffDescription: string;
  backupCueReviewPendingTitle: string;
  backupCueReviewPendingDescription: string;
};

function getSavedReviewSetCount(reviewState: SavedReviewStateSnapshot) {
  return reviewState.savedMonths.length + reviewState.savedThreads.length;
}

export function getReviewWorkspaceBackupCue(input: {
  cloudSession: CloudSession;
  cloudSyncEnabled: boolean;
  hasReviewItems: boolean;
  reviewState: SavedReviewStateSnapshot;
  copy: BackupCueCopy;
}): BackupCue | null {
  const { cloudSession, cloudSyncEnabled, hasReviewItems, reviewState, copy } = input;
  const savedReviewSetCount = getSavedReviewSetCount(reviewState);

  if (!hasReviewItems) {
    return null;
  }

  if (cloudSession.status === 'signed-out' && savedReviewSetCount > 0) {
    return {
      title: copy.backupCueConnectTitle,
      description: copy.backupCueConnectDescription,
      actionLabel: copy.backupCueOpenAction,
      icon: 'cloud-upload-outline',
    };
  }

  if (savedReviewSetCount > 0 && reviewState.syncStatus !== 'synced') {
    return {
      title: copy.backupCueReviewPendingTitle,
      description: copy.backupCueReviewPendingDescription,
      actionLabel: copy.backupCueOpenAction,
      icon: 'sync-outline',
    };
  }

  if (cloudSession.status === 'signed-in' && !cloudSyncEnabled && savedReviewSetCount > 0) {
    return {
      title: copy.backupCueSyncOffTitle,
      description: copy.backupCueSyncOffDescription,
      actionLabel: copy.backupCueOpenAction,
      icon: 'cloud-offline-outline',
    };
  }

  return null;
}
