import RNFS from 'react-native-fs';
import { getSupabaseClient } from '../api/supabase/client';
import { DREAM_AUDIO_BUCKET } from '../api/contracts/dreamSync';
import { decryptDownloadedAudioFile } from './audioCipher';
import {
  ArchiveKeyRequiredError,
  getArchiveKey,
} from '../crypto/archiveKeyService';

export async function downloadDreamAudio(
  remotePath: string,
  dreamId: string,
): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  // Checked before the download rather than after: fetching several megabytes
  // that cannot then be opened wastes the user's data and ends in the same
  // error either way.
  const key = await getArchiveKey();
  if (!key) {
    throw new ArchiveKeyRequiredError('missing');
  }

  const { data, error } = await client.storage
    .from(DREAM_AUDIO_BUCKET)
    .createSignedUrl(remotePath, 60);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('Failed to create signed URL.');
  }

  const filename =
    remotePath.split('/').filter(Boolean).pop() ?? `${dreamId}.m4a`;
  const audioDir = `${RNFS.DocumentDirectoryPath}/audio`;
  await RNFS.mkdir(audioDir).catch(() => undefined);

  const localPath = `${audioDir}/${filename}`;
  const result = await RNFS.downloadFile({
    fromUrl: data.signedUrl,
    toFile: localPath,
  }).promise;

  if (result.statusCode !== 200) {
    throw new Error(`Audio download failed with status ${result.statusCode}.`);
  }

  try {
    await decryptDownloadedAudioFile(localPath, key);
  } catch (decryptionError) {
    // The file on disk is a sealed blob, not a recording. Leaving it there
    // would hand the player something unplayable, which reads as "your dream is
    // gone" rather than "this could not be decrypted".
    await RNFS.unlink(localPath).catch(() => undefined);
    throw decryptionError;
  }

  return `file://${localPath}`;
}
