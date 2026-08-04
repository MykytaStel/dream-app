import type { Dream } from '../src/features/dreams/model/dream';
import { getArchiveBrowseResult } from '../src/features/dreams/model/archiveBrowseQuery';

function createDream(overrides: Partial<Dream> & Pick<Dream, 'id'>): Dream {
  return {
    createdAt: new Date('2026-03-01T08:00:00.000Z').getTime(),
    sleepDate: '2026-03-01',
    title: overrides.id,
    tags: [],
    ...overrides,
  };
}

describe('archiveBrowseQuery', () => {
  test('applies status and month scope before returning visible dreams', () => {
    const archivedMarchOlder = createDream({
      id: 'archived-march-older',
      sleepDate: '2026-03-02',
      createdAt: new Date('2026-03-02T08:00:00.000Z').getTime(),
      archivedAt: 1,
    });
    const archivedMarchNewer = createDream({
      id: 'archived-march-newer',
      sleepDate: '2026-03-08',
      createdAt: new Date('2026-03-08T08:00:00.000Z').getTime(),
      archivedAt: 2,
    });
    const activeMarch = createDream({
      id: 'active-march',
      sleepDate: '2026-03-09',
    });
    const archivedApril = createDream({
      id: 'archived-april',
      sleepDate: '2026-04-01',
      archivedAt: 3,
    });

    const result = getArchiveBrowseResult({
      dreams: [
        archivedMarchOlder,
        activeMarch,
        archivedApril,
        archivedMarchNewer,
      ],
      filter: 'archived',
      selectedMonthKey: '2026-03',
      tagFilter: null,
      specialFilter: 'all',
      searchQuery: '',
      selectedDate: null,
    });

    expect(result.statusScopedDreams.map(dream => dream.id)).toEqual([
      'archived-march-older',
      'archived-april',
      'archived-march-newer',
    ]);
    expect(result.monthDreams.map(dream => dream.id)).toEqual([
      'archived-march-older',
      'archived-march-newer',
    ]);
    expect(result.visibleDreams.map(dream => dream.id)).toEqual([
      'archived-march-newer',
      'archived-march-older',
    ]);
  });

  test('normalizes hyphenated tags before applying search', () => {
    const matching = createDream({
      id: 'matching',
      sleepDate: '2026-03-05',
      archivedAt: 1,
      title: 'Lantern over water',
      tags: ['night-flight'],
    });
    const wrongTag = createDream({
      id: 'wrong-tag',
      sleepDate: '2026-03-06',
      archivedAt: 2,
      title: 'Lantern in a room',
      tags: ['indoors'],
    });

    const result = getArchiveBrowseResult({
      dreams: [wrongTag, matching],
      filter: 'archived',
      selectedMonthKey: '2026-03',
      tagFilter: 'night flight',
      specialFilter: 'all',
      searchQuery: 'lantern',
      selectedDate: null,
    });

    expect(result.visibleDreams.map(dream => dream.id)).toEqual(['matching']);
  });

  test('composes special filter, search and selected date', () => {
    const matching = createDream({
      id: 'matching-lucid',
      sleepDate: '2026-03-12',
      archivedAt: 1,
      lucidity: 2,
      transcript: 'A silver bridge appeared.',
      tags: [],
    });
    const nonLucid = createDream({
      id: 'non-lucid',
      sleepDate: '2026-03-12',
      archivedAt: 2,
      transcript: 'A silver bridge appeared.',
      tags: [],
    });
    const wrongDate = createDream({
      id: 'wrong-date',
      sleepDate: '2026-03-13',
      archivedAt: 3,
      lucidity: 2,
      transcript: 'A silver bridge appeared.',
      tags: [],
    });

    const result = getArchiveBrowseResult({
      dreams: [nonLucid, wrongDate, matching],
      filter: 'archived',
      selectedMonthKey: '2026-03',
      tagFilter: null,
      specialFilter: 'lucid',
      searchQuery: 'silver bridge',
      selectedDate: '2026-03-12',
    });

    expect(result.searchedMonthDreams.map(dream => dream.id)).toEqual([
      'wrong-date',
      'matching-lucid',
    ]);
    expect(result.visibleDreams.map(dream => dream.id)).toEqual([
      'matching-lucid',
    ]);
  });

  test('keeps status scope available when no month is selected', () => {
    const archived = createDream({ id: 'archived', archivedAt: 1 });

    const result = getArchiveBrowseResult({
      dreams: [archived],
      filter: 'archived',
      selectedMonthKey: null,
      tagFilter: null,
      specialFilter: 'all',
      searchQuery: '',
      selectedDate: null,
    });

    expect(result.statusScopedDreams).toEqual([archived]);
    expect(result.monthDreams).toEqual([]);
    expect(result.searchedMonthDreams).toEqual([]);
    expect(result.visibleDreams).toEqual([]);
  });
});
