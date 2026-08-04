import { getDreamCopy } from '../src/constants/copy/dreams';
import {
  getArchiveSearchPlaceholder,
  getArchiveSurfaceOptions,
} from '../src/features/dreams/model/archiveSurface';

describe('archiveSurface', () => {
  test('exposes list first in both supported locales', () => {
    expect(getArchiveSurfaceOptions('en')).toEqual([
      { key: 'list', label: 'List' },
      { key: 'calendar', label: 'Calendar' },
    ]);
    expect(getArchiveSurfaceOptions('uk')).toEqual([
      { key: 'list', label: 'Список' },
      { key: 'calendar', label: 'Календар' },
    ]);
  });

  test('list search names the full archive scope', () => {
    expect(getArchiveSearchPlaceholder('list', 'en', getDreamCopy('en'))).toBe(
      'Search the full archive',
    );
    expect(getArchiveSearchPlaceholder('list', 'uk', getDreamCopy('uk'))).toBe(
      'Шукати в усьому архіві',
    );
  });

  test('calendar search keeps the existing localized copy', () => {
    const copy = getDreamCopy('en');

    expect(getArchiveSearchPlaceholder('calendar', 'en', copy)).toBe(
      copy.archiveSearchPlaceholder,
    );
  });
});
