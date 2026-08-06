import { observability } from '../../../services/observability';
import { reportActionError } from '../../../services/observability/errorReporting';
import { exportDreamDataSnapshot } from './dataExportService';
import {
  captureLocalDataSnapshot,
  restoreLocalDataSnapshot,
  type LocalDataSnapshot,
} from './localDataSnapshotService';
import {
  beginLocalDataTransactionJournal,
  clearLocalDataTransactionJournal,
  markLocalDataTransactionCommitted,
} from './localDataTransactionJournalService';

export type LocalDataTransactionCheckpointPolicy =
  'required' | 'best-effort' | 'none';

type LocalDataTransactionOptions = {
  label: string;
  checkpointPolicy?: LocalDataTransactionCheckpointPolicy;
};

export type LocalDataTransactionResult<T> = {
  value: T;
  checkpointFilePath: string | null;
};

let transactionTail: Promise<void> = Promise.resolve();

export class LocalDataTransactionError extends Error {
  readonly operationError: unknown;
  readonly rollbackError: unknown;
  readonly checkpointFilePath: string | null;

  constructor(
    operationError: unknown,
    rollbackError?: unknown,
    checkpointFilePath: string | null = null,
  ) {
    super(
      rollbackError
        ? 'The operation failed and local data rollback was incomplete.'
        : 'The operation failed. Local data was restored to its previous state.',
    );
    this.name = 'LocalDataTransactionError';
    this.operationError = operationError;
    this.rollbackError = rollbackError;
    this.checkpointFilePath = checkpointFilePath;
  }
}

async function createCheckpoint(
  policy: LocalDataTransactionCheckpointPolicy,
  label: string,
) {
  if (policy === 'none') {
    return null;
  }

  try {
    const result = await exportDreamDataSnapshot();
    return result.filePath;
  } catch (error) {
    reportActionError('local_data_transaction.checkpoint', error, {
      transaction_label: label,
      checkpoint_policy: policy,
    });
    if (policy === 'required') {
      throw error;
    }
    return null;
  }
}

async function rollbackPreparedTransaction(
  snapshot: LocalDataSnapshot,
  transactionId: string,
  label: string,
) {
  try {
    await restoreLocalDataSnapshot(snapshot);
    clearLocalDataTransactionJournal(transactionId);
    return undefined;
  } catch (error) {
    reportActionError('local_data_transaction.rollback', error, {
      transaction_label: label,
    });
    return error;
  }
}

function reportTransactionFailure(input: {
  label: string;
  operationError: unknown;
  rollbackError: unknown;
  checkpointFilePath: string | null;
}) {
  const rollbackCompleted = !input.rollbackError;
  const checkpointCreated = Boolean(input.checkpointFilePath);
  reportActionError('local_data_transaction.operation', input.operationError, {
    transaction_label: input.label,
    rollback_completed: rollbackCompleted,
  });
  observability.trackEvent('local_data_transaction_failed', {
    transaction_label: input.label,
    rollback_completed: rollbackCompleted,
    checkpoint_created: checkpointCreated,
  });
}

async function performTransaction<T>(
  options: LocalDataTransactionOptions,
  operation: () => Promise<T> | T,
): Promise<LocalDataTransactionResult<T>> {
  const checkpointPolicy = options.checkpointPolicy ?? 'required';
  const checkpointFilePath = await createCheckpoint(
    checkpointPolicy,
    options.label,
  );
  const checkpointCreated = Boolean(checkpointFilePath);

  // Capture as late as possible: checkpoint creation may await file IO, so the
  // exact rollback state must be the state immediately before the prepared
  // journal and mutation, not the state from before the export began.
  const snapshot = captureLocalDataSnapshot();
  const journal = beginLocalDataTransactionJournal({
    label: options.label,
    checkpointFilePath,
    snapshot,
  });

  observability.trackEvent('local_data_transaction_started', {
    transaction_label: options.label,
    checkpoint_created: checkpointCreated,
  });

  let value: T;
  try {
    value = await operation();
  } catch (operationError) {
    const rollbackError = await rollbackPreparedTransaction(
      snapshot,
      journal.transactionId,
      options.label,
    );
    reportTransactionFailure({
      label: options.label,
      operationError,
      rollbackError,
      checkpointFilePath,
    });
    throw new LocalDataTransactionError(
      operationError,
      rollbackError,
      checkpointFilePath,
    );
  }

  try {
    markLocalDataTransactionCommitted(journal.transactionId);
  } catch (commitError) {
    const rollbackError = await rollbackPreparedTransaction(
      snapshot,
      journal.transactionId,
      options.label,
    );
    reportTransactionFailure({
      label: options.label,
      operationError: commitError,
      rollbackError,
      checkpointFilePath,
    });
    throw new LocalDataTransactionError(
      commitError,
      rollbackError,
      checkpointFilePath,
    );
  }

  // Once the committed marker is durable, cleanup is best-effort. If process
  // termination or an MMKV error leaves it behind, startup recovery clears the
  // committed record without rolling the successful operation back.
  try {
    clearLocalDataTransactionJournal(journal.transactionId);
  } catch (error) {
    reportActionError('local_data_transaction.journal_cleanup', error, {
      transaction_label: options.label,
    });
  }

  observability.trackEvent('local_data_transaction_completed', {
    transaction_label: options.label,
    checkpoint_created: checkpointCreated,
  });
  return { value, checkpointFilePath };
}

/**
 * Serializes every archive-wide mutation. A signed prepared journal is written
 * before the operation and a committed marker is written before success is
 * returned, so startup can distinguish rollback from cleanup after termination.
 */
export function runLocalDataTransaction<T>(
  options: LocalDataTransactionOptions,
  operation: () => Promise<T> | T,
): Promise<LocalDataTransactionResult<T>> {
  const queued = transactionTail.then(
    () => performTransaction(options, operation),
    () => performTransaction(options, operation),
  );
  transactionTail = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

export function __unsafeResetLocalDataTransactionQueueForTests() {
  transactionTail = Promise.resolve();
}
