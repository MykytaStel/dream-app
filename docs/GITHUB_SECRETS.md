# GitHub Secrets and Access

## Required now (to run current CI)
- No secrets required.

## Required for Android store release (later)
- `ANDROID_UPLOAD_KEYSTORE_BASE64`
  - Base64 encoded release keystore file.
- `ANDROID_UPLOAD_STORE_PASSWORD`
  - Keystore password.
- `ANDROID_UPLOAD_KEY_ALIAS`
  - Alias name.
- `ANDROID_UPLOAD_KEY_PASSWORD`
  - Alias password.

## Required for iOS distribution (later)
- Apple Developer account access (App Store Connect).
- Signing certificates/profiles or App Store Connect API key.

## Required for Firebase integration (later)
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

## Notes
- Keep secret values only in GitHub Secrets, never in repo.
- For now release pipeline uses debug signing for build artifact generation only.
