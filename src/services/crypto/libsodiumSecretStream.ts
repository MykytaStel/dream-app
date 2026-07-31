/**
 * The streaming half of libsodium, declared on our side of the line.
 *
 * `react-native-libsodium` installs its functions as JSI globals but ships no
 * types for the ones we added, because we added them in a patch rather than
 * upstream. Declaring them here instead of patching the package's TypeScript
 * keeps the patch to a single C++ file: the thing only the package can provide.
 * Everything expressible in TypeScript stays in this repo, where it is reviewed
 * and tested like the rest of the code.
 *
 * See `.yarn/patches/react-native-libsodium-*.patch`.
 */

/** One encrypted piece of a stream, and what it says about the stream. */
export type SecretStreamChunk = {
  message: ArrayBuffer;
  tag: number;
};

type PushStream = {
  /** 24 bytes that must be stored before the first chunk. */
  readonly header: ArrayBuffer;
  push(message: ArrayBuffer, tag?: number): ArrayBuffer;
};

type PullStream = {
  pull(ciphertext: ArrayBuffer): SecretStreamChunk;
};

declare const global: {
  jsi_crypto_secretstream_xchacha20poly1305_HEADERBYTES?: number;
  jsi_crypto_secretstream_xchacha20poly1305_ABYTES?: number;
  jsi_crypto_secretstream_xchacha20poly1305_KEYBYTES?: number;
  jsi_crypto_secretstream_xchacha20poly1305_TAG_MESSAGE?: number;
  jsi_crypto_secretstream_xchacha20poly1305_TAG_FINAL?: number;
  jsi_crypto_secretstream_xchacha20poly1305_init_push?: (
    key: ArrayBuffer,
  ) => PushStream;
  jsi_crypto_secretstream_xchacha20poly1305_init_pull?: (
    header: ArrayBuffer,
    key: ArrayBuffer,
  ) => PullStream;
};

export class SecretStreamUnavailableError extends Error {
  constructor() {
    super('secretstream-binding-missing');
    this.name = 'SecretStreamUnavailableError';
  }
}

/**
 * True when the patched binding is present.
 *
 * Checked rather than assumed: if the patch ever fails to apply, this is the
 * difference between a clear error and a crash inside the audio path.
 */
export function isSecretStreamAvailable(): boolean {
  return (
    typeof global.jsi_crypto_secretstream_xchacha20poly1305_init_push ===
      'function' &&
    typeof global.jsi_crypto_secretstream_xchacha20poly1305_init_pull ===
      'function'
  );
}

function requireBinding() {
  if (!isSecretStreamAvailable()) {
    throw new SecretStreamUnavailableError();
  }
}

export const SECRETSTREAM_HEADER_BYTES = 24;
export const SECRETSTREAM_TAG_BYTES = 17;

/** The tag that marks the end. Its absence is how truncation is detected. */
export const TAG_FINAL = 3;
export const TAG_MESSAGE = 0;

/**
 * Fails loudly if the library's constants ever stop matching ours.
 *
 * The same guard `assertCryptoConstants` provides for the one-shot cipher: a
 * size mismatch would otherwise surface much later, as an archive that cannot
 * be read.
 */
export function assertSecretStreamConstants(): void {
  requireBinding();

  const headerBytes =
    global.jsi_crypto_secretstream_xchacha20poly1305_HEADERBYTES;
  const tagBytes = global.jsi_crypto_secretstream_xchacha20poly1305_ABYTES;
  const finalTag = global.jsi_crypto_secretstream_xchacha20poly1305_TAG_FINAL;

  if (
    headerBytes !== SECRETSTREAM_HEADER_BYTES ||
    tagBytes !== SECRETSTREAM_TAG_BYTES ||
    finalTag !== TAG_FINAL
  ) {
    throw new Error(
      `secretstream sizes changed: header ${headerBytes}, tag ${tagBytes}, final ${finalTag}.`,
    );
  }
}

export function createPushStream(key: Uint8Array): PushStream {
  requireBinding();
  return global.jsi_crypto_secretstream_xchacha20poly1305_init_push!(
    toArrayBuffer(key),
  );
}

export function createPullStream(
  header: Uint8Array,
  key: Uint8Array,
): PullStream {
  requireBinding();
  return global.jsi_crypto_secretstream_xchacha20poly1305_init_pull!(
    toArrayBuffer(header),
    toArrayBuffer(key),
  );
}

/**
 * The JSI boundary takes an ArrayBuffer, and a Uint8Array is not always backed
 * by one it owns outright — a subarray shares its parent's buffer, so handing
 * over `.buffer` would pass the whole thing.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (
    bytes.byteOffset === 0 &&
    bytes.byteLength === bytes.buffer.byteLength &&
    bytes.buffer instanceof ArrayBuffer
  ) {
    return bytes.buffer;
  }

  return bytes.slice().buffer as ArrayBuffer;
}
