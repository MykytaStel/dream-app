# Roadmap

## How this roadmap works

Work is organised into stages, not dates. A stage closes when its exit criterion is
met. This keeps the plan honest: a date can be missed quietly, an exit criterion
cannot.

Each stage assumes the previous one is done. The order is a dependency chain, not a
preference — and it is the part of this document least open to negotiation.

## What changed, and why this file was rewritten

The previous roadmap had four horizons: foundation, ship v1.0, premium feel, AI layer.
Its H0 planned the React Native upgrade, Sentry and a light theme. All three shipped;
`package.json` carries React Native 0.86.2 and Sentry 8.20.0, and `daylight` is a
registered light theme with per-theme contrast tests. A roadmap still planning
delivered work is worse than no roadmap: it hides what is actually left.

The deeper reason for the rewrite is a change of diagnosis. The old plan assumed the
product needed more capability. It does not. It has fast text and voice capture, local
storage, drafts, an archive with search and filters and a calendar, nightmares, lucid
practice, statistics, patterns, monthly reports, reminders, widgets, quick actions,
biometric lock, import, export and optional encrypted sync.

**The risk is no longer missing features. It is too many features with no proven
hierarchy.** A new user cannot tell which single problem this app solves best, because
it currently presents itself as a morning notepad, an archive, an analytics tool, a
lucid trainer, a nightmare tool, cloud storage and a dashboard builder at once.

Everything below follows from that.

## Stages to v1.0

| | Stage | Exit criterion | Estimate |
|---|---|---|---|
| 0 | Product freeze | docs match the code; release criteria written; P0 list agreed | 16–24 h |
| 1 | Capture reliability | quick capture path is fast and cannot lose an entry | 40–60 h |
| 2 | Information architecture | Home, Archive and Memory each have one clear job | 45–70 h |
| 3 | Activation | a new user saves a dream without being taught | 30–50 h |
| 4 | Trust and recovery | restore works from a clean device; sync failures are legible | 40–70 h |
| 5 | Beta and release | analytics, crash-free sessions, accessibility, store assets | 35–55 h |

**Total: 206–329 hours** — roughly 6–9 weeks full time, or 12–20 weeks at 15–20 hours a
week. This excludes billing infrastructure, semantic search, on-device embeddings,
dream images and any web client.

### Stage 0 — Product freeze

No new large features. Bring the documentation back in line with the code, write down
what actually blocks a public release, and separate confirmed needs from hypotheses.
Cheapest stage, and it unblocks the rest: without an honest list of what works, there
is no way to decide what is missing.

### Stage 1 — Capture reliability

Split the composer into **Quick Capture** — text or voice, sleep date, optional title,
save, in thirty to sixty seconds — and **Reflect Later**, which offers mood, intensity,
tags, lucidity, nightmare and sleep context *after* the entry is safe. A **Guided
Entry** mode exists for people who want structure, and is never the default morning
screen.

Then the failure list, every item of which has to be walked deliberately: the app
killed during recording, no space on the device, microphone permission refused, the
transcription model missing or its download interrupted, transcription failing, Save
pressed twice, the timezone changing, a corrupted draft, a sync conflict, biometrics
unavailable after an OS update, and a lost recovery key.

### Stage 2 — Information architecture

Home keeps one primary action, the active draft, three recent dreams, one revisit card
and a backup line only when something is wrong. Search, the calendar, filters and saved
searches move to Archive and live behind a filter sheet rather than all being visible
at once. Memory shows what the archive can support at its current size, and drops the
achievements and weekly goals that make a journal feel like a habit tracker the product
explicitly refuses to be.

### Stage 3 — Activation

The current onboarding explains the product across four slides and then leaves the user
on a tab bar. It should instead promise one thing, optionally ask what they are here
for, and open capture. Reminders, backup, biometric lock and the transcription model
are offered in context after the first or third entry, not all at once at the start.

### Stage 4 — Trust and recovery

A backup nobody has restored is a claim, not a feature. Restore has to be exercised on
a clean device, sync errors have to say what happened and what to do, and the recovery
key flow has to survive someone who has lost theirs.

### Stage 5 — Beta and release

Analytics on the activation funnel — without dream text, transcripts, titles, tags,
symbols, search queries or mood values ever leaving the device. Crash-free sessions,
accessibility, store assets, and the two rounds of real use described in
`RELEASE_CRITERIA.md`.

## After beta, and only on a signal

| Work | Starts when | Estimate |
|---|---|---|
| Paid sync | retention exists and someone has said they would pay | 45–80 h |
| User-confirmed patterns | people actually open Memory | 40–70 h |
| Semantic search | real archives are large enough to search | 120–220 h |
| Visual dream board | research shows demand | 50–90 h |
| Cloud reflection credits | willingness to pay is confirmed | 40–70 h |

## Explicitly out of scope

| Not doing | Why |
|---|---|
| A social feed, public profiles, community sharing | conflicts with the positioning and adds moderation burden |
| A universal symbol dictionary | the opposite of the product's actual difference |
| An interpretation marketplace, therapist integration | scope and liability, with no evidence of demand |
| Apple Health and wearables | speculative until sleep data proves it adds something the journal cannot |
| AI-generated dream art as a core feature | testable later as credits, never as the foundation |
| More achievements, themes or dashboard widgets | each one makes the hierarchy problem worse |
| A web client | large surface, no signal |

Each of these grows scope, privacy burden or moderation burden without proving the one
thing that has to be true first: that a person records dreams regularly and comes back
to the archive.

## What would change this plan

- **Alpha shows people cannot find capture.** Stage 3 moves ahead of Stage 2.
- **Someone loses an entry.** Everything stops until Stage 1 is closed.
- **Nobody opens Memory in the beta.** User-confirmed patterns leave the post-beta list
  entirely rather than being built on an unproven surface.
- **Retention is strong before the beta ends.** Paid sync moves earlier.
