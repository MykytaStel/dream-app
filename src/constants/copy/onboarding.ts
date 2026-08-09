import { AppLocale } from '../../i18n/types';

const ONBOARDING_COPY_EN = {
  promiseEyebrow: 'Kaleidoscope',
  promiseTitle: 'Write before it fades',
  promiseDescription:
    'Dreams disappear in minutes. See what keeps coming back — privately, without your journal leaving the device.',
  voiceAction: 'Record a voice memo',
  textAction: 'Write it down',
  noMemoryAction: "I don't remember, but I want to start",
};

type OnboardingCopy = typeof ONBOARDING_COPY_EN;

const ONBOARDING_COPY_UK: OnboardingCopy = {
  promiseEyebrow: 'Калейдоскоп',
  promiseTitle: 'Запиши, поки не забув',
  promiseDescription:
    'Сни зникають за лічені хвилини. Побач, що повертається у твоїх снах — приватно, без хмари.',
  voiceAction: 'Записати голосом',
  textAction: 'Написати текстом',
  noMemoryAction: 'Не пам’ятаю сон, але хочу почати',
};

export function getOnboardingCopy(locale: AppLocale): OnboardingCopy {
  return locale === 'uk' ? ONBOARDING_COPY_UK : ONBOARDING_COPY_EN;
}
