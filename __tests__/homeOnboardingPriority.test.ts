import { pickActiveOnboardingModal } from '../src/features/dreams/model/homeOnboardingPriority';

describe('home onboarding priority', () => {
  it('returns null when nothing is eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: false,
        backup: false,
      }),
    ).toBeNull();
  });

  it('picks biometric alone', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: true,
        reminder: false,
        backup: false,
      }),
    ).toBe('biometric');
  });

  it('picks reminder alone', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: true,
        backup: false,
      }),
    ).toBe('reminder');
  });

  it('picks backup alone', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: false,
        backup: true,
      }),
    ).toBe('backup');
  });

  it('prefers biometric over reminder and backup when all are eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: true,
        reminder: true,
        backup: true,
      }),
    ).toBe('biometric');
  });

  it('prefers biometric over backup when reminder is not eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: true,
        reminder: false,
        backup: true,
      }),
    ).toBe('biometric');
  });

  it('prefers reminder over backup when biometric is not eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: true,
        backup: true,
      }),
    ).toBe('reminder');
  });
});
