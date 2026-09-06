export type { DreamListItem, DreamsMeta } from './core';

export {
  UnreadableDreamStoreError,
  listDreams,
  listDreamListItems,
  getDreamsMeta,
  replaceAllDreams,
  saveDream,
  getDream,
  deleteDream,
  ensurePreviewDream,
} from './core';

export {
  archiveDream,
  starDream,
  unstarDream,
  unarchiveDream,
  updateDreamTranscriptState,
  saveDreamTranscriptEdit,
  clearDreamTranscript,
  setDreamAudioUri,
  saveDreamAnalysis,
  clearDreamAnalysis,
} from './mutations';

export {
  applyRemoteDreamDeletion,
  markDreamSyncing,
  markDreamSynced,
  markDreamSyncError,
  markAllDreamsPendingUpload,
  upsertDreamFromSyncBundle,
} from './sync';
