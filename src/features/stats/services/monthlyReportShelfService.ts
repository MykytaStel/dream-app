import { kv } from '../../../services/storage/mmkv';
import { MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY } from '../../../services/storage/keys';

type MonthlyReportShelfRecord = {
  monthKey: string;
  savedAt: number;
};

function normalizeRecord(
  value: Partial<MonthlyReportShelfRecord> | null | undefined,
): MonthlyReportShelfRecord | null {
  if (!value?.monthKey || typeof value.monthKey !== 'string') {
    return null;
  }

  return {
    monthKey: value.monthKey,
    savedAt:
      typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
        ? value.savedAt
        : Date.now(),
  };
}

export function getSavedMonthlyReportMonths() {
  const raw = kv.getString(MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY);
  if (!raw) {
    return [] as MonthlyReportShelfRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<MonthlyReportShelfRecord>>;
    return parsed
      .map(normalizeRecord)
      .filter((item): item is MonthlyReportShelfRecord => Boolean(item))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [] as MonthlyReportShelfRecord[];
  }
}

function persistSavedMonthlyReportMonths(records: MonthlyReportShelfRecord[]) {
  kv.set(MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY, JSON.stringify(records.slice(0, 12)));
}

export function toggleSavedMonthlyReportMonth(monthKey: string) {
  const current = getSavedMonthlyReportMonths();
  const existing = current.find(item => item.monthKey === monthKey);

  if (existing) {
    const next = current.filter(item => item.monthKey !== monthKey);
    persistSavedMonthlyReportMonths(next);
    return next;
  }

  const nextRecord: MonthlyReportShelfRecord = {
    monthKey,
    savedAt: Date.now(),
  };
  const next = [nextRecord, ...current.filter(item => item.monthKey !== monthKey)];
  persistSavedMonthlyReportMonths(next);
  return next;
}

export function isMonthlyReportMonthSaved(monthKey: string) {
  return getSavedMonthlyReportMonths().some(item => item.monthKey === monthKey);
}
