# Tech stack

This file documents the stack that exists. Versions are copied from `package.json`;
when they change, this file changes with them.

Verified: 2026-07-28. Node `>=20`, Yarn `3.6.4`.

## Application

| Package | Version | Why |
|---|---|---|
| `react-native` | 0.83.2 | app runtime, New Architecture enabled |
| `react` | 19.2.4 | — |
| `typescript` | 5.9.3 | pinned; see TypeScript below |
| `@react-navigation/native` | 7.1.33 | navigation core |
| `@react-navigation/native-stack` | 7.14.4 | screen stacks |
| `@react-navigation/bottom-tabs` | 7.15.5 | primary tab layout |
| `zustand` | 5.0.11 | client state |
| `@tanstack/react-query` | 5.90.21 | server state and cache |
| `zod` | 4.3.6 | schema validation at boundaries |
| `@shopify/restyle` | ^2.4.5 | themed styling primitives |
| `react-native-reanimated` | 4.2.2 | animation |
| `react-native-worklets` | 0.7.4 | must stay compatible with Reanimated |
| `react-native-gesture-handler` | 2.30.0 | gestures |
| `react-native-screens` | 4.24.0 | native screen containers |
| `react-native-safe-area-context` | 5.7.0 | safe area insets |
| `react-native-vector-icons` | ^10.3.0 | iconography |

## Storage and data

| Package | Version | Why |
|---|---|---|
| `react-native-mmkv` | 4.1.2 | primary local storage, synchronous and fast |
| `@react-native-async-storage/async-storage` | ^2.2.0 | legacy storage paths; pinned, see Known debt |
| `@supabase/supabase-js` | ^2.99.1 | optional cloud sync and backup |
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
| `eslint` | ^8.19.0 |
| `prettier` | 2.8.8 |
| `@react-native/eslint-config` | 0.83.2 |
| `@react-native/babel-preset` | 0.83.2 |
| `@react-native/metro-config` | 0.83.2 |
| `@react-native-community/cli` | 20.1.2 |
| `react-test-renderer` | 19.2.4 |

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
| Sentry | not installed yet | scheduled for H0; crash reporting is a release prerequisite |

## Known debt

| Item | Detail |
|---|---|
| `react-native-fs` | 2.20.0, effectively unmaintained. Works today; a candidate to break on newer React Native. |
| `react-native-html-to-pdf` | 1.3.0, unmaintained for years. Same risk. |
| `@react-native-async-storage/async-storage` | Pinned at `^2.2.0`. Version 3.x was tried and did not build; the cause has not been diagnosed yet. |
| `add` | `^2.0.6` is not a real dependency — it landed from a mistyped `yarn add add`. Scheduled for removal. |

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
