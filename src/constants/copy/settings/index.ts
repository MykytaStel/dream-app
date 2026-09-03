import { AppLocale } from '../../../i18n/types';
import { SETTINGS_COPY_EN, type SettingsCopy } from './en';
import { SETTINGS_COPY_UK } from './uk';

export { SETTINGS_COPY_EN, SETTINGS_COPY_UK };
export type { SettingsCopy };

export function getSettingsCopy(locale: AppLocale): SettingsCopy {
  return locale === 'uk' ? SETTINGS_COPY_UK : SETTINGS_COPY_EN;
}
