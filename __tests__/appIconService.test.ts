const mockNativeAppIcon = {
  isSupported: jest.fn(),
  getIcon: jest.fn(),
  setIcon: jest.fn(),
};
let mockModulePresent = true;
const mockStore = new Map<string, string>();

jest.mock('../src/specs/NativeAppIcon', () => ({
  __esModule: true,
  get default() {
    return mockModulePresent ? mockNativeAppIcon : null;
  },
}));

jest.mock('../src/services/storage/mmkv', () => ({
  kv: {
    getString: (k: string) => mockStore.get(k),
    set: (k: string, v: string) => mockStore.set(k, v),
  },
}));

import {
  appIconsSupported,
  getCachedAppIconId,
  setAppIcon,
  syncAppIcon,
} from '../src/features/settings/services/appIconService';
import { APP_ICON_KEY } from '../src/services/storage/keys';

beforeEach(() => {
  mockStore.clear();
  mockModulePresent = true;
  mockNativeAppIcon.isSupported.mockReset();
  mockNativeAppIcon.getIcon.mockReset();
  mockNativeAppIcon.setIcon.mockReset().mockResolvedValue(undefined);
});

describe('getCachedAppIconId', () => {
  test('is default when nothing is stored or the value is junk', () => {
    expect(getCachedAppIconId()).toBe('default');
    mockStore.set(APP_ICON_KEY, 'not-an-icon');
    expect(getCachedAppIconId()).toBe('default');
  });

  test('returns a stored valid id', () => {
    mockStore.set(APP_ICON_KEY, 'sage');
    expect(getCachedAppIconId()).toBe('sage');
  });
});

describe('syncAppIcon', () => {
  test('reads the live icon and caches it', async () => {
    mockNativeAppIcon.getIcon.mockResolvedValue('night');
    await expect(syncAppIcon()).resolves.toBe('night');
    expect(mockStore.get(APP_ICON_KEY)).toBe('night');
  });

  test('falls back to the cache when the native call fails', async () => {
    mockStore.set(APP_ICON_KEY, 'ivory');
    mockNativeAppIcon.getIcon.mockRejectedValue(new Error('boom'));
    await expect(syncAppIcon()).resolves.toBe('ivory');
  });

  test('normalises an unknown native value to default', async () => {
    mockNativeAppIcon.getIcon.mockResolvedValue('AppIcon-Legacy');
    await expect(syncAppIcon()).resolves.toBe('default');
  });
});

describe('setAppIcon', () => {
  test('calls native and caches the new id', async () => {
    await setAppIcon('mono');
    expect(mockNativeAppIcon.setIcon).toHaveBeenCalledWith('mono');
    expect(mockStore.get(APP_ICON_KEY)).toBe('mono');
  });

  test('does not cache when native rejects', async () => {
    mockNativeAppIcon.setIcon.mockRejectedValue(new Error('unsupported'));
    await expect(setAppIcon('sage')).rejects.toThrow('unsupported');
    expect(mockStore.has(APP_ICON_KEY)).toBe(false);
  });
});

describe('when the native module is absent (Android for now)', () => {
  beforeEach(() => {
    mockModulePresent = false;
  });

  test('reports unsupported and never throws on read', async () => {
    expect(appIconsSupported()).toBe(false);
    await expect(syncAppIcon()).resolves.toBe('default');
  });

  test('setAppIcon rejects rather than pretending it worked', async () => {
    await expect(setAppIcon('ivory')).rejects.toThrow(/not supported/i);
  });
});
