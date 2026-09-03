import { AppLocale } from '../../../i18n/types';
import { DREAM_COPY_EN, type DreamCopy } from './en';
import { DREAM_COPY_UK } from './uk';
import {
  DREAM_INTENSITY_LEVELS_EN,
  DREAM_INTENSITY_LEVELS_UK,
  DREAM_LUCIDITY_LABELS_EN,
  DREAM_LUCIDITY_LABELS_UK,
  DREAM_LUCIDITY_LEVELS_EN,
  DREAM_LUCIDITY_LEVELS_UK,
  DREAM_MOOD_LABELS_EN,
  DREAM_MOOD_LABELS_UK,
  DREAM_MOODS_EN,
  DREAM_MOODS_UK,
  DREAM_PRE_SLEEP_EMOTION_LABELS_EN,
  DREAM_PRE_SLEEP_EMOTION_LABELS_UK,
  DREAM_PRE_SLEEP_EMOTIONS_EN,
  DREAM_PRE_SLEEP_EMOTIONS_UK,
  DREAM_STRESS_LABELS_EN,
  DREAM_STRESS_LABELS_UK,
  DREAM_STRESS_LEVELS_EN,
  DREAM_STRESS_LEVELS_UK,
  DREAM_WAKE_EMOTION_LABELS_EN,
  DREAM_WAKE_EMOTION_LABELS_UK,
  DREAM_WAKE_EMOTIONS_EN,
  DREAM_WAKE_EMOTIONS_UK,
} from './options';

export { DREAM_COPY_EN, DREAM_COPY_UK };
export type { DreamCopy };

export function getDreamCopy(locale: AppLocale): DreamCopy {
  return locale === 'uk' ? DREAM_COPY_UK : DREAM_COPY_EN;
}

export function getDreamMoods(locale: AppLocale) {
  return locale === 'uk' ? DREAM_MOODS_UK : DREAM_MOODS_EN;
}

export function getDreamMoodLabels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_MOOD_LABELS_UK : DREAM_MOOD_LABELS_EN;
}

export function getDreamIntensityLevels(locale: AppLocale) {
  return locale === 'uk'
    ? DREAM_INTENSITY_LEVELS_UK
    : DREAM_INTENSITY_LEVELS_EN;
}

export function getDreamLucidityLevels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_LUCIDITY_LEVELS_UK : DREAM_LUCIDITY_LEVELS_EN;
}

export function getDreamLucidityLabels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_LUCIDITY_LABELS_UK : DREAM_LUCIDITY_LABELS_EN;
}

export function getDreamStressLevels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_STRESS_LEVELS_UK : DREAM_STRESS_LEVELS_EN;
}

export function getDreamStressLabels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_STRESS_LABELS_UK : DREAM_STRESS_LABELS_EN;
}

export function getDreamWakeEmotions(locale: AppLocale) {
  return locale === 'uk' ? DREAM_WAKE_EMOTIONS_UK : DREAM_WAKE_EMOTIONS_EN;
}

export function getDreamWakeEmotionLabels(locale: AppLocale) {
  return locale === 'uk'
    ? DREAM_WAKE_EMOTION_LABELS_UK
    : DREAM_WAKE_EMOTION_LABELS_EN;
}

export function getDreamPreSleepEmotions(locale: AppLocale) {
  return locale === 'uk'
    ? DREAM_PRE_SLEEP_EMOTIONS_UK
    : DREAM_PRE_SLEEP_EMOTIONS_EN;
}

export function getDreamPreSleepEmotionLabels(locale: AppLocale) {
  return locale === 'uk'
    ? DREAM_PRE_SLEEP_EMOTION_LABELS_UK
    : DREAM_PRE_SLEEP_EMOTION_LABELS_EN;
}
