import {
  REMINDER_ONBOARDING_DREAM_THRESHOLD,
  shouldShowReminderOnboarding,
} from '../src/features/reminders/model/reminderOnboarding';
import {
  hasSeenReminderOnboarding,
  markReminderOnboardingSeen,
  resetReminderOnboardingSeen,
} from '../src/features/reminders/services/reminderOnboardingService';

describe('reminder onboarding', () => {
  beforeEach(() => {
    resetReminderOnboardingSeen();
  });

  it('stays hidden below the threshold', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: REMINDER_ONBOARDING_DREAM_THRESHOLD - 1,
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('opens at the threshold when unseen', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: REMINDER_ONBOARDING_DREAM_THRESHOLD,
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden after it was seen', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: REMINDER_ONBOARDING_DREAM_THRESHOLD + 4,
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('can be force-opened in preview mode', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: 0,
        hasSeen: true,
        forceVisible: true,
      }),
    ).toBe(true);
  });

  it('persists the seen flag', () => {
    expect(hasSeenReminderOnboarding()).toBe(false);

    markReminderOnboardingSeen();

    expect(hasSeenReminderOnboarding()).toBe(true);

    resetReminderOnboardingSeen();

    expect(hasSeenReminderOnboarding()).toBe(false);
  });
});
