import {
  BACKUP_ONBOARDING_DREAM_THRESHOLD,
  shouldShowBackupOnboarding,
} from '../src/features/settings/model/backupOnboarding';
import {
  hasSeenBackupOnboarding,
  markBackupOnboardingSeen,
  resetBackupOnboardingSeen,
} from '../src/features/settings/services/backupOnboardingService';

describe('backup onboarding', () => {
  beforeEach(() => {
    resetBackupOnboardingSeen();
  });

  it('stays hidden below the threshold', () => {
    expect(
      shouldShowBackupOnboarding({
        dreamCount: BACKUP_ONBOARDING_DREAM_THRESHOLD - 1,
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('opens at the threshold when unseen', () => {
    expect(
      shouldShowBackupOnboarding({
        dreamCount: BACKUP_ONBOARDING_DREAM_THRESHOLD,
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden after it was seen', () => {
    expect(
      shouldShowBackupOnboarding({
        dreamCount: BACKUP_ONBOARDING_DREAM_THRESHOLD + 4,
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('can be force-opened in preview mode', () => {
    expect(
      shouldShowBackupOnboarding({
        dreamCount: 0,
        hasSeen: true,
        forceVisible: true,
      }),
    ).toBe(true);
  });

  it('persists the seen flag', () => {
    expect(hasSeenBackupOnboarding()).toBe(false);

    markBackupOnboardingSeen();

    expect(hasSeenBackupOnboarding()).toBe(true);

    resetBackupOnboardingSeen();

    expect(hasSeenBackupOnboarding()).toBe(false);
  });
});
