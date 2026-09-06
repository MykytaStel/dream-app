// `docs/ROADMAP.md` stage 3: the contextual prompts are offered "after the
// first or third entry, not all at once at the start". Biometric lock is the
// first-entry prompt (protect the archive you are starting); the reminder and
// backup prompts wait for the third, so a first save is only the saved sheet
// and the widget nudge.
export const REMINDER_ONBOARDING_DREAM_THRESHOLD = 3;

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
