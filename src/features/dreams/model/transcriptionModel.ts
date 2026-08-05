import type { AppLocale } from '../../../i18n/types';

/**
 * Which speech model to fetch, what language to tell it it is hearing, and how
 * to decode it.
 *
 * Keeping this policy in one table makes model quality a measurable product
 * decision rather than a set of unrelated call-site constants.
 */

export type WhisperDecodingOptions = {
  translate: boolean;
  temperature: number;
  temperatureInc: number;
  beamSize: number;
  prompt?: string;
};

export type WhisperModel = {
  filename: string;
  url: string;
  /** Approximate local download size. */
  approxBytes: number;
  /** Passed straight to whisper. */
  language: string;
  decoding: WhisperDecodingOptions;
};

const MODEL_BASE_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';

const MEBIBYTE = 1024 * 1024;

const QUALITY_DECODING: Omit<WhisperDecodingOptions, 'prompt'> = {
  translate: false,
  // Start deterministically, then allow whisper's own fallback when the audio
  // is ambiguous instead of accepting the first unstable decode.
  temperature: 0,
  temperatureInc: 0.2,
  beamSize: 5,
};

/**
 * English keeps the English-only model. At identical size, `tiny.en` is trained
 * solely on English and is a better latency/quality trade-off than multilingual
 * `tiny` for English recordings.
 */
const TINY_EN: WhisperModel = {
  filename: 'ggml-tiny.en.bin',
  url: `${MODEL_BASE_URL}/ggml-tiny.en.bin`,
  approxBytes: 74 * MEBIBYTE,
  language: 'en',
  decoding: QUALITY_DECODING,
};

/**
 * Ukrainian uses quantized multilingual `small`, not `base`.
 *
 * `small-q5_1` is materially stronger for a lower-resource language while its
 * roughly 190 MB download remains realistic for an optional, user-triggered,
 * offline model. Quantization keeps it far below the unquantized small model.
 */
const SMALL_Q5_1_MULTILINGUAL: WhisperModel = {
  filename: 'ggml-small-q5_1.bin',
  url: `${MODEL_BASE_URL}/ggml-small-q5_1.bin`,
  approxBytes: 181 * MEBIBYTE,
  language: 'uk',
  decoding: {
    ...QUALITY_DECODING,
    // The prompt is context, not text to prepend. It biases punctuation and
    // language choice without translating the speaker into English.
    prompt:
      'Це особистий щоденниковий запис сну українською мовою. Зберігай оригінальні слова, імена та розділові знаки.',
  },
};

const MODELS_BY_LOCALE: Record<AppLocale, WhisperModel> = {
  en: TINY_EN,
  uk: SMALL_Q5_1_MULTILINGUAL,
};

// Files used by earlier app versions still belong to this feature and may be
// safely pruned after the replacement model is present.
const LEGACY_TRANSCRIPTION_MODEL_FILENAMES = ['ggml-base.bin'];

export function selectTranscriptionModel(locale: AppLocale): WhisperModel {
  return MODELS_BY_LOCALE[locale];
}

/** Every model this app may have downloaded, including superseded versions. */
export function listTranscriptionModelFilenames(): string[] {
  return Array.from(
    new Set([
      ...Object.values(MODELS_BY_LOCALE).map(model => model.filename),
      ...LEGACY_TRANSCRIPTION_MODEL_FILENAMES,
    ]),
  );
}
