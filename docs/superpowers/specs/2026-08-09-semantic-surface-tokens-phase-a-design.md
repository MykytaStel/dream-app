# Semantic surface tokens — Phase A (token model, migration, prevention)

Date: 2026-08-09
Plan section: `~/.claude/plans/dream-app-product-plan-2026-08-03.md` §7.1 ("Виправити
design-token модель") — diagnosed there as "systemic, not a run of accidents."

## Program: two phases, one initiative

§7.1 covers two genuinely separate pieces of work:

- **Phase A (this spec):** real semantic tokens for surface/foreground roles, a
  migration of every existing call site currently faking one of those roles with
  `text`/`ink`/`background`, and a prevention check. Pure TypeScript/React Native
  refactor, no new tooling.
- **Phase B (next, own spec):** the plan's automated-checks list — screenshot tests
  per theme, light/dark contrast matrix (partially covered already by
  `__tests__/themeContrast.test.ts`), Dynamic Type, reduce motion, long UK/EN
  strings, small Android/large iPhone, font scaling 130–160%, loading/empty/error/
  disabled states. This needs a screenshot-diffing toolchain that does not exist in
  this repo today — a different kind of work, not a continuation of Phase A's
  renames.

Phase B is brainstormed immediately after Phase A reaches implementation, not
deferred indefinitely — tracked here so the split doesn't read as "B disappears."

## Problem, with evidence

`src/theme/tokens.ts` defines `text`, `ink`, `background` and others as flat colour
values with no encoded role. Call sites pick among them by feel for what should be a
mechanical choice ("what draws legibly on a `primary`-filled surface"), and get it
wrong the same way repeatedly:

- Commit `6add228` ("a second pass through the light theme, and three defects it
  uncovered", 2026-08-03) fixed the *second* wave of this exact mistake — `ink` used
  as text colour on a `primary`-filled surface. `ink` is a fixed near-black in every
  palette; on `daylight` (the one light theme), `primary` is itself a deep blue, so
  dark-on-dark vanished. The fix in each case was to use `background`'s value
  instead, which the commit message describes as "what this app means by 'the colour
  of things drawn on primary'" — an unwritten convention, not a named token.
- The same commit's own text admits the limit of what guards this today:
  `__tests__/themeContrast.test.ts` checks a curated list of foreground/background
  *pairings*, so it "cannot see a fourth, fifth or sixth site choosing `ink`."
- Verified live during this brainstorm: **the only two remaining places in the
  repository where `ink` is used as a foreground colour are
  `src/features/settings/components/LocalDataRecoveryGate.tsx:233` and
  `src/services/storage/StorageMigrationGate.tsx:248`** — both written earlier in
  *this session*, reintroducing the identical bug class with nothing in the codebase
  to stop it. That is the concrete cost of the token model not encoding the role.

Two smaller instances of the same shape of problem, also verified:

- Seven call sites hand-build a modal backdrop scrim as `ink` at some ad hoc alpha
  (`hexToRgba(ink, 0.6)`, `` `${ink}8F` ``, `` `${ink}59` ``, ...). `tokens.ts`'s own
  comment on `ink` already says its purpose is exactly this: *"ink stays dark: it is
  the colour of a scrim laid over content."* The role has a name in the comment and
  no name in the type.
- Danger/destructive tinted surfaces are hand-built per call site as
  `` `${danger}NN` `` with the alpha suffix copied by eye. Two files
  (`HomeDreamRow.tsx`, `ArchiveDreamRow.tsx`) agree on `14` for the fill and `44` for
  the border; the gate components written this session used `26`/`88` instead —
  again, no token to converge on, so the value drifted the moment a third writer
  touched it.

## Non-goals for this phase

- **Not fixing the general case.** A token that stops `text`/`background` from ever
  being chosen as a foreground on a *new* colour-filled surface in the future needs
  either full AST-aware lint tooling or discipline; see "Prevention" below for what
  this phase actually does about it, and its acknowledged limit.
- **Not adding tokens without an found instance of the ad hoc pattern they'd
  replace.** The plan's full wishlist also names `surfacePrimary`, `surfaceSecondary`,
  `surfaceInteractive`, `onSurface`, `controlThumb`, `selectedFill`, `selectedBorder`,
  `focusRing`. None of these have a demonstrated ad hoc reconstruction in the current
  code — `text`/`textDim` already correctly serve the "on-surface" role (see the
  passing `text`-on-`background`/`surface`/`surfaceAlt` pairings already in
  `themeContrast.test.ts`), and `switchThumb` already exists for the one control-thumb
  case in the app. Adding unused tokens now would be exactly the kind of "themes,
  more design surface" the top-level plan already lists under work *not* to do before
  retention is proven.
- **Not Phase B's screenshot/a11y infrastructure.** Separate spec, separate toolchain.

## Token changes

In `src/theme/tokens.ts`'s `ThemePalette` type and each of the four palettes
(`kaleidoscope`, `ember`, `moss`, `daylight`), and threaded through
`src/theme/theme.ts`'s `createAppTheme`:

1. **`onPrimary` (new).** Value equals the current `background` value for that
   palette — not a new colour, a name for the one already in use. Zero contrast risk:
   the pairings this replaces (`background` on `primary`/`danger`/`accent`) are
   already asserted in `themeContrast.test.ts`.
2. **`ink` → `scrim` (rename, old name removed).** Value unchanged in every palette.
   Chosen over keeping both names as an alias because, once the two foreground
   misuses below are migrated, every remaining use of `ink` in the repository *is*
   a scrim background — the token's only real meaning already matches
   `tokens.ts`'s own comment on it, so the honest fix is to rename it, not alias it.
   Removing the name means a future `theme.colors.ink` is a TypeScript compile error,
   not a silent repeat of the bug this phase is fixing.
3. **`destructiveSurface` (new, = `` `${danger}14` ``)** and **`destructiveBorder`**
   **(new, = `` `${danger}44` ``).** Canonicalise the convention `HomeDreamRow.tsx`
   and `ArchiveDreamRow.tsx` already agree on.

## Migration (file-by-file, all verified to exist at the line given)

**`onPrimary`** — replace `theme.colors.background` used as a `color:` (foreground)
value with `theme.colors.onPrimary`; replace `theme.colors.ink` used as a `color:`
value (the actual bug) with `theme.colors.onPrimary`:

- `src/features/settings/screens/SettingsScreen.styles.ts`
- `src/features/dreams/screens/HomeScreen.styles.ts`
- `src/features/dreams/screens/WakeEntryScreen.styles.ts`
- `src/features/dreams/screens/ArchiveScreen.styles.ts`
- `src/features/dreams/screens/NewDreamScreen.styles.ts`
- `src/features/dreams/components/archive/ArchiveFilterSheet.tsx`
- `src/features/stats/screens/MonthlyReportScreen.styles.ts`
- `src/features/stats/screens/ProgressScreen.styles.ts`
- `src/features/stats/screens/StatsScreen.styles.ts`
- `src/features/stats/components/MemoryPatternCard.tsx`
- `src/features/widgets/components/WidgetPinToast.tsx`
- `src/components/ui/SegmentedControl.tsx`
- `src/features/settings/components/LocalDataRecoveryGate.tsx:233` (bug fix)
- `src/services/storage/StorageMigrationGate.tsx:248` (bug fix)

**`ink` → `scrim`** — every remaining `theme.colors.ink` reference becomes
`theme.colors.scrim`, value unchanged:

- `src/app/navigation/tabs.styles.ts:222`
- `src/features/settings/components/BackupOnboardingModal.tsx:145`
- `src/features/settings/components/ArchiveKeyStrandedModal.tsx:105`
- `src/features/dreams/screens/HomeScreen.styles.ts:842`
- `src/features/dreams/components/CaptureSavedSheet.tsx:259`
- `src/features/dreams/components/archive/ArchiveFilterSheet.tsx:254`
- `src/features/stats/components/MemoryPatternCard.tsx:462`

**`destructiveSurface` / `destructiveBorder`**:

- `src/features/dreams/components/home/HomeDreamRow.tsx:183-184`
- `src/features/dreams/components/archive/ArchiveDreamRow.tsx:66-67`
- `src/features/dreams/components/DreamDetailActionTile.tsx:61` only (line 66's
  `` `${danger}20` `` is a distinct pressed-state shade, not this convention —
  left untouched)
- `src/features/settings/components/LocalDataRecoveryGate.tsx` (`warningIcon` block,
  currently `` `${danger}26` ``/`` `${danger}88` ``)
- `src/services/storage/StorageMigrationGate.tsx` (`warningIcon` block, same)
- `src/features/settings/components/ArchiveKeyStrandedModal.tsx` does not have a
  danger-tinted surface — not in scope.

Every other `theme.colors.danger` use in the files above (direct icon/text colour,
not an alpha-tinted surface) is already correct and untouched.

## Prevention

Two different guarantees, because the two bug classes are different sizes:

1. **The `ink` bug class is closed by construction.** The name is gone. Any future
   `theme.colors.ink` fails `tsc --noEmit` immediately — no test to maintain, no test
   that can go stale.
2. **The general `text`/`background`-as-foreground-on-a-filled-surface class gets a
   narrower, explicitly imperfect check**, added to `__tests__/themeTokens.test.ts`
   alongside its existing raw-hex scan: for each `StyleSheet.create({ ... })` block
   in a scanned file, if the same object literal contains both a `backgroundColor:`
   referencing `theme.colors.primary`/`danger`/`accent` and a `color:` referencing
   `theme.colors.text`/`theme.colors.background`, flag it. Same text-scanning
   approach the file already uses successfully for the hex-literal ban, applied to a
   narrower, concrete pattern rather than attempting general design-system linting.
   Documented in the test itself as catching *this* pattern, not all misuse — matching
   the honesty of the existing raw-hex check, which also names its own limits.

## Testing

- `npx tsc --noEmit` after the rename — the compiler enumerates every remaining
  `ink` reference as an error, which doubles as a completeness check on the
  migration list above (if it names a site this spec's file list missed, that's a
  real gap to fix, not a false positive).
- `npx jest __tests__/themeContrast.test.ts` — confirms `onPrimary` pairings hold
  (they're the same pairings already passing under the `background` name, so this
  proves no regression, not new coverage).
- `npx jest __tests__/themeTokens.test.ts` — extended with the new co-occurrence
  check (2 above); must still pass on every existing file post-migration.
- Manual: open each of the 14 migrated files' screens in `daylight` (the one theme
  where the original `ink` bug was actually visible) and confirm no regression by
  eye — the automated contrast check proves the numbers hold, not that nothing looks
  wrong.
