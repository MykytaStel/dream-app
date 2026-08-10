import {
  BIOMETRIC_ONBOARDING_DREAM_THRESHOLD,
  shouldShowBiometricOnboarding,
} from '../src/features/security/model/biometricOnboarding';
import {
  hasSeenBiometricOnboarding,
  markBiometricOnboardingSeen,
  resetBiometricOnboardingSeen,
} from '../src/features/security/services/biometricOnboardingService';

describe('biometric onboarding', () => {
  beforeEach(() => {
    resetBiometricOnboardingSeen();
  });

  it('stays hidden below the threshold', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: BIOMETRIC_ONBOARDING_DREAM_THRESHOLD - 1,
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('opens at the threshold when unseen', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: BIOMETRIC_ONBOARDING_DREAM_THRESHOLD,
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden after it was seen', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: BIOMETRIC_ONBOARDING_DREAM_THRESHOLD + 4,
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('can be force-opened in preview mode', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: 0,
        hasSeen: true,
        forceVisible: true,
      }),
    ).toBe(true);
  });

  it('persists the seen flag', () => {
    expect(hasSeenBiometricOnboarding()).toBe(false);

    markBiometricOnboardingSeen();

    expect(hasSeenBiometricOnboarding()).toBe(true);

    resetBiometricOnboardingSeen();

    expect(hasSeenBiometricOnboarding()).toBe(false);
  });
});
