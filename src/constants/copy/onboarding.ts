import { AppLocale } from '../../i18n/types';

const ONBOARDING_COPY_EN = {
  slide1Eyebrow: 'Capture',
  slide1Title: 'Write before it fades',
  slide1Description:
    'Dreams disappear in minutes. Open Kaleidoscope right after waking — before the details slip away.',
  slide2Eyebrow: 'Reflect',
  slide2Title: 'Find patterns and dream signs',
  slide2Description:
    'Track moods, recurring themes, lucid moments, and the signals that come back night after night.',
  slide3Eyebrow: 'Support',
  slide3Title: 'Lucid and nightmare tools',
  slide3Description:
    'Train lucidity gently, use wake capture fast, and track nightmares without turning the app into a medical product.',
  slide4Eyebrow: 'Private',
  slide4Title: 'Yours alone',
  slide4Description:
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
  slide2Title: 'Знайди патерни і dream signs',
  slide2Description:
    'Відстежуй настрої, повторювані теми, усвідомлені моменти і сигнали, що повертаються ніч за ніччю.',
  slide3Eyebrow: 'Підтримка',
  slide3Title: 'Інструменти для lucid і кошмарів',
  slide3Description:
    'Тренуй усвідомленість м’яко, швидко записуй після пробудження і відстежуй кошмари без медичних обіцянок.',
  slide4Eyebrow: 'Приватність',
  slide4Title: 'Тільки твоє',
  slide4Description:
    'Все зберігається на твоєму пристрої. Акаунт не потрібен. Твій щоденник снів — повністю приватний.',
  continueAction: 'Далі',
  getStartedAction: 'Почати',
  skipAction: 'Пропустити',
};

export function getOnboardingCopy(locale: AppLocale): OnboardingCopy {
  return locale === 'uk' ? ONBOARDING_COPY_UK : ONBOARDING_COPY_EN;
}
