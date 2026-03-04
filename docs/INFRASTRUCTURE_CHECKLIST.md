# Kaleidoskop Infrastructure Checklist

## Stage 1: Code Quality Gate (Done in repo)
- CI workflow for PR/push:
  - `yarn typecheck`
  - `yarn lint`
  - `yarn test:ci`
- Jest native setup for `gesture-handler`, `reanimated`, and `mmkv` mocks.

## Stage 2: Release Workflow (Done in repo baseline)
- Branch strategy:
  - Feature branches from `dev/kaleidoskop-v0.0.1`
  - Merge to release branch (`release/v0.0.x`)
  - Tag release (`v0.0.x`)
- Android build job:
  - GitHub Actions `Android Release` (`workflow_dispatch` and `v*` tags)
  - Produces `app-release.aab` artifact
- iOS baseline:
  - Keep manual local archive + TestFlight upload (Xcode) to avoid paid macOS CI minutes.

## Stage 3: Observability (Done in repo baseline)
- App-level observability abstraction (`src/services/observability`)
- Global JS error capture hook in `AppProvider`
- Current provider is console (free, no vendor lock).

## Stage 4: External Services (Next)
- Free-first target providers:
  - Crash reporting + product analytics: Firebase (Crashlytics + Analytics)
- Keep provider abstraction and switch implementation from console to Firebase after credentials are ready.
- Privacy rule:
  - Never send full dream text/audio content as analytics payload.

## Stage 5: Distribution
- iOS:
  - Internal TestFlight -> external beta
- Android:
  - Internal testing track -> closed testing

## Input needed from product owner (Mykyta)
- Repository setup:
  - Push this project to GitHub repo `dream-app` and enable GitHub Actions.
- Access/secrets checklist:
  - See `docs/GITHUB_SECRETS.md`
- Store readiness:
  - Apple Developer account access (for TestFlight/App Store)
  - Google Play Console access (for Android release)
- Firebase setup (when ready):
  - Firebase project for `dream-app`
  - `GoogleService-Info.plist` (iOS) + `google-services.json` (Android)
- Privacy baseline:
  - Confirm policy: no raw dream text/audio in analytics payloads.
