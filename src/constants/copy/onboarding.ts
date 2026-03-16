import { AppLocale } from '../../i18n/types';

const ONBOARDING_COPY_EN = {
  slide1Eyebrow: 'Capture',
  slide1Title: 'Write before it fades',
  slide1Description:
    'Dreams disappear in minutes. Open Kaleidoscope right after waking — before the details slip away.',
  slide2Eyebrow: 'Reflect',
  slide2Title: 'Find your patterns',
  slide2Description:
    'Track moods, symbols, and recurring themes. Discover what your sleeping mind returns to night after night.',
  slide3Eyebrow: 'Private',
  slide3Title: 'Yours alone',
  slide3Description:
    'Everything stays on your device. No account required. Your dream journal is private by design.',
  continueAction: 'Continue',
  getStartedAction: 'Get started',
  skipAction: 'Skip',
};

type OnboardingCopy = typeof ONBOARDING_COPY_EN;

const ONBOARDING_COPY_UK: OnboardingCopy = {
  slide1Eyebrow: 'Захоплення',
  slide1Title: 'Запиши, поки не забув',
  slide1Description:
    'Сни зникають за лічені хвилини. Відкрий Kaleidoscope одразу після пробудження — поки деталі ще свіжі.',
  slide2Eyebrow: 'Рефлексія',
  slide2Title: 'Знайди свої патерни',
  slide2Description:
    'Відстежуй настрої, символи та повторювані теми. Дізнайся, до чого твій розум повертається ніч за ніччю.',
  slide3Eyebrow: 'Приватність',
  slide3Title: 'Тільки твоє',
  slide3Description:
    'Все зберігається на твоєму пристрої. Акаунт не потрібен. Твій щоденник снів — повністю приватний.',
  continueAction: 'Далі',
  getStartedAction: 'Почати',
  skipAction: 'Пропустити',
};

export function getOnboardingCopy(locale: AppLocale): OnboardingCopy {
  return locale === 'uk' ? ONBOARDING_COPY_UK : ONBOARDING_COPY_EN;
}
