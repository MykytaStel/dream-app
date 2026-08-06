import { observability } from '../../../services/observability';
import { reportActionError } from '../../../services/observability/errorReporting';
import {
  LOCAL_DATA_RECOVERY_HISTORY_STORAGE_KEY,
  LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY,
  LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import {
  attachDreamBackupIntegrity,
  verifyDreamBackupIntegrity,
  type DreamBackupIntegrityManifest,
} from './dreamBackupIntegrityService';
import {
  parseLocalDataSnapshot,
  restoreLocalDataSnapshot,
  type LocalDataSnapshot,
} from './localDataSnapshotService';

const LOCAL_DATA_TRANSACTION_JOURNAL_VERSION = 1;
const LOCAL_DATA_RECOVERY_HISTORY_LIMIT = 20;

type RecordShape = Record<string, unknown>;

export type LocalDataTransactionJournalPhase = 'prepared' | 'committed';

export type LocalDataTransactionJournal = {
  version: typeof LOCAL_DATA_TRANSACTION_JOURNAL_VERSION;
  transactionId: string;
  label: string;
  startedAt: number;
  phase: LocalDataTransactionJournalPhase;
  checkpointFilePath: string | null;
  snapshot: LocalDataSnapshot;
  integrity: DreamBackupIntegrityManifest;
};

export type LocalDataRecoveryHistoryEntry = {
  id: string;
  at: number;
  status: 'recovered' | 'committed-cleared' | 'blocked' | 'quarantined';
  transactionLabel: string | null;
  checkpointCreated: boolean;
};

export type LocalDataRecoveryResult =
  | { status: 'none' }
  | {
      status: 'recovered' | 'committed-cleared';
      transactionLabel: string;
      checkpointCreated: boolean;
    }
  | {
      status: 'blocked';
      reason: 'journal-invalid' | 'restore-failed';
      transactionLabel: string | null;
      checkpointCreated: boolean;
    };

export class LocalDataTransactionJournalError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'journal-conflict'
      | 'journal-invalid'
      | 'journal-identity-mismatch'
      | 'journal-persistence-failed',
  ) {
    super(message);
    this.name = 'LocalDataTransactionJournalError';
  }
}

function isRecord(value: unknown): value is RecordShape {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function transactionId(now: number) {
  return `${now}:${Math.random().toString(36).slice(2, 10)}`;
}

function signJournal(
  journal: Omit<LocalDataTransactionJournal, 'integrity'>,
): LocalDataTransactionJournal {
  return attachDreamBackupIntegrity(journal) as LocalDataTransactionJournal;
}

function persistJournal(journal: LocalDataTransactionJournal) {
  const serialized = JSON.stringify(journal);
  kv.set(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY, serialized);
  if (kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY) !== serialized) {
    throw new LocalDataTransactionJournalError(
      'The local data transaction journal could not be persisted exactly.',
      'journal-persistence-failed',
    );
  }
}

function removeJournalValue(key: string) {
  kv.remove(key);
  if (kv.getString(key) !== undefined) {
    throw new LocalDataTransactionJournalError(
      'The local data transaction journal could not be removed.',
      'journal-persistence-failed',
    );
  }
}

function parseJournal(value: unknown): LocalDataTransactionJournal {
  if (!isRecord(value)) {
    throw new LocalDataTransactionJournalError(
      'The local data transaction journal is not an object.',
      'journal-invalid',
    );
  }

  try {
    verifyDreamBackupIntegrity(value, { required: true });
  } catch (error) {
    throw new LocalDataTransactionJournalError(
      error instanceof Error ? error.message : 'Journal integrity failed.',
      'journal-invalid',
    );
  }

  if (
    value.version !== LOCAL_DATA_TRANSACTION_JOURNAL_VERSION ||
    typeof value.transactionId !== 'string' ||
    !value.transactionId.trim() ||
    typeof value.label !== 'string' ||
    !value.label.trim() ||
    typeof value.startedAt !== 'number' ||
    !Number.isFinite(value.startedAt) ||
    (value.phase !== 'prepared' && value.phase !== 'committed') ||
    (value.checkpointFilePath !== null &&
      typeof value.checkpointFilePath !== 'string') ||
    !isRecord(value.integrity)
  ) {
    throw new LocalDataTransactionJournalError(
      'The local data transaction journal metadata is invalid.',
      'journal-invalid',
    );
  }

  return {
    version: LOCAL_DATA_TRANSACTION_JOURNAL_VERSION,
    transactionId: value.transactionId,
    label: value.label,
    startedAt: value.startedAt,
    phase: value.phase,
    checkpointFilePath: value.checkpointFilePath,
    snapshot: parseLocalDataSnapshot(value.snapshot),
    integrity: value.integrity as DreamBackupIntegrityManifest,
  };
}

function readJournalState():
  | { status: 'none' }
  | { status: 'valid'; journal: LocalDataTransactionJournal; raw: string }
  | { status: 'invalid'; raw: string; error: unknown } {
  const raw = kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);
  if (raw === undefined) {
    return { status: 'none' };
  }

  try {
    return {
      status: 'valid',
      journal: parseJournal(JSON.parse(raw) as unknown),
      raw,
    };
  } catch (error) {
    return { status: 'invalid', raw, error };
  }
}

function isRecoveryStatus(
  value: unknown,
): value is LocalDataRecoveryHistoryEntry['status'] {
  return (
    value === 'recovered' ||
    value === 'committed-cleared' ||
    value === 'blocked' ||
    value === 'quarantined'
  );
}

function readRecoveryHistory(): LocalDataRecoveryHistoryEntry[] {
  const raw = kv.getString(LOCAL_DATA_RECOVERY_HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (entry): entry is LocalDataRecoveryHistoryEntry =>
              isRecord(entry) &&
              typeof entry.id === 'string' &&
              typeof entry.at === 'number' &&
              Number.isFinite(entry.at) &&
              isRecoveryStatus(entry.status) &&
              (entry.transactionLabel === null ||
                typeof entry.transactionLabel === 'string') &&
              typeof entry.checkpointCreated === 'boolean',
          )
          .slice(0, LOCAL_DATA_RECOVERY_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function appendRecoveryHistory(
  entry: Omit<LocalDataRecoveryHistoryEntry, 'id'>,
) {
  const next: LocalDataRecoveryHistoryEntry[] = [
    {
      ...entry,
      id: `${entry.status}:${entry.at}:${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    },
    ...readRecoveryHistory(),
  ].slice(0, LOCAL_DATA_RECOVERY_HISTORY_LIMIT);
  kv.set(LOCAL_DATA_RECOVERY_HISTORY_STORAGE_KEY, JSON.stringify(next));
}

function trackRecovery(
  status: LocalDataRecoveryHistoryEntry['status'],
  transactionLabel: string | null,
  checkpointCreated: boolean,
) {
  observability.trackEvent('local_data_transaction_recovery', {
    status,
    transaction_label: transactionLabel,
    checkpoint_created: checkpointCreated,
  });
}

function recordRecovery(
  status: LocalDataRecoveryHistoryEntry['status'],
  transactionLabel: string | null,
  checkpointCreated: boolean,
) {
  const at = Date.now();
  try {
    appendRecoveryHistory({
      at,
      status,
      transactionLabel,
      checkpointCreated,
    });
  } catch (error) {
    reportActionError('local_data_transaction.recovery_history', error);
  }

  try {
    trackRecovery(status, transactionLabel, checkpointCreated);
  } catch (error) {
    reportActionError('local_data_transaction.recovery_observability', error);
  }
}

export function beginLocalDataTransactionJournal(input: {
  label: string;
  checkpointFilePath: string | null;
  snapshot: LocalDataSnapshot;
  now?: number;
}) {
  if (kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY) !== undefined) {
    throw new LocalDataTransactionJournalError(
      'A previous local data transaction still requires recovery.',
      'journal-conflict',
    );
  }

  const startedAt = input.now ?? Date.now();
  const journal = signJournal({
    version: LOCAL_DATA_TRANSACTION_JOURNAL_VERSION,
    transactionId: transactionId(startedAt),
    label: input.label,
    startedAt,
    phase: 'prepared',
    checkpointFilePath: input.checkpointFilePath,
    snapshot: input.snapshot,
  });
  persistJournal(journal);
  return journal;
}

export function markLocalDataTransactionCommitted(id: string) {
  const state = readJournalState();
  if (state.status !== 'valid') {
    throw new LocalDataTransactionJournalError(
      'The active transaction journal cannot be committed.',
      'journal-invalid',
    );
  }
  if (state.journal.transactionId !== id) {
    throw new LocalDataTransactionJournalError(
      'The active transaction journal belongs to another operation.',
      'journal-identity-mismatch',
    );
  }

  const { integrity: _integrity, ...unsigned } = state.journal;
  persistJournal(signJournal({ ...unsigned, phase: 'committed' }));
}

export function clearLocalDataTransactionJournal(id?: string) {
  if (id) {
    const state = readJournalState();
    if (state.status !== 'valid') {
      throw new LocalDataTransactionJournalError(
        'Refusing to clear an invalid transaction journal.',
        'journal-invalid',
      );
    }
    if (state.journal.transactionId !== id) {
      throw new LocalDataTransactionJournalError(
        'Refusing to clear another transaction journal.',
        'journal-identity-mismatch',
      );
    }
  }
  removeJournalValue(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);
}

export function getLocalDataRecoveryHistory() {
  return readRecoveryHistory();
}

export function hasQuarantinedLocalDataTransaction() {
  return (
    kv.getString(LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY) !== undefined
  );
}

export async function recoverInterruptedLocalDataTransaction(): Promise<LocalDataRecoveryResult> {
  const state = readJournalState();
  if (state.status === 'none') {
    return { status: 'none' };
  }

  if (state.status === 'invalid') {
    reportActionError('local_data_transaction.recovery_journal', state.error);
    recordRecovery('blocked', null, false);
    return {
      status: 'blocked',
      reason: 'journal-invalid',
      transactionLabel: null,
      checkpointCreated: false,
    };
  }

  const journal = state.journal;
  const metadata = {
    transactionLabel: journal.label,
    checkpointCreated: Boolean(journal.checkpointFilePath),
  };

  if (journal.phase === 'committed') {
    clearLocalDataTransactionJournal(journal.transactionId);
    recordRecovery(
      'committed-cleared',
      metadata.transactionLabel,
      metadata.checkpointCreated,
    );
    return { status: 'committed-cleared', ...metadata };
  }

  try {
    await restoreLocalDataSnapshot(journal.snapshot);
    clearLocalDataTransactionJournal(journal.transactionId);
    recordRecovery(
      'recovered',
      metadata.transactionLabel,
      metadata.checkpointCreated,
    );
    return { status: 'recovered', ...metadata };
  } catch (error) {
    reportActionError('local_data_transaction.startup_restore', error, {
      transaction_label: journal.label,
    });
    recordRecovery(
      'blocked',
      metadata.transactionLabel,
      metadata.checkpointCreated,
    );
    return {
      status: 'blocked',
      reason: 'restore-failed',
      ...metadata,
    };
  }
}

/**
 * Preserves the exact raw journal locally, then removes it from the active slot
 * so the user can inspect the current archive without a stale future rollback.
 */
export function quarantineInterruptedLocalDataTransaction() {
  const state = readJournalState();
  if (state.status === 'none') {
    return false;
  }

  const metadata =
    state.status === 'valid'
      ? {
          transactionLabel: state.journal.label,
          checkpointCreated: Boolean(state.journal.checkpointFilePath),
        }
      : { transactionLabel: null, checkpointCreated: false };
  const quarantined = JSON.stringify({
    version: 1,
    quarantinedAt: Date.now(),
    journalRaw: state.raw,
  });
  kv.set(LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY, quarantined);
  if (
    kv.getString(LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY) !== quarantined
  ) {
    throw new LocalDataTransactionJournalError(
      'The interrupted journal could not be quarantined exactly.',
      'journal-persistence-failed',
    );
  }

  removeJournalValue(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);
  recordRecovery(
    'quarantined',
    metadata.transactionLabel,
    metadata.checkpointCreated,
  );
  return true;
}

export function discardQuarantinedLocalDataTransaction() {
  removeJournalValue(LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY);
}

export function __unsafeResetLocalDataTransactionJournalForTests() {
  kv.remove(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);
  kv.remove(LOCAL_DATA_TRANSACTION_QUARANTINE_STORAGE_KEY);
  kv.remove(LOCAL_DATA_RECOVERY_HISTORY_STORAGE_KEY);
}
