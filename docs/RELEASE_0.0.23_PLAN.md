# Release 0.0.23 Plan

## Goal

Ship the first detail-focused release after `0.0.22`: make a saved dream feel
structured, rich, and worth revisiting instead of reading like a stack of
technical sections.

## Release theme

- Detail should feel like a premium reading surface, not an admin page
- Related pieces should feel connected:
  - raw note
  - transcript
  - analysis
  - nearby dreams
- Ship one small new feature inside this release, not only layout polish

## Scope

### 1. Related dreams strip

- Add the small new feature for this version:
  - a related-dreams strip that makes neighboring or similar entries easier to open
- Keep the first version intentionally focused:
  - quick scan
  - quick jump
  - no heavy recommendation logic

### 2. Stronger detail hierarchy

- Make the first screen easier to read in order:
  - title
  - core text
  - supporting context
  - follow-up surfaces
- Reduce the feeling of “many equal cards”

### 3. Better relationships between text layers

- Clarify the difference between:
  - written note
  - generated transcript
  - edited transcript
  - analysis summary
- Avoid making the user parse too many similar-looking sections

### 4. Cleaner follow-up actions

- Keep edit, archive, important, and delete easy to reach
- Avoid oversized action blocks or repeated controls
- Let quick actions feel lighter and more contextual

### 5. Motion and polish

- Add light transitions where they improve comprehension:
  - section reveal
  - transcript/edit state changes
  - related-dream card movement
- Keep motion subtle and product-like

## Suggested release notes

- Refreshed the dream detail screen with stronger reading hierarchy
- Added a related-dreams strip for faster revisits
- Improved the relationship between notes, transcript, analysis, and actions

## Scope lock

- no backend-driven recommendations
- no heavy social or sharing layer
- no cloud sync dependency for related dreams
- no full editor rewrite inside this release

## Definition of done

- Dream detail is easier to scan than in `0.0.22`
- Users can jump between related dreams with less friction
- Transcript, note, and analysis surfaces feel more distinct
- Actions feel accessible without dominating the screen
- Version `0.0.23` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.23): refresh dream detail and add related dreams strip`
