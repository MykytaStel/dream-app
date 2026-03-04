import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform } from 'react-native';
import {
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  AudioEncoderAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';

const arp = AudioRecorderPlayer;

export async function startRecording(): Promise<string> {
  const path = Platform.select({ ios: 'dream.m4a', android: 'sdcard/dream.mp4' })!;
  await arp.startRecorder(path, {
    AudioSourceAndroid: AudioSourceAndroidType.VOICE_RECOGNITION,
    OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AVFormatIDKeyIOS: 'aac',
    AVEncodingOptionIOS: 'aac',
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
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
