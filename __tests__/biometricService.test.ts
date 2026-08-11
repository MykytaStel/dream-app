jest.mock('react-native-biometrics');

import ReactNativeBiometrics from 'react-native-biometrics';
import { checkBiometricAvailability } from '../src/services/security/biometricService';

// biometricService.ts constructs a single ReactNativeBiometrics instance at
// module load time and reuses it for every call, so there is exactly one
// mocked instance for the whole test file to configure per test.
const MockReactNativeBiometrics = ReactNativeBiometrics as jest.MockedClass<
  typeof ReactNativeBiometrics
>;
const mockIsSensorAvailable = MockReactNativeBiometrics.mock.instances[0]
  .isSensorAvailable as jest.Mock;

describe('checkBiometricAvailability classification', () => {
  beforeEach(() => {
    mockIsSensorAvailable.mockReset();
  });

  it('reports available with the biometry type when the sensor is usable', async () => {
    mockIsSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: 'FaceID',
    });

    await expect(checkBiometricAvailability()).resolves.toEqual({
      available: true,
      biometryType: 'FaceID',
    });
  });

  describe('iOS NSError descriptions (locale-independent Code= portion)', () => {
    it('classifies LAErrorBiometryNotEnrolled (-7) as not-enrolled', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error:
          'Error Domain=com.apple.LocalAuthentication Code=-7 "No identity enrolled." UserInfo={NSLocalizedDescription=No identity enrolled.}',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-enrolled',
      });
    });

    it('classifies LAErrorBiometryNotEnrolled (-7) as not-enrolled even with a non-English localized message', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error:
          'Error Domain=com.apple.LocalAuthentication Code=-7 "Жодного відбитка не зареєстровано." UserInfo={NSLocalizedDescription=Жодного відбитка не зареєстровано.}',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-enrolled',
      });
    });

    it('classifies LAErrorPasscodeNotSet (-5) as not-enrolled', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error:
          'Error Domain=com.apple.LocalAuthentication Code=-5 "Passcode not set." UserInfo={NSLocalizedDescription=Passcode not set.}',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-enrolled',
      });
    });

    it('does NOT classify LAErrorBiometryLockout (-8) as not-enrolled — this is the transient case an attacker could trigger on purpose', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error:
          'Error Domain=com.apple.LocalAuthentication Code=-8 "Biometry is locked out." UserInfo={NSLocalizedDescription=Biometry is locked out.}',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-supported',
      });
    });

    it('does NOT classify LAErrorBiometryNotAvailable (-6) as not-enrolled', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error:
          'Error Domain=com.apple.LocalAuthentication Code=-6 "Biometry is not available." UserInfo={NSLocalizedDescription=Biometry is not available.}',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-supported',
      });
    });
  });

  describe('Android BiometricManager constants (literal, non-localized strings)', () => {
    it('classifies BIOMETRIC_ERROR_NONE_ENROLLED as not-enrolled', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error: 'BIOMETRIC_ERROR_NONE_ENROLLED',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-enrolled',
      });
    });

    it('does NOT classify BIOMETRIC_ERROR_HW_UNAVAILABLE as not-enrolled', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error: 'BIOMETRIC_ERROR_HW_UNAVAILABLE',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-supported',
      });
    });

    it('does NOT classify BIOMETRIC_ERROR_NO_HARDWARE as not-enrolled', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        error: 'BIOMETRIC_ERROR_NO_HARDWARE',
      });

      await expect(checkBiometricAvailability()).resolves.toEqual({
        available: false,
        reason: 'not-supported',
      });
    });
  });

  it('classifies an unmapped/undefined native error as not-supported, not not-enrolled', async () => {
    mockIsSensorAvailable.mockResolvedValue({
      available: false,
      error: undefined,
    });

    await expect(checkBiometricAvailability()).resolves.toEqual({
      available: false,
      reason: 'not-supported',
    });
  });

  it('classifies a thrown/rejected native call as unknown', async () => {
    mockIsSensorAvailable.mockRejectedValue(new Error('bridge error'));

    await expect(checkBiometricAvailability()).resolves.toEqual({
      available: false,
      reason: 'unknown',
    });
  });
});
