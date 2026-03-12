# Roadmap 0.5.1 to 0.6.0

## Product direction

`0.5.0` rebuilt daily value around capture, revisit, and reflection.

The next range should turn Kaleidoskop from a strong local journal into a
clearer, more connected product without losing the fast wake-up flow.

This range should deliver four things together:

- stronger everyday capture and follow-up loops
- a real backend and sync layer that users can trust
- calmer and more intentional UI across key screens
- a clearer product shape that can justify `0.6.0` as a meaningful step up

## Rules for this range

- local capture must stay usable even when backend or sync is unavailable
- backend should support product value, not become the visible headline again
- every release should ship one concrete user-facing feature, not only plumbing
- UI work should reduce noise and ambiguity, not add more decorative complexity
- `Dream detail`, `Home`, `Archive`, `Memory`, and `Settings` should converge
  toward one system instead of drifting apart

## Release 0.5.1

### Theme

Wake flow and capture quality.

### Main outcomes

- make the first 30 seconds after waking feel faster and less fragile
- reduce unfinished or low-quality captures before they become archive debt
- make transcript and refine work feel closer to capture, not buried later
- keep the new `0.5.0` revisit surfaces, but make them easier to act on

### New feature

- add a dedicated `Wake Flow` quick-capture path with:
  - one-tap voice or text start
  - optional ultra-light mood/context chips
  - stronger draft recovery when the user is interrupted

### Backend scope

- add a clearer local mutation queue for dream edits, transcript changes, and
  analysis updates
- standardize changed-at metadata for all editable dream fields
- prepare sync payloads so drafts, transcript state, and analysis state can
  round-trip cleanly later

### UI and UX scope

- redesign the wake-entry surface around one-hand use and lower cognitive load
- improve draft/recovery states so “continue where I left off” feels obvious
- tighten post-save branching so the next step is always concrete and singular

### Scope lock

- no social or public sharing yet
- no heavy analytics redesign in this release

## Release 0.5.2

### Theme

Cloud trust and sync confidence.

### Main outcomes

- make backup and sync feel dependable for normal users, not only for setup
- reduce fear around restore, overwrite, and “what is newer?”
- make attachment handling and cross-device updates more transparent
- keep the app calm even when sync is doing real work in the background

### New feature

- add a `Sync activity / restore timeline` surface where the user can see:
  - last successful sync
  - last backup snapshot
  - device freshness
  - restore preview before applying destructive changes

### Backend scope

- move from basic sync into a more explicit incremental change flow
- support safer upload/download handling for audio attachments
- add conflict rules for:
  - edited transcripts
  - local analysis
  - mood/context changes
- store enough sync metadata to explain why a change won or lost

### UI and UX scope

- surface sync state in a calmer, user-readable way across `Settings` and
  targeted recovery moments
- add restore previews that read like product UI, not admin UI
- introduce lightweight per-dream sync status only when it matters

### Scope lock

- no live collaboration
- no generic backend control center

## Release 0.5.3

### Theme

Threads, reviews, and archive depth.

### Main outcomes

- make the archive feel like a living memory system, not only a storage list
- let users stay with one thread across multiple dreams and time periods
- turn transcript and analysis work into a real review habit
- make monthly and multi-dream review feel richer than “cards in a stack”

### New feature

- add a dedicated `Dream thread` view that can:
  - group related dreams around one recurring signal
  - show a simple time sequence of matches
  - let the user save or pin a thread for later review

### Backend scope

- persist derived metadata for recurring signals and saved thread state
- add recompute hooks after sync, restore, or import so reflection data stays
  fresh
- support optional server-side storage for saved monthly/thread snapshots when
  cloud is enabled

### UI and UX scope

- move from card-heavy thread browsing to a more editorial timeline pattern
- make `Memory`, `Monthly report`, and thread detail feel like one family
- reduce repeated labels, dead empty states, and duplicate summary blocks

### Scope lock

- no fully open-ended AI assistant
- no generic chat UI

## Release 0.6.0

### Theme

Connected reflection product.

### Main outcomes

- Kaleidoskop should feel like a complete private dream workspace, not just a
  journal with extras
- cross-device archive, review loops, and reflection tools should all feel
  product-grade
- the information architecture should be cleaner and easier to explain to a new
  user
- backend should be stable enough that new features can build on it instead of
  around it

### Flagship feature set

- ship a `Review workspace` that unifies:
  - weekly review
  - monthly report
  - saved threads
  - work queue
- add a user-facing `Collections` or `Saved sets` concept for important dreams,
  active threads, and review-ready entries

### Backend scope

- make cloud-connected archive a first-class product capability
- support background-friendly sync behavior with safer retries and clearer
  device state
- stabilize snapshot/restore behavior enough for confident multi-device use
- prepare the backend boundary for future premium or advanced reflection
  features without hard-coding product assumptions now

### UI and UX scope

- do a cross-app navigation and hierarchy pass so `Home`, `Capture`, `Dream
  detail`, `Archive`, `Memory`, and `Settings` feel intentionally related
- refresh onboarding and first-run education around:
  - local-first privacy
  - optional cloud connection
  - how review loops work
- raise the overall visual quality bar from “polished indie utility” toward
  “premium private journal”

### Definition of success

By `0.6.0`, a user should be able to:

1. capture a dream quickly after waking
2. return later on the same or another device
3. see the next best transcript/analysis/reflection step
4. follow one recurring thread across multiple dreams
5. trust that backup, sync, and restore will not feel risky or confusing

## What not to do in this range

- do not let backend work consume whole releases without visible user value
- do not reintroduce dashboard-heavy UI after the `0.5.0` cleanup
- do not build cloud AI features before local and sync foundations are stable
- do not spread the same feature across `Home`, `Archive`, `Memory`, and
  `Detail` with four different interaction patterns
- do not make the app slower during the wake-up capture moment

## Decision point after 0.6.0

If this range succeeds, the next step can branch into:

- premium reflection and advanced analytics
- health integrations
- richer export/share and private presentation surfaces

If it does not, the right move is not more feature breadth, but another
stabilization and coherence pass before going wider.
