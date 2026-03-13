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
Current release target: `0.6.2`

This release should harden sync and restore behavior from `0.6.0` and `0.6.1`
before the next broader product push:

- sync should stay idempotent and easier to reason about on repeated runs
- snapshot and conflict metadata should stay explicit across sync, restore, and migrations
- development diagnostics should expose pending state and failures more clearly

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
[docs/RELEASE_0.5.6_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.6_PLAN.md)
for the completed review-workspace foundation,
[docs/RELEASE_0.6.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.6.0_PLAN.md)
for the completed connected-reflection scope,
[docs/RELEASE_0.6.1_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.6.1_PLAN.md)
for the completed stabilization target,
[docs/RELEASE_0.6.2_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.6.2_PLAN.md)
for the active backend-hardening target,
[docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
for the completed feature/backend/UI/UX range from `0.5.1` to `0.6.0`,
[docs/ROADMAP_0.6.1_TO_1.0.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.6.1_TO_1.0.0.md)
for the next path from `0.6.1` to `1.0.0`, and
[docs/ROADMAP_0.0.17_TO_0.0.25.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.0.17_TO_0.0.25.md)
for the completed path that led into `0.1.0`.

## Infrastructure

- CI (GitHub Actions): typecheck, lint, tests
- Manual Android release pipeline (GitHub Actions): build `app-release.aab`
- Observability layer is in place with console provider and global JS error hook

See [docs/INFRASTRUCTURE_CHECKLIST.md](/Users/mykyta/Documents/projects/dream-app/docs/INFRASTRUCTURE_CHECKLIST.md) for step-by-step rollout.
Secrets/access requirements are listed in [docs/GITHUB_SECRETS.md](/Users/mykyta/Documents/projects/dream-app/docs/GITHUB_SECRETS.md).

## Cloud Baseline After 0.4.0

`0.4.0` established the production-ready backup baseline without adding
compile-time app secrets.

1. On the first device, turn on backup in `Settings` -> `General` -> `Cloud backup`.
2. Save that backup under an email/password account when you want multi-device sync.
3. On another device, open the same backup with the same email/password.
4. Use `Sync now` to upload or pull dream changes.
5. Keep the Supabase runtime config flow as a developer-only setup path in debug builds.
6. Treat `0.4.0` as the stable cloud baseline while `0.5.0` shifts back to user-facing product value.
