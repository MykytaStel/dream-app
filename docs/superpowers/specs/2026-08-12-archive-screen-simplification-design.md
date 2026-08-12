# Archive screen simplification

Date: 2026-08-12
Found during: a gap audit of Home/Archive/capture-edge-cases against the owner's
product plan (`~/.claude/plans/dream-app-product-plan-2026-08-03.md` §3.3, "Home
and Archive duplicate each other"). §3.3's target for Archive's default screen:
*"заголовок, пошук, перемикач Список/Календар, записи. Усе інше — у sheet
«Фільтри»."* (header, search, List/Calendar toggle, entries. Everything else —
in a "Filters" sheet.)

## Program note

`ArchiveControlsPanel.tsx` currently renders more than that on the main screen:
a second segmented control for `viewMode` (comfortable/compact row density), a
conditional "reset view" chip, a results-count toolbar, and an inline revisit
card — none in the plan's minimal list. The revisit card also duplicates
`HomeSpotlightSection` on Home: same purpose (surface one dream worth
revisiting, tap to open), same output shape, but two independently-scored,
independently-maintained implementations (`getArchiveRevisitCue` vs.
`getHomeRevisitCue`) with different age thresholds, different weights, and
Home's version additionally factoring in cross-dream relatedness and
time-window resurfacing that Archive's has no equivalent of.

## Design

### `viewMode` (comfortable/compact) — remove entirely

Confirmed via full-codebase check: `viewMode` is session-only React state
(`useArchiveBrowseState.ts`), never persisted to MMKV, and is the *only*
display-density control anywhere in the app (no equivalent in Settings). Its one
consumer, `ArchiveDreamRow.tsx`, branches its entire JSX between a "comfortable"
and a "compact" layout. Remove the toggle, delete the compact branch as dead
code, and always render the comfortable layout — the only one that survives.

Files: `ArchiveControlsPanel.tsx` (remove the segmented control, `browseModes`/
`viewMode`/`onChangeViewMode` props), `ArchiveScreen.tsx` (stop threading those
props through), `useArchiveBrowseState.ts` (remove `viewMode` state and
`setViewMode`), `ArchiveDreamRow.tsx` (delete the `isCompact` branch and its
props), `archiveBrowser.ts` (remove `ArchiveViewMode` type if nothing else uses
it — verify at implementation time).

### "Reset view" chip — remove; compensate with a native search-clear affordance

The chip today clears search text + `tagFilter` + `specialFilter` (not the
calendar date, which already has its own `onClearDate` chip in
`ArchiveMonthPanel.tsx`). Once filters live only in the sheet, the sheet's own
Reset button already clears `filter`/`specialFilter`/`tagFilter` via its draft
state. The one capability lost is one-tap search-text clearing.

`FormField` (`src/components/ui/FormField.tsx`) spreads unknown props onto the
underlying RN `TextInput`, so adding `clearButtonMode="while-editing"` to the
search field's props in `ArchiveControlsPanel.tsx` is a one-line addition — RN's
native iOS clear-X, no new component work. Android has no built-in equivalent;
this spec does **not** build a custom cross-platform clear button (see Out of
Scope) — that's disproportionate effort for a decluttering task, and standard
keyboard interaction (select-all, backspace) still works.

Files: `ArchiveControlsPanel.tsx` (remove the chip's JSX and its
`hasHardReset`/`onReset` props; add `clearButtonMode="while-editing"` to the
search `FormField`), `ArchiveScreen.tsx` (stop passing `hasHardReset`/`onReset`),
`useArchiveBrowseState.ts` (remove `hasHardReset` and `resetArchiveView` *if*
nothing else in the codebase calls them — verify with a repo-wide grep at
implementation time before deleting; if something else depends on
`resetArchiveView`, keep the function and only remove its exposure to this one
call site).

### Results-count toolbar — keep the count, drop the row's other job

The toolbar today is one `Text` (`visibleEntriesLabel`, e.g. "42 entries") sharing
a row with the `viewMode` toggle via `justifyContent: 'space-between'`. Once the
toggle is gone, the row simplifies to just the label — cheap, informative, and a
reasonable read of "the entries themselves" from the plan's minimal list. No
functional change beyond removing the segmented control from that row; the label
and its computation (`formatArchiveEntryCount`) are untouched.

Files: `ArchiveControlsPanel.tsx` (remove `<ArchiveSegmentedControl>` from Block
B, keep the `Text`), `ArchiveScreen.styles.ts` (`resultsToolbar` likely no longer
needs `justifyContent: 'space-between'` with only one child — adjust if it looks
wrong once the toggle is gone, this is a visual judgment call for whoever
implements it, not a hard requirement).

### Inline revisit card — remove entirely, no reconciliation with Home's version

Delete the card, its scoring function, and its threading, rather than trying to
unify it with Home's richer `getHomeRevisitCue`. Rationale: a user actively
browsing/searching Archive is already engaged; revisit-nudging is a
come-back-and-engage mechanic that belongs on Home, where it already exists.
Unifying the two scoring functions would be a separate, larger project (aligning
age thresholds, porting Home's cross-dream-relatedness and resurfacing signals,
or simplifying Home's down to Archive's level) that this spec does not need —
deleting Archive's copy resolves the duplication without touching Home at all.

Files: `archiveBrowser.ts` (delete `getArchiveRevisitCue`,
`ARCHIVE_REVISIT_MIN_AGE_MS`, `ArchiveRevisitCue` type — verify no other
consumer first), `useArchiveBrowseState.ts` (remove the `revisitCue` memo and
its exposure), `ArchiveControlsPanel.tsx` (remove Block C's JSX and the
`revisitCue`/`onOpenRevisitDream` props), `ArchiveScreen.tsx` (remove the
`onOpenRevisitDream` callback that navigates to `DreamDetail` — verify it isn't
reused elsewhere first), `ArchiveScreen.styles.ts` (remove
`revisitInlineCard`/`revisitCardPressed`/`revisitInlineMain`/`revisitInlineMeta`
and any other now-unused revisit-specific styles), copy file (remove
`archiveRevisitLabel` if nothing else uses it).

### What stays, unchanged

Header, search field (gaining the one new prop above), the List/Calendar
`surfaceMode` toggle, the Filters-sheet trigger chip (with its active-filter-count
badge), the entries list itself, and `ArchiveFilterSheet.tsx`'s own contents —
none of this spec's changes touch the sheet's internals.

## Explicitly out of scope

- No new "Display density" setting anywhere else (Settings, the Filters sheet,
  etc.) to replace the removed `viewMode` toggle — it had zero persistence and no
  evidence of being load-bearing; if it's missed, that's a signal to design it
  properly later, not to preserve it now.
- No custom cross-platform search-clear button component. `clearButtonMode`
  covers iOS for free; building an Android equivalent is new component work
  disproportionate to this task.
- No reconciliation of Archive's and Home's revisit-scoring logic. Home's
  `getHomeRevisitCue`/`HomeSpotlightSection` are untouched.
- No changes to `ArchiveFilterSheet.tsx`'s own contents, `ArchiveMonthPanel.tsx`,
  or the calendar surface mode's behavior.
- No changes to `ArchiveDreamRow.tsx` beyond deleting the now-dead compact
  branch — its comfortable-mode rendering is untouched.

## Testing

- `__tests__/useArchiveBrowseState.behaviour.test.tsx` and
  `__tests__/archiveFilterApply.behaviour.test.tsx` currently assert on
  `viewMode`/`setViewMode`, `hasHardReset`/`resetArchiveView`, and `revisitCue`
  (per the returned hook shape) — these assertions need removing or updating to
  match the hook's smaller post-change surface. Read both files at
  implementation time rather than assuming their exact current shape.
- No snapshot/screenshot/characterization test exists for `ArchiveScreen.tsx` or
  `ArchiveControlsPanel.tsx`'s rendered structure today (confirmed via repo-wide
  search) — nothing else needs updating for the render-shape changes themselves.
- `npx tsc --noEmit` and `npx eslint` on all changed files — deleting exported
  symbols (`ArchiveViewMode`, `ArchiveRevisitCue`, `getArchiveRevisitCue`, etc.)
  will surface any consumer this spec's "verify no other caller first" notes
  missed, as a compile error rather than a silent runtime gap.
- `npx jest` full suite for regressions.
- Manual: open Archive, confirm the screen shows header/search/List-Calendar
  toggle/entries-count/entries only — no density toggle, no reset chip, no
  revisit card. Type in search, confirm the iOS clear-X appears and works.
  Open Filters, confirm status/special/tags filters and their own Reset/Cancel/
  Apply still work exactly as before. Switch to Calendar view, confirm
  `onClearDate` still works there unchanged.
