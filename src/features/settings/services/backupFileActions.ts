import { Linking, NativeModules, Platform, Share } from 'react-native';

type BackupFileIntentModule = {
  open: (filePath: string, mimeType: string) => Promise<void>;
  share: (filePath: string, mimeType: string, title?: string) => Promise<void>;
};

const backupFileIntentModule =
  NativeModules.BackupFileIntent as BackupFileIntentModule | undefined;

function createShareableFileUrl(filePath: string) {
  return filePath.startsWith('file://') ? filePath : `file://${filePath}`;
}

export async function openLocalBackupFile(filePath: string, mimeType: string) {
  if (Platform.OS === 'android' && backupFileIntentModule?.open) {
    await backupFileIntentModule.open(filePath, mimeType);
    return;
  }

  await Linking.openURL(createShareableFileUrl(filePath));
}

export async function shareLocalBackupFile(
  filePath: string,
  mimeType: string,
  title?: string,
) {
  if (Platform.OS === 'android' && backupFileIntentModule?.share) {
    await backupFileIntentModule.share(filePath, mimeType, title);
    return;
  }

  await Share.share({
    title,
    url: createShareableFileUrl(filePath),
  });
}
