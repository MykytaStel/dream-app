/**
 * How a dream is recorded, in one place for both platforms.
 *
 * These were never chosen. iOS took the recorder library's defaults —
 * 44.1 kHz **stereo**, from a phone's single microphone — and Android's native
 * module set 44.1 kHz mono at 128 kbps, which is a bitrate for music. The two
 * platforms recorded the same dream at noticeably different sizes, and neither
 * number was a decision anyone made.
 *
 * Measured with the same AAC encoder the app uses, on 27 seconds of speech:
 *
 * | Configuration        | MB per minute |
 * |----------------------|---------------|
 * | 44.1 kHz stereo      | 0.74          |
 * | 44.1 kHz mono        | 0.47          |
 * | 22.05 kHz mono       | 0.25          |
 * | 16 kHz mono          | 0.19          |
 *
 * Size matters more here than it looks, because a recording is paid for six
 * times: on disk, through encryption, on upload, in cloud storage, on download,
 * and through decryption on the next device.
 *
 * **22.05 kHz, not 16 kHz.** Whisper resamples everything to 16 kHz, so 16
 * would be free as far as the transcript is concerned — and it saves only
 * another 0.06 MB per minute. But the person also plays the recording back to
 * hear their own voice at five in the morning, and that is not a place to spend
 * quality for a rounding error.
 *
 * **Mono.** A phone has one microphone. The second channel was a copy.
 */

/** 22.05 kHz: half of CD rate, comfortably above what speech needs. */
export const AUDIO_SAMPLE_RATE_HZ = 22050;

/** One microphone, one channel. */
export const AUDIO_CHANNELS = 1;

/** ~32 kbps. Measured output lands near 0.25 MB per minute. */
export const AUDIO_BIT_RATE = 32000;

/**
 * Roughly what a minute of recording costs, for anything that needs to
 * estimate before recording exists. Measured, not derived from the bitrate,
 * because AAC output does not track the nominal rate exactly.
 */
export const AUDIO_BYTES_PER_MINUTE = Math.round(0.25 * 1024 * 1024);
