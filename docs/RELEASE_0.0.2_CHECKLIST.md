# Release 0.0.2 Checklist

## Scope locked

- Core dream flows stabilized:
  - create/edit/archive/delete/filter
  - stable sorting
  - date validation
  - tag normalization
- Sleep context analytics and mood correlations
- Wake reminder notifications with deep open to Record tab
- i18n base layer (English/Ukrainian) + language switch in settings
- Timeline/Record state handling (empty/loading/error)
- Swipe UX refinements for Timeline
- Storage schema migrations (`v1 -> v2`) for backward compatibility
- Test coverage added for rules, repository flows, and migrations

## Pre-release checks

- Run `yarn typecheck`
- Run `yarn eslint .`
- Run `yarn test:ci`
- Run iOS app and verify:
  - tab switching and Record layout
  - Timeline swipe actions
  - language switching (en/uk)
  - reminder enable/disable + time update
- Run Android app and verify same flows

## Branch and tagging

- Release branch candidate: `codex/release-v0.0.2`
- Suggested release commit title:
  - `release(v0.0.2): stabilize core flows, i18n, swipe ux, and storage migrations`
- Suggested tag after merge:
  - `v0.0.2`

## Roll-forward note

- If a post-release hotfix is needed, branch from tag:
  - `codex/hotfix-v0.0.2.x`
