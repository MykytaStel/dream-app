# Proactive disclosure of a stranded archive key — design

Date: 2026-08-09
Stage: 4 — Trust and recovery (`docs/ROADMAP.md`)
Release criterion this closes (partially): `docs/RELEASE_CRITERIA.md`, "Restore is
real" — *"The recovery key flow has to survive the case that matters: someone who has
lost theirs. Losing the key must be explained before it happens, not discovered
after."*

## Problem

The archive's encryption key normally travels with the user automatically — iCloud
Keychain on iOS, Android's backup service on Android — and the existing code is
deliberately silent about it (`src/services/security/archiveKeyStorage.ts:8-13`,
`src/services/crypto/archiveKeyService.ts:71-76`): *"the spec's first layer is that
turning on sync asks the user for nothing."* That silence is a documented, correct
decision for the common case, and this design does not change it.

It stops being correct in the one case the same comment names: the key **cannot**
travel on its own (device backup off, or a Keychain that will not answer). Today that
state is `presentArchiveKey()` returning `tone: 'attention'` in
`src/features/settings/model/archiveKeyPresentation.ts`, which renders as one extra
line of text in `SettingsArchiveKeySection` — a section whose own comment says "most of
the time... nobody presses [it]." A person can be in the exact situation the recovery
code exists for and never see it unless they happen to open Backup settings and read
carefully.

## Explicit non-goals

- **Not fixing `getKeySyncAvailability()`'s detection accuracy.** Today it returns
  `available` unconditionally on Android and on iOS only checks that the Keychain API
  responds — neither reflects whether the user actually has iCloud Keychain or Android
  backup switched on. Making that detection trustworthy is a platform-API research
  question with an uncertain answer (Apple/Google may not expose the toggle state at
  all) and is out of scope here. This design surfaces whatever `tone: 'attention'`
  already fires today, on the existing signal, nothing more.
- **Not gating the cloud-sync toggle.** An earlier version of this design intercepted
  `onToggleCloudSync` with a mandatory modal on every first enable. That was rejected:
  it silences-then-interrupts the common case the existing code deliberately keeps
  quiet, and every first-sync in an already-safe state (iCloud Keychain/Android backup
  genuinely on) would grow the exact "notice everyone sees and nobody needs" the
  codebase already argues against in `SettingsArchiveKeySection.tsx`'s own comment.
- **Not a global (app-root) banner.** Scoped to `BackupScreen` only. Someone who enables
  sync and never opens Backup again is a real gap, but it is a bigger, separate piece
  of work (a Home-level or app-root surface, mirroring `LocalDataRecoveryGate` /
  `StorageMigrationGate`) and is not this change.

## What this change does

When `presentArchiveKey()` first evaluates to `tone: 'attention'` while the user has
`BackupScreen` open, show a one-time modal with the recovery code already visible (not
behind a "Show" tap) and a plain explanation, instead of leaving it as a line of text
that may go unread. One acknowledgement action, "Got it," dismisses it. It does not
reappear once dismissed, by any dismissal path — Section 4.

This is informational only. It never blocks or delays turning sync on; it never asks
the user to confirm anything before proceeding. It only makes the existing "attention"
state impossible to miss the first time it is true.

## Components

### 1. Seen-flag storage (new)

`src/services/storage/keys.ts` gains:

```ts
export const ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY =
  'archive-key-stranded-disclosure-seen';
```

A small service, mirroring `src/features/settings/services/backupOnboardingService.ts`
exactly:

```ts
// src/features/settings/services/archiveKeyStrandedDisclosureService.ts
export function hasSeenArchiveKeyStrandedDisclosure(): boolean;
export function markArchiveKeyStrandedDisclosureSeen(): void;
export function resetArchiveKeyStrandedDisclosureSeen(): void; // test seam, mirrors the onboarding reset
```

### 2. Hook change

`useArchiveKeyController` (`src/features/settings/hooks/useArchiveKeyController.ts`)
gains one derived boolean and one handler:

- `showStrandedDisclosure: boolean` — true when
  `presentation.tone === 'attention' && !hasSeenArchiveKeyStrandedDisclosure()`,
  recomputed with `presentation` (existing `useMemo`).
- `onDismissStrandedDisclosure(): void`.

Concretely, since `presentation` is derived from `availability`/`hasKey`/
`lastSyncErrorMessage` and knows nothing about the seen-flag, the flag is tracked as its
own piece of state, read once on mount via a lazy initializer:

```ts
const [strandedDisclosureDismissed, setStrandedDisclosureDismissed] = React.useState(
  () => hasSeenArchiveKeyStrandedDisclosure(),
);

const showStrandedDisclosure =
  presentation.tone === 'attention' && !strandedDisclosureDismissed;

const onDismissStrandedDisclosure = React.useCallback(() => {
  markArchiveKeyStrandedDisclosureSeen();
  setStrandedDisclosureDismissed(true);
}, []);
```

No other field changes shape. The modal fetches its own copy of the code via
`getArchiveRecoveryCode()` directly (a small local `useEffect`/state inside
`ArchiveKeyStrandedModal`, gated on `showStrandedDisclosure` becoming true) rather than
sharing `recoveryCode`/`onToggleRecoveryCode` from the controller — those exist for the
section's separate reveal/hide toggle, a different concern with different lifecycle
(user-initiated, can be hidden again), and reusing them would couple two independent
UI states together for no benefit.

### 3. New component: `ArchiveKeyStrandedModal`

`src/features/settings/components/ArchiveKeyStrandedModal.tsx`. `<Modal>`-based,
following `ArchiveFilterSheet.tsx`'s structure (backdrop `Pressable`, sheet content,
`accessibilityViewIsModal`) rather than a shared primitive — there is no shared
Modal/Sheet component in `components/ui/` today, and every existing sheet/modal in this
codebase builds its own.

Content:
- Title + body reusing the existing `archiveKeyStranded` copy string.
- The 24-word code, shown immediately and `selectable` (same presentation as the
  existing reveal block in `SettingsArchiveKeySection.tsx`).
- One action: "Got it" (new copy key, see below) → calls
  `controller.onDismissStrandedDisclosure()`.
- Backdrop tap / hardware back also dismiss and must call the same handler (Section 4).

Rendered from `BackupScreen.tsx`, gated on
`archiveKey.showStrandedDisclosure`, alongside the existing
`<SettingsArchiveKeySection copy={copy} controller={archiveKey} />` line.

### 4. Dismissal is uniform

Every exit path — the "Got it" button, backdrop tap, hardware back — calls
`onDismissStrandedDisclosure()` and marks the flag seen. There is no "remind me later."
Reasoning: this is not a confirmation gate on an action (nothing is being enabled or
skipped), it is a one-time notice. Re-showing it on every subsequent visit to
`BackupScreen` while the underlying "attention" state persists would recreate the
"notice everyone sees and nobody needs" pattern this codebase explicitly designed
against elsewhere. Someone who wants to see the code again always has the existing
"Show recovery code" action in `SettingsArchiveKeySection`, unchanged by this work.

## Copy

New keys in `src/constants/copy/settings.ts`, en + uk, placed beside the existing
`archiveKey*` block:

- `archiveKeyStrandedDisclosureTitle` — short, names the situation (e.g. "This key
  cannot leave this phone on its own").
- `archiveKeyStrandedDisclosureAction` — "Got it" / "Зрозуміло".

Reuses `archiveKeyStranded` (body) and `archiveKeyCodeIntro` (code framing) rather than
duplicating them — the modal is a more visible presentation of the same fact, not a new
fact.

## Error handling

If the modal's own `getArchiveRecoveryCode()` fetch fails (the same failure mode
`onToggleRecoveryCode` already handles elsewhere with `reportError` and an
`archive_recovery_code_failed` event — same handling here), do not show a broken modal:
suppress rendering it for this mount without marking the flag seen, so it tries again
next time the screen is visited. This never blocks sync or navigation either way.

## Testing

- `archiveKeyStrandedDisclosureService.test.ts` — mirrors the pattern an equivalent
  onboarding-flag test would use: unset → `hasSeen` false; `markSeen` → `hasSeen` true;
  `reset` → back to false.
- `useArchiveKeyController` unit coverage (extending the existing test file if one
  exists, else new): `tone: 'attention'` + unseen flag → `showStrandedDisclosure` true;
  same tone on a second render after dismissal → false; a `tone` other than
  `'attention'` never sets it regardless of the flag.
- `themeTokens.test.ts` (existing, repo-wide) will catch any hardcoded color literal in
  the new modal automatically — no new test needed for that, just don't hardcode colors.
- Manual: force `getKeySyncAvailability` to return `unavailable` in a dev build, open
  Backup, confirm the modal appears once, both locales, both light/dark themes; confirm
  it does not reappear after reload.
