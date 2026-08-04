import {
  countActiveArchiveFilters,
  DEFAULT_ARCHIVE_FILTER_SELECTION,
  getArchiveFilterSheetCopy,
} from '../src/features/dreams/model/archiveFilterSheet';

describe('archiveFilterSheet', () => {
  test('the default selection has no active filters', () => {
    expect(countActiveArchiveFilters(DEFAULT_ARCHIVE_FILTER_SELECTION)).toBe(0);
  });

  test('counts status, special and tag filters independently', () => {
    expect(
      countActiveArchiveFilters({
        filter: 'starred',
        specialFilter: 'nightmare',
        tagFilter: 'ocean',
      }),
    ).toBe(3);

    expect(
      countActiveArchiveFilters({
        filter: 'all',
        specialFilter: 'lucid',
        tagFilter: null,
      }),
    ).toBe(1);
  });

  test('does not count search or calendar state as sheet filters', () => {
    const selection = {
      ...DEFAULT_ARCHIVE_FILTER_SELECTION,
      tagFilter: 'forest',
    };

    expect(countActiveArchiveFilters(selection)).toBe(1);
  });

  test('provides localized sheet actions', () => {
    expect(getArchiveFilterSheetCopy('uk')).toMatchObject({
      triggerLabel: 'Фільтри',
      resetLabel: 'Скинути',
      applyLabel: 'Застосувати',
    });
    expect(getArchiveFilterSheetCopy('en')).toMatchObject({
      triggerLabel: 'Filters',
      resetLabel: 'Reset',
      applyLabel: 'Apply',
    });
  });
});
