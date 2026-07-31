import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base-64';
import { fromBase64, toBase64 } from '../crypto/archiveCipher';

/** Injected rather than taking the key, so no caller has to hold one. */
export type SealBytes = (plaintext: Uint8Array) => Uint8Array;
export type OpenBytes = (sealed: Uint8Array) => Uint8Array;

/**
 * Encrypts the recording before it is uploaded, and decrypts it after download.
 *
 * A voice note is the dream, narrated. Sealing the text while shipping the
 * audio in the clear would leave the promise broken and only look kept.
 *
 * The whole file passes through memory, because `react-native-libsodium` does
 * not expose `crypto_secretstream` — chunked encryption would mean hand-rolling
 * the chunk framing, including the defences against reordering and truncation
 * that secretstream exists to provide. That is real cryptographic engineering
 * and not something to improvise here, so the single-pass path is used and
 * bounded instead.
 */

/**
 * The bound on the single-pass path.
 *
 * Encrypting a file of size N holds roughly 4N at once: the base64 read, the
 * decoded bytes, the sealed output, and its base64 form. At 16 MB that peaks
 * near 64 MB, which a phone can absorb. The 100 MB the upload path allows would
 * peak near 400 MB and take the app down.
 *
 * 16 MB is around half an hour of AAC voice, well past the length of a dream
 * recounted on waking. Files above it fail loudly rather than uploading
 * unencrypted.
 */
export const MAX_ENCRYPTABLE_AUDIO_BYTES = 16 * 1024 * 1024;

/** What the sealed blob is, as far as storage is concerned. */
export const ENCRYPTED_AUDIO_MIME_TYPE = 'application/octet-stream';

export class AudioTooLargeToEncryptError extends Error {
  constructor(readonly bytes: number) {
    super('audio-file-too-large-to-encrypt');
    this.name = 'AudioTooLargeToEncryptError';
  }
}

function decodeBase64ToBytes(input: string): Uint8Array {
  const binary = decodeBase64(input);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export async function readAudioBytes(localPath: string): Promise<Uint8Array> {
  const stat = await RNFS.stat(localPath);
  const size = Number(stat.size);

  if (size > MAX_ENCRYPTABLE_AUDIO_BYTES) {
    throw new AudioTooLargeToEncryptError(size);
  }

  return decodeBase64ToBytes(await RNFS.readFile(localPath, 'base64'));
}

/**
 * Writes the sealed recording to a file next to the original.
 *
 * A file rather than bytes in hand, because the Android uploader is a native
 * module that streams from a path. The caller deletes it once the upload
 * finishes.
 */
export async function encryptAudioFileForUpload(
  localPath: string,
  seal: SealBytes,
): Promise<string> {
  const sealed = seal(await readAudioBytes(localPath));
  const encryptedPath = `${RNFS.CachesDirectoryPath}/outgoing-audio-${Date.now()}.bin`;

  await RNFS.writeFile(encryptedPath, toBase64(sealed), 'base64');
  return encryptedPath;
}

/**
 * Turns a downloaded blob back into a playable file, in place.
 *
 * Failure here throws rather than leaving the file as-is: a blob that stayed
 * put would be handed to the audio player and fail as an unplayable recording,
 * which reads as "your dream is gone" instead of "this could not be decrypted".
 */
export async function decryptDownloadedAudioFile(
  encryptedPath: string,
  open: OpenBytes,
): Promise<void> {
  const plaintext = open(
    fromBase64(await RNFS.readFile(encryptedPath, 'base64')),
  );

  await RNFS.writeFile(encryptedPath, toBase64(plaintext), 'base64');
}
