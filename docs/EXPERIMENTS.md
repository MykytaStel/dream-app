# Experiments

## What this file is for

Separating what we know from what we hope. Everything here is a **hypothesis** — a
belief about users that has not been checked against users.

It exists because the fastest way to build the wrong thing is to write a guess into a
roadmap, where it stops looking like a guess. A feature in `ROADMAP.md` is committed
work. A belief in this file is a question, and the only way it leaves is by being
answered.

Each entry says what is believed, what would confirm it, and what would kill it. An
entry with no kill condition is not a hypothesis; it is a preference wearing one.

---

## H1 — People will come back to old dreams

**Believed:** the archive, not the entry, is the product. Given thirty entries, people
will reopen old dreams without being pushed.

**Confirms it:** in the closed beta, over a third of users with ten or more entries
open an entry older than a week, unprompted, more than once.

**Kills it:** entries are written and never reopened. If that happens, this is a
capture tool with an archive attached, and the entire Discovery layer — patterns,
threads, monthly reports, semantic search — is built on sand. This is the single most
load-bearing belief in the product.

**Status:** untested. Everything downstream of Memory depends on it.

---

## H2 — Recurrence is the differentiator people can name

**Believed:** what makes this app different is not privacy and not AI, both of which
competitors ship. It is a personal record of what recurs for one person over months.

**Confirms it:** beta users describe the value in their own words as recurrence,
connections, or returning to old dreams.

**Kills it:** they describe it as "a nice journal", or ask for symbol meanings. The
first means the differentiator has not landed; the second means they wanted the
crowded category we deliberately left.

**Status:** untested, and directly checked by a beta exit criterion.

---

## H3 — Quick Capture beats a good form

**Believed:** a thirty-second path with four fields will produce more saved dreams than
a well-organised long form, even though the long form collects more.

**Confirms it:** median time to first save under two minutes, and detail fields filled
*after* saving at a meaningful rate.

**Kills it:** people save fragments and never return to add anything, and the archive
fills with untagged, unmooded entries that patterns cannot work with. That would mean
detail has to be collected at capture time after all, and Reflect Later is a nice idea
that loses data.

**Status:** partly built, untested.

---

## H4 — Asking the goal at onboarding helps

**Believed:** asking whether someone is here to remember more, notice repeats, practise
lucidity or work with nightmares lets the app order its secondary cards usefully.

**Confirms it:** people who answer show better week-one retention than people who skip.

**Kills it:** most skip it, or the answer does not predict what they use. Then it is a
question asked for the app's benefit rather than the user's, and it should go — an
extra screen before the first capture is expensive.

**Status:** not built. Worth building only because it is cheap and skippable.

---

## H5 — People will pay for sync, not for insight

**Believed:** the paid tier should be encrypted backup and multi-device, because that
is what costs money to run and what people fear losing. Insight should stay free.

**Confirms it:** people enable backup and, when asked, say they would pay something for
it; the price hypothesis of $3.99/month or $24.99–29.99/year survives contact.

**Kills it:** people are indifferent to backup but ask for deeper analysis. Then the
whole free-versus-paid line drawn in `PRODUCT.md` is wrong, and the honest response is
to change it rather than to sell sync harder.

**Status:** untested. No paywall exists, deliberately — a paywall before retention is
guessing at what people would pay for.

---

## H6 — Calm mode is wanted, not just tidy

**Believed:** some people want the app to stop explaining itself, permanently.

**Confirms it:** beta users find and enable it, and keep it on.

**Kills it:** nobody turns it on. That would not mean the text is fine — it would mean
the text should have been cut rather than made optional, which is already the standing
rule. A toggle nobody uses is a subtitle nobody needed.

**Status:** built. Cheap enough that shipping it untested was reasonable; not cheap
enough to build a second one like it before this one is checked.

---

## H7 — Night capture matters

**Believed:** someone opening the app at four in the morning needs a warm dark screen
regardless of their theme, and will not go and change a setting first.

**Confirms it:** alpha users who capture at night do not complain about glare, and
nobody turns the setting off.

**Kills it:** people find the theme switching disorienting, or turn it off. Then the
right answer is a dimmer, not a different palette.

**Status:** built and on by default. The default is the hypothesis.

---

## Retired

Nothing yet. When a hypothesis is answered it moves here with the answer and the date,
because a belief that was tested and dropped is more useful to the next person than one
that quietly vanished.
