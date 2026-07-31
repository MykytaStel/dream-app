import RNFS from 'react-native-fs';
import {
  decryptAudioFileStream,
  encryptAudioFileStream,
} from './audioStreamCipher';

/**
 * Encrypts the recording before it is uploaded, and decrypts it after download.
 *
 * A voice note is the dream, narrated. Sealing the text while shipping the
 * audio in the clear would leave the promise broken and only look kept.
 *
 * This used to encrypt in a single pass, which held roughly four copies of the
 * file at once and so capped recordings at 16 MB — anything longer failed to
 * sync at all. The cap is gone: `crypto_secretstream` encrypts a chunk at a
 * time, so memory no longer depends on how long someone talked.
 *
 * The defences that make chunking safe — a chunk cannot be moved, dropped or
 * replayed — come from the primitive, not from this app.
 */

/** What the sealed blob is, as far as storage is concerned. */
export const ENCRYPTED_AUDIO_MIME_TYPE = 'application/octet-stream';

/**
 * Writes the sealed recording to a file next to the original.
 *
 * A file rather than bytes in hand, because the Android uploader is a native
 * module that streams from a path — and because holding the result in memory
 * would give back the limit this change removed. The caller deletes it once the
 * upload finishes.
 */
export async function encryptAudioFileForUpload(
  localPath: string,
  key: Uint8Array,
): Promise<string> {
  const encryptedPath = `${RNFS.CachesDirectoryPath}/outgoing-audio-${Date.now()}.bin`;

  await encryptAudioFileStream(localPath, encryptedPath, key);
  return encryptedPath;
}

/**
 * Turns a downloaded blob back into a playable file, in place.
 *
 * Failure removes the file rather than leaving it: a blob left on disk would be
 * handed to the audio player and fail as an unplayable recording, which reads
 * as "your dream is gone" instead of "this could not be decrypted".
 */
export async function decryptDownloadedAudioFile(
  encryptedPath: string,
  key: Uint8Array,
): Promise<void> {
  const restoredPath = `${encryptedPath}.restored`;

  await decryptAudioFileStream(encryptedPath, restoredPath, key);

  // Swapped only once the decryption has fully succeeded, so an interrupted
  // decrypt never leaves a half-written file under the name the player uses.
  await RNFS.unlink(encryptedPath).catch(() => undefined);
  await RNFS.moveFile(restoredPath, encryptedPath);
}
