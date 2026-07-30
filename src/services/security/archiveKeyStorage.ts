import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import RNFS from 'react-native-fs';
import { fromBase64, toBase64 } from '../crypto/archiveCipher';
import { ARCHIVE_KEY_BYTES } from '../crypto/recoveryCode';
import { reportError } from '../observability/errorReporting';

/**
 * Where the archive key lives, and how it reaches the user's next device.
 *
 * The goal is that a person who turns on sync never has to do anything: the key
 * follows their platform account. The recovery code exists for the cases this
 * cannot cover — moving between iOS and Android, or platform backup being
 * switched off — and only then.
 *
 * iOS: Keychain with cloudSync, so iCloud Keychain carries it.
 * Android: a file under archive-key/, the one path included in the backup
 * rules. Keystore is not used for storage because Keystore keys are
 * non-exportable and never leave the device, which is the opposite of what is
 * needed here.
 */

const KEYCHAIN_SERVICE = 'kaleidoscope.archive-key';
const KEYCHAIN_USERNAME = 'archive';
const ANDROID_KEY_DIRECTORY = `${RNFS.DocumentDirectoryPath}/archive-key`;
const ANDROID_KEY_FILE = `${ANDROID_KEY_DIRECTORY}/key`;

export type KeySyncAvailability =
  | { status: 'available'; via: 'icloud-keychain' | 'android-backup' }
  | { status: 'unavailable'; reason: string };

function assertKeySize(key: Uint8Array) {
  if (key.length !== ARCHIVE_KEY_BYTES) {
    throw new Error(`Archive key must be ${ARCHIVE_KEY_BYTES} bytes.`);
  }
}

export async function saveArchiveKey(key: Uint8Array): Promise<void> {
  assertKeySize(key);
  const encoded = toBase64(key);

  if (Platform.OS === 'ios') {
    await Keychain.setGenericPassword(KEYCHAIN_USERNAME, encoded, {
      service: KEYCHAIN_SERVICE,
      // Rides iCloud Keychain to the user's other devices.
      cloudSync: true,
      // Available after first unlock so a background sync can read it, but
      // never present on a device that has not been unlocked since boot.
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
    return;
  }

  await RNFS.mkdir(ANDROID_KEY_DIRECTORY);
  await RNFS.writeFile(ANDROID_KEY_FILE, encoded, 'utf8');
}

export async function loadArchiveKey(): Promise<Uint8Array | null> {
  try {
    if (Platform.OS === 'ios') {
      const stored = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
        cloudSync: true,
      });

      return stored ? fromBase64(stored.password) : null;
    }

    if (!(await RNFS.exists(ANDROID_KEY_FILE))) {
      return null;
    }

    return fromBase64(await RNFS.readFile(ANDROID_KEY_FILE, 'utf8'));
  } catch (error) {
    // A key that cannot be read is not the same as no key: reporting it means
    // "your archive is unreadable" gets noticed rather than looking like a
    // fresh install.
    reportError(error, { event: 'archive_key_read_failed' });
    return null;
  }
}

export async function deleteArchiveKey(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Keychain.resetGenericPassword({
      service: KEYCHAIN_SERVICE,
      cloudSync: true,
    });
    return;
  }

  if (await RNFS.exists(ANDROID_KEY_FILE)) {
    await RNFS.unlink(ANDROID_KEY_FILE);
  }
}

/**
 * Whether the key will actually reach another device on its own.
 *
 * Checked so the app can ask for the recovery code at the moment it becomes
 * necessary, instead of staying quiet and leaving someone with an archive only
 * one phone can open.
 */
export async function getKeySyncAvailability(): Promise<KeySyncAvailability> {
  if (Platform.OS === 'ios') {
    const supported = await Keychain.getSupportedBiometryType().catch(
      () => null,
    );

    // A Keychain that answers at all is a Keychain that can synchronise; the
    // user's iCloud Keychain switch is not readable from here, which is why the
    // recovery code stays available in settings regardless.
    return supported !== undefined
      ? { status: 'available', via: 'icloud-keychain' }
      : { status: 'unavailable', reason: 'keychain-unavailable' };
  }

  return { status: 'available', via: 'android-backup' };
}
