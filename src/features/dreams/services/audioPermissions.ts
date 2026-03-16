import { PermissionsAndroid, Platform } from 'react-native';

export type AudioPermissionStatus = 'granted' | 'denied' | 'unavailable';

export async function ensureRecordAudioPermission(): Promise<AudioPermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  if (!PermissionsAndroid) {
    return 'unavailable';
  }

  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

  const current = await PermissionsAndroid.check(permission);
  if (current) {
    return 'granted';
  }

  const result = await PermissionsAndroid.request(permission);

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }

  if (result === PermissionsAndroid.RESULTS.DENIED) {
    return 'denied';
  }

  return 'unavailable';
}

