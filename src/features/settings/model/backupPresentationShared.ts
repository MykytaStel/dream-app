import { type AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';

export type SettingsCopy = ReturnType<typeof getSettingsCopy>;

export function fillTemplate(
  template: string,
  replacements: Record<string, string | number>,
) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

export function getPickerLocale(locale: AppLocale) {
  return locale === 'uk' ? 'uk-UA' : 'en-US';
}

export function formatBackupTimestamp(value: string, locale: AppLocale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(getPickerLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
