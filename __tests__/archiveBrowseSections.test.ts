import type { Dream } from '../src/features/dreams/model/dream';
import { buildArchiveBrowseSections } from '../src/features/dreams/model/archiveBrowseSections';

function createDream(
  id: string,
  sleepDate: string,
  createdAt: string,
): Dream {
  return {
    id,
    sleepDate,
    createdAt: new Date(createdAt).getTime(),
    title: id,
    tags: [],
  };
}

describe('archiveBrowseSections', () => {
  const marchOlder = createDream(
    'march-older',
    '2026-03-02',
    '2026-03-02T08:00:00.000Z',
  );
  const marchNewer = createDream(
    'march-newer',
    '2026-03-08',
    '2026-03-08T08:00:00.000Z',
  );
  const april = createDream(
    'april',
    '2026-04-01',
    '2026-04-01T08:00:00.000Z',
  );

  test('list mode groups the full journal newest month first', () => {
    const sections = buildArchiveBrowseSections({
      dreams: [marchOlder, april, marchNewer],
      surfaceMode: 'list',
      selectedMonthKey: null,
      selectedDate: null,
      locale: 'en-US',
    });

    expect(sections.map(section => section.monthKey)).toEqual([
      '2026-04',
      '2026-03',
    ]);
    expect(sections[0].data.map(dream => dream.id)).toEqual(['april']);
    expect(sections[1].data.map(dream => dream.id)).toEqual([
      'march-newer',
      'march-older',
    ]);
  });

  test('calendar mode keeps one selected month section', () => {
    const sections = buildArchiveBrowseSections({
      dreams: [marchOlder, marchNewer],
      surfaceMode: 'calendar',
      selectedMonthKey: '2026-03',
      selectedDate: null,
      locale: 'en-US',
    });

    expect(sections).toHaveLength(1);
    expect(sections[0].monthKey).toBe('2026-03');
    expect(sections[0].title).toMatch(/March 2026/i);
    expect(sections[0].data.map(dream => dream.id)).toEqual([
      'march-newer',
      'march-older',
    ]);
  });

  test('calendar mode uses the selected date as its section title', () => {
    const sections = buildArchiveBrowseSections({
      dreams: [marchNewer],
      surfaceMode: 'calendar',
      selectedMonthKey: '2026-03',
      selectedDate: '2026-03-08',
      locale: 'en-US',
    });

    expect(sections[0].title).toMatch(/Mar 8, 2026/i);
  });

  test('calendar mode has no sections without an available month', () => {
    expect(
      buildArchiveBrowseSections({
        dreams: [],
        surfaceMode: 'calendar',
        selectedMonthKey: null,
        selectedDate: null,
        locale: 'en-US',
      }),
    ).toEqual([]);
  });
});
