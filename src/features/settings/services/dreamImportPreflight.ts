import type { Dream } from '../../dreams/model/dream';
import {
  isValidSleepDate,
  sanitizeDream,
  validateDreamForSave,
} from '../../dreams/model/dreamRules';
import type { DreamBackup } from './dataExportService';

type RecordShape = Record<string, unknown>;

export type DreamImportHealth = {
  canRestore: true;
  warningCount: number;
  normalizedDreamCount: number;
  invalidSleepDateCount: number;
  staleTranscriptCount: number;
  deviceBoundAudioReferenceCount: number;
};

export type PreparedDreamImport = {
  dreams: DreamBackup[];
  health: DreamImportHealth;
};

export class DreamImportPreflightError extends Error {
  readonly code:
    'invalid-dream-record' | 'duplicate-dream-id' | 'invalid-dream-content';
  readonly recordIndex?: number;

  constructor(
    code: DreamImportPreflightError['code'],
    message: string,
    recordIndex?: number,
  ) {
    super(message);
    this.name = 'DreamImportPreflightError';
    this.code = code;
    this.recordIndex = recordIndex;
  }
}

function isRecord(value: unknown): value is RecordShape {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stableComparableDream(dream: DreamBackup) {
  const comparable = { ...dream } as Record<string, unknown>;
  delete comparable.syncStatus;
  delete comparable.syncError;
  return comparable;
}

/**
 * Validates every imported record before restore can acquire the transaction
 * lock. The output is the normalized collection that will actually be written,
 * so preview and execution cannot disagree about record counts or content.
 * Error messages identify only a record position, never a dream id or content.
 */
export function prepareDreamImport(dreams: unknown[]): PreparedDreamImport {
  const ids = new Set<string>();
  const normalizedDreams: DreamBackup[] = [];
  let normalizedDreamCount = 0;
  let invalidSleepDateCount = 0;
  let staleTranscriptCount = 0;
  let deviceBoundAudioReferenceCount = 0;

  dreams.forEach((rawDream, index) => {
    if (!isRecord(rawDream)) {
      throw new DreamImportPreflightError(
        'invalid-dream-record',
        `Backup dream at position ${index + 1} is not an object.`,
        index,
      );
    }

    const id = typeof rawDream.id === 'string' ? rawDream.id.trim() : '';
    const createdAt = rawDream.createdAt;
    if (!id || typeof createdAt !== 'number' || !Number.isFinite(createdAt)) {
      throw new DreamImportPreflightError(
        'invalid-dream-record',
        `Backup dream at position ${index + 1} is missing a valid id or creation time.`,
        index,
      );
    }

    if (ids.has(id)) {
      throw new DreamImportPreflightError(
        'duplicate-dream-id',
        `Backup contains duplicate dream identities near position ${index + 1}.`,
        index,
      );
    }
    ids.add(id);

    let normalized: Dream;
    try {
      normalized = sanitizeDream(rawDream as Dream);
    } catch {
      throw new DreamImportPreflightError(
        'invalid-dream-record',
        `Backup dream at position ${index + 1} could not be normalized.`,
        index,
      );
    }

    const validationError = validateDreamForSave(normalized);
    if (validationError) {
      throw new DreamImportPreflightError(
        'invalid-dream-content',
        `Backup dream at position ${index + 1} is not saveable: ${validationError}.`,
        index,
      );
    }

    if (
      typeof rawDream.sleepDate === 'string' &&
      rawDream.sleepDate.trim() &&
      !isValidSleepDate(rawDream.sleepDate.trim())
    ) {
      invalidSleepDateCount += 1;
    }

    if (
      rawDream.transcriptStatus === 'processing' &&
      normalized.transcriptStatus === 'error'
    ) {
      staleTranscriptCount += 1;
    }

    if (typeof normalized.audioUri === 'string' && normalized.audioUri.trim()) {
      // Local restore JSON stores a device path, not audio bytes. The reference
      // may still be valid when restoring on the same device, but it is not
      // portable and must be surfaced rather than silently promised as backup.
      deviceBoundAudioReferenceCount += 1;
    }

    const backupDream = normalized as DreamBackup;
    let rawComparable: Record<string, unknown>;
    try {
      rawComparable = stableComparableDream(rawDream as DreamBackup);
    } catch {
      rawComparable = rawDream;
    }
    if (
      JSON.stringify(rawComparable) !==
      JSON.stringify(stableComparableDream(backupDream))
    ) {
      normalizedDreamCount += 1;
    }

    normalizedDreams.push(backupDream);
  });

  const warningCount =
    normalizedDreamCount +
    invalidSleepDateCount +
    staleTranscriptCount +
    deviceBoundAudioReferenceCount;

  return {
    dreams: normalizedDreams,
    health: {
      canRestore: true,
      warningCount,
      normalizedDreamCount,
      invalidSleepDateCount,
      staleTranscriptCount,
      deviceBoundAudioReferenceCount,
    },
  };
}
