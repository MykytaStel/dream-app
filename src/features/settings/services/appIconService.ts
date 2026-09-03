import { AppState, Platform } from 'react-native';
import NativeAppIcon from '../../../specs/NativeAppIcon';
import {
  APP_ICON_KEY,
  APP_ICON_PENDING_KEY,
} from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

/**
 * The home-screen icon the user can choose.
 *
 * The OS remembers the choice on its own — an alternate icon name on iOS, an
 * enabled launcher alias on Android — so `syncAppIcon` treats the native module
 * as the source of truth. The id is also cached so the settings screen paints
 * the right selection without waiting on an async call.
 *
 * Android quirk: flipping the launcher alias tears down the visible activity,
 * so on Android the switch is deferred and applied when the app next goes to
 * the background. iOS applies it immediately.
 *
 * The module is absent where the platform cannot change the icon — `NativeAppIcon`
 * is null and every function below degrades to "not supported".
 */

export type AppIconId = 'default' | 'ivory' | 'sage' | 'night' | 'mono';

export const APP_ICON_IDS: readonly AppIconId[] = [
  'default',
  'ivory',
  'sage',
  'night',
  'mono',
];

function isAppIconId(value: string | undefined): value is AppIconId {
  return value != null && (APP_ICON_IDS as readonly string[]).includes(value);
}

export function appIconsSupported(): boolean {
  return NativeAppIcon != null;
}

/** The cached id, for a synchronous first paint. Reconciled by `syncAppIcon`. */
export function getCachedAppIconId(): AppIconId {
  const raw = kv.getString(APP_ICON_KEY);
  return isAppIconId(raw) ? raw : 'default';
}

/**
 * The live icon from the OS, cache refreshed. When an Android switch is still
 * pending, the cache wins — the OS has not caught up yet.
 */
export async function syncAppIcon(): Promise<AppIconId> {
  if (!NativeAppIcon) {
    return getCachedAppIconId();
  }

  if (isAppIconId(kv.getString(APP_ICON_PENDING_KEY))) {
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
 * Records the choice. iOS applies it now (the system shows its own alert);
 * Android stores it and `applyPendingAppIcon` runs it on the next backgrounding.
 * Throws when the platform cannot change the icon or the id is unknown.
 */
export async function setAppIcon(id: AppIconId): Promise<void> {
  if (!NativeAppIcon) {
    throw new Error('Changing the app icon is not supported on this device.');
  }

  if (Platform.OS === 'android') {
    kv.set(APP_ICON_KEY, id);
    kv.set(APP_ICON_PENDING_KEY, id);
    return;
  }

  await NativeAppIcon.setIcon(id);
  kv.set(APP_ICON_KEY, id);
}

/** Applies a deferred Android switch. Safe to call when nothing is pending. */
export function applyPendingAppIcon(): void {
  if (Platform.OS !== 'android' || !NativeAppIcon) {
    return;
  }

  const pending = kv.getString(APP_ICON_PENDING_KEY);
  if (!isAppIconId(pending)) {
    return;
  }

  kv.remove(APP_ICON_PENDING_KEY);
  NativeAppIcon.setIcon(pending).catch(() => {
    // The alias flip failed or the process is already going down; the choice
    // stays in APP_ICON_KEY and syncAppIcon reconciles on the next launch.
  });
}

if (Platform.OS === 'android') {
  AppState.addEventListener('change', state => {
    if (state === 'background') {
      applyPendingAppIcon();
    }
  });
}
