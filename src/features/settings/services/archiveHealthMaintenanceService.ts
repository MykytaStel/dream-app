import { kv } from '../../../services/storage/mmkv';
import {
  ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY,
  ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY,
} from '../../../services/storage/keys';
import { reportActionError } from '../../../services/observability/errorReporting';
import { observability } from '../../../services/observability';
import {
  readArchiveHealth,
  type ArchiveHealthSnapshot,
} from './archiveHealthService';

export const ARCHIVE_HEALTH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export type ArchiveHealthSummary = Pick<
  ArchiveHealthSnapshot,
  'status' | 'dreamCount' | 'audioReferenceCount' | 'checkedAt'
> & {
  issueCount: number;
  repairActionCount: number;
};

export type ArchiveHealthMaintenanceResult =
  | {
      status: 'not-due';
      nextEligibleAt: number;
      summary: ArchiveHealthSummary | null;
    }
  | {
      status: 'completed';
      summary: ArchiveHealthSummary;
    }
  | {
      status: 'failed';
      reason: 'health-check-failed';
      summary: ArchiveHealthSummary | null;
    };

let inFlight: Promise<ArchiveHealthMaintenanceResult> | null = null;
let sessionLastCheckAt: number | undefined;

function toSummary(snapshot: ArchiveHealthSnapshot): ArchiveHealthSummary {
  return {
    status: snapshot.status,
    dreamCount: snapshot.dreamCount,
    audioReferenceCount: snapshot.audioReferenceCount,
    checkedAt: snapshot.checkedAt,
    issueCount: snapshot.issues.reduce((total, issue) => total + issue.count, 0),
    repairActionCount: snapshot.repairActions.length,
  };
}

export function getArchiveHealthSummary(): ArchiveHealthSummary | null {
  const raw = kv.getString(ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ArchiveHealthSummary>;
    if (
      (parsed.status !== 'healthy' &&
        parsed.status !== 'attention' &&
        parsed.status !== 'blocked') ||
      typeof parsed.checkedAt !== 'number' ||
      !Number.isFinite(parsed.checkedAt) ||
      typeof parsed.issueCount !== 'number' ||
      !Number.isFinite(parsed.issueCount)
    ) {
      throw new Error('invalid-archive-health-summary');
    }

    return {
      status: parsed.status,
      checkedAt: parsed.checkedAt,
      issueCount: Math.max(0, parsed.issueCount),
      repairActionCount:
        typeof parsed.repairActionCount === 'number' &&
        Number.isFinite(parsed.repairActionCount)
          ? Math.max(0, parsed.repairActionCount)
          : 0,
      dreamCount:
        typeof parsed.dreamCount === 'number' && Number.isFinite(parsed.dreamCount)
          ? Math.max(0, parsed.dreamCount)
          : 0,
      audioReferenceCount:
        typeof parsed.audioReferenceCount === 'number' &&
        Number.isFinite(parsed.audioReferenceCount)
          ? Math.max(0, parsed.audioReferenceCount)
          : 0,
    };
  } catch (error) {
    reportActionError('archive_health_summary.read', error);
    return null;
  }
}

function readLastCheckAt() {
  if (sessionLastCheckAt !== undefined) {
    return sessionLastCheckAt;
  }

  try {
    const stored = kv.getNumber(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY);
    return stored !== undefined && Number.isFinite(stored) && stored >= 0
      ? stored
      : undefined;
  } catch (error) {
    reportActionError('archive_health_maintenance.read_cadence', error);
    return undefined;
  }
}

function persistSummary(summary: ArchiveHealthSummary) {
  sessionLastCheckAt = summary.checkedAt;
  try {
    kv.set(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY, summary.checkedAt);
    kv.set(ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY, JSON.stringify(summary));
  } catch (error) {
    reportActionError('archive_health_maintenance.persist', error, {
      checked_at: summary.checkedAt,
    });
  }
}

/**
 * Stores the aggregate produced by an explicit screen check or repair.
 *
 * This intentionally uses the same summary boundary as weekly maintenance, so
 * Settings never persists issue details, dream identifiers, filenames, or URIs.
 */
export function recordArchiveHealthSnapshot(snapshot: ArchiveHealthSnapshot) {
  const summary = toSummary(snapshot);
  persistSummary(summary);
  return summary;
}

async function perform(now: number): Promise<ArchiveHealthMaintenanceResult> {
  const lastCheckAt = readLastCheckAt();
  if (
    lastCheckAt !== undefined &&
    lastCheckAt <= now + ARCHIVE_HEALTH_INTERVAL_MS &&
    now < lastCheckAt + ARCHIVE_HEALTH_INTERVAL_MS
  ) {
    return {
      status: 'not-due',
      nextEligibleAt: lastCheckAt + ARCHIVE_HEALTH_INTERVAL_MS,
      summary: getArchiveHealthSummary(),
    };
  }

  try {
    const snapshot = await readArchiveHealth(now);
    const summary = recordArchiveHealthSnapshot(snapshot);
    observability.trackEvent('archive_health_maintenance', {
      status: summary.status,
      issue_count: summary.issueCount,
      repair_action_count: summary.repairActionCount,
    });
    return { status: 'completed', summary };
  } catch (error) {
    reportActionError('archive_health_maintenance.run', error);
    return {
      status: 'failed',
      reason: 'health-check-failed',
      summary: getArchiveHealthSummary(),
    };
  }
}

export function runArchiveHealthMaintenance(
  now: number = Date.now(),
): Promise<ArchiveHealthMaintenanceResult> {
  if (inFlight) return inFlight;
  inFlight = perform(now).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function __unsafeResetArchiveHealthMaintenanceForTests() {
  inFlight = null;
  sessionLastCheckAt = undefined;
}
