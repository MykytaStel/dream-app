import {
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import type { Dream, Mood } from '../model/dream';
import { sanitizeDream, sortDreamsStable } from '../model/dreamRules';

export type DreamDerivedStoreStatus =
  'current' | 'missing' | 'invalid' | 'stale';

export type DreamDerivedDataHealth = {
  indexStatus: DreamDerivedStoreStatus;
  metaStatus: DreamDerivedStoreStatus;
  expectedIndexCount: number;
  expectedMonthCount: number;
};

type DerivedDreamListItem = {
  id: string;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number;
  starredAt?: number;
  sleepDate?: string;
  title?: string;
  mood?: Dream['mood'];
  hasAudio: boolean;
  transcriptPreview?: string;
  textPreview?: string;
};

type DerivedDreamsMeta = {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  starredCount: number;
  audioOnlyCount: number;
  latestSleepDate?: string;
  monthKeys: string[];
};

type CanonicalDerivedData = {
  index: DerivedDreamListItem[];
  meta: DerivedDreamsMeta;
};

const MOOD_VALUES: readonly Mood[] = [
  'neutral',
  'positive',
  'negative',
  'peaceful',
  'joyful',
  'mysterious',
  'nostalgic',
  'melancholic',
  'anxious',
  'dark',
  'surreal',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isOptionalFiniteNumber(value: unknown) {
  return (
    value === undefined || (typeof value === 'number' && Number.isFinite(value))
  );
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function toLocalDateKey(epoch: number) {
  const date = new Date(epoch);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getDreamMonthKey(dream: Pick<Dream, 'createdAt' | 'sleepDate'>) {
  const dateKey = dream.sleepDate || toLocalDateKey(dream.createdAt);
  return dateKey.slice(0, 7);
}

function buildDreamListItem(dream: Dream): DerivedDreamListItem {
  const textPreview = dream.text?.trim() || undefined;
  const transcriptPreview = dream.transcript?.trim() || undefined;

  return {
    id: dream.id,
    createdAt: dream.createdAt,
    updatedAt: dream.updatedAt,
    archivedAt: dream.archivedAt,
    starredAt: dream.starredAt,
    sleepDate: dream.sleepDate,
    title: dream.title?.trim() || undefined,
    mood: dream.mood,
    hasAudio: Boolean(dream.audioUri?.trim()),
    transcriptPreview,
    textPreview,
  };
}

function buildDreamsMeta(dreams: Dream[]): DerivedDreamsMeta {
  const monthKeys = Array.from(new Set(dreams.map(getDreamMonthKey))).sort(
    (left, right) => right.localeCompare(left),
  );

  return {
    totalCount: dreams.length,
    activeCount: dreams.filter(dream => typeof dream.archivedAt !== 'number')
      .length,
    archivedCount: dreams.filter(dream => typeof dream.archivedAt === 'number')
      .length,
    starredCount: dreams.filter(dream => typeof dream.starredAt === 'number')
      .length,
    audioOnlyCount: dreams.filter(
      dream =>
        Boolean(dream.audioUri?.trim()) &&
        !dream.text?.trim() &&
        !dream.transcript?.trim(),
    ).length,
    latestSleepDate: dreams[0]?.sleepDate,
    monthKeys,
  };
}

function buildCanonicalDerivedData(dreams: Dream[]): CanonicalDerivedData {
  const normalized = sortDreamsStable(dreams.map(sanitizeDream));
  return {
    index: normalized.map(buildDreamListItem),
    meta: buildDreamsMeta(normalized),
  };
}

function normalizeDreamListItem(raw: unknown): DerivedDreamListItem | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id.trim()) {
    return null;
  }

  if (
    typeof raw.createdAt !== 'number' ||
    !Number.isFinite(raw.createdAt) ||
    !isOptionalFiniteNumber(raw.updatedAt) ||
    !isOptionalFiniteNumber(raw.archivedAt) ||
    !isOptionalFiniteNumber(raw.starredAt) ||
    !isOptionalString(raw.sleepDate) ||
    !isOptionalString(raw.title) ||
    !isOptionalString(raw.transcriptPreview) ||
    !isOptionalString(raw.textPreview) ||
    typeof raw.hasAudio !== 'boolean'
  ) {
    return null;
  }

  if (
    raw.mood !== undefined &&
    (typeof raw.mood !== 'string' || !MOOD_VALUES.includes(raw.mood as Mood))
  ) {
    return null;
  }

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt as number | undefined,
    archivedAt: raw.archivedAt as number | undefined,
    starredAt: raw.starredAt as number | undefined,
    sleepDate: raw.sleepDate as string | undefined,
    title: raw.title as string | undefined,
    mood: raw.mood as Mood | undefined,
    hasAudio: raw.hasAudio,
    transcriptPreview: raw.transcriptPreview as string | undefined,
    textPreview: raw.textPreview as string | undefined,
  };
}

function normalizeDreamsMeta(raw: unknown): DerivedDreamsMeta | null {
  if (!isRecord(raw) || !Array.isArray(raw.monthKeys)) {
    return null;
  }

  if (
    !isCount(raw.totalCount) ||
    !isCount(raw.activeCount) ||
    !isCount(raw.archivedCount) ||
    !isCount(raw.starredCount) ||
    !isCount(raw.audioOnlyCount) ||
    !isOptionalString(raw.latestSleepDate)
  ) {
    return null;
  }

  const monthKeys = raw.monthKeys.filter(
    (value): value is string => typeof value === 'string',
  );
  if (monthKeys.length !== raw.monthKeys.length) {
    return null;
  }

  return {
    totalCount: raw.totalCount,
    activeCount: raw.activeCount,
    archivedCount: raw.archivedCount,
    starredCount: raw.starredCount,
    audioOnlyCount: raw.audioOnlyCount,
    latestSleepDate: raw.latestSleepDate as string | undefined,
    monthKeys,
  };
}

function inspectIndex(
  expected: DerivedDreamListItem[],
): DreamDerivedStoreStatus {
  const raw = kv.getString(DREAMS_INDEX_STORAGE_KEY);
  if (raw === undefined) {
    return 'missing';
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return 'invalid';
    }

    const normalized = parsed.map(normalizeDreamListItem);
    if (normalized.some(item => item === null)) {
      return 'invalid';
    }

    return JSON.stringify(normalized) === JSON.stringify(expected)
      ? 'current'
      : 'stale';
  } catch {
    return 'invalid';
  }
}

function inspectMeta(expected: DerivedDreamsMeta): DreamDerivedStoreStatus {
  const raw = kv.getString(DREAMS_META_STORAGE_KEY);
  if (raw === undefined) {
    return 'missing';
  }

  try {
    const normalized = normalizeDreamsMeta(JSON.parse(raw) as unknown);
    if (!normalized) {
      return 'invalid';
    }

    return JSON.stringify(normalized) === JSON.stringify(expected)
      ? 'current'
      : 'stale';
  } catch {
    return 'invalid';
  }
}

/**
 * Reads and compares the two regenerable dream stores without mutating them.
 * This is intentionally separate from listDreamListItems/getDreamsMeta, whose
 * normal application behavior is to rebuild missing or malformed values.
 */
export function inspectDreamDerivedData(
  dreams: Dream[],
): DreamDerivedDataHealth {
  const expected = buildCanonicalDerivedData(dreams);
  return {
    indexStatus: inspectIndex(expected.index),
    metaStatus: inspectMeta(expected.meta),
    expectedIndexCount: expected.index.length,
    expectedMonthCount: expected.meta.monthKeys.length,
  };
}

/**
 * Rebuilds only regenerable index/meta values. The source dream collection is
 * never rewritten and no widget, sync, reminder, or review side effect runs.
 */
export function rebuildDreamDerivedData(dreams: Dream[]) {
  const expected = buildCanonicalDerivedData(dreams);
  kv.set(DREAMS_INDEX_STORAGE_KEY, JSON.stringify(expected.index));
  kv.set(DREAMS_META_STORAGE_KEY, JSON.stringify(expected.meta));

  return {
    indexCount: expected.index.length,
    monthCount: expected.meta.monthKeys.length,
  };
}
