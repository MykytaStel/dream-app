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

export type AudioPermissionCode =
  'android-audio-permission-denied' | 'android-audio-permission-unavailable';

// Carries the reason on the error itself so callers can pick the right message
// without parsing text. Callers read `.code`, which stays a plain string field.
export class AudioPermissionError extends Error {
  readonly code: AudioPermissionCode;

  constructor(message: string, code: AudioPermissionCode) {
    super(message);
    this.name = 'AudioPermissionError';
    this.code = code;
  }
}

type NativeAudioRecorderModule = {
  startRecording(): Promise<string>;
  stopRecording(): Promise<string | null>;
  play(path: string): Promise<void>;
  stop(): Promise<void>;
  cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>;
};

// NativeModules is an untyped bag; assert only the one entry we know about.
// This goes away once the module becomes a TurboModule and codegen types it.
const NativeAudioRecorder: NativeAudioRecorderModule | undefined = (
  NativeModules as { AudioRecorder?: NativeAudioRecorderModule }
).AudioRecorder;

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
      throw new AudioPermissionError(
        'Audio recording permission is required.',
        permission === 'denied'
          ? 'android-audio-permission-denied'
          : 'android-audio-permission-unavailable',
      );
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

  const audioDir = `${RNFS.DocumentDirectoryPath}/audio`;
  await RNFS.mkdir(audioDir).catch(() => undefined);
  const timestamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 9);
  const path = `${audioDir}/dream_audio_${timestamp}_${suffix}.mp4`;
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

type PlayCallbacks = {
  onFinished?: () => void;
  onProgress?: (positionMs: number, durationMs: number) => void;
};

export async function play(uri: string, callbacks?: PlayCallbacks) {
  const normalized = normalizeUriForPlayback(uri);

  if (callbacks?.onProgress) {
    arp.addPlayBackListener(e => {
      callbacks.onProgress!(e.currentPosition, e.duration);
    });
  }

  if (callbacks?.onFinished) {
    arp.addPlaybackEndListener(() => {
      arp.removePlaybackEndListener();
      callbacks.onFinished!();
    });
  }

  try {
    await arp.startPlayer(normalized);
  } catch (e) {
    arp.removePlayBackListener();
    arp.removePlaybackEndListener();
    throw e;
  }
}

export async function stop() {
  arp.removePlayBackListener();
  arp.removePlaybackEndListener();
  await arp.stopPlayer();
}

/** Deletes orphaned recording files in app audio dir older than maxAgeDays. Android only; no-op on iOS. */
export async function cleanupOrphanedAudioFiles(
  maxAgeDays: number,
): Promise<number> {
  if (Platform.OS !== 'android' || !NativeAudioRecorder) {
    return 0;
  }
  return NativeAudioRecorder.cleanupOrphanedAudioFiles(maxAgeDays);
}
