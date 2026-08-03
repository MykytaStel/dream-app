# Product

## What this is

Kaleidoscope of Dreams is a dream journal for people who want to remember more than
last night. It captures a dream in the narrow window before it dissolves, keeps every
entry on the device by default, and — as entries accumulate — surfaces the symbols,
moods and situations that keep coming back.

The archive is the product. A single entry is a note; two hundred entries are a record
of what a person's mind returns to.

## Positioning

> Write the dream down before it goes. See what keeps coming back — privately,
> without your journal leaving the device.

An earlier version of this line leaned on the app getting smarter on-device, and that
is no longer a difference. Competitors ship offline AI, on-device transcription and
semantic search today; privacy plus AI is now table stakes in this category, not a
position.

The difference that remains is narrower and harder to copy: **not what a symbol means
in general, but what recurs for one person over months and years.** A dictionary of
symbols can be written once and sold to everyone. A record of what your own mind
returns to cannot be — it has to be accumulated, and it belongs to whoever accumulated
it.

This is also why the app is not sold as a dream interpreter. That category is crowded
and its promise is a reading; this one's promise is a memory.

What this product is **not**:

- not a social network — there is no feed, no sharing to strangers, no public profile
- not therapy — it never presents a reading of a dream as clinical fact
- not a habit tracker — streaks exist to be noticed, not to punish a missed night
- not an occult product — symbols are treated as personal recurrence, not prophecy

## Who it is for

**Primary.** People already drawn to dreams, journaling, symbolism or emotional
self-reflection, who want something calm and private, and who have found existing
journaling apps shallow or cluttered.

**Secondary.** People practising lucid dreaming, people tracking nightmares or
sleep-linked mood, and design-conscious users who simply want the daily ritual to
feel good.

## Three layers of value

| Layer | What it means | State today |
|---|---|---|
| Capture | get the dream down before it is gone | strong |
| Revisit | old entries stay worth returning to | works, lacks visual coherence |
| Discovery | patterns surface without being hunted | heuristics only, AI planned |

The order matters. An app that is bad at capture never accumulates the archive that
makes discovery possible. Depth is earned from the bottom up.

## The three journeys everything is judged against

Every screen, every setting and every piece of copy should be traceable to one of
these. Work that serves none of them is work that made the app larger without making
it better — which is the failure this product is closest to.

### 1. First capture

Someone has just installed the app and has a dream in mind, or does not and wants to
start anyway. They should reach a saved entry without reading anything, choosing a
mode, or meeting a single setting.

**Judged by:** they save something. Not that they understood the app.

### 2. Morning capture

Someone wakes at six, in the dark, with a dream already dissolving. They have under a
minute of usable memory and clumsy hands.

**Judged by:** time from opening the app to a saved fragment, and whether anything was
lost when the phone rang mid-recording.

### 3. Revisit

Someone with thirty entries opens the app on an ordinary evening with no dream to
write. The archive has to give them a reason to be there.

**Judged by:** they open an old dream, and they recognise something in what the app
noticed.

## What is free, and what is not

Decided 2026-08-02, before there is anything to sell, because the answer shapes
what gets built and a decision left open gets re-argued every time it comes up.

**Everything the device can do is free.** Capture, the archive, search, patterns,
threads, monthly reports, on-device transcription. All of it.

**What costs money to run is what costs money to use:** sync, backup, and having
the archive on more than one device.

Three reasons, in order of how much they matter.

The price matches our cost. Supabase bills per user; the phone does not. A paid
tier that charges for arithmetic already running on the device is a tier that has
to be justified with a story rather than an invoice.

The differentiator stays free. Pattern-finding on the device is the reason to
choose this over a prettier notes app, and it is what someone describes when they
recommend it. In a niche this size, growth is people telling each other. Putting a
fence around the thing they would describe removes the reason to describe it.

The encryption work becomes the pitch rather than a footnote. The paid tier is the
one where data leaves the phone, and it leaves sealed with a key the server never
receives. "You pay us to store what we cannot read" is a sentence that is both true
here and rare.

What this rules out: a free tier limited by number of dreams. A journal that stops
accepting entries is not a smaller product, it is a broken one, and the archive is
the thing we are asking people to build.

## Privacy model

Dream content is among the most personal text a person will ever write down. Privacy
here is a product pillar, not a compliance checkbox.

**On the device, always.** Embeddings, symbol clustering and emotional trends run
locally. They work offline, cost nothing per use, and transmit nothing.

**In the cloud, only when asked.** Deeper summaries and interpretations require an
explicit opt-in and a per-entry confirmation. The setting is off by default and states
plainly what leaves the device.

The seam for this already exists in the codebase: `DreamAnalysisProvider` in
`src/features/analysis/model/dreamAnalysis.ts` carries a `provider` field and a separate
`allowNetwork` flag, so no network path can be reached by accident.

Cloud sync and backup are likewise optional. The app is fully usable by someone who
never creates an account.

## Risks we actively avoid

| Risk | How it shows up | Guard |
|---|---|---|
| Becoming generic | product reads as a notes app with a moon icon | positioning above is the test for every feature |
| Slowing capture | one more required field at 6am | capture flow changes need an explicit speed argument |
| Mystical drift | copy that tells users what a dream means | interpretations are offered as prompts, never verdicts |
| Noisy dashboards | statistics competing for attention | insight surfaces show few things, chosen well |
| Forced gamification | guilt for a missed night | streaks are shown, never demanded |

## Where the roadmap lives

Horizons, exit criteria and what is deliberately out of scope: [ROADMAP.md](ROADMAP.md).
What the product can do today, checked against the code: [CAPABILITIES.md](CAPABILITIES.md).
