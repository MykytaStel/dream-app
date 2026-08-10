import { BiometricAvailability } from '../../../services/security/biometricService';

/**
 * Deliberately narrow: `available: false` from the OS is a point-in-time
 * verdict, not a durable capability claim. It also covers transient states —
 * most importantly a biometric lockout after repeated failed attempts, which
 * an attacker with physical possession of a locked device can trigger on
 * purpose. Only `'not-enrolled'` (no biometrics configured at all) is safe to
 * treat as durable; every other reason, including `'not-supported'` and
 * `'unknown'`, must leave the lock in place.
 */
export function shouldAutoDisableBiometricLock(
  availability: BiometricAvailability,
): boolean {
  return !availability.available && availability.reason === 'not-enrolled';
}
