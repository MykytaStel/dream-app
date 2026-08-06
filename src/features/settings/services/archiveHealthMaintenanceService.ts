import { observability } from '../../../services/observability';
import {
  reportActionError,
  reportStorageReadFailure,
} from '../../../services/observability/errorReporting';
import { ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import {
  getArchiveHealthHistory,
  scanArchiveHealth,
  type ArchiveHealthStatus,
} from './archiveHealthService';

export const ARCHIVE_HEALTH_MAINTENANCE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export type ArchiveHealthMaintenanceTrigger = 'startup' | 'foreground';

export type LatestArchiveHealthStatus = {
  status: ArchiveHealthStatus;
  checkedAt: number;
  issueCount: number;
};

export type ArchiveHealthMaintenanceResult =
  | {
      status: 'not-due';
      trigger: ArchiveHealthMaintenanceTrigger;
      lastCheckAt: number;
      nextEligibleAt: number;
      latest: LatestArchiveHealthStatus | null;
    }
  | {
      status: 'attempted';
      trigger: ArchiveHealthMaintenanceTrigger;
      checkedAt: number;
      healthStatus: ArchiveHealthStatus;
      issueCount: number;
    }
  | {
      status: 'failed';
      trigger: ArchiveHealthMaintenanceTrigger;
      attemptedAt: number;
      reason: 'health-check-failed';
      latest: LatestArchiveHealthStatus | null;
    };

type ArchiveHealthMaintenanceOptions = {
  trigger: ArchiveHealthMaintenanceTrigger;
  now?: number;
};

let inFlight: Promise<ArchiveHealthMaintenanceResult> | null = null;
let sessionLastCheckAt: number | undefined;

function isHealthStatus(value: string): value is ArchiveHealthStatus {
  return value === 'healthy' || value === 'attention' || value === 'critical';
}

/**
 * Reads the newest privacy-safe health result already stored by PR #37.
 *
 * History entries contain aggregate status/counts only. Reusing that boundary
 * avoids introducing a second archive-health summary schema or persisting any
 * issue details, dream identifiers, filenames, or audio paths.
 */
export function getLatestArchiveHealthStatus(): LatestArchiveHealthStatus | null {
  const entry = getArchiveHealthHistory().find(item =>
    isHealthStatus(item.status),
  );

  return entry && isHealthStatus(entry.status)
    ? {
        status: entry.status,
        checkedAt: entry.at,
        issueCount: Math.max(0, entry.issueCount),
      }
    : null;
}

function readLastCheckAt(): number | undefined {
  if (sessionLastCheckAt !== undefined) {
    return sessionLastCheckAt;
  }

  try {
    const stored = kv.getNumber(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY);
    if (stored === undefined) {
      return undefined;
    }

    if (!Number.isFinite(stored) || stored < 0) {
      reportStorageReadFailure(
        ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY,
        new Error('Archive health maintenance timestamp is invalid.'),
      );
      return undefined;
    }

    return stored;
  } catch (error) {
    reportStorageReadFailure(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY, error);
    return undefined;
  }
}

function persistLastCheckAt(checkedAt: number) {
  sessionLastCheckAt = checkedAt;

  try {
    kv.set(ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY, checkedAt);
  } catch (error) {
    reportActionError('archive_health_maintenance.persist', error, {
      checked_at: checkedAt,
    });
  }
}

async function performArchiveHealthMaintenance(
  options: ArchiveHealthMaintenanceOptions,
): Promise<ArchiveHealthMaintenanceResult> {
  const now = options.now ?? Date.now();
  const lastCheckAt = readLastCheckAt();

  if (lastCheckAt !== undefined) {
    if (lastCheckAt > now + ARCHIVE_HEALTH_MAINTENANCE_INTERVAL_MS) {
      reportStorageReadFailure(
        ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY,
        new Error('Archive health maintenance timestamp is in the future.'),
      );
    } else {
      const nextEligibleAt =
        lastCheckAt + ARCHIVE_HEALTH_MAINTENANCE_INTERVAL_MS;
      if (now < nextEligibleAt) {
        return {
          status: 'not-due',
          trigger: options.trigger,
          lastCheckAt,
          nextEligibleAt,
          latest: getLatestArchiveHealthStatus(),
        };
      }
    }
  }

  try {
    // `record: true` writes one aggregate history entry through the existing
    // PR #37 privacy boundary. It never invokes repair or mutates dream data.
    const snapshot = await scanArchiveHealth({ record: true });
    persistLastCheckAt(snapshot.scannedAt);

    observability.trackEvent('archive_health_maintenance', {
      trigger: options.trigger,
      status: snapshot.status,
      issue_count: snapshot.issueCount,
      repairable_issue_count: snapshot.repairableIssueCount,
      critical_count: snapshot.criticalCount,
    });

    return {
      status: 'attempted',
      trigger: options.trigger,
      checkedAt: snapshot.scannedAt,
      healthStatus: snapshot.status,
      issueCount: snapshot.issueCount,
    };
  } catch (error) {
    reportActionError('archive_health_maintenance.run', error, {
      trigger: options.trigger,
    });

    // A programming or integration failure still consumes the weekly window in
    // this session and storage, preventing foreground retry loops.
    persistLastCheckAt(now);

    return {
      status: 'failed',
      trigger: options.trigger,
      attemptedAt: now,
      reason: 'health-check-failed',
      latest: getLatestArchiveHealthStatus(),
    };
  }
}

/**
 * Runs at most one read-only health scan at a time and at most once per
 * persisted seven-day window. Concurrent startup and foreground triggers share
 * the same in-flight promise.
 */
export function runArchiveHealthMaintenance(
  options: ArchiveHealthMaintenanceOptions,
): Promise<ArchiveHealthMaintenanceResult> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = performArchiveHealthMaintenance(options).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function __unsafeResetArchiveHealthMaintenanceForTests() {
  inFlight = null;
  sessionLastCheckAt = undefined;
}
