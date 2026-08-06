import RNFS from 'react-native-fs';
import { observability } from '../../../services/observability';
import { reportActionError } from '../../../services/observability/errorReporting';
import {
  loadDreamImportPreview,
  readDreamImportPayload,
  restoreDreamImportPayload,
  type DreamImportMode,
  type DreamImportPreview,
} from './dataImportService';
import {
  DreamImportPreflightError,
  prepareDreamImport,
  type DreamImportHealth,
} from './dreamImportPreflight';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from './localDataTransactionService';

type RecordShape = Record<string, unknown>;

export type ValidatedDreamImportPreview = DreamImportPreview & {
  health: DreamImportHealth;
  recoveryCheckpointFilePath?: string | null;
};

function isRecord(value: unknown): value is RecordShape {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function readImportHealth(filePath: string): Promise<DreamImportHealth> {
  let raw: string;
  try {
    raw = await RNFS.readFile(filePath, 'utf8');
  } catch (error) {
    reportActionError('dream_import_preflight.read', error);
    throw new Error('Backup file could not be read.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Backup file could not be parsed.');
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.dreams)) {
    throw new Error('Backup is missing a valid dreams array.');
  }

  return prepareDreamImport(parsed.dreams).health;
}

/**
 * Preview and restore share the exact same record-level preflight. This makes
 * duplicate identities and unsaveable records visible before confirmation,
 * while the restore path still re-runs the check immediately before mutation.
 */
export async function loadValidatedDreamImportPreview(
  filePath: string,
  mode: DreamImportMode,
): Promise<ValidatedDreamImportPreview> {
  const [preview, health] = await Promise.all([
    loadDreamImportPreview(filePath, mode),
    readImportHealth(filePath),
  ]);

  observability.trackEvent('dream_import_preflight_completed', {
    warning_count: health.warningCount,
    normalized_dream_count: health.normalizedDreamCount,
    invalid_sleep_date_count: health.invalidSleepDateCount,
    stale_transcript_count: health.staleTranscriptCount,
    device_bound_audio_reference_count: health.deviceBoundAudioReferenceCount,
  });

  return { ...preview, health };
}

/**
 * Restore is one serialized archive mutation with an in-memory rollback
 * snapshot. The checkpoint is best-effort because a restore must remain capable
 * of replacing an unreadable current archive; rollback still preserves its raw
 * bytes if any later settings or reminder write fails.
 */
export async function restoreDreamImportTransactionally(
  filePath: string,
  mode: DreamImportMode,
): Promise<ValidatedDreamImportPreview> {
  // Fast preflight before waiting for the archive mutation queue. The file is
  // parsed once more inside the transaction, normalized, and that exact in-memory
  // payload is passed to the mutation boundary without another file read.
  await readImportHealth(filePath);

  const transaction = await runLocalDataTransaction(
    {
      label: `dream-import-${mode}`,
      checkpointPolicy: 'best-effort',
    },
    async () => {
      const payload = await readDreamImportPayload(filePath);
      const prepared = prepareDreamImport(payload.dreams);
      const preview = await restoreDreamImportPayload(
        { ...payload, dreams: prepared.dreams },
        filePath,
        mode,
      );
      return { preview, health: prepared.health };
    },
  ).catch(error => {
    if (
      error instanceof LocalDataTransactionError &&
      error.operationError instanceof DreamImportPreflightError
    ) {
      throw error.operationError;
    }
    throw error;
  });

  const { preview, health } = transaction.value;
  observability.trackEvent('dream_import_transaction_completed', {
    mode,
    warning_count: health.warningCount,
    checkpoint_created: Boolean(transaction.checkpointFilePath),
    resulting_dream_count: preview.diff.resultingDreamCount,
  });

  return {
    ...preview,
    health,
    recoveryCheckpointFilePath: transaction.checkpointFilePath,
  };
}
