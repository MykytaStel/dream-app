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

Version: `0.0.7`

This is an early MVP focused on the core journaling flow with local reminders
and offline transcription. Future iterations may add AI summaries and richer
dream analytics.

## Infrastructure

- CI (GitHub Actions): typecheck, lint, tests
- Manual Android release pipeline (GitHub Actions): build `app-release.aab`
- Observability layer is in place with console provider and global JS error hook

See [docs/INFRASTRUCTURE_CHECKLIST.md](/Users/mykyta/Documents/projects/dream-app/docs/INFRASTRUCTURE_CHECKLIST.md) for step-by-step rollout.
Secrets/access requirements are listed in [docs/GITHUB_SECRETS.md](/Users/mykyta/Documents/projects/dream-app/docs/GITHUB_SECRETS.md).
