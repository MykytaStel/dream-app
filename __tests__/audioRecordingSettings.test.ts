import { readFileSync } from 'fs';
import { join } from 'path';
import {
  AUDIO_BIT_RATE,
  AUDIO_CHANNELS,
  AUDIO_SAMPLE_RATE_HZ,
} from '../src/features/dreams/model/audioRecordingSettings';

/**
 * Two platforms, one recording.
 *
 * iOS was taking the recorder library's defaults — 44.1 kHz stereo, from a
 * phone's single microphone — while Android's native module set 44.1 kHz mono
 * at 128 kbps, a bitrate meant for music. Nobody chose either, and nothing
 * compared them, so the same dream was stored at 0.74 MB per minute on one
 * platform and 0.92 on the other.
 *
 * The Kotlin cannot import the TypeScript, so the numbers are checked against
 * each other here. Drift is the failure this is built to catch, because drift
 * is what happened.
 */

const androidRecorder = readFileSync(
  join(
    __dirname,
    '..',
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    'dreamapp',
    'AudioRecorderModule.kt',
  ),
  'utf8',
);

const iosRecorder = readFileSync(
  join(__dirname, '..', 'ios', 'DreamApp', 'AudioRecorderModule.swift'),
  'utf8',
);

/** Kotlin writes 32_000 where TypeScript writes 32000. */
const kotlinNumber = (value: number) =>
  value.toLocaleString('en-US').replace(/,/g, '_');

describe('audio recording settings', () => {
  test('the Android recorder uses the same numbers as the shared model', () => {
    expect(androidRecorder).toContain(
      `setAudioSamplingRate(${AUDIO_SAMPLE_RATE_HZ})`,
    );
    expect(androidRecorder).toContain(`setAudioChannels(${AUDIO_CHANNELS})`);
    expect(androidRecorder).toContain(
      `setAudioEncodingBitRate(${kotlinNumber(AUDIO_BIT_RATE)})`,
    );
  });

  test('the iOS recorder uses the same numbers as the shared model', () => {
    // These moved out of TypeScript when iOS stopped going through the
    // recorder library: the settings are now an AVAudioRecorder dictionary,
    // and this is the file that has to agree with the constants.
    expect(iosRecorder).toContain(`AVSampleRateKey: ${AUDIO_SAMPLE_RATE_HZ}`);
    expect(iosRecorder).toContain(`AVNumberOfChannelsKey: ${AUDIO_CHANNELS}`);
    expect(iosRecorder).toContain(`AVEncoderBitRateKey: ${AUDIO_BIT_RATE}`);
  });

  test('no platform is left to a device default', () => {
    // The bug this whole file exists for: absent an explicit dictionary, each
    // platform picks its own defaults and nothing anywhere says so.
    for (const key of [
      'AVSampleRateKey',
      'AVNumberOfChannelsKey',
      'AVEncoderBitRateKey',
    ]) {
      expect(iosRecorder).toContain(key);
    }
    for (const call of [
      'setAudioSamplingRate',
      'setAudioChannels',
      'setAudioEncodingBitRate',
    ]) {
      expect(androidRecorder).toContain(call);
    }
  });

  test('mono, because a phone has one microphone', () => {
    expect(AUDIO_CHANNELS).toBe(1);
  });

  test('the sample rate stays above what transcription needs', () => {
    // Whisper resamples to 16 kHz. Recording below that would lose information
    // the transcript depends on; recording far above it costs on six separate
    // hops and buys nothing the listener can hear.
    expect(AUDIO_SAMPLE_RATE_HZ).toBeGreaterThanOrEqual(16000);
    expect(AUDIO_SAMPLE_RATE_HZ).toBeLessThanOrEqual(24000);
  });

  test('no hardcoded rate survives beside the shared constant', () => {
    expect(iosRecorder).not.toContain('44100');
    expect(androidRecorder).not.toContain('44100');
    expect(androidRecorder).not.toContain('128_000');
  });
});
