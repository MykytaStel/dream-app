import { type CloudSession } from '../../../services/auth/session';
import { type Dream } from '../../dreams/model/dream';
import { type SavedReviewStateSnapshot } from '../../stats/services/reviewStateStorageService';
import {
  fillTemplate,
  type SettingsCopy,
} from './backupPresentationShared';

export type BackupContentTrustItem = {
  key: 'audio' | 'transcript' | 'review';
  title: string;
  meta: string;
  value: string;
};

export function buildBackupContentTrustItems(input: {
  copy: SettingsCopy;
  dreams: Dream[];
  session: CloudSession;
  reviewState: SavedReviewStateSnapshot;
}): BackupContentTrustItem[] {
  const { copy, dreams, session, reviewState } = input;
  const signedIn = session.status === 'signed-in';
  const audioDreams = dreams.filter(dream => Boolean(dream.audioUri?.trim()));
  const uploadedAudioCount = audioDreams.filter(dream =>
    Boolean(dream.audioRemotePath?.trim()),
  ).length;
  const audioStillLocalCount = signedIn
    ? audioDreams.filter(dream => !dream.audioRemotePath?.trim()).length
    : audioDreams.length;

  const transcriptDreams = dreams.filter(dream => Boolean(dream.transcript?.trim()));
  const editedTranscriptCount = transcriptDreams.filter(
    dream => dream.transcriptSource === 'edited',
  ).length;
  const transcriptStillLocalCount = signedIn
    ? transcriptDreams.filter(dream => {
        const transcriptTimestamp =
          dream.transcriptUpdatedAt ?? dream.updatedAt ?? dream.createdAt;
        return (
          dream.syncStatus !== 'synced' ||
          transcriptTimestamp > (dream.lastSyncedAt ?? 0)
        );
      }).length
    : transcriptDreams.length;

  const audioValue =
    audioDreams.length === 0
      ? copy.backupContentTrustAudioEmpty
      : !signedIn
      ? copy.backupContentTrustLocalOnly
      : audioStillLocalCount === 0
      ? copy.backupContentTrustAudioAllBackedUp
      : audioStillLocalCount === 1
      ? copy.backupContentTrustAudioStillLocalSingle
      : fillTemplate(copy.backupContentTrustAudioStillLocalPlural, {
          count: audioStillLocalCount,
        });
  const audioMeta =
    audioDreams.length === 0
      ? copy.backupContentTrustAudioEmptyMeta
      : fillTemplate(copy.backupContentTrustAudioMeta, {
          total: audioDreams.length,
          synced: uploadedAudioCount,
        });

  const transcriptValue =
    transcriptDreams.length === 0
      ? copy.backupContentTrustTranscriptEmpty
      : !signedIn
      ? copy.backupContentTrustLocalOnly
      : transcriptStillLocalCount === 0
      ? copy.backupContentTrustTranscriptCaughtUp
      : transcriptStillLocalCount === 1
      ? copy.backupContentTrustTranscriptStillLocalSingle
      : fillTemplate(copy.backupContentTrustTranscriptStillLocalPlural, {
          count: transcriptStillLocalCount,
        });
  const transcriptMeta =
    transcriptDreams.length === 0
      ? copy.backupContentTrustTranscriptEmptyMeta
      : fillTemplate(copy.backupContentTrustTranscriptMeta, {
          total: transcriptDreams.length,
          edited: editedTranscriptCount,
        });

  const totalReviewSetCount =
    reviewState.savedMonths.length + reviewState.savedThreads.length;
  const reviewValue =
    totalReviewSetCount === 0
      ? copy.backupContentTrustReviewEmpty
      : !signedIn
      ? copy.backupContentTrustLocalOnly
      : reviewState.syncStatus === 'synced'
      ? copy.backupContentTrustReviewCaughtUp
      : copy.backupContentTrustReviewStillLocal;
  const reviewMeta =
    totalReviewSetCount === 0
      ? copy.backupContentTrustReviewEmptyMeta
      : fillTemplate(copy.backupContentTrustReviewMeta, {
          total: totalReviewSetCount,
          months: reviewState.savedMonths.length,
          threads: reviewState.savedThreads.length,
        });

  return [
    {
      key: 'audio',
      title: copy.backupContentTrustAudioTitle,
      meta: audioMeta,
      value: audioValue,
    },
    {
      key: 'transcript',
      title: copy.backupContentTrustTranscriptTitle,
      meta: transcriptMeta,
      value: transcriptValue,
    },
    {
      key: 'review',
      title: copy.backupContentTrustReviewTitle,
      meta: reviewMeta,
      value: reviewValue,
    },
  ];
}
