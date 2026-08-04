import type { Dream } from '../src/features/dreams/model/dream';
import {
  getArchiveSearchMatchReasons,
  getArchiveSearchScore,
  matchesArchiveSpecialFilter,
} from '../src/features/dreams/model/archiveSearch';

describe('archiveSearch', () => {
  const titleMatch: Dream = {
    id: 'title-match',
    createdAt: new Date('2026-03-05T08:00:00.000Z').getTime(),
    sleepDate: '2026-03-05',
    title: 'Lantern room',
    text: 'A quiet room beside the sea.',
    tags: [],
  };
  const tagMatch: Dream = {
    id: 'tag-match',
    createdAt: new Date('2026-03-07T08:00:00.000Z').getTime(),
    sleepDate: '2026-03-07',
    title: 'Ocean room',
    tags: ['lantern'],
  };
  const transcriptMatch: Dream = {
    id: 'transcript-match',
    createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
    sleepDate: '2026-03-06',
    transcript: 'Lantern lantern over water',
    transcriptSource: 'generated',
    tags: [],
  };
  const contextMatch: Dream = {
    id: 'context-match',
    createdAt: new Date('2026-03-04T08:00:00.000Z').getTime(),
    sleepDate: '2026-03-04',
    title: 'Night walk',
    sleepContext: {
      importantEvents: 'Long conversation near the lantern shop',
    },
    tags: [],
  };

  test('reports the fields that matched the query', () => {
    expect(getArchiveSearchMatchReasons(titleMatch, 'lantern')).toEqual([
      'title',
    ]);
    expect(getArchiveSearchMatchReasons(tagMatch, 'lantern')).toEqual(['tag']);
    expect(getArchiveSearchMatchReasons(transcriptMatch, 'lantern')).toEqual([
      'transcript',
    ]);
    expect(getArchiveSearchMatchReasons(contextMatch, 'lantern')).toEqual([
      'context',
    ]);
    expect(getArchiveSearchMatchReasons(titleMatch, '')).toEqual([]);
  });

  test('ranks exact tag, title and transcript matches consistently', () => {
    expect(getArchiveSearchScore(tagMatch, 'lantern')).toBeGreaterThan(
      getArchiveSearchScore(titleMatch, 'lantern'),
    );
    expect(getArchiveSearchScore(titleMatch, 'lantern')).toBeGreaterThan(
      getArchiveSearchScore(transcriptMatch, 'lantern'),
    );
    expect(getArchiveSearchScore(titleMatch, '')).toBe(0);
  });

  test('keeps the all special filter neutral', () => {
    expect(matchesArchiveSpecialFilter(titleMatch, 'all')).toBe(true);
  });
});
