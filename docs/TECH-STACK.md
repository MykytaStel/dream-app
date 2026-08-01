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
| FlashList | measured, not assumed — see below | jank measured on a device, which needs the Hermes number this measurement does not have |
| Redux Toolkit | Zustand handles the amount of client state we have | state that needs middleware, time travel or strict action logs |
| SQLite | MMKV fits the current data model | vector search in H3, which MMKV cannot serve |
| RevenueCat | there is nothing to sell yet | a monetization decision, which needs retention data first |

### What a large archive actually costs

`__tests__/archiveScalePerf.test.ts` measures it. Both lists are already
virtualized, so the row count on screen does not grow with the archive; what
grows is the pipeline that runs before the list. Median of seven runs, one
frame at 60 Hz being 16.7 ms:

| Stage | 250 | 1000 | 5000 |
|---|---|---|---|
| Archive: month scope, search, sections | 0.07 ms | 0.14 ms | 0.55 ms |
| Home timeline, no search | 0.66 ms | 1.98 ms | 10.5 ms |
| Home timeline, search (filter + score + re-sort) | 0.66 ms | 1.95 ms | 9.9 ms |
| Stats aggregates | 0.39 ms | 1.10 ms | 5.4 ms |

Two readings, and they point in different directions.

The archive is not the bottleneck and swapping its list would not make it one
bit faster: 0.14 ms at a thousand dreams is a hundred times under a frame. That
is because `useArchiveBrowseState` narrows to the selected month before it
searches or filters, so its cost tracks the size of a month, not the size of the
archive. FlashList would replace a list that is already free.

The home timeline is where size is felt. It filters, scores and sorts every
dream on each committed keystroke, and 250 → 5000 costs 0.66 → 10.5 ms, close to
linear. A thousand dreams — about three years of writing one down every night —
leaves ample room. Five thousand does not, and that is the number to revisit.

One caveat is load-bearing: these run on V8 on a developer Mac, and the app runs
on Hermes on a phone. **That multiplier has not been measured** — there is no
Hermes engine on this machine to measure it with, and the `hermes` on `PATH` is
an unrelated tool with the same name. So treat every figure as a floor. It does
not weaken the archive conclusion, which would need a 100× multiplier to change;
it is exactly why the home timeline at 5000 needs a device before anyone
optimizes it.

## Known debt

| Item | Detail |
|---|---|
| `react-native-fs` | 2.20.0, effectively unmaintained. Works today; a candidate to break on newer React Native. |
| `react-native-html-to-pdf` | 1.3.0, unmaintained for years. Same risk, and now patched — see Patched dependencies. |
| `@react-native-async-storage/async-storage` | Pinned at `^2.2.0`. Version 3.x was tried and did not build; the cause has not been diagnosed yet. |
| `jest` | Pinned at 29. Jest 30 breaks every suite: `@react-native/jest-preset@0.86.2` depends on jest 29 packages and nests `jest-mock@29.7.0`, while `jest-runtime@30` calls an API only jest-mock 30 has. Moves when react native ships a preset built against 30. |
| `eslint` | Pinned at 9. `@react-native/eslint-config@0.86.2` declares `eslint: "^8.0.0 \|\| ^9.0.0"`, so 10 is not an option yet. A `resolutions` entry forces `eslint-plugin-ft-flow` to 3.0.11, because the upstream config nests 2.0.3, which calls an API eslint 9 removed. |
| `react-native-mmkv` / `react-native-nitro-modules` | Both pinned below the latest release. `react-native-audio-recorder-player@4.5.0` — the newest published version — ships nitrogen-generated Kotlin built against `react-native-nitro-modules@^0.29.2`, and calls `updateNative`, which no longer exists in nitro 0.36.x. Upgrading nitro breaks the Android build at `:react-native-audio-recorder-player:compileDebugKotlin`. Since mmkv 4.3.2 is itself generated against nitro 0.35.9, mmkv and nitro cannot move until audio-recorder-player is rebuilt against modern nitro, or is replaced. All three declare `react-native-nitro-modules: "*"` as a peer, so no tool warns about this. |

## Patched dependencies

Two dependencies are patched. Patches are applied by Yarn's own `patch:` protocol
(`resolutions` in `package.json`, patch file in `.yarn/patches/`), not by a
`postinstall` script: the patch is part of dependency resolution, so it cannot
silently fail to apply the way a lifecycle hook can. It survives `yarn install`
by construction, in CI as well as locally.

| Package | Why |
|---|---|
| `react-native-libsodium@1.7.0` | Adds JSI bindings for `crypto_secretstream_xchacha20poly1305`. The algorithm was already compiled into the vendored libsodium — `nm libsodium.a` shows all sixteen symbols defined — but the binding layer exposed none of them. Without it, encrypting a recording means holding the whole file in memory, which is what capped audio at 16 MB. |
| `react-native-html-to-pdf@1.3.0` | Removes `pdfbox-android`, and with it BouncyCastle. The library renders through Android's own WebView and PrintDocumentAdapter; PDFBox was used solely to count pages, a field this app never reads. `PdfRenderer` has been in the framework since API 21 and gives the same number. Measured: 4 MB off what every Android user downloads. |

Both are deliberately small enough to re-apply by hand if upstream moves. The
libsodium patch touches **one C++ file and nothing else** — TypeScript for the
new functions lives in `src/services/crypto/libsodiumSecretStream.ts` instead,
where it is reviewed and tested like the rest of the code. The PDF patch is four
lines and a removed dependency line.

To change either: `yarn patch <package>`, edit the folder it prints, then
`yarn patch-commit -s <folder>`.

Both are worth offering upstream, and both stop being needed the moment they are
accepted: delete the `resolutions` entry and the patch file.
`libsodiumSecretStream.ts` keeps working either way, since it only reads JSI
globals.

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
