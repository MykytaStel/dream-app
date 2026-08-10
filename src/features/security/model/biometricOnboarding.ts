export const BIOMETRIC_ONBOARDING_DREAM_THRESHOLD = 1;

type ShouldShowBiometricOnboardingArgs = {
  dreamCount: number;
  hasSeen: boolean;
  forceVisible?: boolean;
};

export function shouldShowBiometricOnboarding({
  dreamCount,
  hasSeen,
  forceVisible = false,
}: ShouldShowBiometricOnboardingArgs) {
  if (forceVisible) {
    return true;
  }
  return !hasSeen && dreamCount >= BIOMETRIC_ONBOARDING_DREAM_THRESHOLD;
}
