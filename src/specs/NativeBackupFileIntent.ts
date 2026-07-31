import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Opening and sharing a backup file through Android's intent system.
 *
 * Android only: iOS uses `Linking` and the system share sheet, which need no
 * native code. `get` rather than `getEnforcing`, for the same reason as the
 * recorder.
 */
export interface Spec extends TurboModule {
  open(filePath: string, mimeType: string): Promise<void>;
  share(filePath: string, mimeType: string, title?: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('BackupFileIntent');
