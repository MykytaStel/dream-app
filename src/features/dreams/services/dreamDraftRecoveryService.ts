import { reportStorageReadFailure } from '../../../services/observability/errorReporting';
import {
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import { scheduleDreamWidgetSync } from '../../widgets/services/dreamWidgetSyncService';
import {
  type DreamDraft,
  getDreamDraft,
  getDreamEditDraft,
} from './dreamDraftService';

export type DreamDraftRecoveryStatus =
  'missing' | 'ready' | 'discarded-corrupt' | 'discarded-stale';

export type DreamDraftRecoveryResult = {
  status: DreamDraftRecoveryStatus;
  draft: DreamDraft | null;
};

const STRING_FIELDS = [
  'title',
  'text',
  'sleepDate',
  'audioUri',
  'mood',
  'dreamIntensity',
  'medications',
  'importantEvents',
  'healthNotes',
  'lucidTechnique',
  'lucidTrigger',
  'nightmareRecurringKey',
  'nightmareRewrittenEnding',
  'nightmareRescriptStatus',
] as const;

const NUMBER_FIELDS = [
  'updatedAt',
  'lucidity',
  'stressLevel',
  'recallScore',
  'nightmareDistress',
] as const;

const BOOLEAN_FIELDS = [
  'alcoholTaken',
  'caffeineLate',
  'nightmareExplicit',
  'nightmareRecurring',
  'nightmareWokeFromDream',
] as const;

const STRING_ARRAY_FIELDS = [
  'wakeEmotions',
  'preSleepEmotions',
  'tags',
  'dreamSigns',
  'controlAreas',
  'stabilizationActions',
  'nightmareAftereffects',
  'nightmareGroundingUsed',
] as const;

function hasExpectedStoredDraftShape(
  value: unknown,
): value is Partial<DreamDraft> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  for (const field of STRING_FIELDS) {
    const stored = record[field];
    if (stored !== undefined && typeof stored !== 'string') {
      return false;
    }
  }

  for (const field of NUMBER_FIELDS) {
    const stored = record[field];
    if (
      stored !== undefined &&
      (typeof stored !== 'number' || !Number.isFinite(stored))
    ) {
      return false;
    }
  }

  for (const field of BOOLEAN_FIELDS) {
    const stored = record[field];
    if (stored !== undefined && typeof stored !== 'boolean') {
      return false;
    }
  }

  for (const field of STRING_ARRAY_FIELDS) {
    const stored = record[field];
    if (
      stored !== undefined &&
      (!Array.isArray(stored) || stored.some(item => typeof item !== 'string'))
    ) {
      return false;
    }
  }

  if (
    record.entryMode !== undefined &&
    record.entryMode !== 'default' &&
    record.entryMode !== 'voice' &&
    record.entryMode !== 'wake'
  ) {
    return false;
  }

  return true;
}

function discardCorruptDraft(
  storageKey: string,
  error: unknown,
  onDiscard?: () => void,
): DreamDraftRecoveryResult {
  reportStorageReadFailure(storageKey, error);
  kv.remove(storageKey);
  onDiscard?.();

  return {
    status: 'discarded-corrupt',
    draft: null,
  };
}

function readStoredDraft(
  storageKey: string,
  readNormalized: () => DreamDraft | null,
  onDiscard?: () => void,
): DreamDraftRecoveryResult {
  const raw = kv.getString(storageKey);
  if (raw === undefined) {
    return {
      status: 'missing',
      draft: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!hasExpectedStoredDraftShape(parsed)) {
      throw new Error('Stored dream draft has an invalid shape.');
    }
  } catch (error) {
    return discardCorruptDraft(storageKey, error, onDiscard);
  }

  const draft = readNormalized();
  if (!draft) {
    // The normalizer already reports its own read failure. This boundary owns
    // cleanup and the explicit result so the same broken payload is not retried
    // every time the composer opens.
    kv.remove(storageKey);
    onDiscard?.();
    return {
      status: 'discarded-corrupt',
      draft: null,
    };
  }

  return {
    status: 'ready',
    draft,
  };
}

export function readDreamDraftForRecovery(): DreamDraftRecoveryResult {
  return readStoredDraft(DREAM_DRAFT_STORAGE_KEY, getDreamDraft, () =>
    scheduleDreamWidgetSync({ draftSnapshot: null }),
  );
}

export function readDreamEditDraftForRecovery(
  dreamId: string,
  savedDreamUpdatedAt?: number,
): DreamDraftRecoveryResult {
  const storageKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}${dreamId}`;
  const result = readStoredDraft(storageKey, () => getDreamEditDraft(dreamId));

  if (
    result.status === 'ready' &&
    typeof savedDreamUpdatedAt === 'number' &&
    (result.draft?.updatedAt ?? 0) <= savedDreamUpdatedAt
  ) {
    kv.remove(storageKey);
    return {
      status: 'discarded-stale',
      draft: null,
    };
  }

  return result;
}
