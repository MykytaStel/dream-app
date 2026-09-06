# Memory tab information architecture

Date: 2026-09-06
Found during: an owner review of the Memory tab against `docs/PRODUCT.md`. The
owner asked for an app-wide IA pass; the evidence concentrated the failure on
one screen, so the agreed scope (see "Scope decision" below) is the Memory tab
and one new sub-screen, not the tab bar.

## Scope decision

The owner considered three options — reshuffle within screens, merge/split
sub-screens, or rework the tab bar — and chose the first: **keep the five tabs
(Home / Archive / Add / Memory / Settings), rework only what Memory shows and how
it discloses.** `docs/ROADMAP.md` names "alpha shows people cannot find capture"
as the trigger for a tab-bar change; there is no such signal, so the tab bar is
out of scope.

Home, Archive and Settings match their `docs/ROADMAP.md` stage-2 targets already
and are not touched.

## Program note

`docs/PRODUCT.md` gives Memory one job, the "Revisit" journey: *someone with
thirty entries opens the app on an ordinary evening with no dream to write; the
archive has to give them a reason to be there — judged by whether they open an
old dream and recognise something the app noticed.* The same doc's Discovery
layer is explicit: "patterns surface **without being hunted**", and Memory
"drops the achievements and weekly goals that make a journal feel like a habit
tracker".

The current Memory tab (`StatsScreen.tsx`) violates both. In the `deep`
disclosure stage it stacks, before any browsable content:

1. a revisit nudge inside `StatsHeroSection` (`memoryNudge`),
2. `MemoryPatternCard` (a second "here is a thing we noticed"),
3. `MemoryDisclosureCard` (a "Full picture" status teaser),
4. a `MemoryDetailsToggle` ("Detailed analysis"),
5. a `MemorySecondaryActions` row linking to Dream Practice (a different
   subsystem).

Expanding (4) renders `StatsOverviewSections`, which contains **a second,
identically-labelled "Detailed analysis" toggle** (`isDetailsExpanded` /
`onToggleDetails`) nested inside it. Fully expanded, one screen shows ~10
analytical sections: fingerprint, emotional-trend chart, lucid metrics + history,
nightmare metrics, weekly-pattern cards, review shelf, compare-period chips,
activity-bar chart, snapshot tiles, coverage %, attention list. A "Section"
segmented control (Overview / Recurring / Monthly) and a "Range" filter
(All time / 30d / 7d) sit above all of it.

The models that produce this data (`useStatsScreenController`,
`useStatsOverviewContent`, `statsScreenModel`, `memoryDisclosure`,
`memoryPattern`, `reviewWorkspace`) are sound — they return one bag of derived
values. This spec changes **which container renders which subset**, adds one
screen, and removes one dead route. No storage or data-derivation logic changes.

An earlier, already-merged fix (`291d25f`) moved the outer details toggle's
disclosed content adjacent to its trigger and hid `MemoryDisclosureCard` at the
`deep` stage. This spec supersedes that structure.

## Design

### Target: the Memory tab is one scroll, three blocks, then links

At the `threads` and `deep` disclosure stages, `StatsScreen.tsx` renders, in
order:

**Block 1 — The pattern (always).** One card at the top. When
`getPrimaryMemoryPattern` returns a candidate, render `MemoryPatternCard` as
today (its confirm / dismiss / rename actions feed the beta metric "≥20% of
people with 10+ dreams confirm a pattern" and must be preserved). When there is
no candidate, the same slot renders the revisit-nudge content that
`StatsHeroSection` shows today (`memoryNudge`: eyebrow, dream title, reason,
"Open dream" → `DreamDetail`). The two are one job — "a reason to open an old
dream" — and must never both appear. The "Next step: Nothing urgent right now"
line (`overviewNextStepLabel` / `overviewNextStepEmpty`) is removed; it
contradicts the card above it and carries no action.

**Block 2 — What keeps coming back.** The `DreamFingerprintCard` content,
flattened to tappable signal chips (`fingerprintLeadSignals` +
`fingerprintFacets`) — e.g. `kaleidoscope ×7 · ocean ×4 · falling ×3`. Each chip
opens `PatternDetail` for that signal. No charts, no percentages, no coverage.
This is "what returns" made browsable in place — the Discovery layer's "without
being hunted".

**Block 3 — Pick back up.** Two to three rows from the review shelf
(`workQueueItems`, then `importantDreamItems`, then `savedSetItems` as the
fallback order that `StatsOverviewSections` already computes for
`reviewWorkspacePreview`). Each row opens its dream (or `PatternDetail` /
`MonthlyReport` for a saved set, as today). A "Show all" affordance opens
`ReviewWorkspaceScreen`, which is unchanged. Rendered only when the shelf is
non-empty.

**Link rows (bottom).** A small list (new `MemoryLinkRows` component, replacing
`MemorySecondaryActions`):

- **Monthly** → `MonthlyReport` (screen unchanged). Shown once the `monthly`
  mode would have been available (disclosure `deep` stage / `savedMonths` or a
  `latestMonthlyReport` exists — pick the condition that matches the current
  `memoryModeOptions` gate at implementation time).
- **Trends & numbers** → `MemoryTrends` (new, below).
- **Dream practice** → `DreamPractice`, **only when the user has ≥1 lucid or
  nightmare dream**. Reuse whatever signal already drives `nightmareCount` and
  the lucid metrics in the controller; if there is no single "has practice
  content" flag, derive one in the controller from the existing lucid/nightmare
  aggregates (a boolean, no new model). The `focus` param logic stays as today
  (`nightmareCount === 0 ? 'lucid' : 'nightmares'`).

**Removed from the Memory landing:**

- The "Section" `SegmentedControl` (Overview / Recurring / Monthly). "Recurring"
  content (pattern groups, saved threads) folds into Block 2; "Monthly" becomes
  the link row above. `selectedMemoryMode` state and the `MemoryMode` param
  thread through the controller and several components — remove it where it only
  gated the segmented control; keep any code path that Trends still needs.
- The "Range" chip row (All time / 30d / 7d). Memory's thesis is "over months";
  the landing is always all-time. Range moves to the Trends screen (below).
- The outer `MemoryDetailsToggle` and the whole "expand to see the dashboard"
  interaction. Its content is the Trends screen now.
- `MemoryDisclosureCard` at the `deep` stage stays removed (as `291d25f` did).
  At `foundation` / `signals` / `connections` / `threads` it stays — it is the
  progressive-disclosure teaching moment ("Memory is forming", "N more entries
  to the next level").

**Unchanged at the earlier disclosure stages.** `foundation` through the early
part of `threads` already show only the stage card plus what the archive size
supports. The three-block layout above is what the `threads`/`deep` user sees;
the staged copy and gating in `memoryDisclosure.ts` are untouched.

Files: `StatsScreen.tsx` (rewrite the render body to the three blocks + link
rows; drop `selectedMemoryMode` / `isMemoryDetailsExpanded` state and the
mode/range handlers; keep the loading / empty / error branches and the
`trackMemoryOpened` focus effect), `StatsHeroSection.tsx` (strip the
`SegmentedControl`, the range row, and the `memoryNudge` block — the nudge moves
into Block 1; what remains is the title/subtitle header, which may collapse into
`StatsScreen.tsx` directly if the component becomes trivial),
`MemoryPatternCard.tsx` (add the no-candidate fallback state rendering the
nudge content, or have `StatsScreen.tsx` switch between `MemoryPatternCard` and
a small nudge card — decide at implementation time based on which keeps
`MemoryPatternCard`'s props clean), `MemoryProgressiveDisclosure.tsx` (delete
`MemoryDetailsToggle` and `MemorySecondaryActions`; keep `MemoryDisclosureCard`),
new `MemoryLinkRows.tsx` (+ its own `.styles.ts`), `StatsThreadsSections.tsx`
and `StatsMonthlySections.tsx` (the pattern-groups / saved-threads pieces move
into Block 2's source or a small component it uses; monthly becomes a link —
these two components likely shrink to near-nothing or are deleted, verify their
remaining consumers at implementation time), `useStatsScreenController.ts` /
`StatsScreenSection.shared.ts` (remove `MemoryMode` / `selectedMemoryMode`
plumbing that only served the segmented control; add the "has practice content"
boolean if one does not already exist), copy files
(`src/constants/copy/stats/{en,uk}.ts` — remove `memoryMode*`,
`overviewNextStep*`, and any `details*` strings the landing no longer uses; add
the link-row and Trends-screen strings), route/navigation (see the Trends
section).

### New screen: `MemoryTrends`

A single opt-in screen holding everything moved off the Memory landing. It is the
body of today's `StatsOverviewSections`, with the nested `isDetailsExpanded`
toggle **flattened** (the screen itself is the disclosure — no toggle-within-a-
screen) and the review-shelf preview **removed** (that is Block 3 on the Memory
landing now).

Sections, in the order `StatsOverviewSections` already renders them:

- Emotional-trend chart (`EmotionalTrendSection`)
- Activity bars / compare-period panel, with the **range control** (7d / 30d /
  all) and the snapshot/compare `SegmentedControl` — this screen owns that state
- Snapshot tiles, Coverage %, Attention list
- Weekly-pattern cards
- Lucid progress (metrics + history), Nightmare recovery (metrics)

Decision recorded (owner, this review): move **all** of it, unchanged, for now.
`docs/PRODUCT.md`'s "not a habit tracker" line arguably rules out coverage %,
attention, compare-periods and activity bars, but cutting them is the owner's
call and reversible only with new work; the beta signal ("nobody opens Memory /
Trends") decides it. This screen is where that data lives one tap away until
then. The owner's stated reason for keeping it: the statistics matter, and so
does whether the app looks and feels right — both get judged in the beta.

The screen reuses `useStatsScreenController` (or a focused
`useMemoryTrendsController` that owns `selectedRange` / `selectedMode` and calls
the same `useStatsOverviewContent` model) — decide at implementation time. The
controller already defaults `selectedRange` to `'all'` and computes
`rangeOptions`, `canCompare`, `selectedRangeLabel`; those move with it.

Files: new `src/features/stats/screens/MemoryTrendsScreen.tsx` and its
`.styles.*.ts` (the existing `StatsScreen.styles.detail.ts` /
`.insights.ts` / `.overview.ts` area files hold most of the needed styles —
re-point or move them rather than rewriting), `src/app/navigation/routes.ts`
(add `MemoryTrends: 'MemoryTrends'` to `ROOT_ROUTE_NAMES` and its
`RootStackParamList` entry — `undefined` params), `src/app/navigation/
RootNavigator.tsx` (register the screen), `StatsOverviewSections.tsx` (becomes
this screen's body — flatten the inner toggle, drop the review-shelf block;
likely rename to `MemoryTrendsSections` or inline it), copy files (Trends screen
title + any section strings not already present).

### Delete the dead `Progress` route

`ProgressScreen` and `ROOT_ROUTE_NAMES.Progress` are unreachable from the app —
the "Progress" card was removed from Memory in the E4.6 declutter work.
`MemoryProgressiveDisclosure.tsx`'s own comment says so: "PRODUCT.md is explicit
that this is not a habit tracker. The ProgressScreen and route still exist but
are no longer reachable from the main flow." `docs/PRODUCT.md` §"not a habit
tracker" is the intent. Confirm unreachability with a repo-wide grep at
implementation time (below) before deleting.

Files: delete `src/features/stats/screens/ProgressScreen.tsx` and
`ProgressScreen.styles.ts`; `src/app/navigation/routes.ts` (remove
`Progress: 'Progress'` and `[ROOT_ROUTE_NAMES.Progress]: undefined`);
`src/app/navigation/RootNavigator.tsx` (remove the import and `<Stack.Screen>`);
copy files (remove `progressScreenTitle` / `progressScreen*` strings in
`src/constants/copy/stats/{en,uk}.ts` and any `progress*` strings in
`src/constants/copy/practice.ts` used only by that screen — grep before
deleting). Verify with a repo-wide grep that nothing else navigates to
`ROOT_ROUTE_NAMES.Progress` or imports `ProgressScreen` before deleting.

## Phasing

Each phase is a separate branch and merge.

1. **Delete `Progress`.** Isolated, no behavior change to any reachable screen.
2. **`MemoryTrends` screen + route.** Move `StatsOverviewSections`' content into
   it (flattened, no review-shelf). Memory landing keeps its current structure
   but its outer "Detailed analysis" toggle is replaced by a temporary link row
   to `MemoryTrends`. App is fully usable after this phase; the Memory landing is
   still busy but the double-nested toggle is gone.
3. **Strip the Memory landing** to Block 1 + Block 2 + Block 3 + link rows.
   Consolidate `memoryNudge` and `MemoryPatternCard`. Remove the mode
   `SegmentedControl` and the range row from `StatsHeroSection`.
4. **Fold and clean up.** Move threads / saved-threads content into Block 2,
   monthly into a link row, add the conditional Dream Practice row, delete the
   now-unused components (`StatsThreadsSections`, `StatsMonthlySections`,
   `MemorySecondaryActions`, dead styles and copy).

## Explicitly out of scope

- The tab bar. No merge of Home and Archive, no change to tab count, names, or
  order, no FAB.
- `Home`, `Archive`, `Settings` and their sub-screens.
- `ReviewWorkspaceScreen`, `PatternDetailScreen`, `MonthlyReportScreen`,
  `DreamPracticeScreen` internals — only the entry points into them change.
- The data models: `statsScreenModel.ts`, `useStatsOverviewContent`,
  `memoryDisclosure.ts`, `memoryPattern.ts`, `reviewWorkspace.ts`,
  `emotionalTrends.ts`, `weeklyPatternCards.ts` — no derivation logic changes.
  The only permitted controller change is removing `MemoryMode` plumbing and
  adding one derived boolean for the conditional practice row.
- Cutting any analytics section. Everything moves to `MemoryTrends` intact; the
  beta signal decides what to cut later.
- The progressive-disclosure stages and their copy (`foundation` → `deep`).
- Onboarding, reminders, backup, the composer.

## Testing

- Model tests — `__tests__/memoryDisclosure.test.ts`, `memoryPattern.test.ts`,
  `statsMemoryNudge.test.ts`, `statsReviewShelf.test.ts`, `statsWorkQueue.test.ts`,
  `statsRangeWindows.test.ts` — are model-level and should survive. Read each at
  implementation time; update only assertions that reference the removed
  `MemoryMode` / `selectedMemoryMode` or a screen structure that changed.
- `__tests__/statsOverviewPeriods.characterisation.test.tsx` drives
  `useStatsOverviewContent` via a hook harness with a fixed clock — it does not
  render `StatsScreen`, so it survives unless the hook's inputs change. Verify.
- Navigation / route tests — grep `__tests__` for `Progress` and for route-count
  or route-list assertions; update for `Progress` removed and `MemoryTrends`
  added.
- New: a characterisation test for the stripped Memory landing — what renders at
  the `foundation`, `threads`, and `deep` stages (stage card vs. three blocks vs.
  link rows), and that Block 1 shows the pattern card XOR the nudge, never both.
- New: a light render test for `MemoryTrendsScreen` — it mounts, shows the range
  control, and shows the trend sections without a nested toggle.
- `npx tsc --noEmit` and `npx eslint . --max-warnings=0` on the branch —
  deleting exported symbols (`MemoryMode`, `ProgressScreen`, `progressScreenTitle`,
  the removed copy keys) surfaces any missed consumer as a compile error.
- `npx prettier --check` on changed files; `npx jest --ci` full suite per phase.
- Manual on the simulator, per phase: seed enough dreams to reach the `deep`
  stage (20+), then confirm — Memory shows one "reason to revisit" card, a row
  of tappable signal chips, up to three "pick back up" rows, and the link rows;
  no Section tabs, no Range chips, no nested "Detailed analysis". Open
  "Trends & numbers", confirm every chart/metric that used to be behind the
  double toggle is there, with the range control working. Confirm "Dream
  practice" appears only after a lucid or nightmare dream exists. Confirm nothing
  navigates to a dead `Progress` screen.
