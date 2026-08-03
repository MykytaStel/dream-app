# Release criteria

## What this file is for

A list of what must be true before this app is offered to strangers. Not a wish list —
every line here is a gate, and a gate that can be argued down was never a gate.

Written because "it feels close" is how software ships broken. The app has been
functionally complete for a while; the question this answers is a different one.

## P0 — blocks any public release

### Nothing loses a dream

| Gate | How it is checked |
|---|---|
| Text survives the app being killed mid-sentence | draft is written on background, not only on a debounce |
| A recording interrupted by a call is kept and reported | walked on a device, with a real incoming call |
| The app killed mid-recording leaves a recoverable file | the draft holds the path from the moment recording starts |
| Editing a saved dream survives an interruption | per-dream edit draft, restored only when newer than the dream |
| Save pressed twice creates one dream | `useDreamComposerForm.saveGuarantees.test.tsx` — it did not, until the id stopped being minted per press |
| A corrupted draft does not block the composer | `dreamDraftCorruption.test.ts` — nine malformed payloads, on both draft stores and the widget snapshot |
| A failed draft write does not break typing | the autosave runs every 400ms from a timer; it reports and continues |
| A failed save is shown, not swallowed | the save alerts and sets the error line |

All seven are implemented and covered by tests.

Two of these were found to be already satisfied and two were not. The
double-press was real: `saveDream` upserts by id, and the id was generated
inside the press rather than for the dream, so two taps in one frame wrote two
dreams. The draft autosave threw on a storage failure from inside a timer,
every 400ms, on the one screen that cannot afford to stop working.

### Capture works when it is needed

| Gate | Target |
|---|---|
| Time from opening the app to a saved fragment | under 2 minutes, median |
| Failed saves | under 1% |
| Microphone permission refused | explained, with text capture still offered |
| Transcription model missing or its download interrupted | capture still works; the model is not on the critical path |
| Timezone changed between sleeping and writing | the sleep date is still the night it belongs to |

### Restore is real

A backup nobody has restored is a claim. Before release, a full restore has to be
performed **on a clean device** — not a reinstall over existing storage — and produce
the same archive, including audio.

The recovery key flow has to survive the case that matters: someone who has lost
theirs. Losing the key must be explained before it happens, not discovered after.

### The app does not leak the journal

| Gate | How it is checked |
|---|---|
| No dream text, transcript, title, tag, symbol, search query or mood value in analytics | grep the event payloads; the rule is in `docs/PRIVACY.md` |
| Cloud content is encrypted before it leaves | already true — content is one ciphertext blob |
| Network analysis stays off until explicitly enabled | `allowNetwork: false` by default, plus a consent screen before the first call |

### It runs

- Crash-free sessions stable across the closed beta.
- Builds pass on both platforms in CI.
- The manual device checklist is walked on a physical iPhone and an Android device,
  not only a simulator.
- Light and dark themes walked on every screen. Six theme defects in one sitting is
  the reason this is a gate rather than a hope.

## P1 — blocks the store, not the beta

- Onboarding leads to a first saved dream without explanation.
- Store assets: screenshots, description, privacy labels.
- Accessibility: Dynamic Type at 130–160% without broken layouts, and a pass with a
  screen reader on the capture path.
- Ukrainian and English both read as written by a person, not translated by one.

## Exit criteria for each round of real use

### Alpha — 5 to 10 people, 7 days

Not a quality gate. A comprehension gate.

Passes when, without being coached:

- they find capture;
- they can say what Home is for versus Archive;
- they are not afraid of losing entries;
- nobody hits a P0 failure.

Their unopened screens are as informative as their used ones, and cutting one is a
success, not a regret.

### Closed beta — 30 to 50 people, 3 to 4 weeks

Passes when all of these hold:

- no confirmed case of a lost entry;
- crash-free sessions stable;
- quick capture is used without explanation;
- retention does not fall to zero after the first week;
- several people describe the value in their own words as recurrence, connections, or
  returning to old dreams — **not** as "it's a nice notes app";
- people are willing to trust it with backup.

The sixth is the one that decides whether the product is what it claims. If people
describe it as a pretty journal, the differentiator has not landed, and no amount of
polish on the current surfaces will change that.

## Numbers to hold the beta against

Internal targets for the first beta, not industry benchmarks:

| Measure | Target |
|---|---|
| Completed onboarding → first dream saved | over 60% |
| Median time to first save | under 2 minutes |
| Failed saves | under 1% |
| Return within the first week | over 25% |
| Still active in week four | over 15% |
| Users with 10+ dreams who open Memory | at least 30% |
| Users with 10+ dreams who confirm a pattern | at least 20% |

The North Star behind all of them is **dreams saved per active retained user per
week** — not daily actives, not opens, not streaks. Opens measure curiosity; saves
measure whether the thing works.
