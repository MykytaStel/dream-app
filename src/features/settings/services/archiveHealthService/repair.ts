import { observability } from '../../../../services/observability';
import { DIAG_EVENTS } from '../../../../services/observability/events';
import { reportActionError } from '../../../../services/observability/errorReporting';
import { rebuildDreamDerivedData } from '../../../dreams/repository/dreamDerivedDataRepository';
import {
  clearDreamDeletionTombstone,
  listDreamDeletionTombstones,
  replaceAllDreamDeletionTombstones,
} from '../../../dreams/repository/dreamDeletionTombstonesRepository';
import { replaceAllDreams } from '../../../dreams/repository/dreamsRepository';
import {
  clearDreamEditDraft,
  getDreamDraft,
  getDreamEditDraft,
  saveDreamDraft,
  saveDreamEditDraft,
} from '../../../dreams/services/dreamDraftService';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../localDataTransactionService';
import { appendHistory, historyId } from './history';
import { isDerivedIssueCode, scanArchiveHealth, scanInternal } from './scan';
import type { ArchiveRepairResult } from './types';

function clearAudioUri<T extends { audioUri?: string }>(input: T): T {
  const next = { ...input };
  delete next.audioUri;
  return next;
}

export async function repairArchiveHealth(): Promise<ArchiveRepairResult> {
  const before = await scanInternal();
  if (before.snapshot.criticalCount > 0) {
    const at = Date.now();
    appendHistory({
      id: historyId('repair', at),
      kind: 'repair',
      at,
      status: 'blocked',
      issueCount: before.snapshot.issueCount,
      repairedIssueCount: 0,
      checkpointCreated: false,
    });
    return {
      status: 'blocked',
      reason: 'critical-issues',
      repairedIssueCount: 0,
      checkpointFilePath: null,
      snapshot: before.snapshot,
    };
  }

  if (before.snapshot.repairableIssueCount === 0) {
    return {
      status: 'blocked',
      reason: 'nothing-to-repair',
      repairedIssueCount: 0,
      checkpointFilePath: null,
      snapshot: before.snapshot,
    };
  }

  let checkpointFilePath: string | null = null;
  try {
    const transaction = await runLocalDataTransaction(
      { label: 'archive-health-repair', checkpointPolicy: 'required' },
      async () => {
        const current = await scanInternal();
        if (current.snapshot.criticalCount > 0) {
          throw new Error('Archive changed and now contains critical issues.');
        }

        let repairedIssueCount = 0;
        const plan = current.plan;
        const derivedIssueCount = current.snapshot.issues
          .filter(issue => isDerivedIssueCode(issue.code))
          .reduce((sum, issue) => sum + issue.count, 0);
        const shouldRewriteDreams =
          plan.clearDreamAudioIds.size > 0 ||
          plan.staleTranscriptIds.size > 0 ||
          current.snapshot.issues.some(
            issue => issue.code === 'invalid-sleep-date',
          );

        if (shouldRewriteDreams) {
          const nextDreams = plan.dreams.map(dream => {
            let next = { ...dream };
            if (plan.clearDreamAudioIds.has(dream.id)) {
              next = clearAudioUri(next);
              repairedIssueCount += 1;
            }
            if (plan.staleTranscriptIds.has(dream.id)) {
              next.transcriptStatus = 'error';
              next.transcriptUpdatedAt = Date.now();
              repairedIssueCount += 1;
            }
            return next;
          });
          const invalidDateCount = current.snapshot.issues.find(
            issue => issue.code === 'invalid-sleep-date',
          )?.count;
          repairedIssueCount += invalidDateCount ?? 0;
          replaceAllDreams(nextDreams);
          repairedIssueCount += derivedIssueCount;
        } else if (plan.rebuildDerivedData) {
          rebuildDreamDerivedData(plan.dreams);
          repairedIssueCount += derivedIssueCount;
        }

        if (plan.clearCreateDraftAudio) {
          const draft = getDreamDraft();
          if (draft) {
            saveDreamDraft(clearAudioUri(draft));
            repairedIssueCount += 1;
          }
        }

        for (const dreamId of plan.clearEditDraftAudioIds) {
          const draft = getDreamEditDraft(dreamId);
          if (draft) {
            saveDreamEditDraft(dreamId, clearAudioUri(draft));
            repairedIssueCount += 1;
          }
        }

        for (const dreamId of plan.orphanEditDraftIds) {
          clearDreamEditDraft(dreamId);
          repairedIssueCount += 1;
        }

        for (const dreamId of plan.tombstoneConflictIds) {
          clearDreamDeletionTombstone(dreamId);
          repairedIssueCount += 1;
        }

        if (plan.deduplicateTombstones) {
          const tombstones = listDreamDeletionTombstones();
          const unique = new Map(
            tombstones.map(
              tombstone => [tombstone.dreamId, tombstone] as const,
            ),
          );
          const deduplicated = Array.from(unique.values());
          replaceAllDreamDeletionTombstones(deduplicated);
          repairedIssueCount += Math.max(
            0,
            tombstones.length - deduplicated.length,
          );
        }

        return repairedIssueCount;
      },
    );
    checkpointFilePath = transaction.checkpointFilePath;
    const snapshot = await scanArchiveHealth();
    const at = Date.now();
    appendHistory({
      id: historyId('repair', at),
      kind: 'repair',
      at,
      status: snapshot.status,
      issueCount: snapshot.issueCount,
      repairedIssueCount: transaction.value,
      checkpointCreated: Boolean(checkpointFilePath),
    });
    observability.trackEvent(DIAG_EVENTS.ArchiveHealthRepaired, {
      repaired_issue_count: transaction.value,
      remaining_issue_count: snapshot.issueCount,
      checkpoint_created: Boolean(checkpointFilePath),
    });
    return {
      status: 'completed',
      repairedIssueCount: transaction.value,
      checkpointFilePath,
      snapshot,
    };
  } catch (error) {
    if (error instanceof LocalDataTransactionError) {
      checkpointFilePath = error.checkpointFilePath;
    }
    reportActionError('archive_health.repair', error);
    const snapshot = await scanArchiveHealth();
    const at = Date.now();
    appendHistory({
      id: historyId('repair', at),
      kind: 'repair',
      at,
      status: 'failed',
      issueCount: snapshot.issueCount,
      repairedIssueCount: 0,
      checkpointCreated: Boolean(checkpointFilePath),
    });
    return {
      status: 'failed',
      repairedIssueCount: 0,
      checkpointFilePath,
      snapshot,
    };
  }
}
