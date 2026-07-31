import { Linking, Platform, Share } from 'react-native';
import NativeBackupFileIntent from '../../../specs/NativeBackupFileIntent';

// Android-only, so the spec uses `get` and this is null on iOS — which the
// branches below already handle by falling back to Linking and the share sheet.

function createShareableFileUrl(filePath: string) {
  return filePath.startsWith('file://') ? filePath : `file://${filePath}`;
}

export async function openLocalBackupFile(filePath: string, mimeType: string) {
  if (Platform.OS === 'android' && NativeBackupFileIntent?.open) {
    await NativeBackupFileIntent.open(filePath, mimeType);
    return;
  }

  await Linking.openURL(createShareableFileUrl(filePath));
}

export async function shareLocalBackupFile(
  filePath: string,
  mimeType: string,
  title?: string,
) {
  if (Platform.OS === 'android' && NativeBackupFileIntent?.share) {
    await NativeBackupFileIntent.share(filePath, mimeType, title);
    return;
  }

  await Share.share({
    title,
    url: createShareableFileUrl(filePath),
  });
}
