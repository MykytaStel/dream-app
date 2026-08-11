# Biometric lockout fix

Date: 2026-08-10
Found during: a gap audit of Home/Archive/capture-edge-cases against the owner's
product plan (`~/.claude/plans/dream-app-product-plan-2026-08-03.md` §4, "biometrics
unavailable after update" is explicitly listed as a required-before-release edge
case).

## Program note

`AppLockGate` (`src/features/security/components/AppLockGate.tsx`) wraps the entire
app at the root (`App.tsx:28`). When `locked === true`, absolutely nothing renders
except the lock screen — including Settings, where the user would otherwise go to
turn the lock off. `authenticateWithBiometrics` (`src/services/security/biometricService.ts:30-38`)
swallows every native error and returns a bare `false`. If a device's biometrics
stop working — OS update removes enrollment, hardware fault, user deletes all
fingerprints — every future unlock attempt fails identically to a wrong-finger
tap, and the app is permanently unreachable to its own owner. There is currently
no code path that distinguishes "this one attempt failed" from "biometrics are no
longer possible on this device."

## Design

**This section describes the design as it actually shipped, after a security
review (see Revision History below) found the first version was a bypass, not a
fix. Do not revert to checking `available: false` for any reason — that is the
exact defect this revision closes.**

### The fix: auto-disable only on one durable, unambiguous signal

`useAppLockGate.ts`'s `triggerAuth` already calls `authenticateWithBiometrics`. On
failure, it will additionally call `checkBiometricAvailability()`
(`biometricService.ts:11-28`), the same capability check the Settings screen's
enable flow already uses, returning a discriminated union
(`{available: false, reason: 'not-supported' | 'not-enrolled' | 'unknown'} |
{available: true, biometryType: string}`).

`available: false` is a **point-in-time verdict, not a durable capability
claim**. Critically, it also fires for a *transient* biometric lockout — iOS
`LAErrorBiometryLockout` after ~5 consecutive failed attempts, Android
`BIOMETRIC_ERROR_HW_UNAVAILABLE` and several unmapped `BiometricManager` codes —
which an attacker with physical possession of a *locked* device can trigger on
purpose. Auto-disabling on any `available: false` would let that attacker turn
the app's lock off deliberately.

The fix only auto-disables on the one reason that is both durable and cannot be
manufactured by repeated failed attempts: `reason === 'not-enrolled'` — no
biometrics configured on the device at all. This is extracted as a pure,
unit-tested predicate:

```ts
// src/features/security/model/biometricLockAutoDisable.ts
export function shouldAutoDisableBiometricLock(
  availability: BiometricAvailability,
): boolean {
  return !availability.available && availability.reason === 'not-enrolled';
}
```

- If the predicate is `false` — stay locked, the existing "Unlock" button lets
  the user retry, exactly like today. This covers ordinary failed/declined
  attempts *and* lockout *and* unmapped/unknown native errors.
- If the predicate is `true` — the device confirms no biometrics are enrolled at
  all, which reaching requires the device passcode (enrollment changes are
  passcode-gated), so an attacker holding a locked device cannot manufacture this
  state. `setBiometricLockEnabled(false)`, unlock, and surface a one-time notice.

This still covers the motivating scenario (OS update clears biometric enrollment)
without covering the exploitable one (deliberately triggered lockout).

**The classifier itself had to be made locale- and platform-robust for this to
work in practice**, not just narrowed: `biometricService.ts`'s original
`error?.includes('enrolled') || error?.includes('PasscodeNotSet')` check was
broken on Android (`'BIOMETRIC_ERROR_NONE_ENROLLED'.includes('enrolled')` is
`false` — case-sensitive) and on any non-English iOS device (the message is
localized). `isNotEnrolledError` now matches the Android constant name directly
(a literal, non-localized string) and, on iOS, parses the numeric `Code=` value
out of `NSError`'s default `%@` description — the `Domain=...Code=<n>` portion is
not localized even though the human-readable message is — comparing against the
known `LAErrorBiometryNotEnrolled` (-7) and `LAErrorPasscodeNotSet` (-5) codes.
If neither pattern matches (including if some future OS version changes the
description format entirely), the classifier falls back to `'not-supported'`,
which is excluded from auto-disable — a parsing miss fails safe (locked, same as
before this fix existed), never fails open.

### State and the one-time notice

`useAppLockGate` gains two new pieces of return state:
- `autoDisabled: boolean` — `true` once the predicate above has fired, `false`
  otherwise. (Not a reason enum: there is exactly one reason now, so the UI needs
  no branching.)
- `dismissAutoDisabledNotice: () => void` — clears it, called once the notice has
  been shown, so a later recurrence (lock re-enabled, breaks again) can fire again.

`AppLockGate.tsx` shows a plain `Alert.alert` with one message. The trigger is
platform-specific because RN's `Modal.onDismiss` **is iOS-only**
(`node_modules/react-native/Libraries/Modal/Modal.js`: "OnDismiss is implemented
on iOS only"): on iOS the alert is shown from the lock `Modal`'s own `onDismiss`
prop, which fires only after that Modal's dismiss animation genuinely completes —
presenting an `Alert` while it's still animating out is a known way for iOS to
drop it silently. (An earlier version of this fix tried to defer the alert with
`InteractionManager.runAfterInteractions`; that API is a deprecated no-op stub in
this RN version — `setImmediate` under the hood, not an animation-aware
deferral — so it did not actually fix anything. `Modal.onDismiss` is the real,
supported hook for this.) On Android, which never fires `onDismiss` and has no
known equivalent presentation race, the alert shows immediately via a `useEffect`
watching `autoDisabled`.

### Copy — deliberately not localized, matching the existing lock screen

`App.tsx` already documents why: `AppLockGate` can render before the async locale
preference has loaded, so its copy is hardcoded English, passed as props
(`LOCK_COPY`, `App.tsx:15-20`). The two new strings for this fix follow the same
pattern — no new i18n plumbing, no dependency on `getSettingsCopy`:

```ts
lockDisabledTitle: 'App lock turned off',
lockDisabledDescription:
  'No biometrics are set up on this device anymore, so App Lock was turned off automatically. You can turn it back on in Settings once Face ID or a fingerprint is set up again.',
```

### Files

- **Modify `src/services/security/biometricService.ts`**: `isNotEnrolledError`
  replaces the old English-substring check with the locale-/platform-robust
  matching described above. `checkBiometricAvailability`'s public shape
  (`BiometricAvailability`) is unchanged.
- **Create `src/features/security/model/biometricLockAutoDisable.ts`**:
  `shouldAutoDisableBiometricLock`, pure and unit-tested.
- **Modify `src/features/security/hooks/useAppLockGate.ts`**: `triggerAuth` calls
  `checkBiometricAvailability()` on failure and consults the predicate above; new
  `autoDisabled` state and `dismissAutoDisabledNotice` callback added to the
  hook's return value.
- **Modify `src/features/security/components/AppLockGate.tsx`**: two new required
  props (`lockDisabledTitle`, `lockDisabledDescription`); the lock `Modal` gains
  an `onDismiss` handler; a `useEffect` handles the Android case.
- **Modify `App.tsx`**: two new entries in `LOCK_COPY`, passed through to
  `AppLockGate`.

No change to `src/features/settings/hooks/useSettingsScreenController.ts` or any
Settings screen — `biometricLockEnabled` there is already re-read from storage via
`getBiometricLockEnabled()` on every screen focus, so it will correctly show "Off"
next time the user visits Settings, with no additional wiring.

## Explicitly out of scope

- No PIN/passcode fallback as an alternative unlock method — a materially bigger
  feature (new secret to store/verify, its own recovery story) that isn't what
  this fix is solving. The fix is "don't brick the app," not "add a second way in."
- No proactive/periodic re-check while the app is unlocked and running — the check
  only runs at the moment an unlock attempt actually fails, which is the only
  moment it matters.
- No change to the manual Settings biometric-lock toggle's own error handling
  (`useSettingsScreenController.ts:366-405`) — that flow already handles
  `available: false` correctly when the user is trying to turn the lock *on*; this
  fix is specifically about the *already-locked-out* path that flow can't reach.

## Testing

- `shouldAutoDisableBiometricLock` (`__tests__/biometricLockAutoDisable.test.ts`):
  4 cases — `not-enrolled` → true, `not-supported` → false, `unknown` → false,
  `available: true` → false.
- `checkBiometricAvailability`'s classifier (`__tests__/biometricService.test.ts`):
  a table test with `react-native-biometrics` auto-mocked (`jest.mock('react-native-biometrics')`,
  then configuring the constructed instance via `MockedClass.mock.instances[0]` —
  `biometricService.ts` constructs a single instance at module load and reuses it,
  so per-test setup targets that one instance's `isSensorAvailable` mock), asserting
  the *actual* native error strings classify correctly: iOS `Code=-7`/`Code=-5`
  (English and non-English localized message) → `not-enrolled`; iOS `Code=-8`
  (lockout) and `Code=-6` → `not-supported`; Android `BIOMETRIC_ERROR_NONE_ENROLLED`
  → `not-enrolled`; `BIOMETRIC_ERROR_HW_UNAVAILABLE`/`BIOMETRIC_ERROR_NO_HARDWARE`
  → `not-supported`; unmapped/undefined error → `not-supported`; rejected native
  call → `unknown`. This is the layer that actually matters — a predicate that's
  correct in isolation is only as good as the classification feeding it.
- `useAppLockGate` (`__tests__/useAppLockGate.behaviour.test.ts`, `renderHook` from
  `@testing-library/react-native`, matching this codebase's `*.behaviour.test.ts`
  convention): this is the layer that held the original Critical bypass, and it
  had no coverage at all through the first two revisions — a straight revert of the
  auto-disable condition to "any unavailable reason" passed every other test in the
  suite. Cases: a failed prompt with biometrics still `available: true` leaves the
  lock in place; failed + `not-supported` leaves it in place (the bucket a real
  lockout falls into); failed + `unknown` leaves it in place; failed + `not-enrolled`
  disables the lock, unlocks, and sets the notice flag; `dismissAutoDisabledNotice`
  clears it; a successful prompt unlocks via the normal path without touching
  biometric-lock settings or even calling `checkBiometricAvailability`; initial
  `locked` reflects the persisted flag. Verified by temporarily reverting the
  auto-disable condition to pass 1's code — 2 of these tests fail, confirming they
  actually guard the regression rather than just exercising the code.
- `checkBiometricAvailability`'s classifier (`__tests__/biometricService.test.ts`):
  a table test with `react-native-biometrics` auto-mocked (`jest.mock('react-native-biometrics')`,
  then configuring the constructed instance via `MockedClass.mock.instances[0]` —
  `biometricService.ts` constructs a single instance at module load and reuses it,
  so per-test setup targets that one instance's `isSensorAvailable` mock), asserting
  the *actual* native error strings classify correctly on the *correct* platform
  (`Platform.OS` set per describe block): iOS `Code=-7`/`Code=-5` (English and
  non-English localized message) → `not-enrolled`; iOS `Code=-8` (lockout) and
  `Code=-6` → `not-supported`; an unrelated error domain that happens to carry
  `Code=-7` → `not-supported` (proves the domain anchor, not just the number,
  matters); Android `BIOMETRIC_ERROR_NONE_ENROLLED` → `not-enrolled`;
  `BIOMETRIC_ERROR_HW_UNAVAILABLE`/`BIOMETRIC_ERROR_NO_HARDWARE` → `not-supported`;
  an Android string that coincidentally contains `"Code=-7"` → `not-supported`
  (proves the iOS branch never runs on Android); unmapped/undefined error →
  `not-supported`; rejected native call → `unknown`.
- `shouldAutoDisableBiometricLock` (`__tests__/biometricLockAutoDisable.test.ts`):
  4 cases — `not-enrolled` → true, `not-supported` → false, `unknown` → false,
  `available: true` → false. (Narrower value now that `useAppLockGate` itself has
  direct coverage above, but kept — it's still the cheapest, most direct
  documentation of the security boundary in isolation.)
- `AppLockGate.tsx`'s dual-path alert trigger (`onDismiss` vs. the Android/fallback
  effect) still has no dedicated test — verified via `npx tsc --noEmit`,
  `npx eslint`, and the full `npx jest` suite for regressions. This remains the one
  piece of this fix verified by reading the code and manual testing rather than an
  automated test, noted here rather than left implicit.
- Manual: with biometric lock enabled and the app locked, remove all enrolled
  biometrics at the OS level (or stub `checkBiometricAvailability` during a debug
  session) and confirm: the app unlocks, the "App lock turned off" alert appears
  exactly once, and Settings subsequently shows the lock as Off. Separately confirm
  an ordinary failed/cancelled Face ID prompt (biometrics still enrolled) does *not*
  unlock or show any alert. **Explicitly test the negative case this fix exists to
  prevent**: fail Face ID five times in a row on a device with enrollment intact
  (triggering iOS biometric lockout) and confirm the app stays locked and App Lock
  stays enabled. If possible, also test the fast-unlock timing case specifically:
  a device with no biometrics enrolled at all, cold-starting the app with the lock
  already engaged, checking whether the alert reliably appears (this is the
  scenario the `onDismiss`-only version of the fix was found unreliable for).

## Revision History

- **2026-08-10, first pass (`81e33ab`)**: auto-disabled on any `available: false`.
  A security review found this was a bypass: an attacker with physical possession
  of a locked device could fail Face ID ~5 times to trigger `LAErrorBiometryLockout`,
  which the existing classifier defaulted to `reason: 'not-supported'` — and the
  first version treated *any* unavailable reason as "gone forever," disabling the
  lock and opening the app.
- **2026-08-10, second pass (`ebe2910`)**: narrowed to `reason === 'not-enrolled'`
  only, via `shouldAutoDisableBiometricLock`. A re-review confirmed the bypass was
  closed, but found the narrowed check was **unreachable in practice** on Android
  (case-sensitive string match against an uppercase constant) and on any
  non-English iOS device (matching localized message text) — so the original
  lockout-forever bug remained live for most real users, and separately found
  `InteractionManager.runAfterInteractions` doesn't defer past the dismiss
  animation in this RN version (it's a deprecated `setImmediate` stub), so the
  dropped-alert mitigation hadn't actually taken effect either.
- **2026-08-10, third pass (`46b3263`)**: fixed both. The classifier now matches
  the Android constant correctly and parses the iOS NSError's locale-independent
  `Code=` number instead of localized text; the alert now uses `Modal.onDismiss`
  (iOS-only, but the real supported mechanism) with an immediate Android path,
  replacing `InteractionManager`. Added table-driven tests against realistic
  native error strings on both platforms, including a non-English iOS message.
- **2026-08-10, fourth pass (current)**: a third review found no Critical issue —
  the security boundary held up under a serious independent attempt to break it —
  but three Important gaps: (1) `useAppLockGate.ts`, the layer that held the
  *original* Critical bypass, still had zero test coverage; a plain revert to pass
  1's code passed all 945 existing tests. Closed with
  `__tests__/useAppLockGate.behaviour.test.ts`, verified to actually catch that
  exact revert. (2) The iOS `Code=` regex matched a bare number with no domain
  check and no `Platform.OS` gate — an error from any domain carrying `Code=-7` or
  `Code=-5` would misclassify as `not-enrolled`, and the iOS branch could run
  against Android strings. Low real-world exploitability (today's actual error
  sources don't produce such collisions) but the wrong direction to fail in, and
  the same *class* of gap as passes 1 and 2. Fixed by anchoring the regex to
  `Domain=com.apple.LocalAuthentication` and gating both branches on `Platform.OS`.
  (3) `Modal.onDismiss` was the *sole* iOS trigger for the notice, and in the
  primary scenario — auto-disable resolving within tens of milliseconds of mount,
  which is exactly what happens with no biometrics enrolled — the dismiss call can
  land while the Modal is still mid-*presentation*, which iOS can silently drop
  with no retry, meaning `onDismiss` never fires and the notice is lost. Fixed
  with a 600ms fallback timer (iOS only; Android already fires immediately) that
  shows the notice regardless, guarded against double-firing with a ref so it's
  safe if `onDismiss` also happens to fire correctly.

Three consecutive reviews each found something real. The lesson: for
security-relevant native-string classification and platform-timing logic, "I
traced the code and it looks right" is not sufficient — an independent adversarial
review pass caught a genuine bypass, then two rounds of "unreachable in practice"
gaps that a passing test suite didn't expose because the layer that mattered
(`useAppLockGate.ts` itself) had no test until the fourth pass.
