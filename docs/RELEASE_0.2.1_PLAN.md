# Release 0.2.1

## Goal

Ship the next live build on top of the `0.2.0` memory-first direction without
resetting scope again.

`0.2.1` is a continuation build:

- tighten wake and detail UX
- remove obvious visual regressions
- start backend prep safely inside the repo

## Why this build exists

The app already moved toward:

- wake-first capture
- preserved raw voice
- early recurring threads
- Memory instead of generic insights

What `0.2.1` needs is not another product pivot.
It needs polish, stabilization, and backend groundwork that does not interrupt
the offline loop.

## Must-have

- app and build metadata point to `0.2.1`
- Home, Wake, Memory, and Dream Detail keep improving toward clarity
- no UI regressions that make capture or recall feel heavier
- backend schema/contracts can start without introducing auth or sync in the
  active user flow

## Scope lock

- no mandatory account
- no cloud-required capture path
- no backend-required transcription or analysis
- no new feature branch that dilutes the memory-first direction

## Backend note

`0.2.1` is the correct base for backend prep in this repo.

Use it for:

- schema
- storage conventions
- sync DTOs
- repository-facing API preparation

Reserve `0.3.0` for the first user-visible cloud release.

## Related docs

- [docs/RELEASE_0.2.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.0_PLAN.md)
- [docs/BACKEND_0.2.x_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/BACKEND_0.2.x_PLAN.md)
