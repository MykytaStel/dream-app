const mockNativeAppIcon = {
  isSupported: jest.fn(),
  getIcon: jest.fn(),
  setIcon: jest.fn(),
};
let mockModulePresent = true;
let mockPlatformOS: 'ios' | 'android' = 'ios';
const mockStore = new Map<string, string>();

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
  },
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

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
    remove: (k: string) => mockStore.delete(k),
  },
}));

import {
  appIconsSupported,
  applyPendingAppIcon,
  getCachedAppIconId,
  setAppIcon,
  syncAppIcon,
} from '../src/features/settings/services/appIconService';
import {
  APP_ICON_KEY,
  APP_ICON_PENDING_KEY,
} from '../src/services/storage/keys';

beforeEach(() => {
  mockStore.clear();
  mockModulePresent = true;
  mockPlatformOS = 'ios';
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

describe('setAppIcon on iOS', () => {
  test('calls native and caches the new id', async () => {
    await setAppIcon('mono');
    expect(mockNativeAppIcon.setIcon).toHaveBeenCalledWith('mono');
    expect(mockStore.get(APP_ICON_KEY)).toBe('mono');
    expect(mockStore.has(APP_ICON_PENDING_KEY)).toBe(false);
  });

  test('does not cache when native rejects', async () => {
    mockNativeAppIcon.setIcon.mockRejectedValue(new Error('unsupported'));
    await expect(setAppIcon('sage')).rejects.toThrow('unsupported');
    expect(mockStore.has(APP_ICON_KEY)).toBe(false);
  });
});

describe('setAppIcon on Android', () => {
  beforeEach(() => {
    mockPlatformOS = 'android';
  });

  test('defers the switch: caches the choice, stores it pending, no native call', async () => {
    await setAppIcon('night');
    expect(mockNativeAppIcon.setIcon).not.toHaveBeenCalled();
    expect(mockStore.get(APP_ICON_KEY)).toBe('night');
    expect(mockStore.get(APP_ICON_PENDING_KEY)).toBe('night');
  });

  test('applyPendingAppIcon runs the deferred switch and clears the pending flag', () => {
    mockStore.set(APP_ICON_PENDING_KEY, 'night');
    applyPendingAppIcon();
    expect(mockNativeAppIcon.setIcon).toHaveBeenCalledWith('night');
    expect(mockStore.has(APP_ICON_PENDING_KEY)).toBe(false);
  });

  test('applyPendingAppIcon is a no-op when nothing is pending', () => {
    applyPendingAppIcon();
    expect(mockNativeAppIcon.setIcon).not.toHaveBeenCalled();
  });

  test('syncAppIcon returns the cached choice while a switch is pending', async () => {
    mockStore.set(APP_ICON_KEY, 'night');
    mockStore.set(APP_ICON_PENDING_KEY, 'night');
    mockNativeAppIcon.getIcon.mockResolvedValue('default');
    await expect(syncAppIcon()).resolves.toBe('night');
    expect(mockNativeAppIcon.getIcon).not.toHaveBeenCalled();
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

describe('when the native module is absent', () => {
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
