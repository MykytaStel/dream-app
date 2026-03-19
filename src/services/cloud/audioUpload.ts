import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base-64';
import { getSupabaseRestConfig } from '../api/supabase/restConfig';
import { getSupabaseClient } from '../api/supabase/client';
import { DREAM_AUDIO_BUCKET } from '../api/contracts/dreamSync';

type NativeAudioUploadModule = {
  upload(options: {
    uploadUrl: string;
    localPath: string;
    mimeType: string;
    anonKey: string;
    accessToken?: string | null;
  }): Promise<void>;
};

const NativeAudioUpload: NativeAudioUploadModule | undefined =
  (NativeModules as any).AudioUpload;

function decodeBase64ToUint8Array(input: string): Uint8Array {
  const binary = decodeBase64(input);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export async function uploadDreamAudio(
  remotePath: string,
  localPath: string,
  mimeType: string,
): Promise<void> {
  const restConfig = await getSupabaseRestConfig();
  if (!restConfig) {
    throw new Error('supabase-rest-config-missing');
  }

  const uploadUrl = `${restConfig.baseUrl.replace(/\/+$/, '')}/storage/v1/object/${encodeURIComponent(
    DREAM_AUDIO_BUCKET,
  )}/${remotePath}`;

  if (Platform.OS === 'android' && NativeAudioUpload) {
    await NativeAudioUpload.upload({
      uploadUrl,
      localPath,
      mimeType,
      anonKey: restConfig.anonKey,
      accessToken: restConfig.accessToken,
    });
    return;
  }

  // Fallback: existing JS upload via supabase-js (may load file into memory)
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const base64 = await RNFS.readFile(localPath, 'base64');
  const binary = decodeBase64ToUint8Array(base64);

  const { error } = await client.storage
    .from(DREAM_AUDIO_BUCKET)
    .upload(remotePath, binary, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw error;
  }
}
