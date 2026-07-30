import { getDreamCopy } from '../src/constants/copy/dreams';
import { getSettingsCopy } from '../src/constants/copy/settings';
import { getStatsCopy } from '../src/constants/copy/stats';
import { getPracticeCopy } from '../src/constants/copy/practice';
import { getOnboardingCopy } from '../src/constants/copy/onboarding';
import { getWidgetCopy } from '../src/constants/copy/widgets';

/**
 * Every UK copy object is built as `{ ...EN, ...overrides }`, which means the
 * type checker is satisfied whether or not a string was actually translated:
 * a forgotten key silently keeps its English value.
 *
 * This test closes that hole by comparing values. A UK string identical to its
 * English counterpart is treated as untranslated unless it is listed below,
 * which forces the decision to be made once and written down.
 */

/**
 * Keys whose English and Ukrainian values are the same on purpose.
 * Adding a key here is a claim that translating it would be wrong.
 */
const IDENTICAL_ON_PURPOSE: Record<string, string[]> = {
  // Brand names and product nouns are not translated.
  dreams: ['dreamCardShareTitle', 'dreamCardWatermark', 'sleepDatePlaceholder'],
  settings: [
    'footerBuildLabel',
    'biometricLockAppName',
    'themeOptionKaleido',
    'themeOptionEmber',
    'themeOptionMoss',
    // Language codes are written the same way in both interfaces.
    'languageEnglish',
    'languageUkrainian',
    // Third-party product names and their field labels.
    'cloudConfigUrlLabel',
    'cloudConfigAnonKeyLabel',
    'cloudIdentityEmailLabel',
  ],
  // WBTB is an established acronym in lucid dreaming practice, used as-is.
  practice: ['wbtbTitle'],
  stats: [],
  onboarding: [],
  widgets: [],
};

type CopyModule = {
  name: string;
  en: Record<string, unknown>;
  uk: Record<string, unknown>;
};

const MODULES: CopyModule[] = [
  { name: 'dreams', en: getDreamCopy('en'), uk: getDreamCopy('uk') },
  { name: 'settings', en: getSettingsCopy('en'), uk: getSettingsCopy('uk') },
  { name: 'stats', en: getStatsCopy('en'), uk: getStatsCopy('uk') },
  { name: 'practice', en: getPracticeCopy('en'), uk: getPracticeCopy('uk') },
  {
    name: 'onboarding',
    en: getOnboardingCopy('en'),
    uk: getOnboardingCopy('uk'),
  },
  { name: 'widgets', en: getWidgetCopy('en'), uk: getWidgetCopy('uk') },
];

function findUntranslated({ name, en, uk }: CopyModule): string[] {
  const allowed = new Set(IDENTICAL_ON_PURPOSE[name] ?? []);

  return Object.keys(en).filter(key => {
    const value = en[key];
    if (typeof value !== 'string' || value.trim() === '') {
      return false;
    }

    return value === uk[key] && !allowed.has(key);
  });
}

describe('copy translation parity', () => {
  test.each(MODULES.map(m => [m.name, m] as const))(
    '%s has no untranslated strings',
    (_name, module) => {
      expect(findUntranslated(module)).toEqual([]);
    },
  );

  test('every key present in English is present in Ukrainian', () => {
    for (const { name, en, uk } of MODULES) {
      const missing = Object.keys(en).filter(key => !(key in uk));
      expect({ module: name, missing }).toEqual({ module: name, missing: [] });
    }
  });

  test('the allowlist has no stale entries', () => {
    // An entry that no longer matches means the string was translated after
    // all, or the key was renamed. Either way the list should shrink.
    for (const { name, en, uk } of MODULES) {
      const stale = (IDENTICAL_ON_PURPOSE[name] ?? []).filter(
        key => !(key in en) || en[key] !== uk[key],
      );
      expect({ module: name, stale }).toEqual({ module: name, stale: [] });
    }
  });
});
