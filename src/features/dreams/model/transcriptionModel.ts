import type { AppLocale } from '../../../i18n/types';

/**
 * Which speech model to fetch, and what language to tell it it is hearing.
 *
 * Until now this was one constant: `ggml-tiny.en.bin`, with `language: 'en'`
 * hardcoded at the call site. An English-only model given Ukrainian speech does
 * not fail — it produces fluent, confident English nonsense. So the feature
 * looked like it worked and was useless to half the audience.
 *
 * The choice is a table rather than a branch because it is a product decision
 * that will be revisited: it is the one place to change when someone measures
 * the models against real recordings.
 */

export type WhisperModel = {
  filename: string;
  url: string;
  /** Measured against the CDN, not estimated. */
  approxBytes: number;
  /** Passed straight to whisper. */
  language: string;
};

const MODEL_BASE_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';

const MEGABYTE = 1024 * 1024;

/**
 * English keeps the English-only model.
 *
 * Not laziness: at identical size, `tiny.en` is trained solely on English and
 * transcribes it better than the multilingual `tiny`. Moving English users to a
 * multilingual model to serve Ukrainian would have made their transcripts worse
 * for no reason.
 */
const TINY_EN: WhisperModel = {
  filename: 'ggml-tiny.en.bin',
  url: `${MODEL_BASE_URL}/ggml-tiny.en.bin`,
  approxBytes: 74 * MEGABYTE,
  language: 'en',
};

/**
 * Ukrainian gets `base`, not `tiny`.
 *
 * The multilingual `tiny` is the same 74 MB as the English one, so making
 * Ukrainian work at all costs nothing — that part is settled. `base` is 141 MB,
 * roughly double, and the reason to pay it is that `tiny`'s multilingual
 * quality drops sharply outside the largest training languages, and a transcript
 * nobody can read is the same as no transcript.
 *
 * This is a judgement, not a measurement: transcription quality cannot be
 * checked from a test suite. Whoever runs both against a real recording should
 * change this line and say what they heard.
 */
const BASE_MULTILINGUAL: WhisperModel = {
  filename: 'ggml-base.bin',
  url: `${MODEL_BASE_URL}/ggml-base.bin`,
  approxBytes: 141 * MEGABYTE,
  language: 'uk',
};

const MODELS_BY_LOCALE: Record<AppLocale, WhisperModel> = {
  en: TINY_EN,
  uk: BASE_MULTILINGUAL,
};

export function selectTranscriptionModel(locale: AppLocale): WhisperModel {
  return MODELS_BY_LOCALE[locale];
}

/** Every model this app might have downloaded, for cleaning up the others. */
export function listTranscriptionModelFilenames(): string[] {
  return Array.from(
    new Set(Object.values(MODELS_BY_LOCALE).map(model => model.filename)),
  );
}
