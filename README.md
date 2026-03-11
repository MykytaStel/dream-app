# Kaleidoskop

Kaleidoskop is a mobile dream journal built to help people capture dreams right
after waking up. The app focuses on fast offline entry creation with text,
voice notes, mood tracking, tags, and lightweight personal statistics.

This project is being developed by Mykyta Stelmashenko.

## Current scope

- Create dream entries with title, date, text, and optional audio
- Track mood and tags for each dream
- Browse saved dreams locally
- View basic stats such as streaks, words, and entry counts

## Tech stack

- React Native
- TypeScript
- React Navigation
- MMKV local storage

## Status

Latest shipped version: `0.1.0`
Current release target: `0.2.2`

This release should move the app out of the generic "dream journal with AI"
bucket and into a more distinct memory-first product focused on:

- a calmer wake-state capture surface
- preserved original voice as part of the memory object
- recurring signals and related-dream threads that appear early
- stronger Memory framing instead of a generic insights dashboard

See
[docs/RELEASE_0.0.16_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.16_PLAN.md)
for the latest shipped release scope,
[docs/RELEASE_0.0.17_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.17_PLAN.md)
for the completed shell-and-performance scope,
[docs/RELEASE_0.0.18_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.18_PLAN.md)
for the shipped archive redesign scope,
[docs/RELEASE_0.0.19_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.19_PLAN.md)
for the latest shipped calendar-and-time-navigation scope,
[docs/RELEASE_0.0.20_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.20_PLAN.md)
for the latest shipped capture-flow-upgrade scope,
[docs/RELEASE_0.0.21_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.21_PLAN.md)
for the latest shipped search-and-retrieval scope,
[docs/RELEASE_0.0.22_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.22_PLAN.md)
for the shipped insights-visual-refresh target,
[docs/RELEASE_0.0.23_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.23_PLAN.md)
for the latest shipped dream-detail-richness scope,
[docs/RELEASE_0.0.24_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.24_PLAN.md)
for the shipped import-and-shell-polish target,
[docs/RELEASE_0.0.25_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.0.25_PLAN.md)
for the latest performance-and-polish target,
[docs/RELEASE_0.1.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.1.0_PLAN.md)
for the completed beta-release target,
[docs/RELEASE_0.2.2_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.2_PLAN.md)
for the active release target, and
[docs/ROADMAP_0.0.17_TO_0.0.25.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.0.17_TO_0.0.25.md)
for the completed path that led into `0.1.0`.

## Infrastructure

- CI (GitHub Actions): typecheck, lint, tests
- Manual Android release pipeline (GitHub Actions): build `app-release.aab`
- Observability layer is in place with console provider and global JS error hook

See [docs/INFRASTRUCTURE_CHECKLIST.md](/Users/mykyta/Documents/projects/dream-app/docs/INFRASTRUCTURE_CHECKLIST.md) for step-by-step rollout.
Secrets/access requirements are listed in [docs/GITHUB_SECRETS.md](/Users/mykyta/Documents/projects/dream-app/docs/GITHUB_SECRETS.md).
