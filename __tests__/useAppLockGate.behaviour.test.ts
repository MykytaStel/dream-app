import { act, renderHook } from '@testing-library/react-native';

const mockAuthenticateWithBiometrics = jest.fn();
const mockCheckBiometricAvailability = jest.fn();
const mockGetBiometricLockEnabled = jest.fn();
const mockSetBiometricLockEnabled = jest.fn();
const mockHapticUnlock = jest.fn();

jest.mock('../src/services/security/biometricService', () => ({
  authenticateWithBiometrics: (...args: unknown[]) =>
    mockAuthenticateWithBiometrics(...args),
  checkBiometricAvailability: (...args: unknown[]) =>
    mockCheckBiometricAvailability(...args),
  getBiometricLockEnabled: (...args: unknown[]) =>
    mockGetBiometricLockEnabled(...args),
  setBiometricLockEnabled: (...args: unknown[]) =>
    mockSetBiometricLockEnabled(...args),
}));

jest.mock('../src/services/haptics/hapticService', () => ({
  hapticUnlock: () => mockHapticUnlock(),
}));

const { useAppLockGate } = require('../src/features/security/hooks/useAppLockGate');

beforeEach(() => {
  mockAuthenticateWithBiometrics.mockReset();
  mockCheckBiometricAvailability.mockReset();
  // Lock starts disabled by default so the mount-time auto-trigger effect
  // (which fires `triggerAuth` on its own whenever the hook mounts locked)
  // never runs unless a test specifically wants it — every test below
  // exercises `triggerAuth` explicitly and awaits it, so behavior never
  // depends on the mount effect's own timing.
  mockGetBiometricLockEnabled.mockReset().mockReturnValue(false);
  mockSetBiometricLockEnabled.mockReset();
  mockHapticUnlock.mockReset();
});

// Guards the exact bug this hook exists to prevent: reverting the
// auto-disable condition to "any unavailable reason" (pass 1's Critical
// bypass) must make one of these fail.
describe('useAppLockGate auto-disable', () => {
  test('a failed prompt on a device that still supports biometrics leaves the lock in place', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(false);
    mockCheckBiometricAvailability.mockResolvedValue({
      available: true,
      biometryType: 'FaceID',
    });

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    await act(async () => {
      await result.current.triggerAuth();
    });

    expect(mockSetBiometricLockEnabled).not.toHaveBeenCalled();
    expect(result.current.autoDisabled).toBe(false);
  });

  test('a failed prompt classified as "not-supported" leaves the lock in place (this is the reason a real biometric lockout falls into)', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(false);
    mockCheckBiometricAvailability.mockResolvedValue({
      available: false,
      reason: 'not-supported',
    });

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    await act(async () => {
      await result.current.triggerAuth();
    });

    expect(mockSetBiometricLockEnabled).not.toHaveBeenCalled();
    expect(result.current.autoDisabled).toBe(false);
  });

  test('a failed prompt classified as "unknown" leaves the lock in place', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(false);
    mockCheckBiometricAvailability.mockResolvedValue({
      available: false,
      reason: 'unknown',
    });

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    await act(async () => {
      await result.current.triggerAuth();
    });

    expect(mockSetBiometricLockEnabled).not.toHaveBeenCalled();
    expect(result.current.autoDisabled).toBe(false);
  });

  test('a failed prompt classified as "not-enrolled" disables the lock, unlocks, and surfaces the notice', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(false);
    mockCheckBiometricAvailability.mockResolvedValue({
      available: false,
      reason: 'not-enrolled',
    });

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    await act(async () => {
      await result.current.triggerAuth();
    });

    expect(mockSetBiometricLockEnabled).toHaveBeenCalledWith(false);
    expect(result.current.locked).toBe(false);
    expect(result.current.autoDisabled).toBe(true);
  });

  test('dismissAutoDisabledNotice clears the notice so a later recurrence can fire again', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(false);
    mockCheckBiometricAvailability.mockResolvedValue({
      available: false,
      reason: 'not-enrolled',
    });

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    await act(async () => {
      await result.current.triggerAuth();
    });
    expect(result.current.autoDisabled).toBe(true);

    await act(async () => {
      result.current.dismissAutoDisabledNotice();
    });

    expect(result.current.autoDisabled).toBe(false);
  });
});

describe('useAppLockGate successful unlock', () => {
  test('a successful prompt unlocks without touching biometric-lock settings or checking availability', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(true);

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    await act(async () => {
      await result.current.triggerAuth();
    });

    expect(mockHapticUnlock).toHaveBeenCalledTimes(1);
    expect(result.current.locked).toBe(false);
    expect(mockCheckBiometricAvailability).not.toHaveBeenCalled();
    expect(mockSetBiometricLockEnabled).not.toHaveBeenCalled();
    expect(result.current.autoDisabled).toBe(false);
  });
});

describe('useAppLockGate initial state', () => {
  test('starts unlocked when biometric lock is disabled', async () => {
    mockGetBiometricLockEnabled.mockReturnValue(false);

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    expect(result.current.locked).toBe(false);
  });

  test('starts locked when biometric lock is enabled', async () => {
    mockGetBiometricLockEnabled.mockReturnValue(true);
    // The mount effect auto-triggers when the hook starts locked — give it
    // a pending (never-resolving in this test) promise so the initial,
    // pre-effect value of `locked` is what gets asserted.
    mockAuthenticateWithBiometrics.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useAppLockGate('Unlock'));

    expect(result.current.locked).toBe(true);
  });
});
