import type { Dream } from '../src/features/dreams/model/dream';
import * as textUtils from '../src/utils/text';
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

  test('folds each searchable field only once per score', () => {
    const dream: Dream = {
      id: 'folding',
      createdAt: new Date('2026-03-09T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-09',
      title: 'Lantern room',
      text: 'a lantern over the lantern water',
      transcript: 'lantern lantern lantern',
      tags: ['lantern'],
      sleepContext: { importantEvents: 'the lantern shop' },
    };

    const spy = jest.spyOn(textUtils, 'normalizeUnicode');
    getArchiveSearchScore(dream, 'lantern');

    // one fold for the query, then one per non-empty field/tag (title, text,
    // transcript, importantEvents, tag) — not three per field as before.
    expect(spy.mock.calls.length).toBeLessThanOrEqual(6);
    spy.mockRestore();
  });

  test('matches across Unicode normalization forms', () => {
    // Text stored with a decomposed accent ("e" + U+0301), query typed with a
    // precomposed one (U+00E9). Without normalization .includes() misses it.
    const decomposedText = 'A stroll along the café terrace';
    const precomposedQuery = 'café';

    const dream: Dream = {
      id: 'accent-match',
      createdAt: new Date('2026-03-08T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-08',
      text: decomposedText,
      tags: [],
    };

    expect(getArchiveSearchMatchReasons(dream, precomposedQuery)).toEqual([
      'notes',
    ]);
    expect(getArchiveSearchScore(dream, precomposedQuery)).toBeGreaterThan(0);
  });
});
