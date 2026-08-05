import {
  formatStorageBytes,
  interpolateStorageCopy,
} from '../src/features/settings/model/storageDiagnosticsPresentation';

describe('storageDiagnosticsPresentation', () => {
  test('formats byte units without hiding small values', () => {
    expect(formatStorageBytes(0, 'en')).toBe('0 B');
    expect(formatStorageBytes(512, 'en')).toBe('512 B');
    expect(formatStorageBytes(1_536, 'en')).toBe('1.5 KB');
    expect(formatStorageBytes(5 * 1024 * 1024, 'en')).toBe('5.0 MB');
  });

  test('returns null for unavailable sizes and clamps negative values', () => {
    expect(formatStorageBytes(null, 'uk')).toBeNull();
    expect(formatStorageBytes(Number.NaN, 'uk')).toBeNull();
    expect(formatStorageBytes(-42, 'uk')).toBe('0 B');
  });

  test('interpolates known placeholders and preserves unknown ones', () => {
    expect(
      interpolateStorageCopy('Removed {count}; kept {unknown}.', { count: 3 }),
    ).toBe('Removed 3; kept {unknown}.');
  });
});
