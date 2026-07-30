import { AppLocale } from './types';

export type PluralForms = {
  en: { one: string; other: string };
  uk: { one: string; few: string; many: string };
};

/**
 * Picks the right noun form for a count.
 *
 * Ukrainian needs three forms, and the rule has one trap: 11 to 14 take the
 * "many" form even though they end in 1 to 4. This lived in four separate
 * copies across the archive and stats models, which is three chances for one
 * of them to be fixed and the others forgotten.
 */
export function pluralize(
  count: number,
  locale: AppLocale,
  forms: PluralForms,
): string {
  if (locale !== 'uk') {
    return Math.abs(count) === 1 ? forms.en.one : forms.en.other;
  }

  const absolute = Math.abs(count);
  const lastTwo = absolute % 100;
  const last = absolute % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return forms.uk.many;
  }

  if (last === 1) {
    return forms.uk.one;
  }

  if (last >= 2 && last <= 4) {
    return forms.uk.few;
  }

  return forms.uk.many;
}

/** The same rule, prefixed with the number, which is how it is used everywhere. */
export function formatCount(
  count: number,
  locale: AppLocale,
  forms: PluralForms,
): string {
  return `${count} ${pluralize(count, locale, forms)}`;
}
