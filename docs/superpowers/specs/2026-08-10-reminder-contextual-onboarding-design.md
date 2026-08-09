# Reminder contextual onboarding — Part B, first slice

Date: 2026-08-10
Plan section: `~/.claude/plans/dream-app-product-plan-2026-08-03.md` §3.5 —
*"Reminder, backup, biometric, Whisper — contextual onboarding після 1-го або 3-го
запису."*

## Program note

§3.5's contextual-onboarding item names four features. Only backup has this pattern
today (`backupOnboarding.ts`/`backupOnboardingService.ts`/`BackupOnboardingModal.tsx`,
wired into `HomeScreen.tsx`, 3-dream threshold). This spec builds reminder next, using
backup as the proven template. Biometric and Whisper are explicitly deferred —
separate future slices, each gets its own spec once reminder has shipped and the
pattern is validated a second time.

## Design

### Threshold

Shows after **1 dream**, not backup's 3. Reminder's job is building the return habit
before it's established; backup's job is protecting data that's accumulated. The
plan text allows either 1 or 3 per feature — this is the reasoned choice for this one.

### Files (mirrors the backup structure exactly)

- **`src/features/reminders/model/reminderOnboarding.ts`** — pure function, no I/O:
  ```ts
  export const REMINDER_ONBOARDING_DREAM_THRESHOLD = 1;

  export function shouldShowReminderOnboarding({
    dreamCount,
    hasSeen,
    forceVisible = false,
  }: {
    dreamCount: number;
    hasSeen: boolean;
    forceVisible?: boolean;
  }) {
    if (forceVisible) return true;
    return !hasSeen && dreamCount >= REMINDER_ONBOARDING_DREAM_THRESHOLD;
  }
  ```
- **`src/features/reminders/services/reminderOnboardingService.ts`** — `hasSeen`/
  `mark`/`reset`, backed by a new `REMINDER_ONBOARDING_SEEN_KEY` in
  `src/services/storage/keys.ts` (value `'reminder-onboarding-seen'`, alongside the
  existing `BACKUP_ONBOARDING_SEEN_KEY`).
- **`src/features/reminders/components/ReminderOnboardingModal.tsx`** — the UI.
  Leaner than `BackupOnboardingModal.tsx`: keeps the hero row (icon + eyebrow/title/
  description) and the two-button action row, drops backup's stat-row/value-card
  (backup needed to justify *why* — data safety is a harder sell; reminder's value
  is legible in one sentence).

### Enable flow — reusing the exact proven sequence, not new permission logic

`src/features/settings/hooks/useSettingsScreenController.ts:189-207`'s
`onToggleReminder` is the existing, working enable path (used by the Settings
screen's manual toggle). The modal's primary action replicates its sequence directly,
against the same `src/features/reminders/services/dreamReminderService.ts` functions
— no new permission-handling code:

```ts
const allowed = await requestReminderPermission();
if (!allowed) {
  Alert.alert(copy.reminderPermissionDeniedTitle, copy.reminderPermissionDeniedDescription);
  return;
}
await applyDreamReminderSettings({ ...DEFAULT_REMINDER_SETTINGS, enabled: true });
trackReminderToggled({ enabled: true });
```

`reminderPermissionDeniedTitle`/`Description` and `trackReminderToggled` already
exist and are reused as-is — no duplication.

The secondary action ("Not now") only closes the modal (marks seen, no permission
request, no settings change) — matches PRODUCT.md's "streaks are shown, never
demanded" posture: declining costs nothing and asks nothing twice in the same
session.

### Copy

New keys in `src/constants/copy/settings.ts` (same file the existing
`reminderPermissionDeniedTitle` etc. and `backupOnboarding*` keys already live in),
both locales: `reminderOnboardingEyebrow`, `reminderOnboardingTitle`,
`reminderOnboardingDescription`, `reminderOnboardingPrimaryAction`,
`reminderOnboardingLaterAction`.

### Wiring into `HomeScreen.tsx` — and the modal-collision problem this surfaces

`HomeScreen.tsx` already renders `BackupOnboardingModal` conditionally on its own
`isBackupOnboardingVisible` boolean. Adding a second, independently-conditioned modal
creates a real collision: at `dreamCount === 3`, if the user opened the app after
their first dream, never interacted with the reminder modal (didn't tap either
button — e.g. backgrounded the app), and then reached three dreams, **both**
`isReminderOnboardingVisible` and `isBackupOnboardingVisible` would be `true` on the
same render, mounting two `<Modal>` components at once.

Fix: sequence them. `isReminderOnboardingVisible` computes first, unchanged.
`isBackupOnboardingVisible` gains one more condition — `&& !isReminderOnboardingVisible`
— so backup never shows while reminder is still pending. Reminder's lower threshold
means it always has first claim; once it's dismissed (either button), backup's own
condition (dreamCount >= 3, not yet seen) takes over normally. This is the only
change to existing backup logic in this spec — everything else about
`BackupOnboardingModal`/`backupOnboarding.ts`/`backupOnboardingService.ts` is
untouched.

## Explicitly out of scope

- Biometric and Whisper contextual onboarding — future slices, same template, not
  this spec.
- Any change to `SettingsRemindersScreen.tsx`'s existing manual toggle-on flow — the
  modal calls the same underlying service functions but is a separate call site, not
  a refactor of the existing one.
- Reminder time/style customization from the modal — enabling uses
  `DEFAULT_REMINDER_SETTINGS` (7:30, balanced style) outright; changing time or style
  stays a Settings-screen-only action, same as it is today.

## Testing

- Unit test for `shouldShowReminderOnboarding`, mirroring
  `__tests__/backupOnboarding.test.ts`'s coverage of `shouldShowBackupOnboarding`:
  below threshold, at threshold when unseen, hidden once seen, `forceVisible`
  override — plus the seen-flag persistence round-trip
  (`hasSeenReminderOnboarding`/`markReminderOnboardingSeen`/
  `resetReminderOnboardingSeen`).
- `npx tsc --noEmit` and `npx eslint` on all new/changed files.
- `npx jest` (full suite) for regressions. Checked before writing this spec: no test
  in `__tests__/` references `isBackupOnboardingVisible` or `BackupOnboardingModal`
  directly, so the sequencing change to `HomeScreen.tsx` has no existing coverage to
  break or update.
- Manual: on a clean install, save one dream, confirm the reminder modal appears
  (not the backup one, since dreamCount is 1). Tap "Enable reminders," confirm the OS
  permission prompt appears, and on approval that `SettingsRemindersScreen.tsx` shows
  reminders as enabled at 7:30/balanced afterward. Repeat from clean, deny the OS
  permission, confirm the denial alert shows and no crash. Repeat from clean, tap
  "Not now," confirm it doesn't reappear on a later app open. Finally, from clean,
  ignore the reminder modal (background the app instead of tapping), save two more
  dreams to reach three, reopen, confirm only the reminder modal shows still (not
  both), and after dismissing it, the backup modal shows on the next open.
