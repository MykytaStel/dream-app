export const REMINDER_ONBOARDING_DREAM_THRESHOLD = 1;

type ShouldShowReminderOnboardingArgs = {
  dreamCount: number;
  hasSeen: boolean;
  forceVisible?: boolean;
};

export function shouldShowReminderOnboarding({
  dreamCount,
  hasSeen,
  forceVisible = false,
}: ShouldShowReminderOnboardingArgs) {
  if (forceVisible) {
    return true;
  }

  return !hasSeen && dreamCount >= REMINDER_ONBOARDING_DREAM_THRESHOLD;
}
