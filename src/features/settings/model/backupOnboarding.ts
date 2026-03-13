export const BACKUP_ONBOARDING_DREAM_THRESHOLD = 3;

type ShouldShowBackupOnboardingArgs = {
  dreamCount: number;
  hasSeen: boolean;
  forceVisible?: boolean;
};

export function shouldShowBackupOnboarding({
  dreamCount,
  hasSeen,
  forceVisible = false,
}: ShouldShowBackupOnboardingArgs) {
  if (forceVisible) {
    return true;
  }

  return !hasSeen && dreamCount >= BACKUP_ONBOARDING_DREAM_THRESHOLD;
}
