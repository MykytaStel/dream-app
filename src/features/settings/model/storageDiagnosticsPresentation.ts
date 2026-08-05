import { AppLocale } from '../../../i18n/types';

const KIB = 1024;
const MIB = KIB * 1024;
const GIB = MIB * 1024;

export function formatStorageBytes(
  value: number | null | undefined,
  locale: AppLocale,
): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const bytes = Math.max(0, value);
  const numberLocale = locale === 'uk' ? 'uk-UA' : 'en-US';
  const format = (amount: number, maximumFractionDigits: number) =>
    new Intl.NumberFormat(numberLocale, {
      maximumFractionDigits,
      minimumFractionDigits: amount < 10 ? 1 : 0,
    }).format(amount);

  if (bytes >= GIB) {
    return `${format(bytes / GIB, 2)} GB`;
  }
  if (bytes >= MIB) {
    return `${format(bytes / MIB, 1)} MB`;
  }
  if (bytes >= KIB) {
    return `${format(bytes / KIB, 1)} KB`;
  }
  return `${Math.round(bytes)} B`;
}

export function formatStorageUpdatedAt(value: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function interpolateStorageCopy(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : `{${key}}`,
  );
}
