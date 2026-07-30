/* eslint-disable no-bitwise -- base64 and UTF-8 are defined in terms of bit
   operations; writing them any other way would obscure what they do. */
/**
 * Framing for encrypted dream records.
 *
 * The primitive lives behind `AeadPrimitive` so this file stays pure: the
 * framing — version byte, nonce placement, base64 — is where mistakes are quiet
 * and expensive, so it is the part that must be testable without a device.
 * `libsodiumAead` supplies the real implementation.
 */

export const ARCHIVE_KEY_BYTES = 32;
export const ARCHIVE_NONCE_BYTES = 24;

/** Bumped only when the format changes; decryption reads it before anything else. */
export const CIPHER_VERSION = 1;

export type AeadPrimitive = {
  randomBytes(length: number): Uint8Array;
  encrypt(
    plaintext: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array,
  ): Uint8Array;
  decrypt(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array,
  ): Uint8Array;
};

export class ArchiveDecryptionError extends Error {
  constructor(
    readonly reason: 'version' | 'malformed' | 'authentication',
    readonly detail?: unknown,
  ) {
    super(`The record could not be decrypted (${reason}).`);
    this.name = 'ArchiveDecryptionError';
  }
}

// Base64 and UTF-8 are implemented here rather than taken from globals: React
// Native's provision of btoa, atob and TextEncoder varies by version and engine,
// and an encoding that silently differs between platforms would corrupt an
// archive on one device and not the other.

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let output = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const chunk =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const remaining = bytes.length - i;

    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += remaining > 1 ? BASE64_ALPHABET[(chunk >> 6) & 63] : '=';
    output += remaining > 2 ? BASE64_ALPHABET[chunk & 63] : '=';
  }

  return output;
}

export function fromBase64(value: string): Uint8Array {
  // Written with a character class so the literal does not open with `=`, which
  // reads as `/=` to both the linter and a hurried human.
  const clean = value.replace(/[=]+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    const index = BASE64_ALPHABET.indexOf(char);
    if (index < 0) {
      throw new ArchiveDecryptionError('malformed', `bad character ${char}`);
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

function encodeUtf8(text: string): Uint8Array {
  const bytes: number[] = [];

  for (const char of text) {
    let code = char.codePointAt(0) as number;

    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  return Uint8Array.from(bytes);
}

function decodeUtf8(bytes: Uint8Array): string {
  let output = '';
  let i = 0;

  while (i < bytes.length) {
    const byte = bytes[i];
    let code: number;
    let size: number;

    if (byte < 0x80) {
      code = byte;
      size = 1;
    } else if ((byte & 0xe0) === 0xc0) {
      code = byte & 0x1f;
      size = 2;
    } else if ((byte & 0xf0) === 0xe0) {
      code = byte & 0x0f;
      size = 3;
    } else {
      code = byte & 0x07;
      size = 4;
    }

    for (let j = 1; j < size; j += 1) {
      code = (code << 6) | (bytes[i + j] & 0x3f);
    }

    output += String.fromCodePoint(code);
    i += size;
  }

  return output;
}

/**
 * Encrypts one dream's content.
 *
 * A fresh nonce is drawn per call rather than derived from a counter: the
 * archive syncs from several devices that cannot see each other's counters, and
 * a repeated nonce with the same key is the one failure XChaCha20 does not
 * survive.
 */
export function encryptRecord(
  content: unknown,
  key: Uint8Array,
  aead: AeadPrimitive,
): string {
  if (key.length !== ARCHIVE_KEY_BYTES) {
    throw new ArchiveDecryptionError('malformed', 'wrong key size');
  }

  const nonce = aead.randomBytes(ARCHIVE_NONCE_BYTES);
  const plaintext = encodeUtf8(JSON.stringify(content));
  const sealed = aead.encrypt(plaintext, nonce, key);

  const framed = new Uint8Array(1 + nonce.length + sealed.length);
  framed[0] = CIPHER_VERSION;
  framed.set(nonce, 1);
  framed.set(sealed, 1 + nonce.length);

  return toBase64(framed);
}

export function decryptRecord<T = unknown>(
  ciphertext: string,
  key: Uint8Array,
  aead: AeadPrimitive,
): T {
  let framed: Uint8Array;
  try {
    framed = fromBase64(ciphertext);
  } catch (error) {
    throw new ArchiveDecryptionError('malformed', error);
  }

  if (framed.length <= 1 + ARCHIVE_NONCE_BYTES) {
    throw new ArchiveDecryptionError('malformed', 'too short');
  }

  const version = framed[0];
  if (version !== CIPHER_VERSION) {
    throw new ArchiveDecryptionError('version', version);
  }

  const nonce = framed.slice(1, 1 + ARCHIVE_NONCE_BYTES);
  const sealed = framed.slice(1 + ARCHIVE_NONCE_BYTES);

  let plaintext: Uint8Array;
  try {
    plaintext = aead.decrypt(sealed, nonce, key);
  } catch (error) {
    // A wrong key and a tampered payload are indistinguishable here, and that
    // is correct: both mean this record must not be trusted.
    throw new ArchiveDecryptionError('authentication', error);
  }

  try {
    return JSON.parse(decodeUtf8(plaintext)) as T;
  } catch (error) {
    throw new ArchiveDecryptionError('malformed', error);
  }
}
