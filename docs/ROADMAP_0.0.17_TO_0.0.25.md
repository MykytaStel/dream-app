# Roadmap 0.0.17 to 0.0.25

## Product direction

This range should not chase backend or random feature depth yet. The goal is
to turn the app into a fast, coherent local-first product first:

- faster movement through large archives
- clearer capture flow
- calmer and more intentional visual hierarchy
- useful retrieval and reflection without cloud dependency

The rule for every version in this range:

- ship one small new feature, even if it is modest
- ship one visible design improvement
- ship one practical workflow improvement
- ship one speed or polish improvement

## Release 0.0.17

### Theme

Performance and shell cleanup.

### Main outcomes

- tighten large-list performance on `Home`, `Archive`, and pattern detail
- add a central `+` quick-add flow
- reduce duplicated navigation and oversized blocks
- align `Home`, `Archive`, `Settings`, `Insights`, and `Progress` under one
  shared control and surface language

### Small new feature

- ship the central `+` quick-add sheet as a new primary action instead of a
  passive record tab

## Release 0.0.18

### Theme

Archive redesign, phase 2.

### Main outcomes

- make `Archive` feel like a true browsing space instead of a large stacked
  screen
- add compact and comfortable browse modes if the data supports it cleanly
- improve search and quick filters for older entries
- continue reducing heavy month and card presentation

### Small new feature

- add `Compact` and `Comfortable` browse modes for archive history review

### Scope lock

- no backend sync
- no full calendar-first product shift yet

## Release 0.0.19

### Theme

Calendar and time navigation.

### Main outcomes

- turn time navigation into a first-class browse path
- add clearer month and day movement patterns
- make it easy to revisit dreams by date, not only by list scroll
- keep the calendar supporting the archive rather than replacing it

### Small new feature

- add a recent-month quick-jump strip so a user can jump to an active month in
  one tap

## Release 0.0.20

### Theme

Capture flow upgrade.

### Main outcomes

- make capture feel faster and more guided
- strengthen voice-first and text-first quick paths
- add better post-save decisions:
  - record another
  - open detail
  - return to feed
- remove leftover “explanatory landing page” feel from the composer

### Small new feature

- add a post-save action sheet with fast next-step choices after each capture

## Release 0.0.21

### Theme

Search and retrieval 2.0.

### Main outcomes

- improve ranking and matching clarity
- add better explanation for why an entry matched
- support smarter combinations of search and filters
- reduce retrieval friction in larger archives

### Small new feature

- add saved search presets for recurring retrieval patterns

## Release 0.0.22

### Theme

Insights visual refresh.

### Main outcomes

- make `Insights` feel browsable and visual, not like a report
- strengthen section identity for:
  - snapshot
  - patterns
  - attention
  - coverage
- reduce the “stack of equal cards” feel

### Small new feature

- add a period-compare toggle so users can compare the current range to the
  previous one

## Release 0.0.23

### Theme

Dream detail richness.

### Main outcomes

- make detail view feel premium and structured
- improve relationships between:
  - original text
  - transcript
  - analysis
  - related dreams
- continue reducing debug/admin feeling in follow-up surfaces

### Small new feature

- add a related-dreams strip so the user can jump between nearby or similar
  entries

## Release 0.0.24

### Theme

Import and restore foundation.

### Main outcomes

- add local import for backups
- support safe preview and validation before restore
- define clear merge vs replace behavior
- strengthen user trust in the local-first direction

### Small new feature

- add an import preview step before any restore action is committed

## Release 0.0.25

### Theme

Performance and polish milestone.

### Main outcomes

- final pass on slow navigation, list mounting, and screen transitions
- visual polish across `Home`, `Archive`, `Detail`, `Insights`, and `Settings`
- add light profiling discipline around known slow surfaces
- reach the point where the app feels beta-quality, not MVP-fragile

### Small new feature

- add a `Return to last dream` shortcut so users can quickly reopen what they
  were just working on

## Decision point after 0.0.25

If `0.0.25` delivers:

- fast large-list behavior
- coherent UI shell
- strong capture and retrieval flows
- safe local export/import posture

then the next step should be `0.1.0`, not another arbitrary `0.0.x`.

If those conditions are not true yet, continue with another focused `0.0.x`
release instead of forcing a premature version jump.

## What not to do in this range

- do not start backend before the local product feels settled
- do not turn the app into a generic admin dashboard
- do not add cloud AI just because the architecture can support it later
- do not keep stacking duplicate navigation paths in multiple screens
- do not let decorative trends outrun actual clarity and speed
