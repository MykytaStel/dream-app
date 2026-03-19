# NATIVE-FEATURES.md

## Purpose

This document defines the native features that can meaningfully improve Kaleidoscope of Dreams.

The goal is not to add native complexity for its own sake.  
The goal is to add native capabilities that improve:

- capture speed
- privacy
- emotional product quality
- retention
- system-level integration
- premium feel

This app is a dream journal and reflection product, not a generic utility app.

---

## Product Principle

Native features should be added only when they do at least one of these:

1. reduce friction at the moment a dream is being captured
2. improve privacy or trust
3. create a premium sensory experience
4. unlock meaningful OS integration
5. improve reliability beyond what a pure React Native layer can offer

Avoid native work that is technically impressive but not product-critical.

---

## Priority Framework

### P0 — Native features worth serious priority
These are the strongest candidates for early implementation.

- Biometrics / app lock
- Home screen widgets
- Quick actions
- Deep links
- Haptics
- Native voice capture reliability
- Local notifications

### P1 — Strong polish features
These add more quality after the core flow is solid.

- Native share/export
- Better native transitions and sheets
- Android in-app widget pin prompt
- Widget refresh bridge
- Better audio playback UI through native capabilities if needed

### P2 — Later / optional
These are useful but not required early.

- Siri / App Intents
- Lock screen surfaces
- Interactive widgets beyond simple open-app flows
- Background sync helpers
- Live Activity-like experiments if they prove valuable

---

## Core Native Features

## 1. Biometrics / App Lock

### Why it fits this product
Dream content is private and intimate. Privacy is not a side feature here; it is part of the product promise.

### User value
- trust
- emotional safety
- confidence when storing sensitive dreams
- premium feel

### Recommended scope
- optional app lock
- Face ID / Touch ID on iOS
- biometric unlock on Android
- support a fallback flow
- optionally protect export and restore actions later

### MVP recommendation
Yes. Strong candidate for Phase 1 or early Phase 2.

---

## 2. Home Screen Widgets

### Why it fits this product
Dream capture is time-sensitive. The value of the product drops when the user has to navigate too much after waking up.

### User value
- faster capture
- better retention
- presence on the home screen
- ritual-like engagement

### Recommended first widget
A “Morning Capture” widget:
- short poetic prompt
- write dream action
- voice note action
- optional last saved date

### MVP recommendation
Yes. Strong early candidate.

---

## 3. Quick Actions

### Why it fits this product
Quick actions reduce launch friction from the app icon itself.

### Suggested actions
- Add dream
- Record voice note
- Open last draft
- Tonight note

### MVP recommendation
Yes. Low complexity, good value.

---

## 4. Deep Links

### Why it fits this product
Widgets, notifications, and shortcuts need reliable entry points into the app.

### Suggested routes
- `myapp://dream/new`
- `myapp://dream/voice`
- `myapp://dream/last`
- `myapp://journal`
- `myapp://insights`

### MVP recommendation
Yes. Foundational.

---

## 5. Haptics

### Why it fits this product
A subtle physical response improves the sense of refinement.

### Good uses
- save dream
- favorite / unfavorite
- archive
- start voice recording
- successful unlock

### Avoid
- loud or game-like haptics
- too many haptic moments on one screen

### MVP recommendation
Yes. Small effort, high polish.

---

## 6. Native Voice Capture Reliability

### Why it fits this product
Voice capture can be a primary input method right after waking.

### Good native support areas
- recording reliability
- interruption handling
- better file handling
- lower latency start
- clearer recording state

### MVP recommendation
Yes, if voice capture is part of the main product promise.

---

## 7. Local Notifications

### Why it fits this product
The app should support ritual, not nagging.

### Good notification types
- morning capture reminder
- evening dream intention note
- weekly reflection reminder
- reminder after several days of inactivity

### Tone guidance
Notifications should feel gentle and poetic, not productivity-driven.

### MVP recommendation
Yes.

---

## 8. Native Share / Export

### Why it fits this product
Users may want to save or share selected entries without exposing their whole journal.

### Good export forms
- text export
- image card
- PDF later
- one-entry share

### MVP recommendation
Phase 2.

---

## 9. Better Native Transitions / Sheets

### Why it fits this product
Calm, tactile motion can elevate the product.

### Use for
- capture modal
- dream detail reveal
- share sheet
- quick action entry points

### MVP recommendation
After core functionality is stable.

---

## Recommended Native Build Order

1. Deep links
2. Quick actions
3. Haptics
4. Biometrics
5. Notifications
6. Widget shared state bridge
7. First widget
8. Voice capture hardening
9. Share/export
10. Advanced polish

---

## Technical Guideline

React Native remains the main app layer.

Use native code for:
- system APIs
- widgets
- biometrics
- quick actions
- deep links
- haptics
- advanced recording behavior
- OS-specific integrations

Do not move core business logic into native code unless necessary.
Keep:
- app navigation logic
- journal business logic
- feature state
- most UI flows
inside the React Native app.

---

## Decision Rule

Before implementing a native feature, ask:

- Does it reduce friction in the dream capture moment?
- Does it improve privacy or trust?
- Does it create meaningful premium value?
- Is there a simpler React Native-only alternative?
- Is the product benefit worth the extra maintenance cost?

If the answer is weak, postpone the feature.
