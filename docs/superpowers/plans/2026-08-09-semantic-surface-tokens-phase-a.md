# Semantic Surface Tokens Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three real semantic colour tokens (`onPrimary`, `scrim` replacing `ink`,
`destructiveSurface`/`destructiveBorder`) and migrate every existing call site
currently faking one of those roles.

**Task 5 outcome (post-execution note):** the planned automated prevention check was
built, reviewed, and reverted (commit `3d7dfe7`) — see "Task 5" section below for what
was tried and why both text-scan granularities fail empirically against this
codebase's actual code shapes. Tasks 1-4 are the delivered scope.

**Architecture:** `onPrimary` and the two destructive tokens are *derived* — computed
inside `theme.ts`'s `createAppTheme` from existing raw palette values (`bg`, `danger`),
not new raw colours. `ink` is renamed to `scrim` at the raw palette level in
`tokens.ts`, because after migration every remaining use of it is a scrim background —
the field's only real meaning already matches its own doc comment. Removing the old
name makes a future regression a `tsc` compile error instead of a fourth silent
recurrence.

**Tech Stack:** TypeScript, `@shopify/restyle` theming, Jest.

## Global Constraints

- Full design: `docs/superpowers/specs/2026-08-09-semantic-surface-tokens-phase-a-design.md`.
- Do **not** add `surfacePrimary`, `surfaceSecondary`, `surfaceInteractive`,
  `onSurface`, `controlThumb`, `selectedFill`, `selectedBorder`, or `focusRing` — no
  demonstrated ad hoc pattern for any of them today (see spec's non-goals).
- Do **not** touch Phase B (screenshot/a11y test infrastructure) — separate spec.
- `onPrimary`'s value must equal the palette's `bg` value in every theme (identical to
  the `background`/`ink`-as-workaround value already in production) — a pure rename,
  zero visual change.
- `scrim`'s value must equal the current `ink` value in every theme — pure rename,
  zero visual change.
- `destructiveSurface` = `` `${danger}14` ``, `destructiveBorder` = `` `${danger}44` ``
  in every theme, computed from the palette's own `danger` value, not hardcoded per
  theme.
- `src/features/dreams/components/DreamDetailActionTile.tsx:66`'s
  `` `${theme.colors.danger}20` `` (pressed-state shade) is explicitly excluded from
  the `destructiveSurface` migration — do not touch it.
- `src/theme/surfaces.ts:25` (`resolveSurfaceColor`'s `'background'` case) is excluded
  from the `onPrimary` migration — it is a legitimate background use, not a foreground.
- Do not add `Co-Authored-By` trailers to commits.
- macOS/BSD `sed` requires `-i ''` (an explicit empty backup-suffix argument), not
  bare `-i` — every `sed` command below uses that form.

---

## Task 1: Extend the token model

**Files:**
- Modify: `src/theme/tokens.ts` (rename `ink` → `scrim` in `ThemePalette` and all four
  palettes; update the `daylight` doc comment)
- Modify: `src/theme/theme.ts` (`createAppTheme`: rename `ink` mapping to `scrim`, add
  `onPrimary`, `destructiveSurface`, `destructiveBorder`)
- Modify: `__tests__/themeContrast.test.ts` (three pairings: `foreground: 'background'`
  → `foreground: 'onPrimary'`)

**Interfaces:**
- Produces: `Theme['colors']` gains `onPrimary: string`, `scrim: string` (replacing
  `ink`), `destructiveSurface: string`, `destructiveBorder: string`. `Theme['colors']`
  is inferred from the object literal in `createAppTheme` — no separate type
  declaration to edit beyond `ThemePalette` for `scrim`. Every later task in this plan
  reads `theme.colors.onPrimary`, `theme.colors.scrim`, `theme.colors.destructiveSurface`,
  or `theme.colors.destructiveBorder`.

- [ ] **Step 1: Update the three `themeContrast.test.ts` pairings first**

In `__tests__/themeContrast.test.ts`, change:

```ts
  {
    foreground: 'background',
    background: 'primary',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the label on a primary button, which uses background as its ink',
  },
  {
    foreground: 'background',
    background: 'danger',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the same on a destructive button, where misreading costs most',
  },
  {
    foreground: 'background',
    minimum: CONTRAST_LARGE_TEXT,
    background: 'accent',
    because:
      'icons sitting on an accent fill — the pairing that was missing when ' +
      'six of them used `ink`, which is dark in every theme and so vanished ' +
      'against a light theme’s darker primary',
  },
```

to:

```ts
  {
    foreground: 'onPrimary',
    background: 'primary',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the label on a primary button',
  },
  {
    foreground: 'onPrimary',
    background: 'danger',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the same on a destructive button, where misreading costs most',
  },
  {
    foreground: 'onPrimary',
    minimum: CONTRAST_LARGE_TEXT,
    background: 'accent',
    because:
      'icons sitting on an accent fill — the pairing that was missing when ' +
      'six sites used `ink`, which is dark in every theme and so vanished ' +
      'against a light theme’s darker primary',
  },
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/themeContrast.test.ts`
Expected: FAIL — `Cannot read properties of undefined (reading toFixed)` or similar,
because `theme.colors.onPrimary` does not exist yet.

- [ ] **Step 3: Rename `ink` to `scrim` in the token model**

In `src/theme/tokens.ts`, in the `ThemePalette` type, change:

```ts
  ink: string;
```

to:

```ts
  scrim: string;
```

In each of the four palette objects, change the `ink:` line to `scrim:`, same value:

```ts
    ink: '#0B1220',
```
→
```ts
    scrim: '#0B1220',
```
(`kaleidoscope`, line 51, and `daylight`, line 134 — both `#0B1220`)

```ts
    ink: '#0E090A',
```
→
```ts
    scrim: '#0E090A',
```
(`ember`, line 74)

```ts
    ink: '#08110F',
```
→
```ts
    scrim: '#08110F',
```
(`moss`, line 97)

And update the `daylight` palette's doc comment, which currently reads:

```ts
   * `ink` stays dark: it is the colour of a scrim laid over content, and a pale
   * scrim would not dim anything.
```

to:

```ts
   * `scrim` stays dark: it is the colour laid over content to dim it, and a pale
   * scrim would not dim anything.
```

- [ ] **Step 4: Add the three derived tokens in `theme.ts`**

In `src/theme/theme.ts`'s `createAppTheme`, change:

```ts
      danger: colors.danger,
      success: colors.success,
      tabIcon: colors.tabIcon,
      glow: colors.glow,
      ink: colors.ink,
      switchTrackOff: colors.switchTrackOff,
```

to:

```ts
      danger: colors.danger,
      // Same value `background` used to stand in for: the colour of content
      // drawn on a primary/danger/accent fill.
      onPrimary: colors.bg,
      destructiveSurface: `${colors.danger}14`,
      destructiveBorder: `${colors.danger}44`,
      success: colors.success,
      tabIcon: colors.tabIcon,
      glow: colors.glow,
      scrim: colors.scrim,
      switchTrackOff: colors.switchTrackOff,
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest __tests__/themeContrast.test.ts`
Expected: PASS — all tests, across all four themes.

- [ ] **Step 6: Confirm the migration scope via the compiler**

Run: `npx tsc --noEmit 2>&1 | grep -E "colors\.ink|Property 'ink'"`

Expected: one error per remaining `theme.colors.ink` reference — cross-check the
file list against these nine (the two real bugs plus seven legitimate scrim uses):

```
src/app/navigation/tabs.styles.ts
src/features/settings/components/ArchiveKeyStrandedModal.tsx
src/features/settings/components/BackupOnboardingModal.tsx
src/features/settings/components/LocalDataRecoveryGate.tsx
src/features/dreams/screens/HomeScreen.styles.ts
src/features/dreams/components/CaptureSavedSheet.tsx
src/features/dreams/components/archive/ArchiveFilterSheet.tsx
src/features/stats/components/MemoryPatternCard.tsx
src/services/storage/StorageMigrationGate.tsx
```

If any file appears that is not in this list, or one of these nine is missing, stop
and re-grep `theme\.colors\.ink\b` across `src/` before continuing — the later tasks
in this plan assume this list is exhaustive.

- [ ] **Step 7: Run the full existing theme token test to confirm no unrelated regression**

Run: `npx jest __tests__/themeTokens.test.ts`
Expected: PASS — 4 tests (this file does not yet know about the new tokens; Task 5
extends it).

- [ ] **Step 8: Commit**

```bash
git add src/theme/tokens.ts src/theme/theme.ts __tests__/themeContrast.test.ts
git commit -m "feat: add onPrimary and destructive surface tokens, rename ink to scrim"
```

---

## Task 2: Migrate the mechanical, zero-visual-change renames

**Files:** every file below, at the exact lines given. All are same-value renames —
`theme.colors.background` → `theme.colors.onPrimary`, or `theme.colors.ink` →
`theme.colors.scrim` — with no other change to the line.

**Interfaces:**
- Consumes: `theme.colors.onPrimary`, `theme.colors.scrim` from Task 1.
- Produces: nothing new — this task only removes call sites that would otherwise
  fail `tsc` (the `ink` ones) or remain semantically unclear (the `background` ones).

Two exceptions are excluded on purpose and must not be touched by this task's
commands: `src/theme/surfaces.ts:25` (legitimate background use) and
`src/features/settings/components/LocalDataRecoveryGate.tsx` /
`src/services/storage/StorageMigrationGate.tsx` (their `ink` and destructive-tint
sites are real bug fixes, handled in Task 3 and Task 4, not here).

- [ ] **Step 1: `onPrimary` — line-targeted rename, `background` sites**

Run each command exactly as given — every `-e` targets one specific line number
verified against the current file, so it cannot touch a different, legitimate
`backgroundColor: theme.colors.background` on another line of the same file:

```bash
sed -i '' \
  -e '50s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '147s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/settings/screens/SettingsScreen.styles.ts

sed -i '' \
  -e '149s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '723s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '810s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/screens/HomeScreen.styles.ts

sed -i '' \
  -e '144s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '153s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '169s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/screens/WakeEntryScreen.styles.ts

sed -i '' \
  -e '138s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '192s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '396s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '907s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '916s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/screens/ArchiveScreen.styles.ts

sed -i '' \
  -e '110s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '140s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '200s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '227s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '276s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '307s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/screens/NewDreamScreen.styles.ts

sed -i '' \
  -e '333s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '379s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/components/archive/ArchiveFilterSheet.tsx

sed -i '' \
  -e '138s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/stats/screens/MonthlyReportScreen.styles.ts

sed -i '' \
  -e '150s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/stats/screens/ProgressScreen.styles.ts

sed -i '' \
  -e '105s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '1080s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/stats/screens/StatsScreen.styles.ts

sed -i '' \
  -e '53s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '454s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '543s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/stats/components/MemoryPatternCard.tsx

sed -i '' \
  -e '109s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/widgets/components/WidgetPinToast.tsx

sed -i '' \
  -e '99s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/components/ui/SegmentedControl.tsx

sed -i '' \
  -e '65s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/components/ui/Button.styles.ts

sed -i '' \
  -e '23s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/components/ui/TagChip.styles.ts

sed -i '' \
  -e '33s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '71s/theme\.colors\.background/theme.colors.onPrimary/' \
  -e '76s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/components/DreamDetailActionTile.tsx

sed -i '' \
  -e '69s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/settings/components/BackupOnboardingModal.tsx

sed -i '' \
  -e '87s/theme\.colors\.background/theme.colors.onPrimary/' \
  src/features/dreams/components/detail/DreamCaptureSection.tsx
```

- [ ] **Step 2: `scrim` — line-targeted rename, legitimate `ink` sites**

```bash
sed -i '' \
  -e '222s/theme\.colors\.ink/theme.colors.scrim/' \
  src/app/navigation/tabs.styles.ts

sed -i '' \
  -e '145s/theme\.colors\.ink/theme.colors.scrim/' \
  src/features/settings/components/BackupOnboardingModal.tsx

sed -i '' \
  -e '105s/theme\.colors\.ink/theme.colors.scrim/' \
  src/features/settings/components/ArchiveKeyStrandedModal.tsx

sed -i '' \
  -e '842s/theme\.colors\.ink/theme.colors.scrim/' \
  src/features/dreams/screens/HomeScreen.styles.ts

sed -i '' \
  -e '259s/theme\.colors\.ink/theme.colors.scrim/' \
  src/features/dreams/components/CaptureSavedSheet.tsx

sed -i '' \
  -e '254s/theme\.colors\.ink/theme.colors.scrim/' \
  src/features/dreams/components/archive/ArchiveFilterSheet.tsx

sed -i '' \
  -e '462s/theme\.colors\.ink/theme.colors.scrim/' \
  src/features/stats/components/MemoryPatternCard.tsx
```

- [ ] **Step 3: Verify with a diff review, not just the compiler**

Run: `git diff --stat`
Expected: exactly the 19 files from Step 1 plus the 7 files from Step 2 (some
overlap — `HomeScreen.styles.ts`, `ArchiveFilterSheet.tsx`,
`BackupOnboardingModal.tsx`, `MemoryPatternCard.tsx` appear in both lists, touched at
different, non-overlapping line numbers). No other file should appear.

Run: `git diff`
Expected: every hunk is a single-line change of the exact shape
`theme.colors.background` → `theme.colors.onPrimary` or `theme.colors.ink` →
`theme.colors.scrim`. If any hunk shows anything else, a `sed` line number was wrong —
revert with `git checkout -- <file>` and re-derive the correct line number before
retrying.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "colors\.ink|Property 'ink'"`
Expected: exactly two remaining hits — `LocalDataRecoveryGate.tsx` and
`StorageMigrationGate.tsx`, the two files this task deliberately left for Task 3.

- [ ] **Step 5: Lint**

Run: `npx eslint $(git diff --name-only)`
Expected: no errors, no warnings.

- [ ] **Step 6: Full test suite**

Run: `npx jest`
Expected: PASS — every suite. (`theme.colors.background`/`theme.colors.ink` were
never asserted against by value in any test outside `themeContrast.test.ts` and
`themeTokens.test.ts`, both already covered.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate on-primary and scrim call sites to the new tokens"
```

---

## Task 3: Fix the two real `ink`-as-foreground bugs

**Files:**
- Modify: `src/features/settings/components/LocalDataRecoveryGate.tsx:233`
- Modify: `src/services/storage/StorageMigrationGate.tsx:248`

**Interfaces:**
- Consumes: `theme.colors.onPrimary` from Task 1.
- Produces: nothing new — closes the two compile errors Task 2 deliberately left.

This is the one task in this plan that changes a rendered colour: in the `daylight`
theme, `onPrimary` (`#F4F6FC`, near-white) replaces `scrim`'s value (`#0B1220`,
near-black) as the primary-button label colour — the actual bug from the spec's
evidence section, fixed here instead of merely renamed.

- [ ] **Step 1: Fix `LocalDataRecoveryGate.tsx`**

Change:

```ts
    primaryLabel: {
      color: theme.colors.ink,
```

to:

```ts
    primaryLabel: {
      color: theme.colors.onPrimary,
```

- [ ] **Step 2: Fix `StorageMigrationGate.tsx`**

Change:

```ts
    primaryLabel: {
      color: theme.colors.ink,
```

to:

```ts
    primaryLabel: {
      color: theme.colors.onPrimary,
```

- [ ] **Step 3: Confirm the compiler is clean**

Run: `npx tsc --noEmit 2>&1 | grep -E "colors\.ink|Property 'ink'"`
Expected: no output — every `ink` reference in the repository is gone.

Run: `npx tsc --noEmit`
Expected: no errors at all.

- [ ] **Step 4: Lint**

Run: `npx eslint src/features/settings/components/LocalDataRecoveryGate.tsx src/services/storage/StorageMigrationGate.tsx`
Expected: no errors, no warnings.

- [ ] **Step 5: Full test suite**

Run: `npx jest`
Expected: PASS — every suite.

- [ ] **Step 6: Manual verification**

These two gates only render when a rare startup-recovery/migration path is taken (see
`docs/superpowers/specs/2026-08-09-stranded-archive-key-disclosure-design.md`'s
sibling gates for context) — not reachable from a normal app session. Verify by
reading, not by running the app: confirm `theme.colors.onPrimary` resolves to
`#F4F6FC` in the `daylight` palette (`src/theme/tokens.ts`, `daylight.bg`) and that
this is a near-white, legible against the button's `theme.colors.auroraMid` fill
(`#6A4BC4`, deep purple) — the exact pairing the bug report described as unreadable
under the old `#0B1220` value.

- [ ] **Step 7: Commit**

```bash
git add src/features/settings/components/LocalDataRecoveryGate.tsx src/services/storage/StorageMigrationGate.tsx
git commit -m "fix: use onPrimary instead of ink for gate primary-button labels"
```

---

## Task 4: Canonicalise destructive-tint call sites

**Files:**
- Modify: `src/features/dreams/components/home/HomeDreamRow.tsx:183-184`
- Modify: `src/features/dreams/components/archive/ArchiveDreamRow.tsx:66-67`
- Modify: `src/features/dreams/components/DreamDetailActionTile.tsx:61`
- Modify: `src/features/dreams/screens/DreamDetailScreen.styles.ts:51`
- Modify: `src/features/settings/components/LocalDataRecoveryGate.tsx` (`warningIcon`
  block)
- Modify: `src/services/storage/StorageMigrationGate.tsx` (`warningIcon` block)

**Interfaces:**
- Consumes: `theme.colors.destructiveSurface`, `theme.colors.destructiveBorder` from
  Task 1.

Four of these six files (`HomeDreamRow.tsx`, `ArchiveDreamRow.tsx`,
`DreamDetailActionTile.tsx`, `DreamDetailScreen.styles.ts`) already use the exact
value the new tokens encode (`` `${danger}14` ``/`` `${danger}44` ``) — zero visual
change, pure rename. The two gate files currently use `` `${danger}26` ``/
`` `${danger}88` `` — canonicalising them to the token changes the rendered alpha, a
real (minor) visual change, same as Task 3's rationale for isolating a real change
from mechanical renames.

- [ ] **Step 1: `HomeDreamRow.tsx` — pure rename**

Change:

```ts
        backgroundColor: `${theme.colors.danger}14`,
        borderColor: `${theme.colors.danger}44`,
```

to:

```ts
        backgroundColor: theme.colors.destructiveSurface,
        borderColor: theme.colors.destructiveBorder,
```

- [ ] **Step 2: `ArchiveDreamRow.tsx` — pure rename**

Change:

```ts
        backgroundColor: `${theme.colors.danger}14`,
        borderColor: `${theme.colors.danger}44`,
```

to:

```ts
        backgroundColor: theme.colors.destructiveSurface,
        borderColor: theme.colors.destructiveBorder,
```

- [ ] **Step 3: `DreamDetailActionTile.tsx` — pure rename, surface only**

Change (inside the `backgroundColor` ternary at line 61; line 66's `20`-suffixed
pressed-state shade a few lines below is untouched):

```ts
  const backgroundColor = danger
    ? `${theme.colors.danger}14`
```

to:

```ts
  const backgroundColor = danger
    ? theme.colors.destructiveSurface
```

- [ ] **Step 4: `DreamDetailScreen.styles.ts` — pure rename, border only**

Change:

```ts
    heroIconButtonDanger: {
      borderColor: `${theme.colors.danger}44`,
    },
```

to:

```ts
    heroIconButtonDanger: {
      borderColor: theme.colors.destructiveBorder,
    },
```

- [ ] **Step 5: `LocalDataRecoveryGate.tsx` — canonicalising change**

Change:

```ts
    warningIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.danger}26`,
      borderWidth: 1,
      borderColor: `${theme.colors.danger}88`,
    },
```

to:

```ts
    warningIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.destructiveSurface,
      borderWidth: 1,
      borderColor: theme.colors.destructiveBorder,
    },
```

- [ ] **Step 6: `StorageMigrationGate.tsx` — canonicalising change**

Change:

```ts
    warningIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.danger}26`,
      borderWidth: 1,
      borderColor: `${theme.colors.danger}88`,
    },
```

to:

```ts
    warningIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.destructiveSurface,
      borderWidth: 1,
      borderColor: theme.colors.destructiveBorder,
    },
```

- [ ] **Step 7: Confirm no stray ad hoc danger-alpha strings remain outside the excluded pressed-state line**

Run: `grep -rn '\${theme\.colors\.danger}[0-9A-Fa-f]\{2\}' --include="*.tsx" --include="*.ts" src`
Expected: exactly one hit — `DreamDetailActionTile.tsx`'s line 66
(`` `${theme.colors.danger}20` ``), the explicitly excluded pressed-state shade.

- [ ] **Step 8: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/features/dreams/components/home/HomeDreamRow.tsx src/features/dreams/components/archive/ArchiveDreamRow.tsx src/features/dreams/components/DreamDetailActionTile.tsx src/features/dreams/screens/DreamDetailScreen.styles.ts src/features/settings/components/LocalDataRecoveryGate.tsx src/services/storage/StorageMigrationGate.tsx`
Expected: no errors, no warnings.

- [ ] **Step 9: Full test suite**

Run: `npx jest`
Expected: PASS — every suite.

- [ ] **Step 10: Commit**

```bash
git add src/features/dreams/components/home/HomeDreamRow.tsx src/features/dreams/components/archive/ArchiveDreamRow.tsx src/features/dreams/components/DreamDetailActionTile.tsx src/features/dreams/screens/DreamDetailScreen.styles.ts src/features/settings/components/LocalDataRecoveryGate.tsx src/services/storage/StorageMigrationGate.tsx
git commit -m "refactor: migrate destructive tint call sites to destructiveSurface/destructiveBorder"
```

---

## Task 5: Prevention check for the general pattern — ABANDONED, kept for the record

**Outcome: built, reviewed, reverted.** The steps below are left as written and
executed, followed by what was found once real code review pushed on the design.
Do not re-attempt this task as specified — read the finding at the end first.

Original task text (executed as-is):

**Files:**
- Modify: `__tests__/themeTokens.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks directly — this is a static source-text check,
  independent of the token values themselves.
- Produces: a new `test()` inside the existing `describe('theme tokens', ...)` block.

Full current content of the file, for reference — this task adds one new `test()`
inside the existing `describe` block, after the existing `'no colour is written...'`
test, and does not otherwise change the file:

```ts
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { themes } from '../src/theme/theme';

// ... FIXED_PALETTE_FILES, COLOUR regex, isComment(), walk() unchanged ...

describe('theme tokens', () => {
  test('no colour is written into a screen or component', () => {
    // ... unchanged ...
  });

  test('every exception is a real file, so the list cannot rot', () => {
    // ... unchanged ...
  });

  test('every theme defines every token', () => {
    // ... unchanged ...
  });

  test('shadow is a token, because `#000` was standing in for it', () => {
    // ... unchanged ...
  });
});
```

- [ ] **Step 1: Write the failing test**

Add, inside `describe('theme tokens', ...)`, after the existing
`'no colour is written into a screen or component'` test:

```ts
  test('a colour-filled surface does not draw its own foreground with text or background', () => {
    const offenders: string[] = [];
    const FILL_TOKENS = ['primary', 'danger', 'accent'];
    const WRONG_FOREGROUND_TOKENS = ['text', 'background'];

    for (const file of walk(SRC)) {
      const key = relative(SRC, file);
      const contents = readFileSync(file, 'utf8');

      // One block per `StyleSheet.create({ ... })` call — matched non-greedily
      // up to the first top-level closing `});`, which is how every style
      // object in this codebase is written.
      const blocks = contents.match(/StyleSheet\.create\(\{[\s\S]*?\n\}\);/g) ?? [];

      for (const block of blocks) {
        const hasFillBackground = FILL_TOKENS.some(token =>
          new RegExp(`backgroundColor:\\s*theme\\.colors\\.${token}\\b`).test(
            block,
          ),
        );
        const wrongForeground = WRONG_FOREGROUND_TOKENS.find(token =>
          new RegExp(`\\bcolor:\\s*theme\\.colors\\.${token}\\b`).test(block),
        );

        if (hasFillBackground && wrongForeground) {
          offenders.push(`${key}: color: theme.colors.${wrongForeground} in a block with a primary/danger/accent backgroundColor`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/themeTokens.test.ts -t "does not draw its own foreground"`
Expected: FAIL — `Button.styles.ts` was fixed in Task 2, so this should actually
already pass if Tasks 1–4 are done first. If run *before* those tasks, it fails,
listing the very files this plan's earlier tasks migrate — which is the point: this
step is written to double as a regression check against reverting Task 2/3/4, not
strictly a TDD red step for new code.

- [ ] **Step 3: Confirm it passes with the migration in place**

Run: `npx jest __tests__/themeTokens.test.ts`
Expected: PASS — all 5 tests now (the four existing plus this one).

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint __tests__/themeTokens.test.ts`
Expected: no errors, no warnings.

- [ ] **Step 5: Full test suite**

Run: `npx jest`
Expected: PASS — every suite.

- [ ] **Step 6: Commit**

```bash
git add __tests__/themeTokens.test.ts
git commit -m "test: catch a colour-filled surface drawing its own foreground with text or background"
```

### Why this was reverted

The test above shipped as commit `e85098e` and passed — vacuously. Task review
found the block-extraction regex (`/StyleSheet\.create\(\{[\s\S]*?\n\}\);/g`) only
matches a `StyleSheet.create` call whose closing brace sits at column 0, which is
this codebase's *minority* pattern; the dominant `return StyleSheet.create({...});`
inside an indented factory function (e.g. every gate/screen `createStyles`
function) was silently skipped — 10 of 58 real call sites were ever scanned,
missing `LocalDataRecoveryGate.tsx` itself.

Fixing the extraction regex to reach all 58 sites (verified) surfaced the real
problem underneath: the co-occurrence check's granularity — "one style *rule*
object contains both a fill `backgroundColor` and a wrong `color`" — cannot fire on
any of the real bugs this plan fixed, because in every one of them the fill and the
wrong foreground are in **separate, sibling** rules (a filled container `View` and
a nested `Text`'s own style key), never the same object. Verified empirically: 0
files trigger a same-rule check today.

The alternative — checking the whole file for "has a fill `backgroundColor`
*anywhere*" and "has a wrong `color` *anywhere*" — was tried next and also
verified empirically:

```bash
comm -12 \
  <(grep -rlE "backgroundColor:\s*theme\.colors\.(primary|danger|accent)\b" --include="*.tsx" --include="*.ts" src | sort) \
  <(grep -rlE "\bcolor:\s*theme\.colors\.(text|background)\b" --include="*.tsx" --include="*.ts" src | sort)
```

16 of the 19 files that use any fill colour also contain an unrelated `text`/
`background` foreground somewhere else on the same screen — an ordinary button
next to ordinary body text, not a bug. A check with a 16/19 false-positive rate on
an already-correct codebase is not a usable regression guard.

**Conclusion:** telling "this fill and this foreground are visually paired" from
"these two unrelated rules happen to share a file" requires JSX-nesting
information — which component is a parent of which — that a source-text scan over
a `StyleSheet.create` object cannot see. The spec's own non-goals section already
ruled out the tool that *can* see it (a custom, AST-aware ESLint rule) as too large
for this phase. Reverted in commit `3d7dfe7` rather than ship a check that is
either silent or noisy. The token rename itself (Task 1: `ink` removed, not
aliased) remains the durable guard — a future misuse of the old name is a `tsc`
error, which is what actually caught this plan's own two-file regression when it
was written.
