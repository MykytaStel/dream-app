# Remove Dead Memory Milestones Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the achievements/weekly-goal code on the Memory tab that computes
data no screen renders — `StatsMilestonesSection.tsx` and its unused data pipeline in
`useStatsOverviewContent.ts` — with zero behavior or visual change.

**Architecture:** A single atomic deletion across three files that all belong to one
dead code path: the orphaned component, its barrel re-export, and the hook
computations that only ever fed it. Not splittable into independently-reviewable
sub-tasks — removing part of a dead pipeline while leaving the rest would just move
the unused code around.

**Tech Stack:** TypeScript, React Native, Jest.

## Global Constraints

- Full design: `docs/superpowers/specs/2026-08-09-remove-dead-memory-milestones-design.md`.
- Do **not** touch `src/features/stats/model/achievements.ts` — still used by
  `ProgressScreen.tsx` and the post-save streak toast in `NewDreamScreen.tsx`.
- Do **not** touch `getAchievementContent` in `src/features/stats/model/statsScreenModel.ts`
  — the function stays; only this task's one import of it is removed.
- Do **not** touch `getEntriesLastSevenDays` in `src/features/dreams/model/dreamAnalytics.ts`
  — the function stays; only this task's one import/call of it is removed.
- Do **not** touch `ProgressScreen.tsx` or `StreakMilestoneToast` — explicitly out of
  scope for this change.
- No visual or behavioral change is expected anywhere — this is deleting code with
  zero live consumers. If any step's verification finds a surviving consumer, stop:
  that means this plan's premise (the code is dead) is wrong for that specific piece,
  and it should not be deleted.
- Do not add `Co-Authored-By` trailers to commits.

---

## Task 1: Delete the dead achievements/weekly-goal pipeline

**Files:**
- Delete: `src/features/stats/components/StatsMilestonesSection.tsx`
- Modify: `src/features/stats/components/StatsScreenSections.tsx`
- Modify: `src/features/stats/hooks/useStatsOverviewContent.ts`

**Interfaces:**
- Produces: nothing — this task only removes unreferenced code. No other file in the
  codebase imports `StatsMilestonesSection`, or reads
  `achievementSummary`/`achievements`/`milestoneSummaryHint`/`overallLastSevenDays`/
  `weeklyGoalComplete`/`weeklyGoalTarget` from the object `useStatsOverviewContent`,
  `useStatsDerivedContent`, or `useStatsScreenController` returns (verified via
  repo-wide grep before this plan was written — Step 1 below re-verifies it against
  the current tree before anything is deleted).

- [ ] **Step 1: Re-verify there are no live consumers before deleting anything**

Run each of these and confirm the output matches what's shown — if any of them finds
something not listed here, STOP and report it; do not proceed with the deletion:

```bash
grep -rn "StatsMilestonesSection" --include="*.tsx" --include="*.ts" src
```
Expected: exactly two lines — the component's own definition in
`StatsMilestonesSection.tsx`, and the re-export in `StatsScreenSections.tsx`.

```bash
grep -rn "achievementSummary\|milestoneSummaryHint\|weeklyGoalComplete\|weeklyGoalTarget" --include="*.tsx" --include="*.ts" src/features/stats | grep -v "StatsMilestonesSection.tsx\|useStatsOverviewContent.ts"
```
Expected: no output. (`ProgressScreen.tsx` computes its own local
`achievementSummary`/`weeklyGoalTarget`/`weeklyGoalComplete` variables independently
inside its own function body — those are a separate, in-scope-for-nothing local
computation this grep would still show since it's under `src/features/stats`, so if
this prints `ProgressScreen.tsx` matches, that is expected and fine; anything else is
not.)

```bash
grep -rn "overallLastSevenDays" --include="*.tsx" --include="*.ts" src | grep -v "StatsMilestonesSection.tsx\|useStatsOverviewContent.ts"
```
Expected: no output.

- [ ] **Step 2: Delete the orphaned component**

```bash
rm src/features/stats/components/StatsMilestonesSection.tsx
```

- [ ] **Step 3: Remove the barrel re-export**

In `src/features/stats/components/StatsScreenSections.tsx`, remove this line:

```ts
export { StatsMilestonesSection } from './StatsMilestonesSection';
```

- [ ] **Step 4: Remove the dead computations from `useStatsOverviewContent.ts`**

Open `src/features/stats/hooks/useStatsOverviewContent.ts`.

First, the imports. Change:

```ts
import {
  getEntriesLastSevenDays,
  getDreamDate,
  getDreamLucidityLevel,
  getLucidDreamStats,
  getLucidPracticeStats,
  getNightmareStats,
  getSleepContextStats,
  getTopPreSleepEmotionSignals,
  getTopWakeEmotionSignals,
  isLucidDream,
} from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../model/dreamReflection';
import {
  getDreamAchievementSummary,
  getDreamAchievements,
} from '../model/achievements';
import {
  buildRecentActivityBars,
  formatDreamCountLabel,
  formatEntryCountLabel,
  getAchievementContent,
  getMemoryNudge,
  getMemoryWorkQueue,
  getPreviousRangeDreams,
  summarizeScopedDreams,
  type MemoryWorkQueueItem,
  type MemoryNudge,
} from '../model/statsScreenModel';
```

to:

```ts
import {
  getDreamDate,
  getDreamLucidityLevel,
  getLucidDreamStats,
  getLucidPracticeStats,
  getNightmareStats,
  getSleepContextStats,
  getTopPreSleepEmotionSignals,
  getTopWakeEmotionSignals,
  isLucidDream,
} from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
  getTranscriptArchiveStats,
} from '../model/dreamReflection';
import {
  buildRecentActivityBars,
  formatDreamCountLabel,
  formatEntryCountLabel,
  getMemoryNudge,
  getMemoryWorkQueue,
  getPreviousRangeDreams,
  summarizeScopedDreams,
  type MemoryWorkQueueItem,
  type MemoryNudge,
} from '../model/statsScreenModel';
```

(`getEntriesLastSevenDays` removed from the first block, the whole
`'../model/achievements'` import removed, `getAchievementContent` removed from the
`'../model/statsScreenModel'` block — every other name in all three blocks is unused
by this task and stays untouched.)

Next, the `overallLastSevenDays` computation. Find:

```ts
  const overallLastSevenDays = React.useMemo(
    () => (isOverviewMode ? getEntriesLastSevenDays(dreams) : 0),
    [dreams, isOverviewMode],
  );
```

Delete it entirely (all lines of this `useMemo` call, including its closing `);`).

Next, the achievements and weekly-goal block. Find:

```ts
  const achievements = React.useMemo(
    () => (isOverviewMode ? getDreamAchievements(dreams) : []),
    [dreams, isOverviewMode],
  );
  const achievementSummary = React.useMemo(
    () => getDreamAchievementSummary(achievements),
    [achievements],
  );
  const weeklyGoalTarget = 3;
  const weeklyGoalComplete = overallLastSevenDays >= weeklyGoalTarget;
```

Delete it entirely.

Next, the highlighted-achievement/milestone-hint block, near the end of the function
just before the `return` statement. Find:

```ts
  const highlightedAchievementTitle = achievementSummary.highlightedId
    ? getAchievementContent(achievementSummary.highlightedId, copy).title
    : null;
  const milestoneSummaryHint =
    achievementSummary.unlockedCount === achievementSummary.totalCount
      ? copy.milestonesCompleteTitle
      : (highlightedAchievementTitle ?? copy.milestoneInProgress);
```

Delete it entirely.

Finally, the return object. Find:

```ts
  return {
    achievementSummary,
    achievements,
    activityBars,
    attentionItems,
    compareMetrics,
    coverageGap,
    coverageItems,
    emotionalTrendInsight,
    emotionalTrendSeries,
    fingerprintFacets,
    fingerprintLeadSignals,
    importantDreamItems,
    lucidHistoryItems,
    lucidMetrics,
    memoryNudge,
    milestoneSummaryHint,
    nightmareMetrics,
    nightmareCount: scopedNightmareStats.nightmareCount,
    overallLastSevenDays,
    savedMonthItems,
    savedOverviewThreadItems,
    savedSetItems,
    summaryTiles,
    topSignal,
    weeklyPatternCards,
    weeklyGoalComplete,
    weeklyGoalTarget,
    workQueueItems,
  };
```

Replace with (six keys removed — `achievementSummary`, `achievements`,
`milestoneSummaryHint`, `overallLastSevenDays`, `weeklyGoalComplete`,
`weeklyGoalTarget` — every remaining key unchanged, same order):

```ts
  return {
    activityBars,
    attentionItems,
    compareMetrics,
    coverageGap,
    coverageItems,
    emotionalTrendInsight,
    emotionalTrendSeries,
    fingerprintFacets,
    fingerprintLeadSignals,
    importantDreamItems,
    lucidHistoryItems,
    lucidMetrics,
    memoryNudge,
    nightmareMetrics,
    nightmareCount: scopedNightmareStats.nightmareCount,
    savedMonthItems,
    savedOverviewThreadItems,
    savedSetItems,
    summaryTiles,
    topSignal,
    weeklyPatternCards,
    workQueueItems,
  };
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If this surfaces an error referencing a removed symbol from a
file outside the three touched here, that means a consumer exists that Step 1's grep
missed — stop and report it rather than patching around the error.

- [ ] **Step 6: Lint**

Run: `npx eslint src/features/stats/components/StatsScreenSections.tsx src/features/stats/hooks/useStatsOverviewContent.ts`
Expected: no errors, no warnings (in particular, no unused-import warnings — if one
appears, an import wasn't fully cleaned up).

- [ ] **Step 7: Full test suite**

Run: `npx jest`
Expected: PASS — every suite, same count as before this change (no test in the repo
targets the removed code, so the total test count should be unchanged, only lower by
however many tests directly exercised `StatsMilestonesSection` — per the spec, that
count is zero).

- [ ] **Step 8: Manual verification**

Open the app (dev build or simulator) and navigate to the Memory tab. Confirm it
looks exactly as it did before this change — same content, same layout — in both a
light and a dark theme. This is the actual pass condition for a dead-code deletion:
nothing should look different, because nothing user-visible was removed.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: remove dead achievements and weekly-goal code from Memory tab"
```
