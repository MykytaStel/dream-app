# Remove dead achievements/weekly-goal code from the Memory tab

Date: 2026-08-09
Plan section: owner's product plan (`~/.claude/plans/dream-app-product-plan-2026-08-03.md`)
§3.4 — "Achievements і weekly goals створюють відчуття habit tracker, якого
PRODUCT.md прямо уникає. Прибрати з основного потоку."

## Finding that reshaped this task

The Memory tab (`StatsScreen.tsx`, the `Stats` bottom-tab route) does not currently
render any achievements or weekly-goal UI. Traced the full chain before writing this
spec:

- `StatsMilestonesSection.tsx` is the only component that would render this content.
  It is exported from the barrel file `StatsScreenSections.tsx` but never imported by
  any screen (`grep -rn "StatsMilestonesSection" --include="*.tsx" src` outside its
  own definition file returns only the barrel re-export).
- The data it would need — `achievementSummary`, `achievements`,
  `milestoneSummaryHint`, `overallLastSevenDays`, `weeklyGoalComplete`,
  `weeklyGoalTarget` — is computed in `useStatsOverviewContent.ts` and threaded
  through `useStatsDerivedContent.ts` → `useStatsScreenController.ts` → the
  `controller` object `StatsScreen.tsx` holds, via `return { ...overview, ... }`
  spreads at each layer. `StatsScreen.tsx` never reads any of these six fields.
- No test references `StatsMilestonesSection`, `weeklyGoalComplete`,
  `weeklyGoalTarget`, or `milestoneSummaryHint`.

So §3.4's directive ("remove from the main flow") is already true in practice — this
task is dead-code deletion that makes the code match what users already see, not a
product or UX change. There is no visual difference before/after.

## Explicitly out of scope (verified still in active use)

- `src/features/stats/model/achievements.ts` — the model itself. Used by
  `ProgressScreen.tsx` (a screen reachable one tap from the Memory tab via
  `MemorySecondaryActions`' "Progress" link, independent of anything this task
  touches) and by the post-save streak-milestone toast in
  `NewDreamScreen.tsx` (`getStreakMilestoneToast`, `STREAK_MILESTONES`).
- `src/features/stats/model/statsScreenModel.ts`'s `getAchievementContent` — the
  function itself stays; only `useStatsOverviewContent.ts`'s import of it is removed
  (`ProgressScreen.tsx` imports and uses it independently).
- `src/features/dreams/model/dreamAnalytics.ts`'s `getEntriesLastSevenDays` — the
  function itself stays; `ProgressScreen.tsx` calls it directly for its own weekly
  count. Only `useStatsOverviewContent.ts`'s separate call to it (feeding the dead
  `overallLastSevenDays` field) is removed.
- `ProgressScreen.tsx` and the `StreakMilestoneToast` post-save toast — both out of
  scope per this session's explicit scoping decision (the Memory-tab card was judged
  the clearest "main flow" instance; these two are a one-tap-away screen and a
  passive, already-PRODUCT.md-sanctioned streak notice, respectively — a separate
  future task if revisited).

## Changes

**Delete:** `src/features/stats/components/StatsMilestonesSection.tsx` (whole file,
182 lines) — confirmed zero importers outside its own definition and the barrel
re-export being removed in the same change.

**Modify:** `src/features/stats/components/StatsScreenSections.tsx` — remove the line
`export { StatsMilestonesSection } from './StatsMilestonesSection';`.

**Modify:** `src/features/stats/hooks/useStatsOverviewContent.ts`:
- Remove the `overallLastSevenDays` `useMemo` (currently ~line 146-148).
- Remove the `achievements` `useMemo` (currently ~line 215-217).
- Remove the `achievementSummary` `useMemo` (currently ~line 219-221).
- Remove the `weeklyGoalTarget` constant and `weeklyGoalComplete` derivation
  (currently ~line 224-225).
- Remove the `highlightedAchievementTitle` and `milestoneSummaryHint` derivations
  (currently ~line 596-602).
- Remove these six keys from the function's return object: `achievementSummary`,
  `achievements`, `milestoneSummaryHint`, `overallLastSevenDays`,
  `weeklyGoalComplete`, `weeklyGoalTarget`.
- Remove the now-fully-unused import
  `import { getDreamAchievementSummary, getDreamAchievements } from '../model/achievements';`
  (lines 25-28) — both names are used nowhere else in this file.
- Remove `getEntriesLastSevenDays` from the named-import list at line 9 (the
  `'../../dreams/model/dreamAnalytics'` import block) — the other nine names in that
  block stay, they're used elsewhere in the file.
- Remove `getAchievementContent` from the named-import list at line 33 (the
  `'../model/statsScreenModel'` import block) — the other names in that block stay.

No other file changes. `StatsOverviewSections.tsx`, `StatsScreen.tsx`, and
`useStatsDerivedContent.ts`/`useStatsScreenController.ts` already don't reference any
of the removed fields (verified by grep before writing this spec) — the `{ ...overview,
... }` spreads simply carry fewer keys through, which is not a code change at those
call sites, just a natural consequence of the source object shrinking.

## Testing

- `npx tsc --noEmit` — the type checker will surface any consumer this spec's grep-based
  verification missed (a removed exported symbol or object field that's still
  referenced somewhere becomes a compile error), which doubles as the completeness
  proof for this deletion.
- `npx eslint` on the two modified files — catches any import left unused.
- `npx jest` (full suite) — no test targets the removed code; the bar is zero
  regressions elsewhere.
- Manual: open the Memory tab in a running build (light and dark theme) and confirm
  it looks identical to before — this is a delete of unreached code, so "no visible
  change" is the actual pass condition, not a screenshot diff of new content.
