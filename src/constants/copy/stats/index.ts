import { AppLocale } from '../../../i18n/types';
import { STATS_COPY_EN, type StatsCopy } from './en';
import { STATS_COPY_UK } from './uk';

export { STATS_COPY_EN, STATS_COPY_UK };
export type { StatsCopy };

export function getStatsCopy(locale: AppLocale): StatsCopy {
  return locale === 'uk' ? STATS_COPY_UK : STATS_COPY_EN;
}
