# Release 0.0.18 Plan

## Goal

Ship the second archive-focused release after `0.0.17`: turn `Archive` into a
clear history-browse space with lighter controls, cleaner month navigation, and
better readability for older entries.

## Release theme

- Archive should feel like a dedicated browsing space, not a leftover long screen
- Search, month navigation, and date navigation should cooperate instead of competing
- Older entries should become easier to scan at speed

## Scope

### 1. Archive layout redesign, phase 2

- Reduce the stacked-card feel in `Archive`
- Keep one clear structure:
  - month context
  - search and filters
  - optional day navigation
  - list of entries
- Make the archive header lighter and more compact
- Tighten spacing so more real history appears above the fold

### 2. Browse modes and row readability

- Add at least one lighter browsing mode for older entries:
  - `Compact`
  - keep `Comfortable` as the calmer default if it remains clearer
- Simplify archive row metadata:
  - title
  - date
  - one short preview
  - fewer, quieter badges
- Make archived/current/important states visible without badge overload

### 3. Month and date navigation cleanup

- Keep month navigation always understandable
- Make day selection feel secondary and optional
- Prevent the calendar from visually dominating the archive
- Clarify what the current search scope is:
  - search applies to the currently open month
  - selected day narrows that result set further

### 4. Better retrieval for older entries

- Improve quick filters for history review
- Make no-results states and empty states more explicit
- Keep the archive focused on finding old dreams quickly, not on reproducing the home feed
- Do one more performance pass on archive-specific search and month switching

### 5. Archive-specific visual consistency

- Reuse the shared control and surface system from `0.0.17`
- Keep chips, row surfaces, and section framing aligned with:
  - `Home`
  - `Insights`
  - `Settings`
- Reduce decorative weight where it slows down readability

## Suggested release notes

- Redesigned Archive to make older dreams easier to browse and scan
- Improved month, date, and search coordination inside the archive flow
- Added lighter archive presentation for large local histories
- Polished archive rows, filters, and empty states for faster retrieval

## Scope lock

- no backend or sync
- no account system
- no calendar-first rewrite of the whole product
- no new analytics engine inside archive
- no cloud search or semantic retrieval

## Definition of done

- `Archive` clearly reads as a history browser
- Search, month switching, and optional day selection work together without confusion
- Older entries are faster to scan than they were in `0.0.17`
- Archive rows and controls feel visually consistent with the rest of the app
- Version `0.0.18` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.18): redesign archive browsing and month navigation`
