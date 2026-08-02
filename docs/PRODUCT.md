# Product

## What this is

Kaleidoscope of Dreams is a dream journal for people who want to remember more than
last night. It captures a dream in the narrow window before it dissolves, keeps every
entry on the device by default, and — as entries accumulate — surfaces the symbols,
moods and situations that keep coming back.

The archive is the product. A single entry is a note; two hundred entries are a record
of what a person's mind returns to.

## Positioning

> A private dream archive that gets smarter without leaving your phone.

Most apps in this category compete on being a prettier notes app. That is a category,
not a difference. The difference here is that the pattern-finding runs on the device,
so depth costs the user no privacy.

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
