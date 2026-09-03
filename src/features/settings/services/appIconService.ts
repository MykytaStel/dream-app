import NativeAppIcon from '../../../specs/NativeAppIcon';
import { APP_ICON_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

/**
 * The home-screen icon the user can choose.
 *
 * The OS remembers the choice on its own (an alternate icon name on iOS, an
 * enabled launcher alias on Android), so the native module is the source of
 * truth. The id is also cached in storage so the settings screen can show the
 * right selection without waiting on an async call, and so an export carries it.
 *
 * The module is absent on Android for now — `NativeAppIcon` is null there and
 * every function below degrades to "not supported".
 */

export type AppIconId = 'default' | 'ivory' | 'sage' | 'night' | 'mono';

export const APP_ICON_IDS: readonly AppIconId[] = [
  'default',
  'ivory',
  'sage',
  'night',
  'mono',
];

function isAppIconId(value: string): value is AppIconId {
  return (APP_ICON_IDS as readonly string[]).includes(value);
}

export function appIconsSupported(): boolean {
  return NativeAppIcon != null;
}

/** The cached id, for a synchronous first paint. Reconciled by `syncAppIcon`. */
export function getCachedAppIconId(): AppIconId {
  const raw = kv.getString(APP_ICON_KEY);
  return raw && isAppIconId(raw) ? raw : 'default';
}

/** Reads the live icon from the OS and refreshes the cache. */
export async function syncAppIcon(): Promise<AppIconId> {
  if (!NativeAppIcon) {
    return getCachedAppIconId();
  }

  try {
    const current = await NativeAppIcon.getIcon();
    const id = isAppIconId(current) ? current : 'default';
    kv.set(APP_ICON_KEY, id);
    return id;
  } catch {
    return getCachedAppIconId();
  }
}

/**
 * Switches the icon and updates the cache. iOS shows its own confirmation
 * alert. Throws when the platform cannot change the icon or the id is unknown.
 */
export async function setAppIcon(id: AppIconId): Promise<void> {
  if (!NativeAppIcon) {
    throw new Error('Changing the app icon is not supported on this device.');
  }

  await NativeAppIcon.setIcon(id);
  kv.set(APP_ICON_KEY, id);
}
