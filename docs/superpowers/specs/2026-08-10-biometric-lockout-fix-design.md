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

### The fix: distinguish a failed attempt from an impossible one

`useAppLockGate.ts`'s `triggerAuth` already calls `authenticateWithBiometrics`. On
failure, it will additionally call `checkBiometricAvailability()`
(`biometricService.ts:11-28`) — the same capability check already used by the
Settings screen's enable flow, returning a discriminated union
(`{available: false, reason: 'not-supported' | 'not-enrolled' | 'unknown'} |
{available: true, biometryType: string}`).

- If `available: true` — this was an ordinary failed/declined attempt (wrong
  finger, user cancelled). Nothing changes: stay locked, the existing "Unlock"
  button lets the user retry, exactly like today.
- If `available: false` — the device itself confirms biometric auth cannot
  succeed right now, for any reason. Continuing to gate the app behind it
  protects nothing (there's no attacker to keep out if the OS itself can't
  verify anyone) and only bricks the app for its owner. In this case:
  `setBiometricLockEnabled(false)`, unlock, and surface a one-time notice
  explaining what happened and that App Lock was turned off automatically.

This generalizes past "after an OS update" to any cause with the same signature —
restoring to a device without biometric hardware, deleting all enrolled
fingerprints, etc. — since the check is capability-based, not scenario-based.

### State and the one-time notice

`useAppLockGate` gains two new pieces of return state:
- `autoDisabledReason: 'not-supported' | 'not-enrolled' | 'unknown' | null` — set
  when the auto-disable fires, `null` otherwise.
- `dismissAutoDisabledNotice: () => void` — clears it, called once the notice has
  been shown, so a later recurrence (lock re-enabled, breaks again) can fire again.

`AppLockGate.tsx` reacts to `autoDisabledReason` becoming non-null with a plain
`Alert.alert`, choosing between two messages (`not-enrolled` vs. everything else),
mirroring the two-way split the Settings enable-flow error copy already uses.

### Copy — deliberately not localized, matching the existing lock screen

`App.tsx` already documents why: `AppLockGate` can render before the async locale
preference has loaded, so its copy is hardcoded English, passed as props
(`LOCK_COPY`, `App.tsx:15-20`). The three new strings for this fix follow the same
pattern — no new i18n plumbing, no dependency on `getSettingsCopy`:

```ts
lockDisabledTitle: 'App lock turned off',
lockDisabledDescriptionNotEnrolled:
  'No biometrics are set up on this device anymore, so App Lock was turned off automatically. You can turn it back on in Settings once Face ID or a fingerprint is set up again.',
lockDisabledDescriptionUnsupported:
  'This device no longer supports biometric authentication, so App Lock was turned off automatically.',
```

### Files

- **Modify `src/features/security/hooks/useAppLockGate.ts`**: `triggerAuth` calls
  `checkBiometricAvailability()` on failure and auto-disables as described; new
  `autoDisabledReason` state and `dismissAutoDisabledNotice` callback added to the
  hook's return value.
- **Modify `src/features/security/components/AppLockGate.tsx`**: three new required
  props (`lockDisabledTitle`, `lockDisabledDescriptionNotEnrolled`,
  `lockDisabledDescriptionUnsupported`); a `useEffect` that fires `Alert.alert` when
  `autoDisabledReason` is non-null, then calls `dismissAutoDisabledNotice`.
- **Modify `App.tsx`**: three new entries in `LOCK_COPY`, passed through to
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

- `src/features/security/hooks/useAppLockGate.ts` has no existing test file today
  (native `AppState` and biometric-module dependencies make it awkward to unit
  test in this codebase's current harness) — this fix doesn't change that; verified
  via `npx tsc --noEmit`, `npx eslint`, and the full `npx jest` suite for
  regressions, consistent with how this file's prior changes have been verified.
- Manual: with biometric lock enabled and the app locked, simulate
  `checkBiometricAvailability()` returning `available: false` (e.g. temporarily
  disable Face ID/fingerprint at the OS level on a simulator/device, or stub the
  function during a debug session) and confirm: the app unlocks, the "App lock
  turned off" alert appears with the correct message for the reason, and Settings
  subsequently shows the lock as Off. Separately confirm an ordinary failed/
  cancelled Face ID prompt (biometrics still enrolled) does *not* unlock or show
  any alert — the existing retry-via-button behavior is unchanged.
