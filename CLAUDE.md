# CLAUDE.md

## Project Overview

**Kaleidoscope of Dreams** is a mobile application focused on dream journaling, emotional reflection, and personal pattern discovery.

The product should help users:
- capture dreams quickly after waking up
- revisit old dreams in a meaningful way
- identify symbols, emotions, and recurring patterns
- build a private ritual around sleep, memory, and self-reflection

This should not feel like a generic note-taking or productivity app.
It should feel calm, elegant, intimate, and memorable.

---

## Product Vision

The long-term goal is to create a dream journal that is:
- beautiful enough to feel premium
- simple enough to use daily
- structured enough to be useful over time
- private enough to feel safe
- distinctive enough to stand out from existing dream apps

The app should combine:
- fast capture
- emotional depth
- symbolic structure
- strong UX
- useful insight generation
- tasteful personalization

---

## What Makes This Product Different

The product should avoid the common problems of many journaling and dream apps:
- boring UI
- weak retention loops
- poor search and discovery
- generic habit-tracker feeling
- excessive fluff without real value
- overly mystical or overly clinical tone

This app should sit in the middle:
- emotionally warm but not childish
- reflective but not pseudo-scientific
- visually rich but not overloaded
- smart but not overwhelming

---

## Core Product Principles

1. **Fast capture matters most**
   Users forget dreams quickly. The main flow must be extremely fast.

2. **Review must feel rewarding**
   Old entries should become more useful over time through tags, symbols, insights, and beautiful browsing.

3. **Privacy is a feature**
   Dream content is personal. Trust must be earned through clear privacy decisions.

4. **Mood and atmosphere matter**
   Visual design, copy, motion, and sound should support a calm and intimate experience.

5. **Depth should unlock gradually**
   Advanced features should not clutter the primary experience.

---

## Core User Flows

### Primary Flow
- open app after waking up
- tap quick add
- write or dictate dream
- optionally choose mood, symbols, or dream type
- save immediately

### Secondary Flow
- revisit dream history
- search or filter by symbol, tag, mood, or type
- compare patterns over time
- reflect on emotional or symbolic repetition

### Tertiary Flow
- receive a reminder
- add a pre-sleep note or intention
- review streaks or insight cards
- export or back up data

---

## MVP Scope

### Must Have
- create, edit, delete dream entries
- title and body text
- dream date and time
- tags
- moods / emotions
- dream types (lucid, nightmare, vivid, normal)
- favorite / pin
- timeline or journal list
- local search
- basic filters
- onboarding
- local notifications
- local-first storage

### Strong MVP Enhancers
- calendar view
- recurring symbol support
- quick templates for dream entry
- voice-to-text capture
- gentle empty states
- biometric lock

---

## Post-MVP Direction

### Product Expansion
- cloud sync
- optional account system
- export to PDF / Markdown / text
- insight cards
- trend analysis
- personalized reminders
- widgets
- shareable visual cards

### Premium / Advanced
- AI-assisted summarization
- AI-assisted symbol extraction
- theme customization
- deeper sleep and dream insight dashboards
- premium dream boards / image associations
- advanced privacy features

---

## Technical Direction

The app is planned as a **React Native + TypeScript** project.

### Preferred Frontend Stack
- React Native
- TypeScript
- React Navigation
- Zustand or Redux Toolkit
- TanStack Query for server state
- React Hook Form
- Zod
- MMKV or AsyncStorage
- Reanimated
- Gesture Handler
- FlashList
- i18n support when needed

### Backend Options

#### Option A — Fast MVP
- Supabase
- PostgreSQL
- Auth
- Storage
- Edge Functions

#### Option B — More Control
- Node.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- background jobs

#### Option C — Ecosystem Speed
- Firebase Auth
- Firestore
- Cloud Functions
- Cloud Storage
- Analytics / Crashlytics

Choose backend direction based on:
- MVP speed
- budget
- sync complexity
- AI plans
- monetization model
- maintenance cost

---

## Native Code Philosophy

Use React Native by default, but do not avoid native code when it clearly improves product quality.

Good native use cases:
- biometrics
- secure local storage
- widgets
- richer notifications
- background syncing
- audio / voice capture improvements
- performance-sensitive transitions
- platform-specific integrations

Rule:
- stay simple when possible
- go native when the user experience or platform integration truly benefits

---

## Engineering Principles

Use both **modern patterns** and **proven patterns**.

### Proven Principles
- separation of concerns
- predictable state flow
- modular architecture
- explicit types
- defensive error handling
- simple naming
- readable code

### Modern Principles
- feature-based structure
- hooks for reusable logic
- server-state vs client-state separation
- schema validation
- offline-first thinking
- composable components
- typed API boundaries
- gradual enhancement

### Avoid
- god components
- vague abstractions
- dependency bloat
- hidden magic
- untyped APIs
- architecture for architecture’s sake

---

## Performance Priorities

Performance should be considered from the start.

Important targets:
- fast app launch
- responsive typing
- smooth navigation
- smooth list performance
- minimal unnecessary renders
- low memory overhead
- graceful offline behavior

Guidelines:
- use optimized list rendering
- keep forms lightweight
- profile before major optimization work
- avoid heavy animations on critical flows
- split large screens before they become unmaintainable

---

## Privacy and Trust

Dream content is highly personal.

The app should:
- minimize unnecessary data collection
- clearly distinguish local vs cloud data
- provide secure storage where needed
- avoid invasive analytics
- support biometric protection
- treat trust as a core product pillar

---

## AI Collaboration Guidance

When helping on this project, an AI assistant should:
- preserve product intent
- prefer practical solutions over trendy overengineering
- recommend modern tools only when they create real value
- keep performance on real devices in mind
- avoid rewriting large files without reason
- suggest backend and design options with tradeoffs
- respect privacy and offline-first needs
- provide scalable solutions instead of quick hacks

---

## Delivery Priority Order

Always prioritize:
1. fast and satisfying dream capture
2. maintainable architecture
3. privacy and reliability
4. retention-friendly UX
5. smooth performance
6. visual polish
7. deeper insights
8. premium and AI features

---

## Summary

Kaleidoscope of Dreams should become:
- a beautiful dream journal
- a meaningful reflection tool
- a calm and memorable mobile experience
- a product with strong emotional differentiation
- a technically modern but grounded app
