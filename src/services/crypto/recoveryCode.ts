import { entropyToMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * Turns the archive key into words a person can write down, and back.
 *
 * This is the safety net, not the front door: the key normally travels through
 * iCloud Keychain or Android backup and the user never sees it. The code
 * appears when platform sync is unavailable, when moving between iOS and
 * Android, or when someone deliberately asks for a paper copy.
 *
 * BIP39 is used rather than a hand-rolled encoding because it carries a
 * checksum — a single mistyped or swapped word is caught immediately instead of
 * silently producing a key that decrypts nothing. Reimplementing that badly, at
 * the one moment a user is already in trouble, is not a risk worth taking.
 */

export const ARCHIVE_KEY_BYTES = 32;
/** 256 bits of entropy encodes as 24 words. */
export const RECOVERY_WORD_COUNT = 24;

export class InvalidRecoveryCodeError extends Error {
  constructor(readonly cause: unknown) {
    super('The recovery code could not be read.');
    this.name = 'InvalidRecoveryCodeError';
  }
}

/**
 * Splits on any run of whitespace so a pasted code survives line breaks, double
 * spaces and a trailing newline — all of which happen when copying from a note.
 */
export function normalizeRecoveryCode(input: string): string {
  return input.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

export function encodeRecoveryCode(key: Uint8Array): string {
  if (key.length !== ARCHIVE_KEY_BYTES) {
    throw new InvalidRecoveryCodeError(
      `Expected ${ARCHIVE_KEY_BYTES} bytes, received ${key.length}.`,
    );
  }

  return entropyToMnemonic(key, wordlist);
}

export function decodeRecoveryCode(code: string): Uint8Array {
  try {
    return mnemonicToEntropy(normalizeRecoveryCode(code), wordlist);
  } catch (error) {
    throw new InvalidRecoveryCodeError(error);
  }
}

/** True when the input is a complete, checksum-valid code. */
export function isRecoveryCodeValid(code: string): boolean {
  try {
    decodeRecoveryCode(code);
    return true;
  } catch {
    return false;
  }
}
