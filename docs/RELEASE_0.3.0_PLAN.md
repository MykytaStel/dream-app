# Release 0.3.0

## Goal

Ship the first user-visible cloud foundation release without breaking the
offline capture loop that defines Kaleidoskop.

`0.3.0` is not the final sync release. It is the first release where the app
starts carrying account and sync state in the product surface and local model.

## Must-have

- app and build metadata point to `0.3.0`
- offline capture still works with no account
- dream records carry local sync metadata
- typed sync mappers exist for local dream -> Supabase contract translation
- Settings show cloud/session state instead of saying cloud is simply "off"
- live Supabase client wiring can be configured without a compile-time secret bake
- anonymous cloud session can connect and disconnect from Settings
- pending local dreams can be uploaded to Supabase without blocking offline capture
- delete sync uses tombstones so removed dreams do not resurrect on pull
- local-vs-remote sync conflicts use explicit last-write-wins rules with visible bookkeeping
- named account upgrade/sign-in exists on top of the anonymous cloud session

## Product rule

- no auth gate before first capture
- no required sync inside the first-save path
- no cloud-required transcription or analysis
- no visual churn that distracts from the product transition

## UI scope

- add a visible cloud/status section in Settings
- allow runtime Supabase project config from Settings while the release is still internal
- keep `Home`, `Wake`, `Memory`, and `Dream Detail` stable while model metadata grows
- preserve the current typography and palette

## Backend scope

- keep Supabase schema and app contracts aligned
- add local sync-status lifecycle support in repositories
- support future remote hydration and upload bookkeeping
- land the first real client/auth adapter without making sync mandatory
- ship upload-only sync first and defer pull/conflict resolution until tombstones and merge rules are explicit
- sync delete state through tombstones before multi-device rollout

## Release phases

1. Foundation: version bump, release doc, sync metadata, contract mappers.
2. Surface: session-aware Settings section and sync summary.
3. Transport slice 1: runtime client config and anonymous auth session.
4. Transport slice 2: upload orchestration for pending local dreams.
5. Transport slice 3: remote pull and tombstones for safe delete propagation.
6. Transport slice 4: explicit conflict policy and device merge rules.

## What follows after this

- multi-device sync
- polish the account onboarding copy and rollout

## Related docs

- [docs/RELEASE_0.2.4_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.4_PLAN.md)
- [docs/BACKEND_0.2.x_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/BACKEND_0.2.x_PLAN.md)
