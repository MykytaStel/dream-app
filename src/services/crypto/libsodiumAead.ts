import sodium from 'react-native-libsodium';
import {
  ARCHIVE_KEY_BYTES,
  ARCHIVE_NONCE_BYTES,
  type AeadPrimitive,
} from './archiveCipher';

/**
 * The real XChaCha20-Poly1305 primitive.
 *
 * Deliberately thin: every decision that could be made wrong — framing, nonce
 * placement, version handling — lives in `archiveCipher`, where it is covered by
 * tests that run without a device. This file only forwards calls.
 */

let ready: Promise<void> | null = null;

/** libsodium loads asynchronously; call once before the first encrypt. */
export function initArchiveCrypto(): Promise<void> {
  if (!ready) {
    ready = sodium.ready;
  }
  return ready;
}

export const libsodiumAead: AeadPrimitive = {
  randomBytes(length: number) {
    return sodium.randombytes_buf(length);
  },

  encrypt(plaintext, nonce, key) {
    return sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      // No additional data: everything worth authenticating is inside the
      // plaintext, and the row's plaintext columns are not secrets.
      null,
      null,
      nonce,
      key,
    );
  },

  decrypt(ciphertext, nonce, key) {
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      key,
    );
  },
};

/** Generates a fresh archive key. */
export function generateArchiveKey(): Uint8Array {
  return sodium.randombytes_buf(ARCHIVE_KEY_BYTES);
}

/**
 * Fails loudly if the library's own constants ever stop matching ours, rather
 * than letting a size mismatch surface as an unreadable archive later.
 */
export function assertCryptoConstants(): void {
  const keyBytes = sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES;
  const nonceBytes = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;

  if (keyBytes !== ARCHIVE_KEY_BYTES || nonceBytes !== ARCHIVE_NONCE_BYTES) {
    throw new Error(
      `libsodium sizes changed: key ${keyBytes}, nonce ${nonceBytes}.`,
    );
  }
}
