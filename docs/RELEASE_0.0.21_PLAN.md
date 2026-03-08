# Release 0.0.21 Plan

## Goal

Ship the first retrieval-focused release after `0.0.20`: make finding the
right dream feel clearer, faster, and less mechanical inside larger local
archives.

## Release theme

- Search should explain itself instead of feeling like a black box
- Retrieval should work with filters, not fight them
- Ship one small new feature inside this release, not only polish

## Scope

### 1. Saved search presets

- Add the small new feature for this version:
  - saved search presets for recurring retrieval patterns
- Let users save a useful query + filter combination
- Keep the first version intentionally small:
  - save
  - apply
  - remove

### 2. Matching clarity

- Make it clearer why a dream matched a query
- Add visible match reasons where it helps:
  - title
  - text
  - transcript
  - tag
- Reduce the feeling that search results are just “some reordered list”

### 3. Smarter combinations of search and filters

- Keep search, date filters, and status filters coordinated
- Avoid layouts where search state is visually separated from the active filters
- Make reset and clear actions obvious when the current retrieval state is too narrow

### 4. Retrieval flow polish

- Reduce friction around repeated searches
- Keep search responsive on larger local histories
- Continue trimming unnecessary copy around search panels and empty states

### 5. Consistency with the current shell

- Reuse the shared chip, surface, and action system already established in:
  - `Home`
  - `Archive`
  - `DreamDetail`
- Avoid turning retrieval into a dense admin-style filter screen

## Suggested release notes

- Added saved search presets for recurring dream searches
- Improved clarity around why dreams match a search
- Polished search and filter coordination in larger local archives

## Scope lock

- no backend or sync
- no semantic cloud search
- no account-based saved searches
- no analytics rewrite inside search surfaces

## Definition of done

- Search results feel easier to trust than in `0.0.20`
- Users can quickly reuse at least one recurring search pattern
- Match reasons are visible where they materially help understanding
- Retrieval stays responsive on larger local histories
- Version `0.0.21` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.21): improve dream retrieval and add saved search presets`
