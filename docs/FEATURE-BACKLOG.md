# FEATURE-BACKLOG.md

## Backlog Structure

This backlog is grouped by priority:
- **P0** — required for a strong MVP
- **P1** — major improvements soon after MVP
- **P2** — differentiation and expansion
- **P3** — later-stage or experimental ideas

### Status Legend
- `[done]` — feature is available end-to-end in the product
- `[partial]` — some meaningful implementation exists, but the full user-facing flow or polish is not complete
- `[missing]` — no meaningful implementation is present in the current codebase

---

## P0 — Strong MVP

### Dream Capture
- [done] create dream entry
- [done] edit dream entry
- [done] delete dream entry
- [done] autosave draft
- [done] title + body fields
- [done] date/time support
- [partial] quick save flow

### Organization
- [done] tags
- [done] moods / emotions
- [done] dream type markers
- [done] favorites / pinned dreams
- [done] timeline or journal list
- [done] dream detail view

### Discovery
- [done] local search
- [done] simple filters
- [partial] sort recent / favorite / tagged

### Product Basics
- [done] onboarding
- [done] settings
- [done] local notifications
- [done] local-first persistence
- [done] privacy explanation

### Quality
- [done] empty states
- [done] error states
- [partial] basic analytics events
- [partial] crash reporting foundation

---

## P1 — Retention and Trust

### Better Revisit Value
- [done] calendar view
- [partial] recurring symbol entry support
- [done] home screen recap
- [done] recent patterns preview
- [done] quick re-entry from notification

### Better Capture Experience
- [done] voice-to-text
- [done] quick templates
- [done] richer mood model
- [done] intensity slider
- [done] sleep context notes

### Privacy and Safety
- [done] biometric lock
- [partial] secure export options
- [done] clearer local vs cloud settings

### Polish
- [partial] stronger onboarding copy
- [partial] first-week retention nudges
- [done] better animations
- [partial] more refined journal cards

---

## P2 — Differentiation

### Insight Layer
- [partial] recurring symbols dashboard
- [done] emotion trend cards
- [missing] nightmare frequency tracking
- [missing] lucid dream tracking
- [done] monthly dream summary
- [partial] weekly pattern cards

### Personalization
- [missing] themes
- [partial] home screen customization
- [missing] widgets
- [partial] visual entry cards
- [missing] custom reminder styles

### Export and Portability
- [done] PDF export
- [missing] Markdown/text export
- [partial] printable dream archive

### Cloud Features
- [done] account system
- [done] cloud backup
- [done] sync across devices
- [done] sync conflict handling

---

## P3 — Advanced / Experimental

### AI Features
- [missing] AI dream summaries
- [missing] AI symbol extraction
- [missing] AI timeline recap
- [missing] semantic search
- [missing] pattern clustering

### Creative Features
- [missing] dream board / collage support
- [missing] image attachments
- [done] voice note playback
- [missing] sleep ritual mode
- [missing] pre-sleep intention prompts

### Premium Expansion
- [missing] premium insight reports
- [missing] exclusive themes
- [missing] curated symbol libraries
- [missing] deeper historical comparisons

### Experimental
- [missing] wearable integration later if useful
- [partial] smart wake reminder concepts
- [missing] community-safe optional sharing concepts

---

## Features to Be Careful With

These can hurt the product if done badly:
- forced gamification
- public social features too early
- pseudo-psychology framing
- too many fields in create flow
- heavy AI messaging that feels fake
- noisy dashboards

---

## Recommended First Cut

If scope must stay tight, keep only:
- [done] create/edit/delete
- [done] timeline
- [done] dream detail
- [done] mood/tag/type
- [done] search
- [done] onboarding
- [done] reminders
- [done] local-first persistence
- [done] favorites

Then add:
- [done] calendar
- [done] voice capture
- [done] biometrics
- [done] insight previews

---

## Current Execution Order

Recommended next implementation sequence based on the current codebase:
1. Close P0/P1 partials: quick save flow, sort clarity, analytics events, crash reporting, secure export options.
2. Finish P2 differentiation core: recurring symbols dashboard, weekly pattern cards, visual entry cards, lucid/nightmare tracking.
3. Add personalization extras after differentiation is solid: themes, widgets, custom reminder styles.
4. Leave AI and premium expansion until the P2 layer is materially complete.

---

## What Will Make the App Feel Special

The biggest difference-makers are likely:
- extremely good capture UX
- beautiful archive/timeline browsing
- recurring symbols and emotions
- tasteful insight cards
- premium atmosphere
- privacy features that build trust

These matter more than an oversized feature count.
