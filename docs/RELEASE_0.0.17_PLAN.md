# Release 0.0.17 Plan

## Goal

Ship the first shell-and-performance release after `0.0.16`: make the app
feel faster on large local archives, centralize quick capture, and bring
`Home`, `Archive`, `Insights`, and `Settings` under one calmer product shell.

## Release theme

- Large local lists should feel lighter and more responsive
- The main add action should be obvious and centered
- Primary screens should look like one product, not four separate UI systems

## Scope

### 1. Large-list performance and perceived speed

- Move the heaviest list surfaces to proper virtualization:
  - `Home`
  - `Archive`
  - `PatternDetail`
- Reduce render cost during search and filtering:
  - deferred search
  - debounced input
  - memoized rows
- Add lighter loading states so list transitions feel less abrupt
- Tighten a few analytics computations that were doing unnecessary repeated work

### 2. New navigation shell and quick add

- Promote `Archive` to a first-class tab
- Add a central `+` action as the main entry point for capture
- Use a quick-add sheet for:
  - voice
  - text
  - continue draft
- Clean up tab-bar spacing, labels, and safe-area behavior so the shell feels
  deliberate instead of decorative

### 3. Home and Archive readability

- Compress `Home` so it reaches the archive feed faster
- Remove duplicate archive entry points inside `Home`
- Make `Archive` month-first:
  - browse by month
  - optionally expand days
  - search only inside the current month
- Replace unclear state names like `Marked` with more human language like
  `Important`

### 4. Shared visual system pass

- Use one shared surface system for:
  - chips
  - tiles
  - inline controls
  - inputs
- Reduce oversized or overly technical UI on:
  - `Settings`
  - `Insights`
  - `Progress`
- Break larger screens into smaller reusable components where repeated layout
  patterns were already emerging

### 5. Insights and progress cleanup

- Pull `Progress` out of the heavier insights flow more clearly
- Replace raw pattern chip walls with grouped pattern cards
- Make counts readable:
  - dreams where a signal repeats
  - entries where an emotion was logged
- Keep pattern presentation scannable without pretending this is a full BI
  dashboard

## Suggested release notes

- Improved performance for large local lists, search, and archive browsing
- Added a new central quick-add flow with voice, text, and draft continuation
- Redesigned Home and Archive so navigation feels clearer and less repetitive
- Unified chips, tiles, and control surfaces across Settings, Insights, and main browsing screens
- Cleaned up insights and progress presentation so recurring patterns are easier to understand

## Scope lock

- no backend or account system
- no sync
- no cloud analysis or OpenAI integration
- no deep analytics engine rewrite
- no store-launch work inside this release

## Definition of done

- Large seeded archives remain usable without obvious list jank
- The central `+` flow becomes the main capture entry point
- `Home`, `Archive`, `Settings`, and `Insights` share a more consistent shell
- `Archive` reads as history browse, not as a second `Home`
- `Patterns` and `Progress` are understandable without technical interpretation
- `0.0.17` has a visible written scope before moving on to the next release

## Suggested release commit

- `release(v0.0.17): tighten shell, list performance, and archive flow`
