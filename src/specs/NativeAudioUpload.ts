import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Streams a recording to storage without loading it into memory.
 *
 * The JavaScript fallback in `audioUpload.ts` reads the whole file as base64,
 * which is what this exists to avoid on large recordings.
 */
export type AudioUploadOptions = {
  uploadUrl: string;
  localPath: string;
  mimeType: string;
  anonKey: string;
  accessToken?: string;
};

export interface Spec extends TurboModule {
  upload(options: AudioUploadOptions): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('AudioUpload');
