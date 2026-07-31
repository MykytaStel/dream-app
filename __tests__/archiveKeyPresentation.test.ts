import { presentArchiveKey } from '../src/features/settings/model/archiveKeyPresentation';
import { ARCHIVE_KEY_REQUIRED } from '../src/services/crypto/archiveKeyService';

/**
 * The design decision under test is a negative one: turning on sync must not
 * ask the user for anything. Most of these assert that nothing is shown — which
 * is easy to break by adding a warning that feels responsible and is not.
 */

const ICLOUD = { status: 'available', via: 'icloud-keychain' } as const;
const ANDROID = { status: 'available', via: 'android-backup' } as const;
const UNAVAILABLE = {
  status: 'unavailable',
  reason: 'keychain-unavailable',
} as const;

describe('archive key presentation', () => {
  test('says nothing worth reading while the key travels on its own', () => {
    const result = presentArchiveKey({
      availability: ICLOUD,
      hasKey: true,
    });

    expect(result.tone).toBe('quiet');
    expect(result.shouldWarn).toBe(false);
    expect(result.showRecoveryCodeEntry).toBe(false);
    expect(result.statusCopyKey).toBe('archiveKeyTravelsIcloud');
  });

  test('names the mechanism per platform, because they fail differently', () => {
    expect(
      presentArchiveKey({ availability: ANDROID, hasKey: true }).statusCopyKey,
    ).toBe('archiveKeyTravelsAndroid');
  });

  test('the code is reachable without ever being pushed', () => {
    const result = presentArchiveKey({
      availability: ICLOUD,
      hasKey: true,
    });

    expect(result.canRevealRecoveryCode).toBe(true);
    expect(result.shouldWarn).toBe(false);
  });

  test('warns when the key would be stranded on this phone', () => {
    const result = presentArchiveKey({
      availability: UNAVAILABLE,
      hasKey: true,
    });

    expect(result.tone).toBe('attention');
    expect(result.shouldWarn).toBe(true);
    expect(result.statusCopyKey).toBe('archiveKeyStranded');
    // Warning without offering the remedy in the same breath would be noise.
    expect(result.canRevealRecoveryCode).toBe(true);
  });

  test('asks for the code only when the archive cannot be opened', () => {
    const result = presentArchiveKey({
      availability: ICLOUD,
      hasKey: true,
      lastSyncErrorMessage: ARCHIVE_KEY_REQUIRED,
    });

    expect(result.tone).toBe('blocking');
    expect(result.showRecoveryCodeEntry).toBe(true);
    expect(result.statusCopyKey).toBe('archiveKeyMissingForArchive');
  });

  test('a blocked archive outranks a healthy-looking key sync', () => {
    // iCloud says the key would travel fine. It is still the wrong key, and
    // saying "all good" here would be the most misleading screen in the app.
    const result = presentArchiveKey({
      availability: ICLOUD,
      hasKey: true,
      lastSyncErrorMessage: ARCHIVE_KEY_REQUIRED,
    });

    expect(result.tone).not.toBe('quiet');
  });

  test('an ordinary sync failure is not treated as a key problem', () => {
    const result = presentArchiveKey({
      availability: ICLOUD,
      hasKey: true,
      lastSyncErrorMessage: 'network-request-failed',
    });

    expect(result.tone).toBe('quiet');
    expect(result.showRecoveryCodeEntry).toBe(false);
  });

  test('before the first sync there is no key, and nothing to say about it', () => {
    const result = presentArchiveKey({
      availability: ICLOUD,
      hasKey: false,
    });

    expect(result.shouldWarn).toBe(false);
    expect(result.canRevealRecoveryCode).toBe(false);
    expect(result.statusCopyKey).toBe('archiveKeyNotYetCreated');
  });

  test('a missing key with a blocked archive still asks for the code', () => {
    // Reinstalled without a backup: the archive exists, this device has
    // nothing. The code is the only way back in.
    const result = presentArchiveKey({
      availability: UNAVAILABLE,
      hasKey: false,
      lastSyncErrorMessage: ARCHIVE_KEY_REQUIRED,
    });

    expect(result.showRecoveryCodeEntry).toBe(true);
    expect(result.canRevealRecoveryCode).toBe(false);
  });
});
