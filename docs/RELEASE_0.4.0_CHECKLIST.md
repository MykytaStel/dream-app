# Release 0.4.0 Checklist

## Goal

Ship `0.4.0` as the first clean multi-device backup release without exposing
backend setup details to normal users.

## Product checklist

- Backup entry point in Settings is short and understandable
- Backup screen separates first-device and second-device paths
- Anonymous first-device flow clearly leads to saving an email account
- Existing-backup flow clearly leads to sign-in and password recovery
- Success states explain the next step after connect, sign-in, account save, and reset email
- Release surface hides Supabase runtime config outside `__DEV__`

## Functional checklist

- Turn on backup on a fresh device
- Save that backup under an email/password account
- Open the same backup on another device
- Run sync after sign-in and verify archive pull
- Edit a dream and verify sync back
- Delete a dream and verify it does not resurrect on another device
- Request a password reset email from the signed-out flow
- Verify export and restore still behave correctly after backup setup

## Technical checklist

- `yarn typecheck`
- `yarn lint`
- `yarn test:ci`
- iOS release build hides developer-only config
- Android release build hides developer-only config
- Bundled Supabase config works without manual runtime input

## Release decision

If the checklist above is green, keep this line as `0.4.0`.

Do not jump to `0.5.0` for backup onboarding polish alone. Use `0.5.0` only
when the next milestone adds materially new product scope beyond release
hardening.
