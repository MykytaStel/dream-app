# Architecture

## Layering

Dependencies flow in one direction:

```
screens → hooks → services → repository → storage
```

A layer may import from layers to its right, never to its left. The rule exists so that
a change to persistence cannot reach up and break a screen, and so that the interesting
logic can be tested without mounting a component.

Alongside this chain sits `model/`, which holds pure functions: no React, no native
modules, no I/O. `model/` imports nothing from the chain above. This is where the
product's actual reasoning lives — streak calculation, pattern matching, presentation
shaping — and it is trivially testable precisely because it touches nothing.

## Feature structure

Code is organised by feature, not by technical layer, so that the files which change
together live together.

```
src/features/
  analysis/     dream analysis providers and settings
  dreams/       capture, archive, detail, timeline
  onboarding/   first-run flow
  practice/     dream practice guidance
  reminders/    notification scheduling
  security/     app lock
  settings/     preferences, backup, export, import
  stats/        insight, patterns, achievements, reports
  widgets/      home screen widget bridge
```

Inside a feature, the conventional subfolders are `components`, `hooks`, `model`,
`repository`, `screens`, `services`. A feature uses only the ones it needs.

Cross-cutting code lives outside features:

```
src/
  app/          navigation, linking, error reporting
  components/   shared UI primitives and animation
  constants/    copy, limits
  i18n/         locale provider and store
  services/     api, auth, cloud, haptics, observability, security, storage
  theme/        tokens, themes, appearance
```

## State

| Kind of state | Tool | Notes |
|---|---|---|
| Client state | Zustand | UI state, filters, session flags |
| Server state | TanStack Query | cache, invalidation, background refresh |
| Persistence | MMKV | synchronous, fast enough to read during render |
| Validation | Zod | applied at boundaries, not sprinkled through the app |

## Sync

Cloud sync is optional; the app is fully functional without it.

- `services/cloud/sync.ts` — the sync loop: what to push, what to pull, in what order.
- `services/cloud/syncResolution.ts` — conflict resolution when the same dream changed
  in two places.
- `services/cloud/syncState.ts` — per-entry sync status, surfaced in the UI so the user
  can see what is and is not backed up.
- `services/cloud/audioUpload.ts`, `audioDownload.ts` — voice recordings move separately
  from entry text, because they are large and can fail independently.

Deletions propagate as tombstones rather than as absence, so a delete on one device is
not undone by a stale copy on another.

Each `Dream` carries `syncStatus`, `lastSyncedAt` and `syncError`
(`features/dreams/model/dream.ts`), which keeps sync state attached to the entry it
describes instead of in a parallel structure that can drift.

## Widget contract

The app writes a snapshot; both native widget implementations read it. The snapshot is
versioned so the native side can be updated independently.

The authoritative shape is `DreamWidgetSnapshot` in
`src/features/widgets/model/dreamWidget.ts`:

```ts
type DreamWidgetSnapshot = {
  version: 1;
  generatedAt: number;
  locale: AppLocale;
  privacyMode: 'redacted';
  state: 'empty' | 'draft' | 'revisit' | 'insight';
  title: string;
  subtitle: string;
  meta: string;
  primaryAction: DreamWidgetAction;   // { label, url }
  secondaryAction: DreamWidgetAction;
  lastDream: { id: string; title: string; date: string } | null;
};
```

Two properties matter beyond the field list:

- **`privacyMode: 'redacted'`** — the widget never renders dream body text. A home
  screen is visible to anyone holding the phone; the snapshot is built so that leaking
  it would leak little.
- **The native side renders, it does not decide.** `title`, `subtitle`, `meta` and both
  actions are computed in TypeScript. Widget copy changes ship in a JS update rather
  than a store release.

Deep link targets are built in `features/widgets/model/dreamWidgetLinks.ts` and resolved
by `app/navigation/linking.ts`.

## Native layer

| Module | Platforms | Style |
|---|---|---|
| `DreamWidget` | iOS + Android | legacy bridge |
| `AudioUpload` | iOS + Android | legacy bridge |
| `AudioRecorder` | Android | legacy bridge |
| `BackupFileIntent` | Android | legacy bridge |

New Architecture is enabled, but all four custom modules are written against the legacy
bridge API (`RCT_EXTERN_MODULE` on iOS, `ReactContextBaseJavaModule` on Android) and run
through the interop layer.

The cost is not mainly performance. It is that **the boundary is untyped**: the
TypeScript side declares the module's shape by hand, and codegen never checks that
declaration against the native signature. A mismatch surfaces at runtime, on a user's
device, rather than at build time.

Migration to TurboModules starts with `DreamWidget`, which is called on every dream save
and carries the most structured payload. The remaining three follow once the pattern is
established.

## When to write a native module

Write one only when at least one of these holds:

1. **The computation is genuinely heavy** and measured to be a bottleneck in JavaScript.
   Measured, not assumed.
2. **The platform API has no maintained binding.** If a well-kept library exists, use it.
3. **The integration is OS-level** — widgets, quick actions, App Intents, share sheets.

Otherwise take the library. Every custom native module is two implementations to
maintain and one more thing that can break on a React Native upgrade.

The clearest upcoming case is H3: on-device embeddings need to hand large `Float32Array`
buffers to JavaScript. Serialising those through the legacy bridge would dominate the
runtime, which is exactly the situation JSI and TurboModules exist for.
