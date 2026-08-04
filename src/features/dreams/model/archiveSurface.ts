import { type DreamCopy } from '../../../constants/copy/dreams';
import { type AppLocale } from '../../../i18n/types';

export type ArchiveSurfaceMode = 'list' | 'calendar';

export function getArchiveSurfaceOptions(
  locale: AppLocale,
): ReadonlyArray<{ key: ArchiveSurfaceMode; label: string }> {
  return [
    { key: 'list', label: locale === 'uk' ? 'Список' : 'List' },
    { key: 'calendar', label: locale === 'uk' ? 'Календар' : 'Calendar' },
  ];
}

export function getArchiveSearchPlaceholder(
  surfaceMode: ArchiveSurfaceMode,
  locale: AppLocale,
  copy: DreamCopy,
) {
  if (surfaceMode === 'calendar') {
    return copy.archiveSearchPlaceholder;
  }

  return locale === 'uk' ? 'Шукати в усьому архіві' : 'Search the full archive';
}
