# Roadmap 0.0.12 to 0.0.15

## Product direction

Next four releases should not add random depth everywhere. They should make the
app feel more intentional:

- less oversized UI on Home
- faster access to common actions
- cleaner separation between capture, archive, insights, and progress
- stronger visual hierarchy so each screen is not just a long stack of cards

The main rule for these releases:

- every version must ship at least one visible design improvement
- every version must ship at least one practical workflow improvement
- no cloud-AI dependency is required

## Key product decisions

### 1. Home first block is too large

Yes. The current first Home block is useful, but it takes too much vertical
space before the archive starts.

The right direction is:

- keep one clear primary CTA
- compress stats into lighter chips
- reduce decorative weight
- stop treating the hero like a landing page

Target outcome:

- user sees `Record now`
- user sees `Continue draft` if needed
- user sees archive faster, ideally within the first screen without much scroll

### 2. Achievements should not dominate the main flow

Achievements are useful, but they should not live as a heavy central block in
the same place as insights.

Better structure:

- keep one lightweight milestone teaser in Home or Insights
- move the full achievements list into its own focused area or collapsible
  section
- make achievements feel optional and motivating, not like admin UI

### 3. Version should be visible, but quiet

Yes, add app version in a small muted footer, the way many production apps do.

Best placement:

- bottom of `Settings`
- optionally also bottom of the `Insights` screen if we want a secondary place

Format:

- `Kaleidoskop v0.0.12`
- small font
- muted color
- centered

### 4. Insights need structure, not more rows

Current Insights work functionally, but visually they read like one long report.

The next direction should be:

- split insights into compact sections with stronger headers
- introduce visual modules:
  - summary strip
  - patterns
  - emotions
  - voice archive
  - milestones
- reduce dense `InfoRow` usage where a chip group, stat tile, or mini-card is
  more readable

## Release 0.0.12

### Theme

Home compression and quick actions.

### Visual changes

- Shrink the Home hero height by about 20-30%
- Make stat chips lighter and visually tighter
- Reduce spacing between hero and timeline
- Improve dream-card pressed state
- Add a better quick-actions affordance for long press

### Functional changes

- Long-press actions on timeline cards become first-class:
  - open
  - edit
  - star/unstar
  - archive/unarchive
  - delete
- Add a subtle selected/pressed visual state for long-press
- Add optional haptic feedback on long press if the library/setup is acceptable
- Add version footer in `Settings`

### Scope lock

- do not redesign all cards yet
- do not move achievements yet
- do not split Insights yet

### Definition of done

- Home shows more archive content above the fold
- Long press feels intentional, not hidden
- Settings footer shows current version cleanly

## Release 0.0.13

### Theme

Insights redesign, phase 1.

### Visual changes

- Replace the long-scroll report feel with grouped sections
- Add a compact top summary strip:
  - total dreams
  - voice dreams
  - streak
  - transcribed dreams
- Redesign emotion patterns as chip clusters or mini-panels instead of raw rows
- Give recurring themes and recurring symbols stronger visual identity

### Functional changes

- Split Insights into clearer modules on one screen:
  - snapshot
  - emotions
  - patterns
  - voice archive
  - milestones teaser
- Add lightweight period context:
  - last 7 days
  - last 30 days
  - all time
- Keep current analytics logic, but improve presentation and grouping

### Scope lock

- no new deep analytics engine
- no charts library unless current UI clearly requires it
- no separate tab yet

### Definition of done

- Insights feel browsable, not like a settings page
- user can scan top-level state in a few seconds
- milestones stop overpowering the rest of analytics

## Release 0.0.14

### Theme

Achievements and progress layer cleanup.

### Visual changes

- Pull full achievements out of the heavy Insights flow
- Add a compact milestone teaser card:
  - current unlocked count
  - next milestone progress
- Improve milestone visual language so it feels like progress, not a data table

### Functional changes

- Move the full achievements list into:
  - either a dedicated `Progress` screen
  - or a deeper expandable screen from Insights
- Add `next unlock` focus:
  - single highlighted target
  - short explanation why it matters
- Add lightweight celebration states for milestone unlocks

### Scope lock

- keep milestone rules simple
- do not add gamification noise
- no XP, levels, streak freezing, or artificial reward systems

### Definition of done

- achievements become supportive, not cluttering
- insights become more analytical
- progress gets its own place in the product structure

## Release 0.0.15

### Theme

Capture flow polish and archive readability.

### Visual changes

- Redesign new/edit dream layout so sections feel more guided
- Improve tag/input rows and chip spacing across the app
- Make detail screen action groups feel less like a wall of controls
- Polish archive cards:
  - better metadata grouping
  - better transcript/audio/mood badges
  - more consistent spacing

### Functional changes

- Add quick templates for dream capture:
  - text first
  - voice first
  - detailed entry
- Add smarter empty states:
  - no dreams
  - no filtered matches
  - no insights yet
- Add archive quick filters on Home that are faster to toggle
- Add a small `About this build` or `Version` cell in Settings footer area:
  - app version
  - storage schema version
  - export format version if useful

### Scope lock

- no sync
- no AI generation
- no account system
- no heavy onboarding flow yet

### Definition of done

- capture feels faster
- timeline cards feel calmer and more readable
- the app has a more polished production-like shell

## Recommended execution order

1. `0.0.12`: shrink Home hero, add version footer, finish long-press polish
2. `0.0.13`: restructure Insights into modules and reduce report feel
3. `0.0.14`: move achievements into their own focused place
4. `0.0.15`: polish capture and archive end-to-end

## What not to do in this range

- Do not keep stacking large cards on Home
- Do not let Insights become a generic admin dashboard
- Do not mix achievements, analytics, and settings-style rows in one dense block
- Do not add AI just because architecture exists
- Do not add too many one-off toggles before the core UX is clean

## Release naming summary

- `0.0.12`: Home compression + quick actions
- `0.0.13`: Insights redesign
- `0.0.14`: Progress and achievements cleanup
- `0.0.15`: Capture and archive polish
