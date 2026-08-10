import { shouldAutoDisableBiometricLock } from '../src/features/security/model/biometricLockAutoDisable';

describe('biometric lock auto-disable', () => {
  it('disables when biometrics are confirmed not enrolled', () => {
    expect(
      shouldAutoDisableBiometricLock({
        available: false,
        reason: 'not-enrolled',
      }),
    ).toBe(true);
  });

  it('does not disable on "not-supported" (covers transient lockout, which the OS reports the same way)', () => {
    expect(
      shouldAutoDisableBiometricLock({
        available: false,
        reason: 'not-supported',
      }),
    ).toBe(false);
  });

  it('does not disable on "unknown" (native/bridge errors, unmapped OS codes)', () => {
    expect(
      shouldAutoDisableBiometricLock({
        available: false,
        reason: 'unknown',
      }),
    ).toBe(false);
  });

  it('does not disable when biometrics are available', () => {
    expect(
      shouldAutoDisableBiometricLock({
        available: true,
        biometryType: 'FaceID',
      }),
    ).toBe(false);
  });
});
