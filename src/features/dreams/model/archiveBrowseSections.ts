import {
  formatSelectedDate,
  getMonthKey,
  getMonthLabel,
  type ArchiveSection,
} from './archiveBrowser';
import { type Dream } from './dream';
import { sortDreamsNewestFirst } from './dreamList';
import { type ArchiveSurfaceMode } from './archiveSurface';

type BuildArchiveBrowseSectionsArgs = {
  dreams: Dream[];
  surfaceMode: ArchiveSurfaceMode;
  selectedMonthKey: string | null;
  selectedDate: string | null;
  locale: string;
};

export function buildArchiveBrowseSections({
  dreams,
  surfaceMode,
  selectedMonthKey,
  selectedDate,
  locale,
}: BuildArchiveBrowseSectionsArgs): ArchiveSection[] {
  const sortedDreams = sortDreamsNewestFirst(dreams);

  if (surfaceMode === 'calendar') {
    if (!selectedMonthKey) {
      return [];
    }

    return [
      {
        title: selectedDate
          ? formatSelectedDate(selectedDate, locale)
          : getMonthLabel(selectedMonthKey, locale),
        monthKey: selectedMonthKey,
        data: sortedDreams,
      },
    ];
  }

  const sections = new Map<string, Dream[]>();

  sortedDreams.forEach(dream => {
    const monthKey = getMonthKey(dream);
    const monthDreams = sections.get(monthKey) ?? [];
    monthDreams.push(dream);
    sections.set(monthKey, monthDreams);
  });

  return Array.from(sections, ([monthKey, data]) => ({
    title: getMonthLabel(monthKey, locale),
    monthKey,
    data,
  }));
}
