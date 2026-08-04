import { act, renderHook } from '@testing-library/react-native';
import { getDreamCopy } from '../src/constants/copy/dreams';
import { useArchiveBrowseState } from '../src/features/dreams/hooks/useArchiveBrowseState';
import type { Dream } from '../src/features/dreams/model/dream';

const copy = getDreamCopy('en');

function at(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 9, 0).getTime();
}

type DreamOverrides = Partial<Dream> & { id: string; createdAt: number };

function makeDream({ id, createdAt, ...rest }: DreamOverrides): Dream {
  return {
    id,
    createdAt,
    archivedAt: createdAt,
    tags: [],
    ...rest,
  };
}

const lucidOceanDream = makeDream({
  id: 'lucid-ocean',
  createdAt: at(2026, 4, 18),
  lucidity: 2,
  tags: ['ocean'],
});
const lucidForestDream = makeDream({
  id: 'lucid-forest',
  createdAt: at(2026, 4, 12),
  lucidity: 2,
  tags: ['forest'],
});
const ordinaryOceanDream = makeDream({
  id: 'ordinary-ocean',
  createdAt: at(2026, 4, 8),
  tags: ['ocean'],
});

function renderArchive() {
  return renderHook(() =>
    useArchiveBrowseState({
      dreams: [lucidOceanDream, lucidForestDream, ordinaryOceanDream],
      copy,
      locale: 'en',
    }),
  );
}

describe('Archive filter sheet application', () => {
  test('sets the whole selection exactly instead of toggling refinements', async () => {
    const { result } = await renderArchive();
    const selection = {
      filter: 'archived' as const,
      specialFilter: 'lucid' as const,
      tagFilter: 'ocean',
    };

    await act(async () => result.current.applyFilterSelection(selection));

    expect(result.current.filter).toBe('archived');
    expect(result.current.specialFilter).toBe('lucid');
    expect(result.current.tagFilter).toBe('ocean');
    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'lucid-ocean',
    ]);

    await act(async () => result.current.applyFilterSelection(selection));

    expect(result.current.specialFilter).toBe('lucid');
    expect(result.current.tagFilter).toBe('ocean');
    expect(result.current.visibleDreams.map(dream => dream.id)).toEqual([
      'lucid-ocean',
    ]);
  });

  test('clears a selected calendar day but preserves the search query', async () => {
    const { result } = await renderArchive();

    await act(async () => result.current.selectSurfaceMode('calendar'));
    await act(async () => result.current.selectCalendarDate('2026-04-18'));
    await act(async () => result.current.setSearchQuery('ocean'));

    await act(async () =>
      result.current.applyFilterSelection({
        filter: 'all',
        specialFilter: 'all',
        tagFilter: null,
      }),
    );

    expect(result.current.selectedDate).toBeNull();
    expect(result.current.searchQuery).toBe('ocean');
  });
});
