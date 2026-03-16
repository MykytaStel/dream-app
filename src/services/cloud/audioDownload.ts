import RNFS from 'react-native-fs';
import { getSupabaseClient } from '../api/supabase/client';
import { DREAM_AUDIO_BUCKET } from '../api/contracts/dreamSync';

export async function downloadDreamAudio(
  remotePath: string,
  dreamId: string,
): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
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

  return `file://${localPath}`;
}
