import { kv } from '../services/storage/mmkv';
import { APP_LOCALE_KEY } from '../services/storage/keys';
import { AppLocale, isAppLocale } from './types';

function getSystemDefaultLocale(): AppLocale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith('uk') ? 'uk' : 'en';
}

export function getStoredLocale(): AppLocale {
  const raw = kv.getString(APP_LOCALE_KEY);
  if (isAppLocale(raw)) {
    return raw;
  }

  return getSystemDefaultLocale();
}

export function saveLocale(locale: AppLocale) {
  kv.set(APP_LOCALE_KEY, locale);
}
