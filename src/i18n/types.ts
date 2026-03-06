export const APP_LOCALES = ['en', 'uk'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'uk';
}
