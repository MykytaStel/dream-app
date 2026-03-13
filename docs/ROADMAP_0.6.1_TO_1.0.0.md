# Roadmap 0.6.1 to 1.0.0

## Product direction

After `0.6.0`, the right path to `1.0.0` is not more surface area. It is a
series of smaller releases that make four product promises trustworthy:

- capture should stay fast
- archive should stay readable
- review should create return value
- backup and sync should feel safe

## Rules for this range

- every release should have one dominant theme
- backend work must support a user-facing outcome, not become a parallel track
- backup and sync should become more trustworthy, but less visually noisy
- review should become more useful without turning the app into a dashboard
- no release should make wake capture slower or more fragile

## Release 0.6.1

### Theme

Stability and coherence.

### Main outcomes

- clean up navigation, spacing, and backup noise after `0.6.0`
- close review-state metadata and migration edge cases
- reduce UI and controller duplication in `Settings`, `Backup`, and review
  flows

## Release 0.6.2

### Theme

Backend hardening.

### Main outcomes

- make sync more idempotent and easier to reason about
- strengthen snapshot versioning and conflict rules
- add clearer sync diagnostics and error visibility for development

### Backend scope

- explicit sync revision handling
- better conflict and overwrite policy for local-first changes
- stronger contract tests around multi-device and restore-after-sync paths

## Release 0.7.0

### Theme

Trustworthy archive recovery.

### Main outcomes

- make backup and restore feel like a product feature, not an admin feature
- support first-device, returning-device, and reinstall recovery flows more
  clearly
- let the user understand what is local, mirrored, or stale

### Product scope

- stronger backup state language
- better restore confidence
- calmer cloud/account status

## Release 0.7.1

### Theme

Onboarding and recovery cues.

### Main outcomes

- explain archive value and recovery value at the right moment
- support “I already have a backup” and “I am new here” as separate paths
- keep education lightweight, contextual, and dismissible

## Release 0.8.0

### Theme

Review loop becomes real.

### Main outcomes

- turn `Review workspace` into a truly useful return surface
- strengthen saved sets, revisit reasons, and next-step clarity
- make follow-up work feel calmer and more editorial

### Product scope

- stronger queue logic
- better revisit rationale
- clearer completion and saved-state behavior

## Release 0.8.1

### Theme

Transcription and analysis reliability.

### Main outcomes

- make transcript and analysis flows more predictable on real data
- clarify retry, pending, and failure states
- keep heavy AI-related work from leaking noise into the rest of the app

## Release 0.9.0

### Theme

Scale and multi-device confidence.

### Main outcomes

- prove the archive still behaves well on larger data sets
- harden long-offline, reinstall, and schema-upgrade paths
- reduce refresh and hydration bottlenecks across major surfaces

### Backend scope

- large-archive performance checks
- migration safety from older versions
- cross-device sync confidence on larger histories

## Release 0.9.1

### Theme

Polish and trust pass.

### Main outcomes

- remove the most visible rough edges before `1.0.0`
- improve accessibility, copy, edge states, and quiet visual consistency
- close remaining “works but feels odd” interactions

## Release 1.0.0

### Theme

Private archive you can trust.

### Definition of success

By `1.0.0`, a user should be able to:

1. capture a dream quickly after waking
2. return later and understand what matters next
3. trust backup, sync, and restore across devices
4. revisit important dreams, months, and recurring threads without friction
5. use the app for a meaningful archive without obvious instability or clutter

## What not to do in this range

- do not add social or public-sharing features
- do not build more AI surface area before reliability is good enough
- do not spread backup or review prompts across every major screen
- do not grow `Settings` and `Memory` into control-panel style dashboards
