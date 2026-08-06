import { observability } from '../../../services/observability';
import {
  createDreamImportPreviewFromPayload,
  readDreamImportPayload,
  restoreDreamImportPayload,
  type DreamImportMode,
  type DreamImportPreview,
} from './dataImportService';
import { DreamBackupIntegrityError } from './dreamBackupIntegrityService';
import {
  DreamImportPreflightError,
  prepareDreamImport,
  type DreamImportHealth,
} from './dreamImportPreflight';
import {
  LocalDataTransactionError,
  runLocalDataTransaction,
} from './localDataTransactionService';

export type ValidatedDreamImportPreview = DreamImportPreview & {
  health: DreamImportHealth;
  recoveryCheckpointFilePath?: string | null;
};

const previewSourceDigests = new Map<string, string>();

function previewKey(filePath: string, mode: DreamImportMode) {
  return `${mode}:${filePath}`;
}

function assertSourceDigest(actual: string, expected: string) {
  if (actual !== expected) {
    throw new DreamBackupIntegrityError('integrity-preview-changed');
  }
}

export function __unsafeResetDreamImportPreviewGuardsForTests() {
  previewSourceDigests.clear();
}

/**
 * Preview parses and verifies one exact payload, then stores only its digest as
 * an in-process confirmation guard. No dream content or file bytes are retained.
 */
export async function loadValidatedDreamImportPreview(
  filePath: string,
  mode: DreamImportMode,
): Promise<ValidatedDreamImportPreview> {
  const key = previewKey(filePath, mode);
  previewSourceDigests.delete(key);

  const payload = await readDreamImportPayload(filePath);
  const prepared = prepareDreamImport(payload.dreams);
  const preview = createDreamImportPreviewFromPayload(payload, filePath, mode);

  previewSourceDigests.set(key, payload.sourceDigest);

  observability.trackEvent('dream_import_preflight_completed', {
    integrity_status: preview.integrityStatus,
    warning_count: prepared.health.warningCount,
    normalized_dream_count: prepared.health.normalizedDreamCount,
    invalid_sleep_date_count: prepared.health.invalidSleepDateCount,
    stale_transcript_count: prepared.health.staleTranscriptCount,
    device_bound_audio_reference_count:
      prepared.health.deviceBoundAudioReferenceCount,
  });

  return { ...preview, health: prepared.health };
}

/**
 * Restore verifies the file once before entering the mutation queue and again
 * inside the transaction. The second read must match the previewed fingerprint,
 * or the first verified read when restore is invoked without a prior preview.
 */
export async function restoreDreamImportTransactionally(
  filePath: string,
  mode: DreamImportMode,
): Promise<ValidatedDreamImportPreview> {
  const key = previewKey(filePath, mode);
  const preflightPayload = await readDreamImportPayload(filePath);
  const expectedSourceDigest =
    previewSourceDigests.get(key) ?? preflightPayload.sourceDigest;

  assertSourceDigest(preflightPayload.sourceDigest, expectedSourceDigest);
  prepareDreamImport(preflightPayload.dreams);

  const transaction = await runLocalDataTransaction(
    {
      label: `dream-import-${mode}`,
      checkpointPolicy: 'best-effort',
    },
    async () => {
      const payload = await readDreamImportPayload(filePath);
      assertSourceDigest(payload.sourceDigest, expectedSourceDigest);

      const prepared = prepareDreamImport(payload.dreams);
      const preview = await restoreDreamImportPayload(
        { ...payload, dreams: prepared.dreams },
        filePath,
        mode,
      );
      return { preview, health: prepared.health };
    },
  ).catch(error => {
    if (error instanceof LocalDataTransactionError) {
      if (
        error.operationError instanceof DreamImportPreflightError ||
        error.operationError instanceof DreamBackupIntegrityError
      ) {
        throw error.operationError;
      }
    }
    throw error;
  });

  previewSourceDigests.delete(key);

  const { preview, health } = transaction.value;
  observability.trackEvent('dream_import_transaction_completed', {
    mode,
    integrity_status: preview.integrityStatus ?? 'legacy-unverified',
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
