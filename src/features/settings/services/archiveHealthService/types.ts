import type { Dream } from '../../../dreams/model/dream';
import type { DreamDerivedStoreStatus } from '../../../dreams/repository/dreamDerivedDataRepository';

export const STALE_TRANSCRIPT_PROCESSING_MS = 15 * 60 * 1000;
export const ARCHIVE_HEALTH_HISTORY_LIMIT = 20;

export type RecordShape = Record<string, unknown>;
export type DerivedStoreKind = 'index' | 'meta';

export type ArchiveHealthSeverity = 'info' | 'warning' | 'critical';
export type ArchiveHealthStatus = 'healthy' | 'attention' | 'critical';
export type ArchiveHealthRepairMode = 'automatic' | 'manual' | 'none';

export type ArchiveHealthIssueCode =
  | 'newer-storage-schema'
  | 'dream-store-unreadable'
  | 'invalid-dream-record'
  | 'duplicate-dream-id'
  | 'invalid-sleep-date'
  | 'stale-transcript-processing'
  | 'missing-dream-audio'
  | 'missing-audio-only-dream'
  | 'dream-index-missing'
  | 'dream-index-invalid'
  | 'dream-index-stale'
  | 'dream-meta-missing'
  | 'dream-meta-invalid'
  | 'dream-meta-stale'
  | 'draft-store-unreadable'
  | 'missing-draft-audio'
  | 'missing-audio-only-draft'
  | 'edit-draft-unreadable'
  | 'orphan-edit-draft'
  | 'missing-edit-draft-audio'
  | 'missing-audio-only-edit-draft'
  | 'tombstone-store-unreadable'
  | 'tombstone-conflict'
  | 'duplicate-tombstone';

export const DERIVED_ISSUE_CODES = new Set<ArchiveHealthIssueCode>([
  'dream-index-missing',
  'dream-index-invalid',
  'dream-index-stale',
  'dream-meta-missing',
  'dream-meta-invalid',
  'dream-meta-stale',
]);

export type ArchiveHealthIssue = {
  code: ArchiveHealthIssueCode;
  severity: ArchiveHealthSeverity;
  repair: ArchiveHealthRepairMode;
  count: number;
};

export type ArchiveHealthSnapshot = {
  status: ArchiveHealthStatus;
  scannedAt: number;
  dreamCount: number | null;
  draftCount: number | null;
  editDraftCount: number | null;
  tombstoneCount: number | null;
  derivedIndexStatus: DreamDerivedStoreStatus | null;
  derivedMetaStatus: DreamDerivedStoreStatus | null;
  issueCount: number;
  repairableIssueCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: ArchiveHealthIssue[];
};

export type ArchiveHealthHistoryEntry = {
  id: string;
  kind: 'scan' | 'repair';
  at: number;
  status: ArchiveHealthStatus | 'failed' | 'blocked';
  issueCount: number;
  repairedIssueCount: number;
  checkpointCreated: boolean;
};

export type ArchiveRepairResult =
  | {
      status: 'completed';
      repairedIssueCount: number;
      checkpointFilePath: string | null;
      snapshot: ArchiveHealthSnapshot;
    }
  | {
      status: 'blocked';
      reason: 'critical-issues' | 'nothing-to-repair';
      repairedIssueCount: 0;
      checkpointFilePath: null;
      snapshot: ArchiveHealthSnapshot;
    }
  | {
      status: 'failed';
      repairedIssueCount: 0;
      checkpointFilePath: string | null;
      snapshot: ArchiveHealthSnapshot;
    };

export type RepairPlan = {
  dreams: Dream[];
  clearDreamAudioIds: Set<string>;
  staleTranscriptIds: Set<string>;
  rebuildDerivedData: boolean;
  clearCreateDraftAudio: boolean;
  clearEditDraftAudioIds: Set<string>;
  orphanEditDraftIds: Set<string>;
  tombstoneConflictIds: Set<string>;
  deduplicateTombstones: boolean;
};

export type InternalScan = {
  snapshot: ArchiveHealthSnapshot;
  plan: RepairPlan;
};
