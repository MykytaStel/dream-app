import { Platform } from 'react-native';
import NativeAudioUpload from '../../specs/NativeAudioUpload';
import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base-64';
import { getSupabaseRestConfig } from '../api/supabase/restConfig';
import { getSupabaseClient } from '../api/supabase/client';
import { DREAM_AUDIO_BUCKET } from '../api/contracts/dreamSync';

// Typed by codegen from src/specs/NativeAudioUpload.ts. `get` rather than
// `getEnforcing` because the JS fallback below is a real path, not a fallback
// for a mistake: this module is absent wherever it has not been built.

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
      // The spec says optional, not nullable: codegen has no way to express a
      // property that may be explicitly null, and the native side reads an
      // absent key the same way it read a null one.
      accessToken: restConfig.accessToken ?? undefined,
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
