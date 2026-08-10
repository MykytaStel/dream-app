export type HomeOnboardingModalKind = 'biometric' | 'reminder' | 'backup';

type OnboardingCandidates = {
  biometric: boolean;
  reminder: boolean;
  backup: boolean;
};

export function pickActiveOnboardingModal(
  candidates: OnboardingCandidates,
): HomeOnboardingModalKind | null {
  if (candidates.biometric) {
    return 'biometric';
  }
  if (candidates.reminder) {
    return 'reminder';
  }
  if (candidates.backup) {
    return 'backup';
  }
  return null;
}
