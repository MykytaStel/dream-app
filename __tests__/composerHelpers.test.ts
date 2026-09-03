import {
  getComposerContentSignature,
  getTodayDate,
  toggleSelection,
  formatLocalAssetName,
} from '../src/features/dreams/components/composer/composerHelpers';

describe('getComposerContentSignature', () => {
  test('is stable for the same content and trims it', () => {
    expect(
      getComposerContentSignature({
        title: ' A ',
        text: 'body',
        sleepDate: '2026-09-03',
      }),
    ).toBe(
      getComposerContentSignature({
        title: 'A',
        text: ' body ',
        sleepDate: ' 2026-09-03 ',
      }),
    );
  });

  test('changes when any field changes', () => {
    const base = getComposerContentSignature({ text: 'a' });
    expect(getComposerContentSignature({ text: 'a', title: 'x' })).not.toBe(
      base,
    );
    expect(
      getComposerContentSignature({ text: 'a', audioUri: 'file://x' }),
    ).not.toBe(base);
  });

  test('a missing field and an empty field read the same', () => {
    expect(getComposerContentSignature({ text: 'a' })).toBe(
      getComposerContentSignature({ text: 'a', title: '', sleepDate: '' }),
    );
  });
});

describe('getTodayDate', () => {
  test('is a local YYYY-MM-DD date', () => {
    expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('toggleSelection', () => {
  test('adds a missing value and removes a present one', () => {
    expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('formatLocalAssetName', () => {
  test('returns the last path segment, or undefined for nothing', () => {
    expect(formatLocalAssetName('file:///var/recordings/dream-1.m4a')).toBe(
      'dream-1.m4a',
    );
    expect(formatLocalAssetName(undefined)).toBeUndefined();
  });
});
