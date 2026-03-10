# Release 0.1.0

## Theme

First public-quality beta.

## Product statement

Kaleidoskop should feel like a private, beautiful, wake-first dream journal:

- ultra-fast to open and capture right after waking
- intimate and trustworthy because the data stays local-first
- strong at preserving the original memory through voice, transcript, and mood
- increasingly valuable over time through patterns, symbols, and reflection

This release is not about adding random breadth. It is about making the app
feel intentionally differentiated and coherent enough to stand as a true
`0.1.0`.

## Differentiation

- ultra-fast wake flow
- elegant kaleidoscope visual identity
- voice + transcript + preserved emotion
- dream fingerprint and symbol tracking direction
- stylish monthly reflection/reporting direction
- privacy and intimate-space feeling

## Must-have for 0.1.0

- wake capture is available in one obvious primary action
- `Home`, `Archive`, `Dream detail`, `Insights`, and `Settings` feel visually related
- large local archives remain responsive enough for daily use
- voice note, transcript, written note, tags, and sleep context work together cleanly
- local export and local restore are understandable and safe
- privacy posture is obvious inside the product, not hidden in technical copy
- insights answer three clear questions:
  - what is happening now
  - what keeps returning
  - what should I add next
- the app has enough polish that it feels like a calm personal product, not an MVP admin panel

## Current progress

- `Wake flow`
  - reminder entry now opens a dedicated wake screen instead of forcing the composer
  - quick add keeps normal voice/text/draft actions
- `Reflection`
  - dream fingerprint v1 exists in `Insights`
  - monthly report exists as a separate editorial screen with save/share
- `Trust`
  - local export and local restore support preview, replace, and merge
- `Architecture`
  - main heavy screens now follow `screen -> hook -> model -> components`
  - `Home`, `Archive`, `Settings`, `Insights`, `Dream detail`, and `Monthly report` are no longer large monoliths
- `Code quality`
  - repo-level `lint` and `typecheck` are clean
- `Polish`
  - `Insights details` and `Settings advanced` are compressed and less panel-heavy
  - `Archive` and `Dream detail` now use quieter secondary controls and tighter spacing

## Remaining scope for this release

- `Main-screen polish pass`
  - do one final consistency pass across `Home`, `Archive`, `Dream detail`, `Insights`, and `Settings`
  - check only for remaining duplicated actions, oversized controls, or contrast outliers
- `Wake flow QA`
  - real-device pass for reminder -> wake entry -> write/speak -> save
  - verify expected behavior without microphone auto-start
- `Audio and transcription QA`
  - verify real-device recording, playback, model download, transcription, and transcript editing
- `Beta-readiness pass`
  - smoke test core flows:
    - capture
    - save
    - revisit
    - reflect
    - restore
  - prepare a short internal beta checklist
- `Shared UI cleanup`
  - keep buttons, chips, separators, and utility rows visually consistent
  - continue removing one-off helpers and repeated style logic where easy wins remain

## High-value after 0.1.0

- wake mode with an even more compressed morning-first capture surface
- dream fingerprint:
  - recurring symbols
  - repeated places
  - emotional tone
  - dominant themes
- stylish monthly dream reports
- deeper correlations with life and sleep context
- private mode upgrades:
  - softer lock states
  - blur or gated opening
  - stronger “personal sanctuary” feeling

## Later

- backend and sync
- accounts
- cloud AI analysis
- HealthKit and Health Connect
- sharing and subscriptions

## What not to do in 0.1.0

- do not turn the app into a generic analytics dashboard
- do not over-index on decorative gradients at the cost of clarity
- do not add cloud dependency to the core wake flow
- do not hide the whole product behind accordions and settings-like controls
- do not bloat `Insights` with charts that say less than a sentence would

## Definition of done

- app metadata and build metadata point to `0.1.0`
- the product story is clear enough to explain in one sentence:
  - a private, beautiful, wake-first dream journal
- core flows are coherent:
  - capture
  - save
  - revisit
  - reflect
  - restore
- the shell feels stable and intentionally designed across the main tabs
- the app is suitable for beta distribution and external product feedback
