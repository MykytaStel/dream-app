# Release 0.0.19 Plan

## Goal

Ship the first time-navigation release after `0.0.18`: make date-based
revisiting feel fast and intentional, while keeping `Archive` list-first and
light.

## Release theme

- Time should feel like a real browse path, not just extra controls around a list
- Calendar should support the archive instead of dominating the screen
- Ship one small new feature inside this release, not only polish

## Scope

### 1. Quick time jumps

- Add one small new feature for this version:
  - a recent-month quick-jump strip for active months
- Let users move between recent months without repeatedly tapping older/newer
- Keep the jump strip secondary and lightweight so it does not become another
  heavy header

### 2. Month and day navigation cleanup

- Make month navigation easier to scan and faster to use
- Keep day selection optional and clearly subordinate to month browsing
- Ensure month changes reset or preserve day state in a way that feels
  predictable
- Reduce any remaining duplication between month context and section headers

### 3. Date-to-list coordination

- Make it obvious whether the list is showing:
  - the whole month
  - one selected day
  - search results inside the current month
- Improve empty and no-results states for day-specific browsing
- Make it easy to return from a selected day back to the full month

### 4. Time-focused motion and polish

- Add calm transitions for:
  - month changes
  - showing or hiding day cells
  - jumping from a month chip into the filtered list
- Keep transitions subtle and fast, not decorative
- Verify that time navigation still feels smooth on larger local histories

### 5. Archive consistency after the time pass

- Keep controls, chips, and row surfaces aligned with the shared app style
- Avoid reintroducing heavy boxed sections after `0.0.18`
- Continue trimming redundant copy where the UI already explains the state

## Suggested release notes

- Added faster month-based navigation in Archive
- Improved day selection and time-based browsing flow
- Added a quick-jump path for recent active months
- Polished time navigation motion and archive clarity

## Scope lock

- no backend or sync
- no account system
- no full calendar-first redesign of the product
- no duplicate archive entry points outside the existing shell
- no decorative animation that slows down archive browsing

## Definition of done

- Time navigation feels meaningfully better than in `0.0.18`
- Users can jump to recent active months without repeated paging
- Day selection and month search do not fight each other
- Archive stays visually lighter than it was before the redesign
- Version `0.0.19` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.19): improve archive time navigation and quick month jumps`
