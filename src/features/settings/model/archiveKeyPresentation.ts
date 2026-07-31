import type { KeySyncAvailability } from '../../../services/security/archiveKeyStorage';
import { ARCHIVE_KEY_REQUIRED } from '../../../services/crypto/archiveKeyService';

/**
 * What the settings screen says about the archive key, and when it says
 * anything at all.
 *
 * The spec's decision was that turning on sync asks the user for nothing. The
 * hard part of honouring that is not the silent case — it is knowing when
 * silence stops being honest. Three situations break it, and this decides which
 * one applies:
 *
 * 1. The key cannot travel on its own. Staying quiet would leave someone with
 *    an archive only one phone can ever open, and they would find out when that
 *    phone is already gone.
 * 2. The server holds an archive this device's key cannot open. Nothing can be
 *    synced until the recovery code is entered, so asking is the only move.
 * 3. Someone deliberately went looking for the code. Always available, never
 *    volunteered.
 */

export type ArchiveKeyState = {
  availability: KeySyncAvailability;
  hasKey: boolean;
  /** The last sync's error, if it had one. */
  lastSyncErrorMessage?: string;
};

export type ArchiveKeyTone = 'quiet' | 'attention' | 'blocking';

export type ArchiveKeyPresentation = {
  tone: ArchiveKeyTone;
  /** Which copy key describes the current situation. */
  statusCopyKey:
    | 'archiveKeyTravelsIcloud'
    | 'archiveKeyTravelsAndroid'
    | 'archiveKeyStranded'
    | 'archiveKeyMissingForArchive'
    | 'archiveKeyNotYetCreated';
  /** Whether to offer revealing the 24 words. */
  canRevealRecoveryCode: boolean;
  /** Whether to offer the input for entering someone else's code. */
  showRecoveryCodeEntry: boolean;
  /**
   * True only where a warning is earned. A notice everyone sees and almost
   * nobody needs teaches people to dismiss notices.
   */
  shouldWarn: boolean;
};

export function presentArchiveKey(
  state: ArchiveKeyState,
): ArchiveKeyPresentation {
  // Checked first: it does not matter how well the key would travel if the
  // archive on the server cannot be opened with it.
  if (state.lastSyncErrorMessage === ARCHIVE_KEY_REQUIRED) {
    return {
      tone: 'blocking',
      statusCopyKey: 'archiveKeyMissingForArchive',
      canRevealRecoveryCode: state.hasKey,
      showRecoveryCodeEntry: true,
      shouldWarn: true,
    };
  }

  if (!state.hasKey) {
    // No key yet means sync has never run. Nothing to show, nothing to warn
    // about, and nothing to write down — the key is created on first sync.
    return {
      tone: 'quiet',
      statusCopyKey: 'archiveKeyNotYetCreated',
      canRevealRecoveryCode: false,
      showRecoveryCodeEntry: false,
      shouldWarn: false,
    };
  }

  if (state.availability.status === 'unavailable') {
    return {
      tone: 'attention',
      statusCopyKey: 'archiveKeyStranded',
      canRevealRecoveryCode: true,
      showRecoveryCodeEntry: false,
      shouldWarn: true,
    };
  }

  return {
    tone: 'quiet',
    statusCopyKey:
      state.availability.via === 'icloud-keychain'
        ? 'archiveKeyTravelsIcloud'
        : 'archiveKeyTravelsAndroid',
    canRevealRecoveryCode: true,
    showRecoveryCodeEntry: false,
    shouldWarn: false,
  };
}
