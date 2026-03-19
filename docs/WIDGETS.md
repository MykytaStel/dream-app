# WIDGETS.md

## Purpose

This document defines the widget strategy for Kaleidoscope of Dreams on iOS and Android.

Widgets should support the product's central value:
capturing and revisiting dreams with minimal friction.

Widgets are not just decorative surfaces.
They should improve:
- capture speed
- retention
- ritual
- emotional connection
- product distinctiveness

---

## Product Rule

The first widget should be simple, useful, and emotionally aligned with the brand.

Do not start with an overloaded widget.

Start with one:
- clear use case
- minimal state
- strong CTA
- good deep links
- reliable refresh

---

## First Widget Recommendation

## Morning Capture

### Goal
Help users capture a dream immediately after waking up.

### Widget content
- title: Morning Capture
- short poetic line
- write dream action
- record voice note action
- optional metadata: last dream date or draft exists

### Why this should be first
- supports the main product use case
- helps both new and active users
- easy to explain in stores
- creates a unique product feel
- keeps scope under control

---

## Widget Ideas by Phase

### Phase 1
- Morning Capture

### Phase 2
- Last Dream
- Dream Streak / Weekly Reflection

### Phase 3
- Insight Widget
- Symbol Recurrence Widget
- Reflect Tonight Widget

---

## Widget UX Principles

- calm, premium, and minimal
- not crowded
- no generic productivity language
- poetic but readable
- very clear CTA hierarchy
- reliable tap behavior
- visually distinctive but restrained

---

## iOS Strategy

### Platform
Use WidgetKit.

### Recommended MVP approach
- one widget extension
- start with one family/size
- use a small shared widget snapshot
- open the app using deep links
- keep actions simple early on

### Shared data model
Store only what widgets need:
- last dream title
- last dream date
- draft exists
- streak count if needed later
- widget variant data

Do not expose the full journal database directly to the widget.

### Data sharing approach
Use an App Group container or another safe shared storage mechanism suitable for app + widget extension.

### Refresh model
When the app saves a dream:
1. update widget snapshot
2. request widget refresh
3. widget timeline/provider uses that snapshot to render current state

### iOS MVP widget states
- default / no data
- ready to capture
- draft exists
- recent dream exists

### Good first deep links
- `myapp://dream/new?source=widget`
- `myapp://dream/voice?source=widget`
- `myapp://dream/last?source=widget`

### What to avoid early
- too many widget families
- complicated interactive behavior
- overly dynamic layouts
- trying to mirror the whole app

---

## Android Strategy

### Platform
Use Jetpack Glance.

### Recommended MVP approach
- one Glance widget
- one receiver
- simple provider metadata
- small widget display model
- open app via deep links / intents
- support refresh from app after save

### Shared data model
Use a small serialized snapshot or preferences-based model.

Suggested fields:
- lastDreamTitle
- lastDreamDate
- hasDraft
- widgetMode
- optional streak

### Android MVP widget states
- no data
- ready to capture
- draft exists
- recent dream exists

### Android-specific value
Later, add in-app widget pin suggestions after the user creates several entries.

### What to avoid early
- too many update paths
- oversized layout ambitions
- trying to replicate normal Compose screens exactly
- overcomplicated variant logic

---

## Shared Architecture Between RN and Native

### React Native responsibilities
- feature UI
- journal state
- dream creation and editing
- route handling
- shared business logic
- writing widget snapshot payload
- triggering native refresh bridge

### Native responsibilities
- widget rendering
- OS-level widget lifecycle
- widget metadata / registration
- platform-specific refresh behavior
- app launch routing from widget tap

### Bridge layer responsibilities
- write widget state
- refresh widgets
- optionally expose widget capability info
- keep bridge narrow and stable

---

## Suggested Shared Widget Snapshot

```json
{
  "mode": "capture",
  "lastDreamTitle": "Falling into a glass ocean",
  "lastDreamDate": "2026-03-19T07:30:00Z",
  "hasDraft": false,
  "streakCount": 3
}
```

Keep this model small and versionable.

---

## Recommended Build Order

1. define widget UX and states
2. define shared snapshot model
3. add deep links
4. implement RN -> native bridge for widget snapshot update
5. implement iOS widget MVP
6. implement Android widget MVP
7. connect refresh after save
8. polish copy and visuals
9. add widget pin / onboarding support
10. consider second widget later

---

## Risk Areas

- making the widget visually busy
- exposing too much app data
- fragile refresh logic
- weak deep link routing
- too many widget variants early
- mixing business logic into the widget layer
- trying to over-design before the capture flow is stable

---

## Success Criteria

The first widget is successful if:
- users can open dream capture faster
- widget taps reliably land in the correct app screen
- the widget feels calm and premium
- refreshes are consistent enough to build trust
- it increases capture engagement and retention
