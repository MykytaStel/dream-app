# Memory IA — Phases 1 & 2 Implementation Plan

> **Status (2026-09-06): DONE.** Task 1 merged `a26b44d`; Tasks 2–4 merged `3c0a023`.
> Full gate suite green (tsc / eslint / prettier / jest 1093). Task 4 sim-verified
> at the `deep` disclosure stage. Phases 3–4 get their own plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unreachable `Progress` screen, and stand up a new `MemoryTrends` sub-screen that holds the analytics dashboard currently buried behind a double-nested toggle on the Memory tab.

**Architecture:** No data-model changes. Phase 1 is a pure deletion (screen + route + copy). Phase 2 adds one `alwaysExpanded` prop to the existing `StatsOverviewSections` component so its inner disclosure can render flat, then mounts that component on a new `MemoryTrendsScreen` that reuses `useStatsScreenController` (the same way `ReviewWorkspaceScreen` already does), and swaps the Memory tab's "Detailed analysis" toggle for a link row to the new screen.

**Tech Stack:** React Native 0.86, `@react-navigation/native-stack`, `@shopify/restyle`, Restyle `useStyles` theme factory, `react-native-reanimated`, jest 29 + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-09-06-memory-ia-design.md` (Phases 1 and 2 of its "Phasing" section).

## Global Constraints

- **Node for all gate commands:** `export PATH="/Users/mykyta/.nvm/versions/node/v20.19.4/bin:$PATH"` — the default node is v16 and fails eslint/jest.
- **Gates (all must pass before every commit that ends a task):**
  - `npx tsc --noEmit`
  - `npx eslint . --max-warnings=0`
  - `npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}"`
  - `npx jest --ci --watchAll=false`
- **No raw hex colour literals** in `src/features/**`, `src/components/**`, `src/services/**` — `__tests__/themeTokens.test.ts` bans them. Use `theme.colors.*` via a `useStyles(create*Styles)` factory. `'transparent'` is allowed.
- **Styles:** one style module per screen named `<Screen>.styles.ts` exporting `create<Screen>Styles(theme)`; consumed via `const styles = useStyles(create<Screen>Styles)`. Never prop-drill a style sheet.
- **Copy** lives in `src/constants/copy/stats/en.ts` (`STATS_COPY_EN` object, `StatsCopy = typeof STATS_COPY_EN`) and `src/constants/copy/stats/uk.ts` (`STATS_COPY_UK: StatsCopy = { ...STATS_COPY_EN, <overrides> }`). Every key must resolve in both locales. Adding a key → add to `en.ts` and add a `uk.ts` override. Removing a key → remove from `en.ts` **and** its `uk.ts` override if present.
- **Git workflow:** work on a `feature/*` branch off `main`; run the full gate suite; `git merge --no-ff` into `main`; `git branch -d` the feature branch; `git push origin main`. One branch per phase.
- **Commit messages:** no `Co-Authored-By` or any AI-attribution trailer, anywhere.
- **Do not touch** `src/features/stats/model/*`, `src/features/stats/hooks/useStatsDerivedContent.ts`, `useStatsCatalogState.ts` — the derivation logic is out of scope. The only permitted hook change in these phases is deleting nothing and adding nothing to them.

---

## Phase 1 — Remove the dead `Progress` route

`ProgressScreen` has been unreachable since the "Progress" card was removed from the Memory tab (`MemoryProgressiveDisclosure.tsx` line ~135 comment: *"The ProgressScreen and route still exist but are no longer reachable from the main flow."*). `docs/PRODUCT.md` §"not a habit tracker" is the reason it should go rather than be re-linked.

### Task 1: Delete `ProgressScreen`, its route, and its exclusive copy

**Files:**
- Delete: `src/features/stats/screens/ProgressScreen.tsx`
- Delete: `src/features/stats/screens/ProgressScreen.styles.ts`
- Modify: `src/app/navigation/routes.ts` (remove `Progress: 'Progress',` from `ROOT_ROUTE_NAMES`; remove `[ROOT_ROUTE_NAMES.Progress]: undefined;` from `RootStackParamList`)
- Modify: `src/app/navigation/RootNavigator.tsx` (remove `import ProgressScreen from '../../features/stats/screens/ProgressScreen';` and the `<Stack.Screen name={ROOT_ROUTE_NAMES.Progress} ... />` block)
- Modify: `src/constants/copy/stats/en.ts` and `src/constants/copy/stats/uk.ts` (remove the Progress-exclusive keys — list below, each verified individually)
- Test: no new test file; the gate suite plus a fresh grep is the check.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks rely on. `ROOT_ROUTE_NAMES.Progress` ceases to exist — any later reference is a compile error.

- [ ] **Step 1: Confirm the route is unreachable**

Run:
```bash
grep -rn "ROOT_ROUTE_NAMES.Progress\|navigate('Progress'\|navigate(\"Progress\"\|ProgressScreen" src --include="*.ts" --include="*.tsx"
```
Expected: matches only in `src/app/navigation/routes.ts`, `src/app/navigation/RootNavigator.tsx`, and `src/features/stats/screens/ProgressScreen.tsx` / `ProgressScreen.styles.ts`. If any **other** file navigates to it, stop and report — the spec's premise is wrong.

- [ ] **Step 2: Check the test suite for `Progress` references**

Run:
```bash
grep -rn "Progress" __tests__ | grep -viE "onProgress|transcriptionProgress|InProgress|playbackProgress|progressRatio"
```
Expected: no navigation/route references to the `Progress` screen. `__tests__/achievements.test.ts` and `__tests__/streakMilestoneConsistency.test.ts` test `src/features/stats/model/achievements.ts` directly (not via the screen) and stay untouched. Record what you find; if a test renders `ProgressScreen` or asserts the route exists, it must be deleted in this task.

- [ ] **Step 3: Delete the screen files**

```bash
git rm src/features/stats/screens/ProgressScreen.tsx src/features/stats/screens/ProgressScreen.styles.ts
```

- [ ] **Step 4: Remove the route from `routes.ts`**

In `src/app/navigation/routes.ts`, delete the line `  Progress: 'Progress',` from the `ROOT_ROUTE_NAMES` object, and delete the line `  [ROOT_ROUTE_NAMES.Progress]: undefined;` from the `RootStackParamList` type.

- [ ] **Step 5: Remove the screen from `RootNavigator.tsx`**

In `src/app/navigation/RootNavigator.tsx`, delete the import line:
```tsx
import ProgressScreen from '../../features/stats/screens/ProgressScreen';
```
and the registration block:
```tsx
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.Progress}
          component={ProgressScreen}
          options={{
            headerShown: true,
            title: 'Progress',
          }}
        />
```

- [ ] **Step 6: Identify the Progress-exclusive copy keys**

For each candidate key below, run `grep -rn "<key>" src --include="*.ts" --include="*.tsx" | grep -v "src/constants/copy/"`. Delete the key from `en.ts` and its `uk.ts` override **only if** that grep returns nothing (i.e. `ProgressScreen.tsx` was its sole consumer and it is now deleted).

Candidates (from `ProgressScreen.tsx`'s `copy.*` reads):
`progressScreenTitle`, `progressScreenSubtitle`, `progressLoadingTitle`, `progressLoadingDescription`, `progressFocusTitle`, `progressFocusDoneTitle`, `progressFocusDoneDescription`, `weeklyGoalTitle`, `weeklyGoalStatusDone`, `weeklyGoalStatusPending`, `milestonesUnlockedLabel`, `milestonesCompleteTitle`, `milestoneInProgress`, `milestonesTitle`, `milestonesDescription`, `milestoneUnlocked`, `milestoneProgressLabel`.

**Keep** any key still referenced by `src/features/stats/model/statsScreenModel.ts` (`getAchievementContent`), `src/features/stats/components/StreakMilestoneToast.tsx`, or `src/features/dreams/screens/NewDreamScreen.tsx` — those paths are live.

- [ ] **Step 7: Delete the confirmed-dead keys**

Remove each confirmed key from `src/constants/copy/stats/en.ts`, then remove the matching override lines (if any) from `src/constants/copy/stats/uk.ts`. Keep the two objects key-aligned.

- [ ] **Step 8: Run the gates**

```bash
export PATH="/Users/mykyta/.nvm/versions/node/v20.19.4/bin:$PATH"
npx tsc --noEmit
npx eslint . --max-warnings=0
npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}"
npx jest --ci --watchAll=false
```
Expected: all green. `tsc` is the real check here — a missed `ROOT_ROUTE_NAMES.Progress` consumer or a still-referenced deleted copy key fails compilation.

- [ ] **Step 9: Grep once more for stragglers**

```bash
grep -rn "Progress" src/features/stats src/app/navigation | grep -viE "onProgress|InProgress|progressRatio|highlightedProgress"
```
Expected: no `ProgressScreen` / `ROOT_ROUTE_NAMES.Progress` matches remain.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: remove the unreachable Progress screen and route"
```

- [ ] **Step 11: Merge and push**

```bash
git checkout main && git merge --no-ff <branch> -m "Merge: remove dead Progress route" && git branch -d <branch> && git push origin main
```

---

## Phase 2 — `MemoryTrends` screen

The Memory tab today renders `StatsOverviewSections` behind an outer `MemoryDetailsToggle`, and that component contains a **second** identically-labelled toggle. Phase 2 moves the whole component to a dedicated screen (`MemoryTrends`), renders it flat (no toggles), and replaces the outer toggle on the Memory tab with a link row. The Memory tab is still busy after this phase — that is Phase 3's job — but the double-nested disclosure is gone and every chart is one tap away.

### Task 2: Add an `alwaysExpanded` prop to `StatsOverviewSections`

Make the component's inner disclosure optional. When `alwaysExpanded` is `true`, the compare/activity/snapshot/coverage/attention block renders unconditionally and the toggle `Pressable` is not rendered. When the prop is absent, behaviour is exactly as today.

**Files:**
- Modify: `src/features/stats/components/StatsOverviewSections.tsx`
- Test: `__tests__/statsOverviewSectionsDisclosure.test.tsx` (new)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `StatsOverviewSections` gains an optional prop `alwaysExpanded?: boolean`. `isDetailsExpanded` and `onToggleDetails` become optional (`isDetailsExpanded?: boolean`, `onToggleDetails?: () => void`) — when `alwaysExpanded` is set, callers may omit them.

- [ ] **Step 1: Write the failing test**

Create `__tests__/statsOverviewSectionsDisclosure.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { theme } from '../src/theme/theme';
import { StatsOverviewSections } from '../src/features/stats/components/StatsOverviewSections';
import { getStatsCopy } from '../src/constants/copy/stats';
import { createStatsScreenStyles } from '../src/features/stats/screens/StatsScreen.styles';

const copy = getStatsCopy('en');
const styles = createStatsScreenStyles(theme);

const baseProps = {
  copy,
  styles,
  fingerprintLeadSignals: [],
  fingerprintFacets: [],
  selectedMode: 'snapshot' as const,
  onSelectMode: () => {},
  canCompare: false,
  selectedRangeLabel: copy.rangeAll,
  compareOptions: [],
  compareMetrics: [],
  activityBars: [],
  emotionalTrendSeries: [],
  emotionalTrendInsight: '',
  lucidMetrics: [],
  lucidHistoryItems: [],
  nightmareMetrics: [],
  lucidProgressTitle: 'Lucid progress',
  lucidProgressDescription: '',
  nightmareRecoveryTitle: 'Nightmare recovery',
  nightmareRecoveryDescription: '',
  weeklyPatternCards: [],
  summaryTiles: [{ label: 'Total', value: 7 }],
  coverageItems: [],
  attentionItems: [],
  workQueueItems: [],
  importantDreamItems: [],
  savedSetItems: [],
  onOpenReviewWorkspace: () => {},
  onOpenLucidDream: () => {},
  onOpenPatternDetail: () => {},
};

function wrap(node: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);
}

describe('StatsOverviewSections disclosure', () => {
  it('hides the inner toggle and shows the snapshot content when alwaysExpanded', () => {
    const { queryByText } = wrap(
      <StatsOverviewSections {...baseProps} alwaysExpanded />,
    );
    // The toggle label (copy.detailsShow / copy.detailsHide) must be gone.
    expect(queryByText(copy.detailsShow)).toBeNull();
    expect(queryByText(copy.detailsHide)).toBeNull();
    // The snapshot section header renders because content is unconditional.
    expect(queryByText(copy.snapshotTitle)).not.toBeNull();
  });

  it('still renders the toggle and respects isDetailsExpanded when alwaysExpanded is absent', () => {
    const { queryByText, rerender } = wrap(
      <StatsOverviewSections
        {...baseProps}
        isDetailsExpanded={false}
        onToggleDetails={() => {}}
      />,
    );
    expect(queryByText(copy.detailsShow)).not.toBeNull();
    expect(queryByText(copy.snapshotTitle)).toBeNull();

    rerender(
      <ThemeProvider theme={theme}>
        <StatsOverviewSections
          {...baseProps}
          isDetailsExpanded
          onToggleDetails={() => {}}
        />
      </ThemeProvider>,
    );
    expect(queryByText(copy.snapshotTitle)).not.toBeNull();
  });
});
```

> Note: verify `copy.snapshotTitle`, `copy.detailsShow`, `copy.detailsHide` are the real key names in `src/constants/copy/stats/en.ts` before running — `StatsOverviewSections.tsx` currently reads `copy.detailsShow` / `copy.detailsHide` at line ~394 and `copy.snapshotTitle` at line ~530. If a key differs, match the source.

- [ ] **Step 2: Run the test, expect failure**

```bash
export PATH="/Users/mykyta/.nvm/versions/node/v20.19.4/bin:$PATH"
npx jest --ci --watchAll=false statsOverviewSectionsDisclosure
```
Expected: FAIL — `alwaysExpanded` is not a prop yet, so the toggle still renders and `snapshotTitle` is absent in the first test.

- [ ] **Step 3: Add the prop**

In `src/features/stats/components/StatsOverviewSections.tsx`:

1. In the props destructure (the `}: {` object around line 62) add `alwaysExpanded,` near `isDetailsExpanded,`.
2. In the prop **type** block, change:
   ```ts
   isDetailsExpanded: boolean;
   onToggleDetails: () => void;
   ```
   to:
   ```ts
   isDetailsExpanded?: boolean;
   onToggleDetails?: () => void;
   alwaysExpanded?: boolean;
   ```
3. Just inside the function body, before the `return`, add:
   ```ts
   const showDetailBlock = alwaysExpanded || isDetailsExpanded;
   ```
4. Replace the toggle `Pressable` (the `<Pressable ... style={styles.detailsToggleRow} onPress={onToggleDetails}>...</Pressable>` block, ~line 381–402) with:
   ```tsx
   {alwaysExpanded ? null : (
     <Pressable
       accessibilityRole="button"
       style={styles.detailsToggleRow}
       onPress={onToggleDetails}
     >
       <View style={styles.detailsToggleCopy}>
         <Text style={styles.detailsToggleTitle}>{copy.detailsTitle}</Text>
         <Text style={styles.detailsToggleDescription}>
           {copy.detailsDescription}
         </Text>
       </View>
       <View style={styles.detailsTogglePill}>
         <Text style={styles.detailsTogglePillText}>
           {isDetailsExpanded ? copy.detailsHide : copy.detailsShow}
         </Text>
         <Ionicons
           name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
           size={14}
           color={t.colors.text}
         />
       </View>
     </Pressable>
   )}
   ```
5. Change the `{isDetailsExpanded ? (` that guards the `<Animated.View ... style={styles.detailsSectionContent}>` block (~line 404) to `{showDetailBlock ? (`.

- [ ] **Step 4: Run the test, expect pass**

```bash
npx jest --ci --watchAll=false statsOverviewSectionsDisclosure
```
Expected: PASS both cases.

- [ ] **Step 5: Full gates**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
```
Expected: green. `StatsScreen.tsx` still passes `isDetailsExpanded`/`onToggleDetails` and no `alwaysExpanded`, so its behaviour is unchanged.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: optional flat rendering for StatsOverviewSections"
```

### Task 3: `MemoryTrends` route and screen

**Files:**
- Create: `src/features/stats/screens/MemoryTrendsScreen.tsx`
- Create: `src/features/stats/screens/MemoryTrendsScreen.styles.ts`
- Modify: `src/app/navigation/routes.ts` (add `MemoryTrends: 'MemoryTrends',` to `ROOT_ROUTE_NAMES`; add `[ROOT_ROUTE_NAMES.MemoryTrends]: undefined;` to `RootStackParamList`)
- Modify: `src/app/navigation/RootNavigator.tsx` (import + register the screen)
- Modify: `src/constants/copy/stats/en.ts` + `uk.ts` (add `memoryTrendsTitle`, `memoryTrendsSubtitle`)
- Test: `__tests__/memoryTrendsScreen.test.tsx` (new)

**Interfaces:**
- Consumes: `StatsOverviewSections` with `alwaysExpanded` (Task 2).
- Produces: `ROOT_ROUTE_NAMES.MemoryTrends` (string `'MemoryTrends'`, `undefined` params). Default-exported `MemoryTrendsScreen` React component, no props.

- [ ] **Step 1: Add the copy keys**

In `src/constants/copy/stats/en.ts`, inside `STATS_COPY_EN`, add near the other `memory*` keys:
```ts
  memoryTrendsTitle: 'Trends & numbers',
  memoryTrendsSubtitle:
    'Charts, comparisons and counts from your local dream archive.',
```
In `src/constants/copy/stats/uk.ts`, inside the `STATS_COPY_UK` override object, add:
```ts
  memoryTrendsTitle: 'Тренди й цифри',
  memoryTrendsSubtitle: 'Графіки, порівняння й підрахунки з локального архіву снів.',
```

- [ ] **Step 2: Add the route**

In `src/app/navigation/routes.ts`: add `  MemoryTrends: 'MemoryTrends',` to `ROOT_ROUTE_NAMES` (near `ReviewWorkspace`), and `  [ROOT_ROUTE_NAMES.MemoryTrends]: undefined;` to `RootStackParamList` (near the `ReviewWorkspace` entry).

- [ ] **Step 3: Write the styles module**

Create `src/features/stats/screens/MemoryTrendsScreen.styles.ts`:
```ts
import { StyleSheet } from 'react-native';
import type { Theme } from '../../../theme/theme';

export function createMemoryTrendsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 6,
      backgroundColor: theme.colors.surfaceElevated,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    rangeLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    rangeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    rangeChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    rangeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}22`,
    },
    rangeChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    rangeChipTextActive: {
      color: theme.colors.text,
    },
  });
}
```
> If `theme.colors.surfaceElevated` / `border` / `primary` / `textDim` are not on the theme, use the names that `MemoryProgressiveDisclosure.tsx`'s `createStyles` uses (it references `surfaceElevated`, `border`, `accent`, `background`). Match existing usage; do not invent tokens and do not use hex.

- [ ] **Step 4: Write the failing test**

Create `__tests__/memoryTrendsScreen.test.tsx`:
```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MemoryTrendsScreen from '../src/features/stats/screens/MemoryTrendsScreen';
import { getStatsCopy } from '../src/constants/copy/stats';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: (cb: () => void) => cb(),
}));

const copy = getStatsCopy('en');

describe('MemoryTrendsScreen', () => {
  it('renders the trend content flat, with a range control and no disclosure toggle', async () => {
    const { queryByText } = render(<MemoryTrendsScreen />);
    await waitFor(() => {
      expect(queryByText(copy.rangeLabel)).not.toBeNull();
    });
    // No "Show details" / "Hide details" toggle on this screen.
    expect(queryByText(copy.detailsShow)).toBeNull();
    expect(queryByText(copy.detailsHide)).toBeNull();
  });
});
```
> This test renders a real screen that reads from the dream repository via `useStatsScreenController` → `useStatsCatalogState`. If the repository read needs jest mocks that other stats-screen tests already set up, copy that setup from `__tests__/statsReviewShelf.test.ts` or `__tests__/statsWorkQueue.test.ts`. Prefer matching an existing stats-screen test's harness over inventing one.

- [ ] **Step 5: Run the test, expect failure**

```bash
npx jest --ci --watchAll=false memoryTrendsScreen
```
Expected: FAIL — `MemoryTrendsScreen` does not exist.

- [ ] **Step 6: Write the screen**

Create `src/features/stats/screens/MemoryTrendsScreen.tsx`. Model it on `ReviewWorkspaceScreen.tsx` — same controller call, same loading/error guards, same `ScreenContainer`.

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { getPracticeCopy } from '../../../constants/copy/practice';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { Theme } from '../../../theme/theme';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { createMemoryTrendsScreenStyles } from './MemoryTrendsScreen.styles';
import { useStyles } from '../../../theme/useStyles';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStatsScreenController } from '../hooks/useStatsScreenController';
import { StatsOverviewSections } from '../components/StatsOverviewSections';

export default function MemoryTrendsScreen() {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const styles = useStyles(createStatsScreenStyles);
  const localStyles = useStyles(createMemoryTrendsScreenStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const openPatternDetail = React.useCallback(
    (signal: string, kind: PatternDetailKind) => {
      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, { signal, kind });
    },
    [navigation],
  );

  const controller = useStatsScreenController({
    locale,
    copy,
    dreamCopy,
    selectedMemoryMode: 'overview',
    openPatternDetail,
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: copy.memoryTrendsTitle });
  }, [copy.memoryTrendsTitle, navigation]);

  if (controller.loading) {
    return (
      <ScreenContainer scroll={false} withTopInset={false}>
        <ScreenStateCard
          variant="loading"
          title={copy.memoryTrendsTitle}
          subtitle={copy.memoryTrendsSubtitle}
        />
      </ScreenContainer>
    );
  }

  if (controller.loadError) {
    return (
      <ScreenContainer scroll={false} withTopInset={false}>
        <ScreenStateCard
          variant="error"
          title={dreamCopy.timelineErrorTitle}
          subtitle={dreamCopy.timelineErrorDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Card style={localStyles.heroCard}>
        <Text style={localStyles.heroSubtitle}>{copy.memoryTrendsSubtitle}</Text>
        <View>
          <Text style={localStyles.rangeLabel}>{copy.rangeLabel}</Text>
          <View style={localStyles.rangeRow}>
            {controller.rangeOptions.map(option => {
              const active = controller.selectedRange === option.key;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option.key}
                  onPress={() => controller.setSelectedRange(option.key)}
                  style={[
                    localStyles.rangeChip,
                    active ? localStyles.rangeChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      localStyles.rangeChipText,
                      active ? localStyles.rangeChipTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <StatsOverviewSections
        alwaysExpanded
        copy={copy}
        styles={styles}
        fingerprintLeadSignals={controller.fingerprintLeadSignals}
        fingerprintFacets={controller.fingerprintFacets}
        selectedMode={controller.selectedMode}
        onSelectMode={controller.setSelectedMode}
        canCompare={controller.canCompare}
        selectedRangeLabel={controller.selectedRangeLabel}
        compareOptions={controller.compareOptions}
        compareMetrics={controller.compareMetrics}
        activityBars={controller.activityBars}
        emotionalTrendSeries={controller.emotionalTrendSeries}
        emotionalTrendInsight={controller.emotionalTrendInsight}
        lucidMetrics={controller.lucidMetrics}
        lucidHistoryItems={controller.lucidHistoryItems}
        nightmareMetrics={controller.nightmareMetrics}
        lucidProgressTitle={practiceCopy.statsLucidProgressTitle}
        lucidProgressDescription={practiceCopy.statsLucidProgressDescription}
        nightmareRecoveryTitle={practiceCopy.statsNightmareRecoveryTitle}
        nightmareRecoveryDescription={
          practiceCopy.statsNightmareRecoveryDescription
        }
        weeklyPatternCards={controller.weeklyPatternCards}
        summaryTiles={controller.summaryTiles}
        coverageItems={controller.coverageItems}
        attentionItems={controller.attentionItems}
        workQueueItems={controller.workQueueItems}
        importantDreamItems={controller.importantDreamItems}
        savedSetItems={controller.savedSetItems}
        onOpenReviewWorkspace={() =>
          navigation.navigate(ROOT_ROUTE_NAMES.ReviewWorkspace)
        }
        onOpenLucidDream={dreamId =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId,
            source: 'stats',
          })
        }
        onOpenPatternDetail={openPatternDetail}
      />
    </ScreenContainer>
  );
}
```
> The `<StatsOverviewSections>` prop list is copied verbatim from the current call site in `src/features/stats/screens/StatsScreen.tsx` (the block starting ~line 321), minus `isDetailsExpanded` / `onToggleDetails`, plus `alwaysExpanded`. If that call site's props have drifted by implementation time, diff against it and match.

- [ ] **Step 7: Register the screen in `RootNavigator.tsx`**

Add the import next to the other stats-screen imports:
```tsx
import MemoryTrendsScreen from '../../features/stats/screens/MemoryTrendsScreen';
```
Add the registration next to `ReviewWorkspace`'s `<Stack.Screen>`:
```tsx
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.MemoryTrends}
          component={MemoryTrendsScreen}
          options={{ headerShown: true, title: 'Trends & numbers' }}
        />
```

- [ ] **Step 8: Run the test, expect pass**

```bash
npx jest --ci --watchAll=false memoryTrendsScreen
```
Expected: PASS. If it fails on a missing repository mock, adopt the harness from `__tests__/statsWorkQueue.test.ts`.

- [ ] **Step 9: Full gates**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
```
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: MemoryTrends screen holding the analytics dashboard"
```

### Task 4: Swap the Memory tab's detail toggle for a `MemoryTrends` link

Remove the outer disclosure from `StatsScreen.tsx`: the `MemoryDetailsToggle`, the `isMemoryDetailsExpanded` state, and the conditional `<StatsOverviewSections>` / scoped-empty-state block that follows it. In their place, render one `SettingsActionRow` (variant `inline`) that navigates to `MemoryTrends`.

**Files:**
- Modify: `src/features/stats/screens/StatsScreen.tsx`
- Modify: `src/constants/copy/stats/en.ts` + `uk.ts` (add `memoryTrendsRowMeta`)
- Test: `__tests__/statsScreenTrendsLink.test.tsx` (new)

**Interfaces:**
- Consumes: `ROOT_ROUTE_NAMES.MemoryTrends` (Task 3).
- Produces: nothing later tasks in this plan rely on. (Phase 3 will rework this screen further.)

- [ ] **Step 1: Add the copy key**

`en.ts`: `  memoryTrendsRowMeta: 'Charts, comparisons and counts.',`
`uk.ts` override: `  memoryTrendsRowMeta: 'Графіки, порівняння й підрахунки.',`

- [ ] **Step 2: Write the failing test**

Create `__tests__/statsScreenTrendsLink.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import StatsScreen from '../src/features/stats/screens/StatsScreen';
import { getStatsCopy } from '../src/constants/copy/stats';

const navigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ setOptions: jest.fn(), navigate }),
  useFocusEffect: (cb: () => void) => cb(),
}));

const copy = getStatsCopy('en');

describe('StatsScreen → MemoryTrends link', () => {
  beforeEach(() => navigate.mockClear());

  it('shows a Trends row instead of a Detailed-analysis toggle and navigates to MemoryTrends', async () => {
    const { queryByText, getByText } = render(<StatsScreen />);
    await waitFor(() => {
      expect(queryByText(copy.memoryTrendsTitle)).not.toBeNull();
    });
    // The old inline dashboard toggle labels are gone from this screen.
    expect(queryByText(copy.detailsShow)).toBeNull();
    expect(queryByText(copy.detailsHide)).toBeNull();

    fireEvent.press(getByText(copy.memoryTrendsTitle));
    expect(navigate).toHaveBeenCalledWith('MemoryTrends');
  });
});
```
> Adopt whatever repository/analytics jest mocks the existing `__tests__/statsMemoryNudge.test.ts` uses so `StatsScreen` mounts at a disclosure stage where the row is visible. If reaching the `deep` stage in a test needs seeded dreams, follow that file's seeding approach.

- [ ] **Step 3: Run the test, expect failure**

```bash
npx jest --ci --watchAll=false statsScreenTrendsLink
```
Expected: FAIL — `copy.memoryTrendsTitle` is not rendered by `StatsScreen` yet.

- [ ] **Step 4: Edit `StatsScreen.tsx`**

1. Remove the state: delete
   ```tsx
   const [isMemoryDetailsExpanded, setIsMemoryDetailsExpanded] =
     React.useState(false);
   ```
2. In `handleSelectMemoryMode`, delete the `if (value !== 'overview') { setIsMemoryDetailsExpanded(false); }` lines (keep `setSelectedMemoryMode(value)`).
3. Remove the `MemoryDetailsToggle` import from the `MemoryProgressiveDisclosure` import block (keep `MemoryDisclosureCard`, `MemorySecondaryActions`).
4. Add to the routes import if not present: it already imports `ROOT_ROUTE_NAMES`. Add `SettingsActionRow`:
   ```tsx
   import { SettingsActionRow } from '../../settings/components/SettingsActionRow';
   ```
5. In the `selectedMemoryMode === 'overview'` fragment, replace the `<MemoryDetailsToggle ... />` element with:
   ```tsx
   <SettingsActionRow
     variant="inline"
     title={copy.memoryTrendsTitle}
     meta={copy.memoryTrendsRowMeta}
     onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.MemoryTrends)}
   />
   ```
6. Delete the entire block that renders the inline dashboard:
   ```tsx
   {selectedMemoryMode === 'overview' && isMemoryDetailsExpanded ? (
     shouldShowScopedEmptyState ? (
       <ScreenStateCard ... />
     ) : (
       <StatsOverviewSections ... />
     )
   ) : null}
   ```
   (the whole conditional, ~line 313–369).
7. Remove the now-unused `StatsOverviewSections` import from the `StatsScreenSections` import block (keep `StatsHeroSection`, `StatsMonthlySections`, `StatsThreadsSections`, `type MemoryMode`).
8. `shouldShowScopedEmptyState` is still used by the `selectedMemoryMode !== 'overview'` block below — leave it. If `tsc`/eslint now flags it unused, that means the other consumer also went; re-check before deleting.

- [ ] **Step 5: Run the test, expect pass**

```bash
npx jest --ci --watchAll=false statsScreenTrendsLink
```
Expected: PASS.

- [ ] **Step 6: Update the disclosure-order fix's expectations if needed**

Run:
```bash
grep -rn "isMemoryDetailsExpanded\|MemoryDetailsToggle\|StatsOverviewSections" __tests__ src/features/stats/screens/StatsScreen.tsx
```
Expected: no matches in `StatsScreen.tsx`; no test references the removed symbols. If a test does, update it to the new link-row structure.

- [ ] **Step 7: Full gates**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx prettier --check "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" && npx jest --ci --watchAll=false
```
Expected: green.

- [ ] **Step 8: Manual check on the simulator**

Build and run (per `dream-app-app-icons` memory / existing sim tooling). Seed ≥20 dreams to reach the `deep` stage (or use the dev preview-dream helper repeatedly / import a fixture). On the Memory tab: confirm there is a **"Trends & numbers"** row and **no** "Detailed analysis" expander. Tap it → the `MemoryTrends` screen opens with the charts, the range chips (7d/30d/all) work, and there is no nested toggle. Back out → Memory tab unchanged.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: Memory tab links to MemoryTrends instead of an inline dashboard"
```

- [ ] **Step 10: Merge and push**

```bash
git checkout main && git merge --no-ff <branch> -m "Merge: MemoryTrends screen (Memory IA phase 2)" && git branch -d <branch> && git push origin main
```

---

## Self-review notes (for the plan author, already done)

- **Spec coverage (Phases 1–2 only):** Progress deletion → Task 1. `MemoryTrends` screen + route → Task 3. Flatten the nested toggle → Task 2 (`alwaysExpanded`) applied in Task 3. Replace outer toggle with a link → Task 4. Phases 3–4 (strip the landing, consolidate cards, fold threads/monthly, conditional practice row, delete dead components) are **out of scope for this plan** — a separate plan after Phase 2 merges, per the owner's decision.
- **Deviation from spec, recorded:** the spec's Phase 2 parenthetical says the Trends screen carries "no review-shelf". This plan keeps the review-shelf inside `StatsOverviewSections` on the Trends screen for now, because Block 3 ("Pick back up") does not land on the Memory tab until Phase 3 — removing it in Phase 2 would leave the review shelf unreachable for a release. Phase 3's plan moves it from Trends → the Memory landing.
- **Type consistency:** `alwaysExpanded?: boolean` used identically in Task 2 (definition) and Task 3 (`<StatsOverviewSections alwaysExpanded ... />`). `ROOT_ROUTE_NAMES.MemoryTrends` → string `'MemoryTrends'`, asserted as `navigate('MemoryTrends')` in Task 4's test.
- **Achievements model:** `getDreamAchievements` / `getDreamAchievementSummary` / `getAchievementContent` become reachable only from `__tests__/achievements.test.ts` and `__tests__/streakMilestoneConsistency.test.ts` after Task 1. `getStreakMilestoneToast` (also in that model file) stays live via `NewDreamScreen`. Fully retiring the achievement machinery is a separate cleanup, not part of this plan.
