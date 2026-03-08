# Release 0.0.22 Plan

## Goal

Ship the first insights-focused visual release after `0.0.21`: make
reflection feel clearer, more visual, and easier to browse without turning the
screen into a dense report.

## Release theme

- Insights should feel like a product surface, not a dashboard dump
- The first screen should explain the current period quickly
- Ship one small new feature inside this release, not only visual polish

## Scope

### 1. Period compare toggle

- Add the small new feature for this version:
  - compare the current period to the previous one
- Keep the first version intentionally focused:
  - current range
  - previous range
  - visible delta where it materially helps

### 2. Stronger top-level snapshot

- Make the first fold easier to scan
- Reduce the feeling of “many equal cards”
- Give the user a clearer summary of:
  - activity
  - momentum
  - current signal

### 3. Clearer section identity

- Strengthen the difference between:
  - snapshot
  - patterns
  - attention
  - progress
- Avoid repeating the same card geometry and copy rhythm everywhere

### 4. Better pattern readability

- Make pattern groups easier to understand at a glance
- Keep counts meaningful and visually secondary to the signal itself
- Reduce ambiguity around why a pattern is interesting

### 5. Motion and polish

- Add light transitions where they improve comprehension:
  - compare toggle
  - section reveal
  - metric state change
- Keep motion subtle and product-like

## Suggested release notes

- Refreshed the Insights screen with clearer visual hierarchy
- Added a compare toggle for the current period versus the previous one
- Improved readability for recurring patterns and summary metrics

## Scope lock

- no backend analytics
- no cloud insights
- no chart-heavy rewrite for every metric
- no export/report builder inside insights

## Definition of done

- Insights is easier to scan than in `0.0.21`
- The first fold tells a coherent story without reading every card
- Compare mode adds useful context without making the screen heavier
- Pattern groups feel clearer and less mechanical
- Version `0.0.22` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.22): refresh insights and add period compare`
