# Release 0.2.0

## Theme

Memory-first differentiation.

## Why this release exists

`0.1.0` established a real product shell:
- wake-first capture,
- local archive and detail flows,
- voice and transcription support,
- reflection and reporting foundations,
- export/restore and observability basics.

That is not enough anymore.
The market is already full of dream apps that combine some mix of:
- journaling,
- AI interpretation,
- voice notes,
- recurring symbols,
- calm visuals.

`0.2.0` exists to make Kaleidoskop feel meaningfully different after only
`2-3` recorded dreams.

## Product rule

After a few dreams, the user should be able to say:

- this app is faster in the waking state
- this app keeps my actual memory, not just cleaned text
- this app notices what returns

If the product still feels like a generic journal with AI summaries, this
release has failed.

## Main outcomes

- tighten the wake-state entry so the primary path is even calmer and more
  obvious
- make preserved raw voice more visible inside dream detail and post-save flows
- surface recurring signals early:
  - symbols
  - people
  - places
  - emotional echoes
- ship `Dream Threads Lite` so a dream can point to related earlier dreams
- reframe the current `Insights` direction toward `Memory` without turning the
  product into an analytics dashboard

## Starting point

The current codebase already has useful foundations:

- dedicated wake entry screen
- local-first dream capture and archive flows
- audio recording and playback support
- transcription pipeline
- dream detail and archive browsing
- fingerprint and monthly-report foundations in stats screens
- import/export and observability infrastructure

That means `0.2.0` should bias toward product differentiation, not rebuilding
the shell again.

## Must-have for 0.2.0

- app and build metadata point to `0.2.0`
- release documentation clearly defines the new direction
- wake capture remains the clear primary action from a reminder or cold open
- original voice is preserved and intentionally presented as part of the memory
  object
- dream detail can show lightweight recurring signals
- a first pass of related-dream linking exists
- the existing fingerprint direction is reused or reshaped into a stronger
  memory object
- `Insights` is reduced or reframed where needed so it supports memory
  continuity instead of generic dashboards

## Scope lock

- no subscriptions
- no community or social feed
- no per-dream image generation
- no full dream graph visualization
- no HealthKit or Health Connect expansion
- no accounts/backend dependency that can block the local wake flow

## Definition of done

- app metadata and build metadata point to `0.2.0`
- repo documentation points to `0.2.0` as the active target
- the release story is clear in one sentence:
  - a private, wake-first dream memory product that preserves voice and shows
    recurring threads early
- the next implementation work is organized around:
  - wake capture
  - memory signals
  - dream threads
  - memory-first screen framing
