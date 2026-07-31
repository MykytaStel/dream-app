# Tech stack

This file documents the stack that exists. Versions are copied from `package.json`;
when they change, this file changes with them.

Verified: 2026-07-28. Node `>=20`, Yarn `3.6.4`.

## Application

| Package | Version | Why |
|---|---|---|
| `react-native` | 0.86.2 | app runtime, New Architecture enabled |
| `react` | 19.2.8 | — |
| `typescript` | 5.9.3 | pinned; see TypeScript below |
| `@react-navigation/native` | 7.3.14 | navigation core |
| `@react-navigation/native-stack` | 7.18.6 | screen stacks |
| `@react-navigation/bottom-tabs` | 7.18.14 | primary tab layout |
| `zustand` | 5.0.14 | client state |
| `@tanstack/react-query` | 5.101.4 | server state and cache |
| `zod` | 4.4.3 | schema validation at boundaries |
| `@shopify/restyle` | ^2.4.5 | themed styling primitives |
| `react-native-reanimated` | 4.5.3 | animation |
| `react-native-worklets` | 0.11.3 | must stay compatible with Reanimated |
| `react-native-gesture-handler` | 3.1.0 | gestures |
| `react-native-screens` | 4.26.2 | native screen containers |
| `react-native-safe-area-context` | 5.8.0 | safe area insets |
| `react-native-vector-icons` | ^10.3.0 | iconography |

## Storage and data

| Package | Version | Why |
|---|---|---|
| `react-native-mmkv` | 4.1.2 | primary local storage, synchronous and fast |
| `@react-native-async-storage/async-storage` | ^2.2.0 | legacy storage paths; pinned, see Known debt |
| `@supabase/supabase-js` | ^2.110.9 | optional cloud sync and backup |
| `react-native-url-polyfill` | ^3.0.0 | URL support required by the Supabase client |
| `react-native-fs` | ^2.20.0 | file access for export and audio |

## Capture and media

| Package | Version | Why |
|---|---|---|
| `whisper.rn` | ^0.5.5 | on-device speech transcription |
| `react-native-audio-recorder-player` | 4.5.0 | recording and playback |
| `react-native-nitro-modules` | 0.34.1 | native module bindings used by MMKV |

## Platform integration

| Package | Version | Why |
|---|---|---|
| `@notifee/react-native` | ^9.1.8 | local notifications with rich scheduling |
| `react-native-biometrics` | ^3.0.1 | app lock |
| `react-native-haptic-feedback` | ^2.3.4 | tactile feedback |
| `@react-native-community/datetimepicker` | ^8.6.0 | sleep date and time input |
| `react-native-html-to-pdf` | 1.3.0 | PDF archive export; see Known debt |

## Tooling

| Package | Version |
|---|---|
| `jest` | ^29.6.3 |
| `eslint` | 9.39.5 |
| `prettier` | 3.9.6 |
| `@react-native/eslint-config` | 0.86.2 |
| `@react-native/babel-preset` | 0.86.2 |
| `@react-native/metro-config` | 0.86.2 |
| `@react-native-community/cli` | 20.1.2 |
| `react-test-renderer` | 19.2.8 |
| `@testing-library/react-native` | 14.0.1 |
| `test-renderer` | 1.2.0 |

`@testing-library/react-native` 14 requires `test-renderer`, the modern replacement
for `react-test-renderer`. Both are present because the older suites still import the
latter; it goes once nothing does.

## Observability

| Package | Version | Why |
|---|---|---|
| `@sentry/react-native` | 8.20.0 | crash reporting, registered as an observability provider |

Off unless `SENTRY_DSN` is set — see `.env.example`. No DSN ships in the repository,
and its absence leaves the console provider in place.

## Deliberate omissions

The most useful part of a stack document is what is missing on purpose. Each of these
has been considered and rejected for now, with the condition that would reverse the
decision.

| Not used | Why | What would change it |
|---|---|---|
| React Hook Form | `features/dreams/components/useDreamComposerForm.ts` already covers the need; the forms are small | a form with genuinely complex cross-field validation |
| FlashList | the archive performs acceptably today | measured jank on a real archive, not a guess |
| Redux Toolkit | Zustand handles the amount of client state we have | state that needs middleware, time travel or strict action logs |
| SQLite | MMKV fits the current data model | vector search in H3, which MMKV cannot serve |
| RevenueCat | there is nothing to sell yet | a monetization decision, which needs retention data first |

## Known debt

| Item | Detail |
|---|---|
| `react-native-fs` | 2.20.0, effectively unmaintained. Works today; a candidate to break on newer React Native. |
| `react-native-html-to-pdf` | 1.3.0, unmaintained for years. Same risk. |
| `@react-native-async-storage/async-storage` | Pinned at `^2.2.0`. Version 3.x was tried and did not build; the cause has not been diagnosed yet. |
| `jest` | Pinned at 29. Jest 30 breaks every suite: `@react-native/jest-preset@0.86.2` depends on jest 29 packages and nests `jest-mock@29.7.0`, while `jest-runtime@30` calls an API only jest-mock 30 has. Moves when react native ships a preset built against 30. |
| `eslint` | Pinned at 9. `@react-native/eslint-config@0.86.2` declares `eslint: "^8.0.0 \|\| ^9.0.0"`, so 10 is not an option yet. A `resolutions` entry forces `eslint-plugin-ft-flow` to 3.0.11, because the upstream config nests 2.0.3, which calls an API eslint 9 removed. |
| `react-native-mmkv` / `react-native-nitro-modules` | Both pinned below the latest release. `react-native-audio-recorder-player@4.5.0` — the newest published version — ships nitrogen-generated Kotlin built against `react-native-nitro-modules@^0.29.2`, and calls `updateNative`, which no longer exists in nitro 0.36.x. Upgrading nitro breaks the Android build at `:react-native-audio-recorder-player:compileDebugKotlin`. Since mmkv 4.3.2 is itself generated against nitro 0.35.9, mmkv and nitro cannot move until audio-recorder-player is rebuilt against modern nitro, or is replaced. All three declare `react-native-nitro-modules: "*"` as a peer, so no tool warns about this. |

## Patched dependencies

One dependency is patched. Patches are applied by Yarn's own `patch:` protocol
(`resolutions` in `package.json`, patch file in `.yarn/patches/`), not by a
`postinstall` script: the patch is part of dependency resolution, so it cannot
silently fail to apply the way a lifecycle hook can. It survives `yarn install`
by construction, in CI as well as locally.

| Package | Why |
|---|---|
| `react-native-libsodium@1.7.0` | Adds JSI bindings for `crypto_secretstream_xchacha20poly1305`. The algorithm was already compiled into the vendored libsodium — `nm libsodium.a` shows all sixteen symbols defined — but the binding layer exposed none of them. Without it, encrypting a recording means holding the whole file in memory, which is what capped audio at 16 MB. |
| `react-native-html-to-pdf@1.3.0` | Removes `pdfbox-android`, and with it BouncyCastle. The library renders through Android's own WebView and PrintDocumentAdapter; PDFBox was used solely to count pages, a field this app never reads. `PdfRenderer` has been in the framework since API 21 and gives the same number. Measured: 4 MB off what every Android user downloads. |

The patch touches **one C++ file and nothing else**. TypeScript for the new
functions lives in `src/services/crypto/libsodiumSecretStream.ts` rather than in
a patch of the package's own types: everything expressible in TypeScript belongs
in this repo, where it is reviewed and tested. That also keeps the patch small
enough to re-apply by hand if upstream moves.

To change it: `yarn patch react-native-libsodium`, edit the folder it prints,
then `yarn patch-commit -s <folder>`.

If upstream ever ships secretstream bindings, delete the `resolutions` entry and
the patch file; `libsodiumSecretStream.ts` keeps working, since it only reads
JSI globals.

## Upgrade policy

Upgrades go in waves, never all at once:

1. Each wave is its own branch.
2. `yarn typecheck`, `yarn test` and `yarn lint` must pass before merge.
3. Both platforms must build before merge.
4. Major version bumps get their own commit, so a bisect can find the culprit.
5. Formatting-only changes never share a commit with logic changes.

New Architecture is enabled (`android/gradle.properties`, `newArchEnabled=true`), which
removes the largest historical risk from React Native upgrades.

## TypeScript

Pinned at 5.9.3 deliberately. TypeScript 7 ships a compiler rewritten in Go and offers a
large speed improvement, but the surrounding toolchain — `@react-native/eslint-config`,
the Babel preset, typescript-eslint — needs to be verified against it first. That
verification is a standalone experiment, not part of a routine upgrade wave.
