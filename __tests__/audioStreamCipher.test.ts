/* eslint-disable no-bitwise -- flipping a bit is the point: these tests
   corrupt the sealed file on purpose. */
import {
  AUDIO_CHUNK_BYTES,
  AudioStreamError,
  decryptAudioFileStream,
  encryptAudioFileStream,
} from '../src/services/cloud/audioStreamCipher';
import { SECRETSTREAM_HEADER_BYTES } from '../src/services/crypto/libsodiumSecretStream';
import {
  createVirtualFileSystem,
  expectSameBytes,
  recognisableAudio,
} from './helpers/virtualFileSystem';

/**
 * Chunked encryption fails in ways one-shot encryption cannot: a chunk can be
 * dropped, moved, or the file cut short — and each of those leaves every
 * remaining chunk perfectly valid on its own. Most of these tests are about
 * that, not about whether the bytes come back.
 */

const KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 11);
const OTHER_KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 200);

const SOURCE = '/documents/note.m4a';
const SEALED = '/caches/note.bin';
const RESTORED = '/documents/restored.m4a';

let vfs: ReturnType<typeof createVirtualFileSystem>;

function sealedChunkCount(): number {
  const sealed = vfs.get(SEALED);
  if (!sealed) {
    throw new Error('nothing was sealed');
  }
  return Math.ceil(
    (sealed.length - SECRETSTREAM_HEADER_BYTES) / (AUDIO_CHUNK_BYTES + 17),
  );
}

async function roundTrip(bytes: Uint8Array) {
  vfs.put(SOURCE, bytes);
  await encryptAudioFileStream(SOURCE, SEALED, KEY);
  await decryptAudioFileStream(SEALED, RESTORED, KEY);
  return vfs.get(RESTORED);
}

describe('streamed audio encryption', () => {
  beforeEach(() => {
    vfs = createVirtualFileSystem();
    vfs.install();
  });

  test('a recording spanning several chunks returns byte for byte', async () => {
    const original = recognisableAudio(AUDIO_CHUNK_BYTES * 3 + 1234);

    const restored = await roundTrip(original);

    expectSameBytes(restored, original);
    expect(sealedChunkCount()).toBe(4);
  });

  test('a size that is an exact multiple of the chunk still ends properly', async () => {
    // The classic off-by-one: the last read returns exactly the chunk size, so
    // a naive loop never marks a final chunk and the stream has no end.
    const original = recognisableAudio(AUDIO_CHUNK_BYTES * 2);

    expectSameBytes(await roundTrip(original), original);
  });

  test('a recording smaller than one chunk works', async () => {
    const original = recognisableAudio(97);

    expectSameBytes(await roundTrip(original), original);
    expect(sealedChunkCount()).toBe(1);
  });

  test('an empty file is still a complete stream', async () => {
    // A header with nothing after it would be indistinguishable from a file
    // that was cut off before its first chunk.
    expectSameBytes(await roundTrip(new Uint8Array(0)), new Uint8Array(0));
  });

  test('what lands on disk is not the recording', async () => {
    const original = recognisableAudio(AUDIO_CHUNK_BYTES + 500);
    vfs.put(SOURCE, original);

    await encryptAudioFileStream(SOURCE, SEALED, KEY);
    const sealed = vfs.get(SEALED)!;

    // The first 64 bytes of the recording must not appear anywhere in the blob.
    const needle = original.slice(0, 64).join(',');
    expect(sealed.join(',')).not.toContain(needle);
  });

  test('a file cut short is refused, not written out as a shorter recording', async () => {
    const original = recognisableAudio(AUDIO_CHUNK_BYTES * 3);
    vfs.put(SOURCE, original);
    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    // Drop the last chunk. Everything left authenticates perfectly — this is
    // exactly why the final tag has to exist.
    const sealed = vfs.get(SEALED)!;
    vfs.put(SEALED, sealed.slice(0, sealed.length - (AUDIO_CHUNK_BYTES + 17)));

    await expect(decryptAudioFileStream(SEALED, RESTORED, KEY)).rejects.toThrow(
      AudioStreamError,
    );
    // And the fragment it had already decrypted is gone.
    expect(vfs.get(RESTORED)).toBeUndefined();
  });

  test('reordered chunks are detected', async () => {
    const original = recognisableAudio(AUDIO_CHUNK_BYTES * 2 + 10);
    vfs.put(SOURCE, original);
    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    const sealed = vfs.get(SEALED)!;
    const chunk = AUDIO_CHUNK_BYTES + 17;
    const head = sealed.slice(0, SECRETSTREAM_HEADER_BYTES);
    const first = sealed.slice(
      SECRETSTREAM_HEADER_BYTES,
      SECRETSTREAM_HEADER_BYTES + chunk,
    );
    const second = sealed.slice(
      SECRETSTREAM_HEADER_BYTES + chunk,
      SECRETSTREAM_HEADER_BYTES + chunk * 2,
    );
    const rest = sealed.slice(SECRETSTREAM_HEADER_BYTES + chunk * 2);

    const swapped = new Uint8Array(sealed.length);
    swapped.set(head, 0);
    swapped.set(second, SECRETSTREAM_HEADER_BYTES);
    swapped.set(first, SECRETSTREAM_HEADER_BYTES + chunk);
    swapped.set(rest, SECRETSTREAM_HEADER_BYTES + chunk * 2);
    vfs.put(SEALED, swapped);

    await expect(decryptAudioFileStream(SEALED, RESTORED, KEY)).rejects.toThrow(
      AudioStreamError,
    );
  });

  test('a flipped byte inside a chunk is detected', async () => {
    vfs.put(SOURCE, recognisableAudio(5000));
    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    const sealed = vfs.get(SEALED)!.slice();
    sealed[SECRETSTREAM_HEADER_BYTES + 40] ^= 0xff;
    vfs.put(SEALED, sealed);

    await expect(decryptAudioFileStream(SEALED, RESTORED, KEY)).rejects.toThrow(
      AudioStreamError,
    );
  });

  test('another key cannot open it', async () => {
    vfs.put(SOURCE, recognisableAudio(4096));
    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    await expect(
      decryptAudioFileStream(SEALED, RESTORED, OTHER_KEY),
    ).rejects.toThrow(AudioStreamError);
  });

  test('a damaged header fails before any chunk is trusted', async () => {
    vfs.put(SOURCE, recognisableAudio(4096));
    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    const sealed = vfs.get(SEALED)!.slice();
    sealed[3] ^= 0xff;
    vfs.put(SEALED, sealed);

    await expect(decryptAudioFileStream(SEALED, RESTORED, KEY)).rejects.toThrow(
      AudioStreamError,
    );
    expect(vfs.get(RESTORED)).toBeUndefined();
  });

  test('a file with only a header is refused', async () => {
    vfs.put(SEALED, new Uint8Array(SECRETSTREAM_HEADER_BYTES));

    await expect(decryptAudioFileStream(SEALED, RESTORED, KEY)).rejects.toThrow(
      AudioStreamError,
    );
  });

  /**
   * The whole point of the change. Memory is one chunk regardless of length, so
   * a long recording must never hold more at once than a short one — which is
   * checked by watching the largest single write, not by profiling.
   */
  test('memory does not grow with the recording', async () => {
    vfs.put(SOURCE, recognisableAudio(AUDIO_CHUNK_BYTES * 20));
    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    const RNFS = require('react-native-fs');
    const largestWrite = Math.max(
      ...(RNFS.appendFile as jest.Mock).mock.calls.map(
        (call: [string, string]) => call[1].length,
      ),
    );

    // Base64 of one sealed chunk, and nothing approaching the 1.3 MB file.
    expect(largestWrite).toBeLessThan((AUDIO_CHUNK_BYTES + 17) * 2);
  });

  test('sealing the same recording twice gives different files', async () => {
    const original = recognisableAudio(3000);

    vfs.put(SOURCE, original);
    await encryptAudioFileStream(SOURCE, SEALED, KEY);
    const first = vfs.get(SEALED)!.slice();

    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    expect(vfs.get(SEALED)).not.toEqual(first);
  });

  test('re-encrypting over a previous attempt replaces it rather than appending', async () => {
    // A retry after a failed upload must not glue a second copy onto the first.
    vfs.put(SOURCE, recognisableAudio(2000));
    await encryptAudioFileStream(SOURCE, SEALED, KEY);
    const firstLength = vfs.get(SEALED)!.length;

    await encryptAudioFileStream(SOURCE, SEALED, KEY);

    expect(vfs.get(SEALED)!.length).toBe(firstLength);
  });
});
