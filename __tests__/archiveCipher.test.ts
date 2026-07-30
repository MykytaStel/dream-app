/* eslint-disable no-bitwise -- the fake primitive and the byte-level
   assertions work on bits by nature. */
import {
  ARCHIVE_KEY_BYTES,
  ARCHIVE_NONCE_BYTES,
  ArchiveDecryptionError,
  CIPHER_VERSION,
  decryptRecord,
  encryptRecord,
  fromBase64,
  toBase64,
  type AeadPrimitive,
} from '../src/services/crypto/archiveCipher';

/**
 * A stand-in for XChaCha20-Poly1305 that keeps the properties the framing
 * depends on: the key and nonce both affect the output, and any change to the
 * sealed bytes is detected. It is emphatically not encryption — it exists so
 * the framing can be tested without a device, which is where the quiet mistakes
 * live.
 */
function createFakeAead(): AeadPrimitive & { nonceCalls: number } {
  let counter = 0;

  const mask = (data: Uint8Array, nonce: Uint8Array, key: Uint8Array) =>
    data.map((byte, i) => byte ^ key[i % key.length] ^ nonce[i % nonce.length]);

  const checksum = (data: Uint8Array) =>
    data.reduce((sum, byte) => (sum + byte) % 251, 7);

  return {
    get nonceCalls() {
      return counter;
    },
    randomBytes(length) {
      counter += 1;
      // Distinct per call, so a repeated nonce shows up as a test failure.
      return Uint8Array.from({ length }, (_, i) => (counter * 31 + i) % 256);
    },
    encrypt(plaintext, nonce, key) {
      const body = mask(plaintext, nonce, key);
      const sealed = new Uint8Array(body.length + 1);
      sealed.set(body);
      sealed[body.length] = checksum(body);
      return sealed;
    },
    decrypt(ciphertext, nonce, key) {
      const body = ciphertext.slice(0, -1);
      if (ciphertext[ciphertext.length - 1] !== checksum(body)) {
        throw new Error('authentication failed');
      }
      return mask(body, nonce, key);
    },
  };
}

function makeKey(fill: number): Uint8Array {
  return Uint8Array.from(
    { length: ARCHIVE_KEY_BYTES },
    (_, i) => (fill + i) % 256,
  );
}

const DREAM = {
  title: 'The glass ocean',
  text: 'I was falling and could not wake up',
  tags: ['water', 'falling'],
  mood: 'anxious',
};

describe('archive record framing', () => {
  test('a record survives the round trip', () => {
    const aead = createFakeAead();

    expect(
      decryptRecord(encryptRecord(DREAM, makeKey(1), aead), makeKey(1), aead),
    ).toEqual(DREAM);
  });

  test('the plaintext never appears in the ciphertext', () => {
    const aead = createFakeAead();
    const sealed = encryptRecord(DREAM, makeKey(1), aead);

    // The property the whole feature exists for.
    expect(sealed).not.toContain('glass ocean');
    const raw = String.fromCharCode(...fromBase64(sealed));
    expect(raw).not.toContain('glass ocean');
    expect(raw).not.toContain('falling');
  });

  test('encrypting the same content twice gives different output', () => {
    const aead = createFakeAead();

    // A repeated nonce under one key is the failure XChaCha20 does not survive,
    // and several devices encrypt the same archive without seeing each other.
    expect(encryptRecord(DREAM, makeKey(1), aead)).not.toBe(
      encryptRecord(DREAM, makeKey(1), aead),
    );
  });

  test('another key cannot read the record', () => {
    const aead = createFakeAead();
    const sealed = encryptRecord(DREAM, makeKey(1), aead);

    expect(() => decryptRecord(sealed, makeKey(2), aead)).toThrow(
      ArchiveDecryptionError,
    );
  });

  test('a tampered payload is rejected rather than half read', () => {
    const aead = createFakeAead();
    const raw = fromBase64(encryptRecord(DREAM, makeKey(1), aead));
    raw[raw.length - 2] ^= 0xff;
    const tampered = toBase64(raw);

    expect(() => decryptRecord(tampered, makeKey(1), aead)).toThrow(
      ArchiveDecryptionError,
    );
  });

  test('the version byte comes first and is checked', () => {
    const aead = createFakeAead();
    const raw = fromBase64(encryptRecord(DREAM, makeKey(1), aead));

    expect(raw[0]).toBe(CIPHER_VERSION);

    raw[0] = 99;
    const future = toBase64(raw);
    expect(() => decryptRecord(future, makeKey(1), aead)).toThrow(
      expect.objectContaining({ reason: 'version' }),
    );
  });

  test('a truncated record is refused', () => {
    const aead = createFakeAead();
    const short = toBase64(Uint8Array.from([CIPHER_VERSION, 1, 2, 3]));

    expect(() => decryptRecord(short, makeKey(1), aead)).toThrow(
      expect.objectContaining({ reason: 'malformed' }),
    );
  });

  test('a wrong key size is refused before anything is encrypted', () => {
    const aead = createFakeAead();

    expect(() => encryptRecord(DREAM, new Uint8Array(16), aead)).toThrow(
      ArchiveDecryptionError,
    );
  });

  test('the nonce occupies the expected slot', () => {
    const aead = createFakeAead();
    const raw = fromBase64(encryptRecord(DREAM, makeKey(1), aead));

    expect(raw.length).toBeGreaterThan(1 + ARCHIVE_NONCE_BYTES);
  });
});

// Base64 and UTF-8 are hand-written here rather than taken from platform
// globals, so they need their own coverage: a difference between devices would
// corrupt an archive on one and not the other.
describe('encoding', () => {
  test.each([0, 1, 2, 3, 4, 5, 16, 31, 32, 100])(
    'round trips %i bytes',
    length => {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37) % 256);

      expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    },
  );

  test('covers every byte value', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);

    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });

  test('pads to a multiple of four characters', () => {
    expect(toBase64(Uint8Array.from([1])).length % 4).toBe(0);
    expect(toBase64(Uint8Array.from([1, 2])).length % 4).toBe(0);
    expect(toBase64(Uint8Array.from([1, 2, 3])).length % 4).toBe(0);
  });

  test('matches a known vector', () => {
    // "Man" is the canonical base64 example.
    expect(toBase64(Uint8Array.from([77, 97, 110]))).toBe('TWFu');
  });

  test('rejects characters outside the alphabet', () => {
    expect(() => fromBase64('!!!!')).toThrow(ArchiveDecryptionError);
  });

  test('carries Ukrainian text and emoji through encryption unchanged', () => {
    const aead = createFakeAead();
    const content = {
      title: 'Скляний океан',
      text: 'Я падав крізь воду — і не міг прокинутись 🌊',
    };

    expect(
      decryptRecord(encryptRecord(content, makeKey(1), aead), makeKey(1), aead),
    ).toEqual(content);
  });
});
