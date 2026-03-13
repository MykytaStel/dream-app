import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { ensureRecordAudioPermission } from './audioPermissions';

const arp = AudioRecorderPlayer;

type NativeAudioRecorderModule = {
  startRecording(): Promise<string>;
  stopRecording(): Promise<string | null>;
  play(path: string): Promise<void>;
  stop(): Promise<void>;
  cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>;
};

const NativeAudioRecorder: NativeAudioRecorderModule | undefined =
  (NativeModules as any).AudioRecorder;

function normalizeUriForStorage(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  if (value.startsWith('file://')) {
    return value;
  }

  // react-native-audio-recorder-player on iOS often returns bare paths
  return `file://${value}`;
}

function normalizeUriForPlayback(value: string): string {
  if (!value) {
    return value;
  }

  // Native side strips file:// before File/Uri; player libs accept both
  return value.startsWith('file://') ? value : `file://${value}`;
}

export async function startRecording(): Promise<string> {
  if (Platform.OS === 'android' && NativeAudioRecorder) {
    const permission = await ensureRecordAudioPermission();
    if (permission !== 'granted') {
      const reason =
        permission === 'denied' ? 'android-audio-permission-denied' : 'android-audio-permission-unavailable';
      const error = new Error('Audio recording permission is required.');
      (error as any).code = reason;
      throw error;
    }

    const uri = await NativeAudioRecorder.startRecording();
    return normalizeUriForStorage(uri);
  }

  if (Platform.OS === 'ios') {
    const audioDir = `${RNFS.DocumentDirectoryPath}/audio`;
    await RNFS.mkdir(audioDir).catch(() => undefined);
    const timestamp = Date.now();
    const suffix = Math.random().toString(36).slice(2, 9);
    const path = `${audioDir}/dream_audio_${timestamp}_${suffix}.m4a`;
    await arp.startRecorder(path, {
      AVFormatIDKeyIOS: 'aac',
      AVEncodingOptionIOS: 'aac',
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    });
    return normalizeUriForStorage(path);
  }

  const path = 'sdcard/dream.mp4';
  await arp.startRecorder(path, {
    AudioSourceAndroid: AudioSourceAndroidType.VOICE_RECOGNITION,
    OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AVFormatIDKeyIOS: 'aac',
    AVEncodingOptionIOS: 'aac',
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  });
  return normalizeUriForStorage(path);
}

export async function stopRecording(): Promise<string> {
  if (Platform.OS === 'android' && NativeAudioRecorder) {
    const uri = await NativeAudioRecorder.stopRecording();
    return normalizeUriForStorage(uri ?? '');
  }

  const uri = await arp.stopRecorder();
  arp.removeRecordBackListener();
  return normalizeUriForStorage(uri ?? '');
}

export async function play(uri: string) {
  const normalized = normalizeUriForPlayback(uri);

  if (Platform.OS === 'android' && NativeAudioRecorder) {
    await NativeAudioRecorder.play(normalized);
    return;
  }

  await arp.startPlayer(normalized);
}

export async function stop() {
  if (Platform.OS === 'android' && NativeAudioRecorder) {
    await NativeAudioRecorder.stop();
    return;
  }

  await arp.stopPlayer();
}

/** Deletes orphaned recording files in app audio dir older than maxAgeDays. Android only; no-op on iOS. */
export async function cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number> {
  if (Platform.OS !== 'android' || !NativeAudioRecorder) {
    return 0;
  }
  return NativeAudioRecorder.cleanupOrphanedAudioFiles(maxAgeDays);
}

