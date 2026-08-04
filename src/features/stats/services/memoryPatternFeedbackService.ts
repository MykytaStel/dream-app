import type { PatternDetailKind } from '../../../app/navigation/routes';
import { reportStorageReadFailure } from '../../../services/observability/errorReporting';
import { MEMORY_PATTERN_FEEDBACK_STORAGE_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';
import { normalizePatternSignal } from '../model/patternMatches';

export type MemoryPatternFeedbackStatus = 'confirmed' | 'dismissed';

export type MemoryPatternFeedbackRecord = {
  key: string;
  signal: string;
  kind: PatternDetailKind;
  status?: MemoryPatternFeedbackStatus;
  customTitle?: string;
  updatedAt: number;
};

type RawMemoryPatternFeedbackRecord = Partial<MemoryPatternFeedbackRecord>;

export function buildMemoryPatternKey(signal: string, kind: PatternDetailKind) {
  return `${kind}:${normalizePatternSignal(signal)}`;
}

function normalizeFeedbackRecord(
  value: RawMemoryPatternFeedbackRecord | null | undefined,
): MemoryPatternFeedbackRecord | null {
  if (!value?.signal || typeof value.signal !== 'string') {
    return null;
  }

  if (
    value.kind !== 'word' &&
    value.kind !== 'theme' &&
    value.kind !== 'symbol'
  ) {
    return null;
  }

  const signal = value.signal.trim();
  if (!signal) {
    return null;
  }

  const status =
    value.status === 'confirmed' || value.status === 'dismissed'
      ? value.status
      : undefined;
  const customTitle =
    typeof value.customTitle === 'string' && value.customTitle.trim()
      ? value.customTitle.trim()
      : undefined;

  if (!status && !customTitle) {
    return null;
  }

  return {
    key: buildMemoryPatternKey(signal, value.kind),
    signal,
    kind: value.kind,
    status,
    customTitle,
    updatedAt:
      typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
  };
}

function persistFeedback(records: MemoryPatternFeedbackRecord[]) {
  const next = records
    .slice()
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 40);
  kv.set(MEMORY_PATTERN_FEEDBACK_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getMemoryPatternFeedback() {
  const raw = kv.getString(MEMORY_PATTERN_FEEDBACK_STORAGE_KEY);
  if (!raw) {
    return [] as MemoryPatternFeedbackRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as RawMemoryPatternFeedbackRecord[];
    const seen = new Set<string>();

    return parsed
      .map(normalizeFeedbackRecord)
      .filter((record): record is MemoryPatternFeedbackRecord => {
        if (!record || seen.has(record.key)) {
          return false;
        }
        seen.add(record.key);
        return true;
      })
      .sort((left, right) => right.updatedAt - left.updatedAt);
  } catch (error) {
    reportStorageReadFailure(MEMORY_PATTERN_FEEDBACK_STORAGE_KEY, error);
    return [] as MemoryPatternFeedbackRecord[];
  }
}

function updatePatternFeedback(
  signal: string,
  kind: PatternDetailKind,
  updater: (
    current: MemoryPatternFeedbackRecord | undefined,
  ) => MemoryPatternFeedbackRecord | null,
) {
  const key = buildMemoryPatternKey(signal, kind);
  const current = getMemoryPatternFeedback();
  const existing = current.find(record => record.key === key);
  const nextRecord = updater(existing);
  const withoutCurrent = current.filter(record => record.key !== key);

  return persistFeedback(
    nextRecord ? [nextRecord, ...withoutCurrent] : withoutCurrent,
  );
}

export function confirmMemoryPattern(signal: string, kind: PatternDetailKind) {
  return updatePatternFeedback(signal, kind, current => ({
    key: buildMemoryPatternKey(signal, kind),
    signal: signal.trim(),
    kind,
    status: 'confirmed',
    customTitle: current?.customTitle,
    updatedAt: Date.now(),
  }));
}

export function dismissMemoryPattern(signal: string, kind: PatternDetailKind) {
  return updatePatternFeedback(signal, kind, current => ({
    key: buildMemoryPatternKey(signal, kind),
    signal: signal.trim(),
    kind,
    status: 'dismissed',
    customTitle: current?.customTitle,
    updatedAt: Date.now(),
  }));
}

export function renameMemoryPattern(
  signal: string,
  kind: PatternDetailKind,
  customTitle: string,
) {
  const normalizedTitle = customTitle.trim();

  return updatePatternFeedback(signal, kind, current => {
    if (!normalizedTitle && !current?.status) {
      return null;
    }

    return {
      key: buildMemoryPatternKey(signal, kind),
      signal: signal.trim(),
      kind,
      status: current?.status,
      customTitle: normalizedTitle || undefined,
      updatedAt: Date.now(),
    };
  });
}
