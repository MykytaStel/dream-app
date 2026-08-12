# Archive Screen Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Archive's main screen down to the product plan's minimal target —
header, search, List/Calendar toggle, entries count, entries — by removing the
comfortable/compact density toggle, the standalone "reset view" chip, and the
inline revisit card, none of which are in that target list.

**Architecture:** This is a deletion-heavy change across the files that make up
Archive's main-screen chrome: the row component (`ArchiveDreamRow.tsx`) loses its
compact rendering branch entirely; the controls panel (`ArchiveControlsPanel.tsx`)
loses three of its rendered blocks and the props that fed them; the state hook
(`useArchiveBrowseState.ts`) loses the state and derived values only those blocks
consumed; the screen (`ArchiveScreen.tsx`) stops threading the removed props;
`archiveBrowser.ts` loses the now-unused revisit-scoring function and its two
types; the styles file and the copy file lose the entries that only those removed
blocks referenced. Nothing about `ArchiveFilterSheet.tsx`, `ArchiveMonthPanel.tsx`,
or Home's own revisit card changes.

**Tech Stack:** React Native, TypeScript, `@shopify/restyle` theming, Jest +
`@testing-library/react-native`.

## Global Constraints

- The comfortable-mode rendering path in `ArchiveDreamRow.tsx` (everything
  outside the `if (isCompact) { ... }` block) is unchanged in behavior — only the
  compact branch, the `isCompact` conditionals inside slicing logic, and the
  `viewMode` prop are removed.
- `hasResettableView` and `resetArchiveView` in `useArchiveBrowseState.ts` are
  **not** removed — `resetArchiveView` is still called by the empty-state
  `ScreenStateCard`'s action in `ArchiveScreen.tsx` (`browse.hasResettableView` /
  `browse.resetArchiveView`, unrelated to the chip being removed). Only
  `hasHardReset` (a different, narrower flag with exactly one consumer: the
  removed chip) is removed.
- `ArchiveFilterSheet.tsx`, `ArchiveMonthPanel.tsx`, `HomeSpotlightSection.tsx`,
  and `getHomeRevisitCue`/`homeOverview.ts` are untouched by this plan.
- A handful of pre-existing, already-unused style keys and copy keys sit
  adjacent to the ones this plan removes (`revisitCard`, `revisitHeader`,
  `revisitLabel`, `revisitAction`, `revisitActionRow`, `revisitTitle`,
  `revisitReason` in the styles file; `rowDateChipTextCompact`,
  `compactStatusText` also in the styles file). These were unused before this
  plan and are out of scope — do not remove them, only remove the exact keys
  this plan names.
- Never add a `Co-Authored-By` trailer to any commit.

---

### Task 1: Remove the density toggle, reset chip, and revisit card from Archive's main screen

**Files:**
- Modify: `src/features/dreams/components/archive/ArchiveDreamRow.tsx`
- Modify: `src/features/dreams/components/archive/ArchiveControlsPanel.tsx`
- Modify: `src/features/dreams/hooks/useArchiveBrowseState.ts`
- Modify: `src/features/dreams/screens/ArchiveScreen.tsx`
- Modify: `src/features/dreams/model/archiveBrowser.ts`
- Modify: `src/features/dreams/screens/ArchiveScreen.styles.ts`
- Modify: `src/constants/copy/dreams.ts`
- Modify: `__tests__/useArchiveBrowseState.behaviour.test.tsx`

**Interfaces:**
- Consumes: nothing from another task — this is the only task in this plan.
- Produces: nothing consumed elsewhere — this is the final state of Archive's
  main screen for this plan.

This is one task despite touching many files: every file's change is driven by
the same three removals, and the hook's returned shape, the row's props, and the
screen's prop-threading all have to change together for the branch to compile at
the end of the task — splitting it would leave an intermediate state that
doesn't build.

- [ ] **Step 1: Remove the compact branch from `ArchiveDreamRow.tsx`**

Find the import block (currently lines 18-24):

```tsx
import {
  formatArchivePreview,
  getArchiveMatchReasonLabels,
  getArchiveMoodLabel,
  type ArchiveViewMode,
} from '../../model/archiveBrowser';
```

Replace with:

```tsx
import {
  formatArchivePreview,
  getArchiveMatchReasonLabels,
  getArchiveMoodLabel,
} from '../../model/archiveBrowser';
```

Find the props type (currently lines 238-247):

```tsx
type ArchiveDreamRowProps = {
  dream: Dream;
  copy: DreamCopy;
  searchQuery: string;
  locale: AppLocale;
  moodLabels: Record<Mood, string>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  viewMode: ArchiveViewMode;
};
```

Replace with:

```tsx
type ArchiveDreamRowProps = {
  dream: Dream;
  copy: DreamCopy;
  searchQuery: string;
  locale: AppLocale;
  moodLabels: Record<Mood, string>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createArchiveScreenStyles>;
};
```

Find the component's destructured props and the start of its body (currently
lines 249-292):

```tsx
export const ArchiveDreamRow = React.memo(function ArchiveDreamRow({
  dream,
  copy,
  searchQuery,
  locale,
  moodLabels,
  navigation,
  styles,
  viewMode,
}: ArchiveDreamRowProps) {
  const theme = useTheme<Theme>();
  const date = getDreamDate(dream);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const mood = getArchiveMoodLabel(dream.mood, moodLabels);
  const isCompact = viewMode === 'compact';
  const accentColor = getAccentColor(theme, dream);
  const signalChips = React.useMemo(
    () => buildSignalChips(dream, copy, mood).slice(0, isCompact ? 3 : 5),
    [copy, dream, isCompact, mood],
  );
  const matchReasons = React.useMemo(
    () =>
      getArchiveMatchReasonLabels(dream, searchQuery, copy).slice(
        0,
        isCompact ? 1 : 2,
      ),
    [copy, dream, isCompact, searchQuery],
  );
  const visibleTags = dream.tags.slice(0, isCompact ? 1 : 2);
  const hiddenTagCount = Math.max(0, dream.tags.length - visibleTags.length);
  const rowDateLabel = `${date.toLocaleDateString(localeKey, {
    month: 'short',
    day: 'numeric',
  })} · ${date.toLocaleDateString(localeKey, {
    weekday: 'short',
  })}`;
  const compactMonthLabel = date.toLocaleDateString(localeKey, {
    month: 'short',
  });
  const compactDayLabel = String(date.getDate());
  const preview = formatArchivePreview(dream, copy);
  const previewLabel = getPreviewLabel(dream, copy);
  const previewIcon = getPreviewIcon(dream);
```

Replace with:

```tsx
export const ArchiveDreamRow = React.memo(function ArchiveDreamRow({
  dream,
  copy,
  searchQuery,
  locale,
  moodLabels,
  navigation,
  styles,
}: ArchiveDreamRowProps) {
  const theme = useTheme<Theme>();
  const date = getDreamDate(dream);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const mood = getArchiveMoodLabel(dream.mood, moodLabels);
  const accentColor = getAccentColor(theme, dream);
  const signalChips = React.useMemo(
    () => buildSignalChips(dream, copy, mood).slice(0, 5),
    [copy, dream, mood],
  );
  const matchReasons = React.useMemo(
    () => getArchiveMatchReasonLabels(dream, searchQuery, copy).slice(0, 2),
    [copy, dream, searchQuery],
  );
  const visibleTags = dream.tags.slice(0, 2);
  const hiddenTagCount = Math.max(0, dream.tags.length - visibleTags.length);
  const rowDateLabel = `${date.toLocaleDateString(localeKey, {
    month: 'short',
    day: 'numeric',
  })} · ${date.toLocaleDateString(localeKey, {
    weekday: 'short',
  })}`;
  const preview = formatArchivePreview(dream, copy);
  const previewLabel = getPreviewLabel(dream, copy);
  const previewIcon = getPreviewIcon(dream);
```

Find the entire compact-branch block, from the `if (isCompact)` guard through
its closing brace (currently lines 293-413 — the block immediately before
`return (` for the comfortable layout):

```tsx
  if (isCompact) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId: dream.id,
          })
        }
        style={({ pressed }: { pressed: boolean }) => [
          styles.listRowPressable,
          pressed ? styles.listRowPressed : null,
        ]}
      >
        <Card
          style={[
            styles.listRowCard,
            styles.listRowCardCompact,
            styles.listRowCardVisual,
            { backgroundColor: `${accentColor}0A` },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.listRowGlow,
              { backgroundColor: `${accentColor}16` },
            ]}
          />
          <View
            pointerEvents="none"
            style={[styles.listRowAccentBar, { backgroundColor: accentColor }]}
          />

          <View
            style={[
              styles.compactDateBlock,
              {
                backgroundColor: `${accentColor}14`,
                borderColor: `${accentColor}30`,
              },
            ]}
          >
            <Text style={styles.compactDayLabel}>{compactDayLabel}</Text>
            <Text style={styles.compactMonthLabel}>{compactMonthLabel}</Text>
          </View>

          <View style={styles.compactContent}>
            <View style={styles.compactTitleRow}>
              <Text style={styles.rowTitleCompact} numberOfLines={1}>
                {dream.title || copy.untitled}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={theme.colors.textDim}
              />
            </View>

            <Text style={styles.compactDateMeta}>{rowDateLabel}</Text>

            {signalChips.length ? (
              <View style={styles.compactSignalRow}>
                {signalChips.map(chip => {
                  const tone = getSignalTone(theme, chip.tone);

                  return (
                    <View
                      key={`${dream.id}-${chip.key}`}
                      style={[
                        styles.compactSignalChip,
                        {
                          backgroundColor: tone.backgroundColor,
                          borderColor: tone.borderColor,
                        },
                      ]}
                    >
                      <Ionicons name={chip.icon} size={11} color={tone.color} />
                    </View>
                  );
                })}
                {matchReasons[0] ? (
                  <Text style={styles.compactMatchText} numberOfLines={1}>
                    {matchReasons[0]}
                  </Text>
                ) : null}
              </View>
            ) : matchReasons[0] ? (
              <Text style={styles.compactMatchText} numberOfLines={1}>
                {matchReasons[0]}
              </Text>
            ) : null}

            <Text style={styles.rowPreviewCompact} numberOfLines={2}>
              {preview}
            </Text>

            {visibleTags.length || hiddenTagCount ? (
              <View style={styles.compactTagRow}>
                {visibleTags.map(tag => (
                  <View
                    key={`${dream.id}-${tag}`}
                    style={styles.compactTagPill}
                  >
                    <Text style={styles.compactTagText}>{tag}</Text>
                  </View>
                ))}
                {hiddenTagCount ? (
                  <View style={styles.compactTagPill}>
                    <Text
                      style={styles.compactTagText}
                    >{`+${hiddenTagCount}`}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </Card>
      </Pressable>
    );
  }

```

Delete that entire block (from `if (isCompact) {` through the blank line after
its closing `}`), so the function goes directly from the `previewIcon`
computation into the comfortable-mode `return (` that already follows it. Do
not touch the comfortable-mode `return` block itself — it is unchanged.

- [ ] **Step 2: Remove the three blocks from `ArchiveControlsPanel.tsx`**

Find the `localStyles` `StyleSheet.create` block near the top of the file
(currently lines 26-39):

```tsx
const localStyles = StyleSheet.create({
  filterTrigger: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});
```

Replace with (drops `footerActions`, which becomes unused once the reset chip's
wrapping `View` is removed later in this step; `filterTrigger` stays — it's
still used by the Filters-sheet trigger chip below, untouched by this plan):

```tsx
const localStyles = StyleSheet.create({
  filterTrigger: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
```

Find the imports (currently lines 14-20):

```tsx
import {
  type ArchiveRevisitCue,
  type ArchiveViewMode,
} from '../../model/archiveBrowser';
import { type ArchiveSurfaceMode } from '../../model/archiveSurface';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';
import { ArchiveSegmentedControl } from './ArchiveSegmentedControl';
```

Replace with:

```tsx
import { type ArchiveSurfaceMode } from '../../model/archiveSurface';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';
import { ArchiveSegmentedControl } from './ArchiveSegmentedControl';
```

Find the props type (currently lines 41-65):

```tsx
type ArchiveControlsPanelProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  searchPlaceholder: string;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  isSearchPending: boolean;
  surfaceModes: ReadonlyArray<{
    key: ArchiveSurfaceMode;
    label: string;
  }>;
  surfaceMode: ArchiveSurfaceMode;
  onChangeSurfaceMode: (mode: ArchiveSurfaceMode) => void;
  filtersLabel: string;
  activeFilterCount: number;
  onOpenFilters: () => void;
  hasHardReset: boolean;
  onReset: () => void;
  visibleEntriesLabel: string;
  revisitCue: ArchiveRevisitCue | null;
  browseModes: ReadonlyArray<{ key: ArchiveViewMode; label: string }>;
  viewMode: ArchiveViewMode;
  onChangeViewMode: (mode: ArchiveViewMode) => void;
  onOpenRevisitDream: (dreamId: string) => void;
};
```

Replace with:

```tsx
type ArchiveControlsPanelProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  searchPlaceholder: string;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  isSearchPending: boolean;
  surfaceModes: ReadonlyArray<{
    key: ArchiveSurfaceMode;
    label: string;
  }>;
  surfaceMode: ArchiveSurfaceMode;
  onChangeSurfaceMode: (mode: ArchiveSurfaceMode) => void;
  filtersLabel: string;
  activeFilterCount: number;
  onOpenFilters: () => void;
  visibleEntriesLabel: string;
};
```

Find the component's destructured props (currently lines 67-88):

```tsx
export function ArchiveControlsPanel({
  copy,
  styles,
  searchPlaceholder,
  searchQuery,
  onChangeSearch,
  isSearchPending,
  surfaceModes,
  surfaceMode,
  onChangeSurfaceMode,
  filtersLabel,
  activeFilterCount,
  onOpenFilters,
  hasHardReset,
  onReset,
  visibleEntriesLabel,
  revisitCue,
  browseModes,
  viewMode,
  onChangeViewMode,
  onOpenRevisitDream,
}: ArchiveControlsPanelProps) {
```

Replace with:

```tsx
export function ArchiveControlsPanel({
  copy,
  styles,
  searchPlaceholder,
  searchQuery,
  onChangeSearch,
  isSearchPending,
  surfaceModes,
  surfaceMode,
  onChangeSurfaceMode,
  filtersLabel,
  activeFilterCount,
  onOpenFilters,
  visibleEntriesLabel,
}: ArchiveControlsPanelProps) {
```

Find the search `FormField` (currently lines 106-114):

```tsx
            <FormField
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={onChangeSearch}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.searchFieldContainer}
              inputStyle={styles.searchInput}
            />
```

Replace with (adds the native iOS clear-X; no-op prop on Android):

```tsx
            <FormField
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={onChangeSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              containerStyle={styles.searchFieldContainer}
              inputStyle={styles.searchInput}
            />
```

Find the footer row's action cluster (currently lines 151-171, the
`localStyles.footerActions` `View` and everything inside it):

```tsx
            <View style={localStyles.footerActions}>
              {hasHardReset ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.controlsActionChip}
                  onPress={onReset}
                >
                  <Text style={styles.controlsActionChipText}>
                    {copy.archiveResetView}
                  </Text>
                </Pressable>
              ) : null}

              {isSearchPending ? (
                <View style={styles.controlsMetaChip}>
                  <Text style={styles.controlsMetaChipText}>
                    {copy.timelineLoadingTitle}
                  </Text>
                </View>
              ) : null}
            </View>
```

Replace with (drops the reset chip, keeps the search-pending indicator):

```tsx
            {isSearchPending ? (
              <View style={styles.controlsMetaChip}>
                <Text style={styles.controlsMetaChipText}>
                  {copy.timelineLoadingTitle}
                </Text>
              </View>
            ) : null}
```

Find the results-toolbar block (currently lines 176-190):

```tsx
      <Animated.View
        entering={FadeInDown.delay(72).duration(220)}
        layout={archiveControlsLayoutTransition}
        style={styles.resultsToolbar}
      >
        <View style={styles.resultsToolbarMeta}>
          <Text style={styles.resultsToolbarText}>{visibleEntriesLabel}</Text>
        </View>
        <ArchiveSegmentedControl
          options={browseModes}
          value={viewMode}
          styles={styles}
          onChange={onChangeViewMode}
        />
      </Animated.View>
```

Replace with (drops the density toggle, keeps the count):

```tsx
      <Animated.View
        entering={FadeInDown.delay(72).duration(220)}
        layout={archiveControlsLayoutTransition}
        style={styles.resultsToolbar}
      >
        <View style={styles.resultsToolbarMeta}>
          <Text style={styles.resultsToolbarText}>{visibleEntriesLabel}</Text>
        </View>
      </Animated.View>
```

Find the inline revisit card block, from its opening condition through the
closing `</>` of the component (currently lines 192-236):

```tsx
      {revisitCue ? (
        <Animated.View
          entering={FadeInDown.delay(86).duration(220)}
          layout={archiveControlsLayoutTransition}
        >
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.revisitInlineCard,
              pressed ? styles.revisitCardPressed : null,
            ]}
            onPress={() => onOpenRevisitDream(revisitCue.dreamId)}
          >
            <View style={styles.revisitInlineMain}>
              <Text style={styles.revisitInlineLabel}>
                {copy.archiveRevisitLabel}
              </Text>
              <Text style={styles.revisitInlineTitle} numberOfLines={1}>
                {revisitCue.title}
              </Text>
            </View>

            <View style={styles.revisitInlineMeta}>
              <View style={styles.revisitBadge}>
                <Ionicons
                  name={revisitCue.icon}
                  size={12}
                  color={theme.colors.accent}
                />
                <Text style={styles.revisitBadgeText}>
                  {revisitCue.contextLabel}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.textDim}
              />
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
}
```

Replace with:

```tsx
    </>
  );
}
```

- [ ] **Step 3: Remove `viewMode`, `hasHardReset`, and `revisitCue` from `useArchiveBrowseState.ts`**

Find the import block (currently lines 11-25):

```ts
import {
  getArchiveRevisitCue,
  buildCalendarCells,
  buildCalendarRows,
  formatArchiveActiveDaysCount,
  formatArchiveEntryCount,
  getArchiveEmptyContent,
  getAvailableMonthKeys,
  getDistinctDayCount,
  getQuickJumpMonthKeys,
  getTopArchiveTags,
  type ArchiveFilter,
  type ArchiveTagSignal,
  type ArchiveViewMode,
} from '../model/archiveBrowser';
```

Replace with:

```ts
import {
  buildCalendarCells,
  buildCalendarRows,
  formatArchiveActiveDaysCount,
  formatArchiveEntryCount,
  getArchiveEmptyContent,
  getAvailableMonthKeys,
  getDistinctDayCount,
  getQuickJumpMonthKeys,
  getTopArchiveTags,
  type ArchiveFilter,
  type ArchiveTagSignal,
} from '../model/archiveBrowser';
```

Find the `viewMode` state declaration (currently lines 68-69):

```ts
  const [viewMode, setViewMode] =
    React.useState<ArchiveViewMode>('comfortable');
```

Delete these two lines entirely (no replacement).

Find the `revisitCue` memo (currently lines 143-146):

```ts
  const revisitCue = React.useMemo(
    () => getArchiveRevisitCue(visibleDreams, copy),
    [visibleDreams, copy],
  );

```

Delete this block entirely (no replacement).

Find the `browseModes` memo (currently lines 217-223):

```ts
  const browseModes = React.useMemo(
    () => [
      { key: 'comfortable' as const, label: copy.archiveBrowseComfortable },
      { key: 'compact' as const, label: copy.archiveBrowseCompact },
    ],
    [copy],
  );
```

Delete this block entirely (no replacement).

Find `hasHardReset`'s computation (currently lines 252-255):

```ts
  const hasHardReset =
    Boolean(searchQuery.trim()) ||
    Boolean(tagFilter) ||
    specialFilter !== 'all';
```

Delete these lines entirely (no replacement). Do **not** touch the
`hasResettableView` computation immediately above it (lines 247-251) — that one
stays, unchanged, because `ArchiveScreen.tsx`'s empty-state action still uses it.

Find the return object (currently lines 415-459). Remove exactly these four
lines from it: `viewMode,`, `setViewMode,`, `browseModes,`, `revisitCue,`, and
`hasHardReset,`. The return object currently reads:

```ts
  return {
    localeKey,
    filter,
    surfaceMode,
    surfaceModes,
    selectSurfaceMode,
    searchPlaceholder,
    searchQuery,
    setSearchQuery,
    selectedMonthKey,
    selectedDate,
    viewMode,
    setViewMode,
    tagFilter,
    specialFilter,
    topMonthTags,
    deferredSearchQuery,
    isSearchPending,
    archiveFilters,
    specialFilters,
    browseModes,
    weekdayLabels,
    availableMonthKeys,
    visibleDreams,
    revisitCue,
    sections,
    calendarRows,
    monthMetaText,
    canGoOlder,
    canGoNewer,
    quickJumpMonthKeys,
    archiveEmptyContent,
    hasResettableView,
    hasHardReset,
    visibleEntriesLabel,
    selectMonth,
    moveMonth,
    resetArchiveView,
    applyFilterSelection,
    selectFilter,
    selectTagFilter,
    selectSpecialFilter,
    clearSelectedDate,
    selectCalendarDate,
  };
```

Replace with:

```ts
  return {
    localeKey,
    filter,
    surfaceMode,
    surfaceModes,
    selectSurfaceMode,
    searchPlaceholder,
    searchQuery,
    setSearchQuery,
    selectedMonthKey,
    selectedDate,
    tagFilter,
    specialFilter,
    topMonthTags,
    deferredSearchQuery,
    isSearchPending,
    archiveFilters,
    specialFilters,
    weekdayLabels,
    availableMonthKeys,
    visibleDreams,
    sections,
    calendarRows,
    monthMetaText,
    canGoOlder,
    canGoNewer,
    quickJumpMonthKeys,
    archiveEmptyContent,
    hasResettableView,
    visibleEntriesLabel,
    selectMonth,
    moveMonth,
    resetArchiveView,
    applyFilterSelection,
    selectFilter,
    selectTagFilter,
    selectSpecialFilter,
    clearSelectedDate,
    selectCalendarDate,
  };
```

- [ ] **Step 4: Stop threading the removed props in `ArchiveScreen.tsx`**

Find `renderArchiveItem` (currently lines 111-133):

```tsx
  const renderArchiveItem = React.useCallback(
    ({ item }: { item: Dream }) => (
      <ArchiveDreamRow
        dream={item}
        copy={copy}
        searchQuery={browse.deferredSearchQuery}
        locale={locale}
        moodLabels={moodLabels}
        navigation={navigation}
        styles={styles}
        viewMode={browse.viewMode}
      />
    ),
    [
      browse.deferredSearchQuery,
      browse.viewMode,
      copy,
      locale,
      moodLabels,
      navigation,
      styles,
    ],
  );
```

Replace with:

```tsx
  const renderArchiveItem = React.useCallback(
    ({ item }: { item: Dream }) => (
      <ArchiveDreamRow
        dream={item}
        copy={copy}
        searchQuery={browse.deferredSearchQuery}
        locale={locale}
        moodLabels={moodLabels}
        navigation={navigation}
        styles={styles}
      />
    ),
    [browse.deferredSearchQuery, copy, locale, moodLabels, navigation, styles],
  );
```

Find the `<ArchiveControlsPanel>` JSX (currently lines 146-169):

```tsx
        <ArchiveControlsPanel
          copy={copy}
          styles={styles}
          searchPlaceholder={browse.searchPlaceholder}
          searchQuery={browse.searchQuery}
          onChangeSearch={browse.setSearchQuery}
          isSearchPending={browse.isSearchPending}
          surfaceModes={browse.surfaceModes}
          surfaceMode={browse.surfaceMode}
          onChangeSurfaceMode={browse.selectSurfaceMode}
          filtersLabel={filterSheetCopy.triggerLabel}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setIsFilterSheetOpen(true)}
          hasHardReset={browse.hasHardReset}
          onReset={browse.resetArchiveView}
          visibleEntriesLabel={browse.visibleEntriesLabel}
          revisitCue={browse.revisitCue}
          browseModes={browse.browseModes}
          viewMode={browse.viewMode}
          onChangeViewMode={browse.setViewMode}
          onOpenRevisitDream={dreamId =>
            navigation.navigate('DreamDetail', { dreamId })
          }
        />
```

Replace with:

```tsx
        <ArchiveControlsPanel
          copy={copy}
          styles={styles}
          searchPlaceholder={browse.searchPlaceholder}
          searchQuery={browse.searchQuery}
          onChangeSearch={browse.setSearchQuery}
          isSearchPending={browse.isSearchPending}
          surfaceModes={browse.surfaceModes}
          surfaceMode={browse.surfaceMode}
          onChangeSurfaceMode={browse.selectSurfaceMode}
          filtersLabel={filterSheetCopy.triggerLabel}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setIsFilterSheetOpen(true)}
          visibleEntriesLabel={browse.visibleEntriesLabel}
        />
```

- [ ] **Step 5: Remove the revisit-cue function and both now-unused types from `archiveBrowser.ts`**

Find the `ArchiveViewMode` type (currently line 19):

```ts
export type ArchiveViewMode = 'comfortable' | 'compact';
```

Delete this line entirely.

Find the `ArchiveRevisitCue` type (currently lines 27-34):

```ts
export type ArchiveRevisitCue = {
  dreamId: string;
  title: string;
  reason: string;
  contextLabel: string;
  actionLabel: string;
  icon: string;
};

```

Delete this block entirely.

Find the block starting at `ARCHIVE_REVISIT_MIN_AGE_MS` and ending at the close
of `getArchiveRevisitCue` (currently lines 349-435, immediately before
`export function getArchiveMatchReasonLabels`):

```ts
const ARCHIVE_REVISIT_MIN_AGE_MS = 12 * 60 * 60 * 1000;

function getArchiveCueTitle(dream: Dream, copy: DreamCopy) {
  return dream.title?.trim() || copy.untitled;
}

export function getArchiveRevisitCue(
  dreams: Dream[],
  copy: DreamCopy,
  now = Date.now(),
): ArchiveRevisitCue | null {
  const candidates = dreams
    .filter(dream => now - dream.createdAt >= ARCHIVE_REVISIT_MIN_AGE_MS)
    .map(dream => {
      const isImportant = isDreamStarred(dream);
      const hasAnalysis = Boolean(dream.analysis?.summary?.trim());
      const hasTranscript = Boolean(dream.transcript?.trim());
      const isArchived = isDreamArchived(dream);
      const hasSignal = Boolean(
        dream.tags.length ||
        dream.wakeEmotions?.length ||
        dream.sleepContext?.preSleepEmotions?.length,
      );
      const score =
        (isImportant ? 40 : 0) +
        (hasAnalysis ? 18 : 0) +
        (hasTranscript ? 10 : 0) +
        (isArchived ? 6 : 0) +
        (hasSignal ? 4 : 0);

      let reason = copy.archiveRevisitReasonSignal;
      let contextLabel = copy.archiveRevisitContextSignal;
      let actionLabel = copy.archiveRevisitAction;
      let icon = 'flash-outline';
      if (isImportant) {
        reason = copy.archiveRevisitReasonImportant;
        contextLabel = copy.archiveRevisitContextImportant;
        icon = 'star-outline';
      } else if (hasAnalysis) {
        reason = copy.archiveRevisitReasonAnalysis;
        contextLabel = copy.archiveRevisitContextAnalysis;
        actionLabel = copy.archiveRevisitActionAnalysis;
        icon = 'sparkles-outline';
      } else if (hasTranscript) {
        reason = copy.archiveRevisitReasonTranscript;
        contextLabel = copy.archiveRevisitContextTranscript;
        actionLabel = copy.archiveRevisitActionTranscript;
        icon = 'document-text-outline';
      } else if (isArchived) {
        reason = copy.archiveRevisitReasonArchived;
        contextLabel = copy.archiveRevisitContextArchived;
        icon = 'archive-outline';
      }

      return {
        dream,
        score,
        reason,
        contextLabel,
        actionLabel,
        icon,
      };
    })
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.dream.createdAt - left.dream.createdAt;
    });

  const top = candidates[0];
  if (!top) {
    return null;
  }

  return {
    dreamId: top.dream.id,
    title: getArchiveCueTitle(top.dream, copy),
    reason: top.reason,
    contextLabel: top.contextLabel,
    actionLabel: top.actionLabel,
    icon: top.icon,
  };
}

```

Delete this entire block. If deleting it leaves `isDreamStarred` or
`isDreamArchived` (imported from `./dreamList`) with no other reference in this
file, remove them from the import too — check with
`grep -n "isDreamStarred\|isDreamArchived" src/features/dreams/model/archiveBrowser.ts`
after deleting the block above before touching the import; leave the import
alone if either name still appears elsewhere in the file.

- [ ] **Step 6: Remove the now-dead style keys from `ArchiveScreen.styles.ts`**

Delete these 8 keys entirely (each is its own top-level entry in the
`StyleSheet.create` object returned by `createArchiveScreenStyles`):
`revisitInlineCard`, `revisitInlineMain`, `revisitInlineLabel`,
`revisitInlineTitle`, `revisitInlineMeta`, `revisitCardPressed`,
`revisitBadge`, `revisitBadgeText`.

Do **not** delete `revisitCard`, `revisitHeader`, `revisitLabel`,
`revisitAction`, `revisitActionRow`, `revisitTitle`, or `revisitReason` — these
were already unused before this plan (nothing in the codebase referenced them
even before Step 2) and are out of scope.

Delete these 15 keys entirely: `listRowCardCompact`, `rowTitleCompact`,
`rowPreviewCompact`, `compactDateBlock`, `compactDayLabel`, `compactMonthLabel`,
`compactContent`, `compactSignalRow`, `compactSignalChip`, `compactMatchText`,
`compactTitleRow`, `compactDateMeta`, `compactTagRow`, `compactTagPill`,
`compactTagText`.

Do **not** delete `rowDateChipTextCompact` or `compactStatusText` — these were
already unused before this plan and are out of scope.

- [ ] **Step 7: Remove the now-dead copy keys from `src/constants/copy/dreams.ts`**

In the `DREAM_COPY_EN` object, find (currently around line 204-205):

```ts
  archiveBrowseComfortable: 'Cards',
  archiveBrowseCompact: 'List',
```

Delete these two lines.

In the same object, find the contiguous block (currently around lines
219-233 — 15 keys from `archiveRevisitLabel` through `archiveRevisitReasonSignal`):

```ts
  archiveRevisitLabel: 'Reopen from this month',
  archiveRevisitAction: 'Open detail',
  archiveRevisitActionAnalysis: 'Review reflection',
  archiveRevisitActionTranscript: 'Clean transcript',
  archiveRevisitEmpty: 'No strong revisit cue in this archive slice yet.',
  archiveRevisitContextImportant: 'Important',
  archiveRevisitContextAnalysis: 'Reflection ready',
  archiveRevisitContextTranscript: 'Transcript ready',
  archiveRevisitContextArchived: 'Archived',
  archiveRevisitContextSignal: 'Detail to keep',
  archiveRevisitReasonImportant: 'Marked important and worth another look',
  archiveRevisitReasonAnalysis: 'Saved reflection is ready to revisit',
  archiveRevisitReasonTranscript: 'Transcript is ready for cleanup',
  archiveRevisitReasonArchived: 'Older archived dream worth reopening',
  archiveRevisitReasonSignal: 'Still carries a detail worth keeping alive',
```

Delete all 15 lines.

In the `DREAM_COPY_UK` object (`const DREAM_COPY_UK: typeof DREAM_COPY_EN`),
find and delete the equivalent two-line `archiveBrowseComfortable`/
`archiveBrowseCompact` pair and the equivalent 15-line `archiveRevisit*` block —
same key names, Ukrainian values. `DREAM_COPY_UK`'s type is pinned to
`typeof DREAM_COPY_EN`, so `npx tsc --noEmit` in Step 9 will fail loudly if
either block is removed from one locale but not the other — use that as your
correctness check rather than trying to match line numbers exactly, since the
UK block's exact line numbers will have shifted once the EN block above it is
edited.

- [ ] **Step 8: Update the hook's behaviour test**

Open `__tests__/useArchiveBrowseState.behaviour.test.tsx`. Find this test
(currently lines 238-258):

```tsx
  test('a chosen day is resettable but is not a hard reset', async () => {
    // The two flags differ by exactly one term, `selectedDate`, and the
    // difference is the point: a day is undone by tapping it again on the
    // calendar that is already on screen, so it does not by itself justify
    // offering to clear everything. A day only counts once calendar is the
    // active surface — that's where selecting one has any effect.
    const { result } = await renderArchive(threeMonths);

    expect(result.current.hasResettableView).toBe(false);
    expect(result.current.hasHardReset).toBe(false);

    await act(async () => result.current.selectSurfaceMode('calendar'));
    await act(async () => result.current.selectCalendarDate('2026-04-04'));

    expect(result.current.hasResettableView).toBe(true);
    expect(result.current.hasHardReset).toBe(false);

    await act(async () => result.current.selectTagFilter('ocean'));

    expect(result.current.hasHardReset).toBe(true);
  });
```

Replace it with a narrower test that keeps covering `hasResettableView` (which
still exists) without asserting on `hasHardReset` (which this plan removes —
its only reason for existing was the chip Step 2 deletes):

```tsx
  test('a chosen day makes the view resettable', async () => {
    // hasResettableView still covers this case now that hasHardReset (a
    // narrower flag, once used only by the standalone "reset view" chip
    // ArchiveControlsPanel no longer renders) is gone.
    const { result } = await renderArchive(threeMonths);

    expect(result.current.hasResettableView).toBe(false);

    await act(async () => result.current.selectSurfaceMode('calendar'));
    await act(async () => result.current.selectCalendarDate('2026-04-04'));

    expect(result.current.hasResettableView).toBe(true);
  });
```

- [ ] **Step 9: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors. If `DREAM_COPY_UK`'s key set drifted from `DREAM_COPY_EN`'s
in Step 7, this is where it surfaces — fix by matching the two blocks exactly.

Run:
```
npx eslint src/features/dreams/components/archive/ArchiveDreamRow.tsx src/features/dreams/components/archive/ArchiveControlsPanel.tsx src/features/dreams/hooks/useArchiveBrowseState.ts src/features/dreams/screens/ArchiveScreen.tsx src/features/dreams/model/archiveBrowser.ts src/features/dreams/screens/ArchiveScreen.styles.ts src/constants/copy/dreams.ts __tests__/useArchiveBrowseState.behaviour.test.tsx
```
Expected: no errors, including no unused-import warnings (an unused
`ArchiveSegmentedControl` import in `ArchiveControlsPanel.tsx` would indicate
Step 2 was applied incorrectly — it's still used by the List/Calendar toggle,
so it should remain imported and used exactly once).

- [ ] **Step 10: Run the full test suite for regressions**

Run: `npx jest`
Expected: PASS. `__tests__/archiveFilterApply.behaviour.test.tsx` needs no
changes (confirmed during planning: it references none of the removed symbols)
but must still pass. Suite/test count will be the same as before this task
(Step 8 replaces one test with another, net zero change in count).

- [ ] **Step 11: Commit**

```bash
git add src/features/dreams/components/archive/ArchiveDreamRow.tsx \
  src/features/dreams/components/archive/ArchiveControlsPanel.tsx \
  src/features/dreams/hooks/useArchiveBrowseState.ts \
  src/features/dreams/screens/ArchiveScreen.tsx \
  src/features/dreams/model/archiveBrowser.ts \
  src/features/dreams/screens/ArchiveScreen.styles.ts \
  src/constants/copy/dreams.ts \
  __tests__/useArchiveBrowseState.behaviour.test.tsx
git commit -m "refactor: simplify Archive's main screen to header/search/toggle/entries"
```
