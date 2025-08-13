import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform } from 'react-native';

const arp = new AudioRecorderPlayer();

export async function startRecording(): Promise<string> {
  const path = Platform.select({ ios: 'dream.m4a', android: 'sdcard/dream.mp4' })!;
  await arp.startRecorder(path, {
    format: Platform.OS === 'ios' ? 'm4a' : undefined,
    audioSource: 6, // VOICE_RECOGNITION (Android)
  });
  return path;
}

export async function stopRecording(): Promise<string> {
  const uri = await arp.stopRecorder();
  arp.removeRecordBackListener();
  return uri ?? '';
}

export async function play(uri: string) {
  await arp.startPlayer(uri);
}

export async function stop() {
  await arp.stopPlayer();
}