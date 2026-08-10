# Biometric contextual onboarding — Part B, second slice

Date: 2026-08-10
Plan section: `~/.claude/plans/dream-app-product-plan-2026-08-03.md` §3.5 —
*"Reminder, backup, biometric, Whisper — contextual onboarding після 1-го або 3-го
запису."*

## Program note

Reminder onboarding shipped (`docs/superpowers/specs/2026-08-10-reminder-contextual-onboarding-design.md`).
This spec builds biometric next, using the same proven template. Whisper stays
deferred — a future fourth slice, once this pattern has been validated a third time.

This slice also pays down a debt the reminder slice's final review flagged: the
pairwise `readyForHandoff` gate between reminder and backup was known not to scale
past two modals, and the priority chain had zero automated coverage. Both are
addressed here as part of adding the third modal, not as a separate cleanup task.

## Design

### Threshold and priority

Shows after **1 dream**, same as reminder. Biometric protects whatever has already
been written — even one entry is private — so there's no reason to wait, same
reasoning as reminder's habit-building urgency.

Priority order when more than one onboarding modal is eligible on the same render:
**biometric → reminder → backup**. Privacy is the highest-stakes prompt (protects
already-written content from casual access), so it claims the slot first; reminder
keeps its existing priority over backup.

### Files (mirrors the reminder structure)

- **`src/features/security/model/biometricOnboarding.ts`** — pure function, no I/O:
  ```ts
  export const BIOMETRIC_ONBOARDING_DREAM_THRESHOLD = 1;

  export function shouldShowBiometricOnboarding({
    dreamCount,
    hasSeen,
    forceVisible = false,
  }: {
    dreamCount: number;
    hasSeen: boolean;
    forceVisible?: boolean;
  }) {
    if (forceVisible) return true;
    return !hasSeen && dreamCount >= BIOMETRIC_ONBOARDING_DREAM_THRESHOLD;
  }
  ```
- **`src/features/security/services/biometricOnboardingService.ts`** — `hasSeen`/
  `mark`/`reset`, backed by a new `BIOMETRIC_ONBOARDING_SEEN_KEY` in
  `src/services/storage/keys.ts` (value `'biometric-onboarding-seen'`, alongside
  `REMINDER_ONBOARDING_SEEN_KEY`).
- **`src/features/security/components/BiometricOnboardingModal.tsx`** — the UI.
  Same lean structure as `ReminderOnboardingModal.tsx`: hero row (icon + eyebrow/
  title/description) + two action buttons. Props:
  `{ visible: boolean; onClose: () => void; onDismiss?: () => void }` — identical
  shape to `ReminderOnboardingModal`'s, including the optional `onDismiss` used for
  the iOS handoff gate (see below).

### Enable flow — reusing the exact proven functions, not new biometric logic

`src/features/settings/hooks/useSettingsScreenController.ts`'s `onToggleBiometricLock`
(lines 366-405) is the existing, working enable path (used by the Settings screen's
manual toggle). The modal's primary action calls the same underlying
`src/services/security/biometricService.ts` functions directly — no new permission
or auth logic:

```ts
const authenticated = await authenticateWithBiometrics(copy.biometricLockPrompt);
if (!authenticated) {
  Alert.alert(copy.biometricLockEnableErrorTitle, copy.biometricLockEnableErrorFailed);
  return; // deliberately does NOT call onClose() — modal stays open
}
setBiometricLockEnabled(true);
trackBiometricLockToggled({ enabled: true });
onClose();
```

`biometricLockPrompt`, `biometricLockEnableErrorTitle`, `biometricLockEnableErrorFailed`
already exist and are reused as-is. There is no permission-request step distinct
from the biometric prompt itself — unlike reminders, the OS auth prompt *is* the
enable action, so there's only one failure path to handle (auth declined/failed),
not two.

The secondary action ("Not now") only closes the modal (marks seen, no auth
prompt, no settings change) — same posture as reminder and backup.

### Availability gate — the modal must never appear on unsupported devices

Unlike reminders (any device can receive local notifications) and backup (no
hardware dependency), biometric lock requires hardware/enrollment that not every
device has. `src/services/security/biometricService.ts`'s
`checkBiometricAvailability()` is async and returns
`{available: false, reason: ...} | {available: true, biometryType: string}`.

`HomeScreen.tsx` calls it once per focus, alongside the existing
`refreshOnboardingState` (same `useFocusEffect`), and caches the result in a
`biometricAvailable: boolean` state (defaulting to `false` until the check
resolves — the modal simply doesn't render before then, same as it never renders
on a device that fails the check). `shouldShowBiometricOnboarding` itself stays a
pure `dreamCount`/`hasSeen` function exactly like reminder's; the availability gate
is a separate `&& biometricAvailable` condition in `HomeScreen`, not baked into the
pure decision function — keeping that function testable without mocking async
device APIs.

No "biometrics unavailable" messaging appears in the onboarding modal itself —
if the device can't do it, the prompt never appears at all, and the existing
Settings screen already explains why when the user looks there directly.

### Copy

New keys in `src/constants/copy/settings.ts`, both locales:
`biometricOnboardingEyebrow`, `biometricOnboardingTitle`,
`biometricOnboardingDescription`, `biometricOnboardingPrimaryAction`,
`biometricOnboardingLaterAction` — same five-key shape as
`reminderOnboarding*`.

### Tracking

New `trackBiometricLockToggled({ enabled: boolean })` in
`src/services/observability/events.ts` (new `OBS_EVENTS.BiometricLockToggled`
entry), mirroring `trackReminderToggled`'s exact shape. Called only from the new
onboarding modal. The existing manual toggle in `useSettingsScreenController.ts`
is untouched and stays untracked, matching today's behavior — adding tracking
parity there is a separate, unrequested change to an already-shipped file, out of
scope here.

### Wiring into `HomeScreen.tsx` — a third modal, and paying down the sequencing debt

Reminder's final review flagged that the pairwise `!isReminderOnboardingVisible`/
`readyForHandoff` pattern between reminder and backup would not scale cleanly to a
third modal, and that the priority logic had no automated coverage. Adding
biometric is exactly that third modal, so this slice fixes both, with the smallest
change that actually closes the gap — not a full rewrite of the already-reviewed
iOS dismiss-animation fix.

**1. A new pure, unit-tested priority function** —
`src/features/dreams/model/homeOnboardingPriority.ts`:

```ts
export type HomeOnboardingModalKind = 'biometric' | 'reminder' | 'backup';

export function pickActiveOnboardingModal(candidates: {
  biometric: boolean;
  reminder: boolean;
  backup: boolean;
}): HomeOnboardingModalKind | null {
  if (candidates.biometric) return 'biometric';
  if (candidates.reminder) return 'reminder';
  if (candidates.backup) return 'backup';
  return null;
}
```

`HomeScreen.tsx` computes each candidate's raw eligibility exactly as today
(`!loading && biometricAvailable && shouldShowBiometricOnboarding(...)` /
`!loading && shouldShowReminderOnboarding(...)` /
`!loading && shouldShowBackupOnboarding(...)` — no cross-references between them),
then calls `pickActiveOnboardingModal` once to resolve which one (if any) is
active. `isBiometricOnboardingVisible` / `isReminderOnboardingVisible` /
`isBackupOnboardingVisible` become `activeOnboardingModal === 'biometric'` / etc.
This makes the priority rule itself a named, directly-tested unit (5 cases: each
alone, all three at once resolving to biometric, biometric+backup resolving to
biometric, reminder+backup resolving to reminder, none active), independent of
`HomeScreen`'s render behavior.

**2. The handoff gate generalizes from one pair to "any modal currently
settling"** — the existing `reminderOnboardingReadyForHandoff` state becomes
`onboardingHandoffReady: boolean` (still a single boolean, not one per pair,
since at most one modal is ever visible or mid-dismiss at a time — the priority
function above already guarantees mutual exclusion). It flips `false` the instant
`activeOnboardingModal` becomes non-null, and back to `true` once that modal has
actually finished dismissing — via `onDismiss` on iOS, or immediately in the
modal's own close handler on Android (unchanged reasoning from the reminder slice:
iOS can drop or garble a `Modal` presented while another is still animating out).
`BiometricOnboardingModal` gains the same `onDismiss` threading `ReminderOnboardingModal`
already has; `BackupOnboardingModal` does not need it — nothing follows backup in
the priority order today, so there's nothing to hand off to. Each of the three
eligibility conditions gains `&& onboardingHandoffReady` (today only backup's
does).

**3. Explicitly not done here:** collapsing this further into a single
`useHomeOnboardingModals()` hook, or making the resolver own the handoff-gate
state too. Three modals do not justify that abstraction yet; revisit if/when
Whisper's onboarding becomes a fourth.

## Explicitly out of scope

- Whisper contextual onboarding — future slice, same template, not this spec.
- Any change to `SettingsSecurityScreen.tsx` or `useSettingsScreenController.ts`'s
  existing manual biometric toggle — the modal calls the same underlying service
  functions but is a separate call site, not a refactor of the existing one.
- Tracking parity for the manual Settings toggle (see Tracking above).
- A full `useHomeOnboardingModals()` orchestration hook (see point 3 above).
- Any UI for the "biometrics unavailable" case inside the onboarding flow — the
  modal never appears in that case, full stop.

## Testing

- Unit test for `shouldShowBiometricOnboarding`, mirroring
  `__tests__/reminderOnboarding.test.ts`: below threshold, at threshold when
  unseen, hidden once seen, `forceVisible` override, plus the seen-flag
  persistence round-trip (`hasSeenBiometricOnboarding`/
  `markBiometricOnboardingSeen`/`resetBiometricOnboardingSeen`).
- Unit test for `pickActiveOnboardingModal`: each candidate alone; all three true
  resolves to `'biometric'`; biometric+backup (no reminder) resolves to
  `'biometric'`; reminder+backup (no biometric) resolves to `'reminder'`; none true
  resolves to `null`.
- `npx tsc --noEmit` and `npx eslint` on all new/changed files.
- `npx jest` (full suite) for regressions.
- Manual: on a clean install with biometrics enrolled, save one dream, confirm the
  biometric modal appears first (not reminder, not backup). Tap "Enable
  biometrics," confirm the OS Face ID/Touch ID prompt appears, and on approval
  that `SettingsSecurityScreen.tsx` shows app lock as on afterward. Repeat from
  clean, cancel/fail the OS prompt, confirm the failure alert shows and the modal
  stays open with no crash. Repeat from clean, tap "Not now" on biometric, confirm
  the reminder modal appears next (not both at once), and after dismissing that,
  backup's modal appears on the next open if eligible. Repeat the full chain on a
  simulator/device with no biometric hardware or no enrollment, confirming the
  biometric modal never appears and reminder claims the first slot instead.
