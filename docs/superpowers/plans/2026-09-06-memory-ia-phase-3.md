# Memory IA — Phase 3 Implementation Plan

> **Status (2026-09-06): DONE.** All 4 tasks merged `69da00b`. Full gates green
> (tsc / eslint / prettier / jest 1099). Sim-verified at the deep stage. Deviation:
> the Recurring row was dropped (PatternDetail needs a {signal,kind} param).
> Deferred to a Phase 4: conditional practice row, dead MemoryMode plumbing,
> unused StatsOverviewSections props, link-row styling.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Strip the Memory tab landing to its three blocks — a single "reason to revisit" card, "what keeps coming back", and "pick back up" — followed by link rows. Remove the Section tabs and the Range filter from the landing.

**Architecture:** No data-model changes. `StatsScreen` stops rendering the Section `SegmentedControl`, the Range chips, and the `threads` / `monthly` mode branches; `selectedMemoryMode` is pinned to `'overview'`. The revisit nudge (currently in `StatsHeroSection`) and `MemoryPatternCard` merge into one slot — never both. `DreamFingerprintCard` and the review-shelf preview move from `StatsOverviewSections` (now only mounted on `MemoryTrends`) onto the landing. `StatsThreadsSections` / `StatsMonthlySections` lose their last consumer and are deleted. The unused controller `MemoryMode` plumbing and the conditional Dream-practice row are left for a Phase 4 cleanup.

**Tech Stack:** React Native 0.86, `@react-navigation/native-stack`, `@shopify/restyle` + `useStyles`, jest 29 + `@testing-library/react-native` (its `render` is **async** — `await render(...)`).

**Spec:** `docs/superpowers/specs/2026-09-06-memory-ia-design.md` — the "Target: the Memory tab is one scroll, three blocks, then links" section, Phase 3 of the phasing list.

## Global Constraints

- **Node for gates:** `export PATH="/Users/mykyta/.nvm/versions/node/v20.19.4/bin:$PATH"`.
- **Gates before every task-ending commit:** `npx tsc --noEmit`, `npx eslint . --max-warnings=0`, `npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}"`, `npx jest --ci --watchAll=false`.
- **No raw hex** in `src/features/**` / `src/components/**` / `src/services/**` — `__tests__/themeTokens.test.ts` bans it. Use `theme.colors.*` through a `useStyles` factory; `'transparent'` allowed; a `` `${theme.colors.x}55` `` template is allowed.
- **Styles:** `create<Screen>Styles(theme)` + `useStyles`; big screens split into `<Screen>.styles.<area>.ts` spread by a `<Screen>.styles.ts` barrel. Reuse the existing `createStatsScreenStyles` keys where they fit rather than adding new ones.
- **Copy:** `src/constants/copy/stats/en.ts` (`STATS_COPY_EN`) + `uk.ts` (`{ ...STATS_COPY_EN, <overrides> }`). Every key resolves in both locales.
- **Git:** one `feature/*` branch off `main` for the whole phase; full gate suite; `git merge --no-ff`; `git branch -d`; `git push origin main`. One merge for the phase.
- **Commits:** no AI-attribution trailer anywhere.
- **Do not touch:** `src/features/stats/model/*`, `useStatsDerivedContent.ts`, `useStatsOverviewContent.ts`, `useStatsCatalogState.ts`, `useStatsThreadsContent.ts`, `useStatsMonthlyContent.ts`. The `MemoryTrends` screen and `StatsOverviewSections`' behaviour on it must stay working.

---

## Task 1: Remove the Section tabs and Range filter from the Memory landing

`StatsScreen` keeps `selectedMemoryMode` as a constant `'overview'`. The `SegmentedControl` (Overview/Recurring/Monthly), the Range chip row, and the `threads` / `monthly` render branches go. `Recurring` and `Monthly` become `SettingsActionRow` link rows next to the existing "Trends & numbers" row. `StatsThreadsSections` and `StatsMonthlySections` lose their only caller and are deleted.

**Files:**
- Modify: `src/features/stats/screens/StatsScreen.tsx`
- Modify: `src/features/stats/components/StatsHeroSection.tsx`
- Modify: `src/features/stats/components/StatsScreenSections.tsx` (drop the two re-exports)
- Delete: `src/features/stats/components/StatsThreadsSections.tsx`, `src/features/stats/components/StatsMonthlySections.tsx`
- Modify: `src/constants/copy/stats/en.ts` + `uk.ts` (add `memoryRecurringRowMeta`, `memoryMonthlyRowMeta`)
- Test: `__tests__/statsScreenTrendsLink.test.tsx` (extend), `__tests__/memoryLandingShape.test.tsx` (new)

**Interfaces:**
- Consumes: `ROOT_ROUTE_NAMES.MemoryTrends` / `.PatternDetail` / `.MonthlyReport` (all already exist).
- Produces: nothing later tasks import. `StatsHeroSection`'s prop surface shrinks (below).

- [ ] **Step 1: Add the two copy keys**

`en.ts`, near `memoryTrendsRowMeta`:
```ts
  memoryRecurringRowMeta: 'Words, themes and symbols that repeat.',
  memoryMonthlyRowMeta: 'Saved monthly reviews.',
```
`uk.ts` override, same place:
```ts
  memoryRecurringRowMeta: 'Слова, теми й символи, що повторюються.',
  memoryMonthlyRowMeta: 'Збережені місячні огляди.',
```

- [ ] **Step 2: Write the failing landing-shape test**

Create `__tests__/memoryLandingShape.test.tsx`. Reuse the mock harness from `__tests__/statsScreenTrendsLink.test.tsx` verbatim (the `jest.mock` blocks for `@react-navigation/native`, `../src/i18n/I18nProvider`, `useStatsScreenController`, `getPrimaryMemoryPattern`, plus `mockNavigate`, `SAFE_AREA_METRICS`, `renderScreen`). Then:

```tsx
describe('Memory landing shape', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('has no Section segmented control and no Range chips', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText(copy.memoryModeThreads)).toBeNull(); // "Recurring" tab
    expect(queryByText(copy.rangeLabel)).toBeNull(); // "Range"
    expect(queryByText(copy.range7Days)).toBeNull();
  });

  it('offers Recurring and Monthly as link rows', async () => {
    const { getByText } = await renderScreen();
    fireEvent.press(getByText(copy.memoryModeMonthly));
    expect(mockNavigate).toHaveBeenCalledWith('MonthlyReport');
  });
});
```

> `copy.memoryModeThreads` is `'Recurring'` and `copy.memoryModeMonthly` is `'Monthly'` — reused as the row titles so no new title keys are needed. Verify those values in `en.ts` before running.

- [ ] **Step 3: Run the test, expect failure**

```bash
export PATH="/Users/mykyta/.nvm/versions/node/v20.19.4/bin:$PATH"
npx jest --ci --watchAll=false memoryLandingShape
```
Expected: FAIL — the Section control still renders "Recurring", and there is no Monthly row.

- [ ] **Step 4: Shrink `StatsHeroSection`**

`src/features/stats/components/StatsHeroSection.tsx` — the hero on the Memory landing now only needs its title/subtitle. Remove:
- the `selectedMemoryMode`, `onSelectMemoryMode`, `memoryModeOptions`, `selectedRange`, `onSelectRange`, `rangeOptions`, `memoryNudge`, `onOpenMemoryNudge`, `coverageGap` props and their types,
- the `<SegmentedControl>` block, the range-row block, and the `selectedMemoryMode === 'overview'` nudge/next-step block,
- now-unused imports (`SegmentedControl`, `SegmentedControlOption`, `Ionicons`, `InsightRange`, `MemoryMode`, `DreamDetailFocusSection`, `FadeInDown` if unused).

The component becomes: an `Animated.View` wrapping a `<Card style={styles.heroCard}>` containing one `<SectionHeader title={copy.title} subtitle={copy.subtitle} large />`. Keep the `statsLayoutTransition` layout.

> The nudge markup moves into `StatsScreen` in Task 2. For Task 1, it is simply deleted from the hero — the landing loses the nudge for one task; Task 2 restores it in the block-1 slot. Both tasks are in the same phase branch, so `main` never sees the gap.

- [ ] **Step 5: Rewrite `StatsScreen.tsx`'s body**

1. Delete the `selectedMemoryMode` state; replace every `selectedMemoryMode === 'overview'` guard with an unconditional render and delete every `selectedMemoryMode !== 'overview'` / `=== 'threads'` / `=== 'monthly'` branch.
2. Delete `handleSelectMemoryMode`, `handleSelectRange`, `memoryModeOptions`, `visibleRangeOptions`, and the `React.useEffect` that calls `setSelectedMemoryMode('overview')`.
3. `shouldShowScopedEmptyState` — its remaining guard was `selectedMemoryMode !== 'monthly'`, always true now; simplify to `!controller.scopedDreams.length`. Keep it only if still used after the branch deletions (the `selectedMemoryMode !== 'overview'` block that used it is gone — verify and delete `shouldShowScopedEmptyState` if nothing references it).
4. The controller call still passes `selectedMemoryMode` — pass the literal `'overview'`:
   ```tsx
   const controller = useStatsScreenController({
     locale,
     copy,
     dreamCopy,
     selectedMemoryMode: 'overview',
     openPatternDetail,
   });
   ```
5. `<StatsHeroSection>` call — reduce to `<StatsHeroSection copy={copy} styles={styles} />`.
6. Replace the single `<SettingsActionRow ... title={copy.memoryTrendsTitle} .../>` with a group of three:
   ```tsx
   <SettingsActionRow
     variant="inline"
     title={copy.memoryModeThreads}
     meta={copy.memoryRecurringRowMeta}
     onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail)}
   />
   <SettingsActionRow
     variant="inline"
     title={copy.memoryModeMonthly}
     meta={copy.memoryMonthlyRowMeta}
     onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport)}
   />
   <SettingsActionRow
     variant="inline"
     title={copy.memoryTrendsTitle}
     meta={copy.memoryTrendsRowMeta}
     onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.MemoryTrends)}
   />
   ```
   > `PatternDetail` params are `{ signal, kind } | undefined` — check `routes.ts`. If `undefined` is not allowed, this row must instead open the pattern list some other way; if the screen tolerates no params (shows a list / picker), pass none. Confirm at implementation time by reading `PatternDetailScreen.tsx`; if it hard-requires a `signal`, drop the Recurring row for this phase and note it for Phase 4 (the fingerprint facets in Task 3 already reach `PatternDetail` with real signals).
7. Remove imports that are now unused: `StatsThreadsSections`, `StatsMonthlySections`, `MemoryMode`, `getPracticeCopy` was already gone, `isMemoryModeAvailable`, `SegmentedControl`-related. Run `tsc` to enumerate.

- [ ] **Step 6: Delete the two section components and their re-exports**

```bash
git rm src/features/stats/components/StatsThreadsSections.tsx src/features/stats/components/StatsMonthlySections.tsx
```
In `src/features/stats/components/StatsScreenSections.tsx` remove the `StatsThreadsSections` and `StatsMonthlySections` `export` lines (keep `StatsHeroSection`, `StatsOverviewSections`, `type MemoryMode`).

> Before deleting, grep: `grep -rn "StatsThreadsSections\|StatsMonthlySections" src __tests__`. Expected: only `StatsScreen.tsx` (being edited) and the barrel. If a test imports them, delete that test or its relevant cases.

- [ ] **Step 7: Run the new test, expect pass; extend the trends-link test**

```bash
npx jest --ci --watchAll=false memoryLandingShape statsScreenTrendsLink
```
`statsScreenTrendsLink.test.tsx` still asserts the Trends row navigates — that must still pass (the row is now one of three). If its mock `useStatsScreenController` return is missing keys the reduced screen still reads, add them; if it references removed keys, trim.

- [ ] **Step 8: Full gates**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: drop Section tabs and Range filter from the Memory landing"
```

---

## Task 2: One "reason to revisit" card — pattern XOR nudge

Block 1 of the landing. When `getPrimaryMemoryPattern` returns a candidate and the stage is past `foundation`, render `MemoryPatternCard` exactly as today. Otherwise render a compact revisit-nudge card built from `controller.memoryNudge`. Never both. The "Next step: Nothing urgent right now" line is already gone (it lived in the hero block deleted in Task 1).

**Files:**
- Create: `src/features/stats/components/MemoryRevisitNudgeCard.tsx` (+ inline styles via `useStyles` on `createStatsScreenStyles` or its own small factory)
- Modify: `src/features/stats/screens/StatsScreen.tsx`
- Test: `__tests__/memoryLandingShape.test.tsx` (extend)

**Interfaces:**
- Consumes: `controller.memoryNudge` — shape `{ dreamId, dreamTitle, reason, badgeLabel, actionLabel, focusSection, icon } | null` (from `useStatsScreenController`'s return; confirm the exact field names at implementation time).
- Produces: `MemoryRevisitNudgeCard` — props `{ nudge: <that shape>, copy, onOpen: (dreamId, focusSection) => void }`.

- [ ] **Step 1: Write the failing test**

In `memoryLandingShape.test.tsx` add a describe covering the XOR. The shared harness mocks `getPrimaryMemoryPattern` — parametrise it. Simplest: two `jest.isolateModules` / separate files, or override per-test with `jest.spyOn`. Given the harness mocks the module factory, add a second test file `__tests__/memoryRevisitSlot.test.tsx` with `getPrimaryMemoryPattern: () => null` and a `memoryNudge` object in the controller mock:

```tsx
// controller mock adds:
memoryNudge: {
  dreamId: 'd1',
  dreamTitle: 'Glass hallway',
  reason: 'Theme still pulling focus.',
  badgeLabel: 'Theme',
  actionLabel: 'Open dream',
  focusSection: 'reflection',
  icon: 'sparkles-outline',
},
```
```tsx
it('shows the revisit nudge when there is no confirmed pattern', async () => {
  const { getByText, queryByText } = await renderScreen();
  expect(queryByText('Glass hallway')).not.toBeNull();
  expect(queryByText(copy.detailReflectionSignalTitle)).toBeNull(); // no MemoryPatternCard chrome
  fireEvent.press(getByText('Open dream'));
  expect(mockNavigate).toHaveBeenCalledWith('DreamDetail', expect.objectContaining({ dreamId: 'd1' }));
});
```
> Pick an assertion string that only `MemoryPatternCard` renders (open `MemoryPatternCard.tsx` and its `MemoryPatternCopy` type for a stable label) to prove it is *not* on screen. Adjust `navigate` arg shape to match what `StatsScreen`'s existing `onOpenMemoryNudge` passed (`{ source: 'stats', dreamId, focusSection }`).

- [ ] **Step 2: Run it, expect failure**

```bash
npx jest --ci --watchAll=false memoryRevisitSlot
```
Expected: FAIL — no nudge card yet (the hero one was removed in Task 1, nothing replaced it).

- [ ] **Step 3: Build `MemoryRevisitNudgeCard`**

Move the nudge JSX deleted from `StatsHeroSection` in Task 1 into this component. It is a `<Card>` with: an eyebrow (`copy.memoryNudgeLabel`), a badge (`nudge.icon` + `nudge.badgeLabel`), `nudge.dreamTitle`, `nudge.reason`, and a pressable action row (`nudge.actionLabel` + arrow) calling `onOpen(nudge.dreamId, nudge.focusSection)`. Reuse `createStatsScreenStyles` keys that the hero used (`memoryNudgeCard`, `memoryNudgeHeader`, `memoryNudgeBadge`, `memoryNudgeBadgeText`, `storyLabel`, `storyValue`, `storyHint`, `memoryNudgeActionRow`, `memoryNudgeActionText`) via `useStyles(createStatsScreenStyles)` — do not prop-drill the sheet.

- [ ] **Step 4: Wire it into `StatsScreen.tsx`**

Where `MemoryPatternCard` renders, wrap the choice:
```tsx
{disclosureState.stage !== 'foundation' && primaryMemoryPattern ? (
  <MemoryPatternCard ... />
) : controller.memoryNudge ? (
  <MemoryRevisitNudgeCard
    nudge={controller.memoryNudge}
    copy={copy}
    onOpen={(dreamId, focusSection) =>
      navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
        source: 'stats',
        dreamId,
        focusSection,
      })
    }
  />
) : null}
```
Keep the existing `MemoryPatternCard` prop block (confirm/dismiss/rename/openDream/openPattern) exactly as it is.

- [ ] **Step 5: Run tests, expect pass**

```bash
npx jest --ci --watchAll=false memoryRevisitSlot memoryLandingShape statsScreenTrendsLink
```

- [ ] **Step 6: Full gates, commit**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
git add -A
git commit -m "refactor: Memory block 1 is one card — pattern or revisit nudge, never both"
```

---

## Task 3: Block 2 — "what keeps coming back" on the landing

Move `DreamFingerprintCard` from `StatsOverviewSections` onto the Memory landing. Its facet tiles already carry `onPress` → `PatternDetail` (wired in `useStatsOverviewContent`), so no component change is needed.

**Files:**
- Modify: `src/features/stats/screens/StatsScreen.tsx`
- Modify: `src/features/stats/components/StatsOverviewSections.tsx` (remove the fingerprint block)
- Test: `__tests__/memoryLandingShape.test.tsx` (extend), `__tests__/memoryTrendsScreen.test.tsx` (extend)

**Interfaces:**
- Consumes: `controller.fingerprintLeadSignals: string[]`, `controller.fingerprintFacets: DreamFingerprintFacet[]`, and the fingerprint copy keys `copy.fingerprintTitle` / `fingerprintDescription` / `fingerprintLeadLabel` / `fingerprintEmpty` (already used at the `StatsScreen` call site for `StatsOverviewSections`; confirm names).
- Produces: nothing new.

- [ ] **Step 1: Write / extend the tests**

`memoryLandingShape.test.tsx`: add facets to the controller mock and assert the fingerprint title renders on the landing:
```tsx
// controller mock: fingerprintFacets: [{ key: 'theme', label: 'THEME', value: 'Kaleidoscope', meta: '50 dreams', onPress: () => {} }],
it('shows the dream fingerprint on the landing', async () => {
  const { queryByText } = await renderScreen();
  expect(queryByText(copy.fingerprintTitle)).not.toBeNull();
});
```
`memoryTrendsScreen.test.tsx`: assert the fingerprint is **no longer** on the Trends screen:
```tsx
expect(queryByText(copy.fingerprintTitle)).toBeNull();
```

- [ ] **Step 2: Run, expect failure**

```bash
npx jest --ci --watchAll=false memoryLandingShape memoryTrendsScreen
```
Expected: landing test FAILs (no fingerprint yet), trends test still PASSes for now (it is still there).

- [ ] **Step 3: Remove the fingerprint block from `StatsOverviewSections.tsx`**

Delete the first child — the `<Animated.View layout={statsLayoutTransition}><Card style={styles.sectionCard}><DreamFingerprintCard .../></Card></Animated.View>` block (it is the opening block of the returned fragment). Remove the now-unused `DreamFingerprintCard` import if nothing else in the file uses it (the `DreamFingerprintFacet` type import is still needed for the props type — keep that). Leave the `fingerprintLeadSignals` / `fingerprintFacets` props in place (unused now; Phase 4 trims them) so `MemoryTrendsScreen`'s call site does not need editing this task.

- [ ] **Step 4: Render `DreamFingerprintCard` on the landing**

In `StatsScreen.tsx`, after block 1 (the pattern/nudge card) and before the link rows, add:
```tsx
<Card style={styles.sectionCard}>
  <DreamFingerprintCard
    title={copy.fingerprintTitle}
    description={copy.fingerprintDescription}
    leadLabel={copy.fingerprintLeadLabel}
    leadSignals={controller.fingerprintLeadSignals}
    emptyLabel={copy.fingerprintEmpty}
    facets={controller.fingerprintFacets}
  />
</Card>
```
Add the import `import { DreamFingerprintCard } from '../components/DreamFingerprintCard';` and `Card` is already imported. Copy the prop names verbatim from the pre-Task-3 `StatsOverviewSections` call site (they were passed through as `copy.fingerprint*`).

- [ ] **Step 5: Run tests, expect pass; full gates; commit**

```bash
npx jest --ci --watchAll=false memoryLandingShape memoryTrendsScreen
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
git add -A
git commit -m "refactor: Memory block 2 — dream fingerprint on the landing, off the Trends screen"
```

---

## Task 4: Block 3 — "pick back up" on the landing

Move the review-shelf preview (the `hasReviewShelf` block in `StatsOverviewSections`) onto the landing: a header + one preview row + a "Show all" affordance → `ReviewWorkspace`. Remove it from `StatsOverviewSections`.

**Files:**
- Modify: `src/features/stats/screens/StatsScreen.tsx`
- Modify: `src/features/stats/components/StatsOverviewSections.tsx` (remove the review-shelf block and its `reviewWorkspacePreview` computation)
- Create: `src/features/stats/components/MemoryPickBackUpCard.tsx`
- Test: `__tests__/memoryLandingShape.test.tsx` (extend)

**Interfaces:**
- Consumes: `controller.workQueueItems`, `controller.importantDreamItems`, `controller.savedSetItems` (arrays; shapes as in `StatsOverviewSections`' current props type).
- Produces: `MemoryPickBackUpCard` — props `{ copy, workQueueItems, importantDreamItems, savedSetItems, onOpenReviewWorkspace, onOpenDream }`. Renders nothing when all three arrays are empty.

- [ ] **Step 1: Write the failing test**

`memoryLandingShape.test.tsx`: add `workQueueItems: [{ dreamId: 'w1', dreamTitle: 'Bridge', reason: 'No reflection yet', badgeLabel: 'Draft', actionLabel: 'Open', focusSection: 'reflection', icon: 'create-outline' }]` to the controller mock and:
```tsx
it('shows a pick-back-up row that opens the dream', async () => {
  const { getByText } = await renderScreen();
  expect(getByText('Bridge')).toBeTruthy();
  fireEvent.press(getByText('Bridge'));
  expect(mockNavigate).toHaveBeenCalledWith('DreamDetail', expect.objectContaining({ dreamId: 'w1' }));
});
```

- [ ] **Step 2: Run, expect failure**

```bash
npx jest --ci --watchAll=false memoryLandingShape
```

- [ ] **Step 3: Build `MemoryPickBackUpCard`**

Lift the `hasReviewShelf` JSX out of `StatsOverviewSections` (the `<Card>` block containing `copy.reviewShelfTitle`, the `reviewWorkspacePreview` row, and the "Open review" `Pressable`). Use `useStyles(createStatsScreenStyles)`. The preview row picks `workQueueItems[0]` then `importantDreamItems[0]` then `savedSetItems[0]` (the same fallback order the current `reviewWorkspacePreview` uses). Tapping the row → `onOpenDream(item.dreamId)` for a work-queue/important item; the "Show all" button → `onOpenReviewWorkspace()`.

- [ ] **Step 4: Remove the block from `StatsOverviewSections.tsx`**

Delete the `hasReviewShelf` const, the `reviewWorkspacePreview` const, and the `{hasReviewShelf ? ( ... ) : null}` block inside the final `<Card>`. That `<Card>` also wraps the (already `alwaysExpanded`-gated) detail toggle + content — keep those. `onOpenReviewWorkspace` / `workQueueItems` / `importantDreamItems` / `savedSetItems` props are now unused in this file — leave them in the props type (Phase 4), or delete and update the two call sites (`MemoryTrendsScreen`, and `StatsScreen` no longer renders it). Prefer leaving them to keep this task's diff contained; note for Phase 4.

- [ ] **Step 5: Render `MemoryPickBackUpCard` on the landing**

In `StatsScreen.tsx`, after block 2 (fingerprint) and before the link rows:
```tsx
<MemoryPickBackUpCard
  copy={copy}
  workQueueItems={controller.workQueueItems}
  importantDreamItems={controller.importantDreamItems}
  savedSetItems={controller.savedSetItems}
  onOpenReviewWorkspace={() =>
    navigation.navigate(ROOT_ROUTE_NAMES.ReviewWorkspace)
  }
  onOpenDream={dreamId =>
    navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId, source: 'stats' })
  }
/>
```

- [ ] **Step 6: Run tests, full gates, commit**

```bash
npx jest --ci --watchAll=false memoryLandingShape memoryTrendsScreen statsScreenTrendsLink
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
git add -A
git commit -m "refactor: Memory block 3 — pick-back-up rows on the landing"
```

---

## Task 5: Manual verification and merge

- [ ] **Step 1: Sim check at the `deep` stage**

Start Metro, launch the app on the booted simulator (it has 250 seeded dreams from the Phase 2 check), open the Memory tab. Confirm the landing, top to bottom:
1. One card — the confirmed-pattern card if there is one, else the revisit nudge — never two.
2. The dream-fingerprint card (theme/symbol tiles tappable → PatternDetail).
3. A "pick back up" card with 1–3 rows (skipped if the shelf is empty).
4. Link rows: Recurring, Monthly, Trends & numbers, plus the existing Dream-practice row.
No Section tabs, no Range chips, no inline charts. Tap Monthly → MonthlyReport; tap Trends → MemoryTrends (unchanged); tap a fingerprint tile → PatternDetail.

- [ ] **Step 2: Stop Metro / sim app**

- [ ] **Step 3: Merge**

```bash
git checkout main && git merge --no-ff <branch> -m "Merge: strip the Memory landing to three blocks (Memory IA phase 3)" && git branch -d <branch> && git push origin main
```

---

## Deferred to Phase 4

- The unused `MemoryMode` type / `selectedMemoryMode` param plumbing through `useStatsScreenController` and `useStatsDerivedContent` (and the `isThreadsMode` / `isMonthlyMode` flags into the three content hooks).
- The now-unused `StatsOverviewSections` props (`fingerprintLeadSignals`, `fingerprintFacets`, `workQueueItems`, `importantDreamItems`, `savedSetItems`, `onOpenReviewWorkspace`).
- Making the Dream-practice link row conditional on the user having ≥1 lucid or nightmare dream.
- Any copy keys orphaned by this phase (`memoryModeLabel`, `overviewNextStep*`, `rangeLabel` if the Trends screen is the only consumer left — grep each).

## Self-review notes

- **Spec coverage:** three-blocks landing → Tasks 2 (block 1), 3 (block 2), 4 (block 3); Section/Range removal → Task 1; link rows → Task 1 (Recurring/Monthly/Trends) + existing Practice row. The nudge/pattern consolidation and "Next step" removal → Task 2 (+ Task 1 deletes the hero block that held "Next step").
- **Risk note:** the `PatternDetail` route may require a `signal` param (Task 1 step 6 flags this). If so, the Recurring row is dropped for the phase and picked up in Phase 4 — the fingerprint tiles (Task 3) still provide a real path into `PatternDetail`.
- **Type consistency:** `MemoryRevisitNudgeCard` / `MemoryPickBackUpCard` prop names are defined in their task's Interfaces block and used unchanged at the `StatsScreen` call sites. `controller.memoryNudge` field names are marked "confirm at implementation time" — do that against `useStatsScreenController`'s return before writing Task 2.
