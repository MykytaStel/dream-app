import RNFS from 'react-native-fs';
import { fromBase64, toBase64 } from '../crypto/archiveCipher';
import {
  createPullStream,
  createPushStream,
  SECRETSTREAM_HEADER_BYTES,
  SECRETSTREAM_TAG_BYTES,
  TAG_FINAL,
  TAG_MESSAGE,
} from '../crypto/libsodiumSecretStream';

/**
 * Encrypts a recording a chunk at a time.
 *
 * The one-shot path this replaces held roughly four copies of the file at once,
 * which is what capped recordings at 16 MB. Here memory is one chunk regardless
 * of length, so the cap and the error that went with it are gone.
 *
 * The defences that make chunking safe — a chunk cannot be moved, dropped or
 * replayed, and the stream knows where it ends — come from
 * `crypto_secretstream`, not from this file. Writing them by hand is what was
 * declined earlier, and rightly.
 */

/**
 * 64 KB per chunk.
 *
 * Overhead is 17 bytes a chunk, so 0.026% — small enough that the choice is
 * about memory rather than size. This number is a starting point, not a
 * measurement; the spec asks for it to be revisited against a real recording.
 */
export const AUDIO_CHUNK_BYTES = 64 * 1024;

export class AudioStreamError extends Error {
  constructor(readonly reason: 'truncated' | 'corrupt' | 'header') {
    super(`audio-stream-${reason}`);
    this.name = 'AudioStreamError';
  }
}

/**
 * File layout:
 *
 *   [header: 24]
 *   [chunk: AUDIO_CHUNK_BYTES + 17]
 *   ...
 *   [final chunk: remainder + 17]   ← carries TAG_FINAL
 *
 * Chunks are a fixed size, so no length prefixes are needed: the reader takes
 * `AUDIO_CHUNK_BYTES + 17` at a time. The last one is shorter, and it is the
 * tag that says so — not the length.
 */
const SEALED_CHUNK_BYTES = AUDIO_CHUNK_BYTES + SECRETSTREAM_TAG_BYTES;

async function readChunk(
  path: string,
  position: number,
  length: number,
): Promise<Uint8Array> {
  const base64 = await RNFS.read(path, length, position, 'base64');
  return base64 ? fromBase64(base64) : new Uint8Array(0);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

export async function encryptAudioFileStream(
  sourcePath: string,
  targetPath: string,
  key: Uint8Array,
): Promise<void> {
  const stat = await RNFS.stat(sourcePath);
  const totalBytes = Number(stat.size);
  const stream = createPushStream(key);

  // Truncated rather than appended to, so a retry after a failed upload does
  // not silently glue a second copy onto the first.
  await RNFS.writeFile(
    targetPath,
    toBase64(new Uint8Array(stream.header)),
    'base64',
  );

  let position = 0;
  do {
    const remaining = totalBytes - position;
    const length = Math.min(AUDIO_CHUNK_BYTES, remaining);
    const plain = await readChunk(sourcePath, position, length);
    position += plain.length;

    // The final tag is what tells the reader the stream ended on purpose. An
    // empty file still gets one chunk, so even that is a complete stream rather
    // than a header with nothing after it.
    const isFinal = position >= totalBytes;
    const sealed = stream.push(
      toArrayBuffer(plain),
      isFinal ? TAG_FINAL : TAG_MESSAGE,
    );

    await RNFS.appendFile(
      targetPath,
      toBase64(new Uint8Array(sealed)),
      'base64',
    );

    if (isFinal) {
      break;
    }
  } while (position < totalBytes);
}

export async function decryptAudioFileStream(
  sourcePath: string,
  targetPath: string,
  key: Uint8Array,
): Promise<void> {
  try {
    await writeDecryptedStream(sourcePath, targetPath, key);
  } catch (error) {
    // Every failure here happens partway through writing. Leaving the fragment
    // behind would hand the player a recording that ends mid-sentence and looks
    // like the dream itself was lost, rather than an error that can be retried.
    await RNFS.unlink(targetPath).catch(() => undefined);
    throw error;
  }
}

async function writeDecryptedStream(
  sourcePath: string,
  targetPath: string,
  key: Uint8Array,
): Promise<void> {
  const stat = await RNFS.stat(sourcePath);
  const totalBytes = Number(stat.size);

  if (totalBytes <= SECRETSTREAM_HEADER_BYTES) {
    throw new AudioStreamError('truncated');
  }

  const header = await readChunk(sourcePath, 0, SECRETSTREAM_HEADER_BYTES);

  let stream: ReturnType<typeof createPullStream>;
  try {
    stream = createPullStream(header, key);
  } catch {
    throw new AudioStreamError('header');
  }

  let position = SECRETSTREAM_HEADER_BYTES;
  let sawFinal = false;
  let wroteAnything = false;

  while (position < totalBytes) {
    const length = Math.min(SEALED_CHUNK_BYTES, totalBytes - position);
    const sealed = await readChunk(sourcePath, position, length);
    position += sealed.length;

    if (sealed.length < SECRETSTREAM_TAG_BYTES) {
      throw new AudioStreamError('truncated');
    }

    let opened: { message: ArrayBuffer; tag: number };
    try {
      opened = stream.pull(toArrayBuffer(sealed));
    } catch {
      // A wrong key, a reordered chunk and a flipped byte are indistinguishable
      // here, and that is correct: none of them may be written out as audio.
      throw new AudioStreamError('corrupt');
    }

    const plain = new Uint8Array(opened.message);
    if (wroteAnything) {
      await RNFS.appendFile(targetPath, toBase64(plain), 'base64');
    } else {
      await RNFS.writeFile(targetPath, toBase64(plain), 'base64');
      wroteAnything = true;
    }

    if (opened.tag === TAG_FINAL) {
      sawFinal = true;
      break;
    }
  }

  // The whole reason the final tag exists. A file cut short decrypts perfectly
  // up to the point it was cut — every chunk before the break authenticates —
  // so length alone cannot tell a complete recording from half of one.
  if (!sawFinal) {
    throw new AudioStreamError('truncated');
  }
}
