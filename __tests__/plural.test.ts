import { formatCount, pluralize } from '../src/i18n/plural';

const ENTRIES = {
  en: { one: 'entry', other: 'entries' },
  uk: { one: 'запис', few: 'записи', many: 'записів' },
};

describe('pluralize', () => {
  test.each([
    [0, 'entries'],
    [1, 'entry'],
    [2, 'entries'],
    [11, 'entries'],
    [21, 'entries'],
  ])('English %i', (count, expected) => {
    expect(pluralize(count, 'en', ENTRIES)).toBe(expected);
  });

  // The full shape of the Ukrainian rule, including the 11-14 exception that
  // makes a naive "last digit" implementation wrong.
  test.each([
    [0, 'записів'],
    [1, 'запис'],
    [2, 'записи'],
    [3, 'записи'],
    [4, 'записи'],
    [5, 'записів'],
    [9, 'записів'],
    [10, 'записів'],
    [11, 'записів'],
    [12, 'записів'],
    [13, 'записів'],
    [14, 'записів'],
    [15, 'записів'],
    [21, 'запис'],
    [22, 'записи'],
    [25, 'записів'],
    [31, 'запис'],
    [100, 'записів'],
    [101, 'запис'],
    [111, 'записів'],
    [112, 'записів'],
    [121, 'запис'],
    [122, 'записи'],
  ])('Ukrainian %i', (count, expected) => {
    expect(pluralize(count, 'uk', ENTRIES)).toBe(expected);
  });

  test('negative counts use the same forms as their absolute value', () => {
    expect(pluralize(-1, 'uk', ENTRIES)).toBe(pluralize(1, 'uk', ENTRIES));
    expect(pluralize(-13, 'uk', ENTRIES)).toBe(pluralize(13, 'uk', ENTRIES));
    expect(pluralize(-1, 'en', ENTRIES)).toBe('entry');
  });
});

describe('formatCount', () => {
  test('prefixes the number', () => {
    expect(formatCount(1, 'uk', ENTRIES)).toBe('1 запис');
    expect(formatCount(11, 'uk', ENTRIES)).toBe('11 записів');
    expect(formatCount(2, 'en', ENTRIES)).toBe('2 entries');
  });
});
