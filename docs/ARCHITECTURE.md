# ARCHITECTURE.md

## Architecture Goal

Build a mobile application that is:
- maintainable
- scalable
- fast
- privacy-conscious
- local-first
- easy to evolve from MVP into a richer synced product

---

## Recommended Approach

Use a **feature-oriented React Native architecture** with clear boundaries between:
- UI
- business logic
- persistence
- server communication
- platform integrations

This app should be able to start as local-first and later gain cloud sync without a rewrite.

---

## Recommended Stack

### App Layer
- React Native
- TypeScript
- React Navigation

### State Layer
- Zustand or Redux Toolkit for app/client state
- TanStack Query for server state

### Forms and Validation
- React Hook Form
- Zod

### Persistence
- MMKV for lightweight fast local storage
- SQLite / WatermelonDB / Realm later if structured local data grows significantly

### UX / Motion
- Reanimated
- Gesture Handler
- FlashList

### Error and Quality Tooling
- Sentry
- optional analytics provider
- lightweight feature flags later

---

## Layered Structure

```txt
src/
  app/
  navigation/
  features/
    dreams/
    insights/
    onboarding/
    settings/
    search/
  components/
    ui/
    common/
  services/
    api/
    storage/
    notifications/
    analytics/
    security/
  store/
  hooks/
  theme/
  utils/
  constants/
  types/
```

---

## Feature Module Guidance

Each feature can contain:
- components
- hooks
- services
- types
- schema / validation
- mappers
- helpers

Example:

```txt
features/dreams/
  components/
  hooks/
  screens/
  services/
  dream.types.ts
  dream.schema.ts
  dream.mappers.ts
```

---

## State Management Boundaries

### Use Local App State For
- UI toggles
- temporary flow state
- modal visibility
- selected filters
- onboarding flags

### Use Persistent Local Storage For
- dream entries
- local preferences
- reminder settings
- lock settings
- draft state

### Use Server State For
- user profile if accounts exist
- sync status
- remote config
- premium entitlements
- cloud-backed insights

---

## Data Flow Principles

Prefer this flow:
- screen triggers user action
- feature hook coordinates logic
- service handles persistence / API
- state updates are explicit and typed
- UI reacts to well-defined state

Avoid putting business logic directly inside screen components.

---

## Data Model Direction

### DreamEntry
- id
- title
- body
- createdAt
- updatedAt
- dreamDate
- mood
- emotions[]
- tags[]
- symbols[]
- dreamType
- isFavorite
- isLucid
- isNightmare
- intensity
- notes

### UserSettings
- theme
- remindersEnabled
- reminderTime
- biometricLockEnabled
- exportPreferences

### InsightSnapshot
- recurringSymbols
- recurringEmotions
- dreamFrequency
- nightmareFrequency
- lucidFrequency
- weeklyTrend
- monthlyTrend

---

## Offline-First Strategy

The app should work well without network access.

Rules:
- saving a dream should never depend on the backend
- local storage is the first write target
- sync should be additive, not blocking
- drafts should survive app interruptions
- conflict resolution should be simple and predictable

Recommended early strategy:
- local-first persistence
- optional background sync later
- server timestamps added when cloud is introduced

---

## Backend Evolution Strategy

### Phase 1
- no required backend
- local storage only
- export support

### Phase 2
- optional auth
- cloud backup
- sync
- profile

### Phase 3
- AI processing
- subscriptions
- remote config
- admin content or curated symbol packs

---

## Security Architecture Notes

The app handles personal content.

Use:
- secure storage for sensitive settings and tokens
- biometric lock for optional app protection
- clear encryption strategy when cloud sync exists
- minimal analytics payloads
- no raw dream text in third-party analytics by default

---

## Navigation Guidance

Recommended initial navigation:
- Home
- Journal
- Add Dream
- Insights
- Settings

Alternative simpler MVP:
- Home
- Dreams
- Add
- Settings

Do not overcomplicate navigation early.

---

## Performance Guidance

Watch for:
- large list rendering costs
- expensive filtering on every keystroke
- large rich text payloads
- oversized screen components
- unnecessary cross-feature re-renders

Prefer:
- memoization only where justified
- debounced search
- optimized list items
- smaller feature hooks
- lazy loading of heavy secondary screens

---

## Testing Strategy

### Unit Tests
- pure helpers
- mappers
- validation rules
- formatting utilities

### Integration Tests
- dream create/edit flows
- filter/search flows
- persistence flows
- settings flows

### Manual QA Priorities
- first-launch onboarding
- add dream speed
- offline save reliability
- app resume behavior
- notification handling
- biometric lock flow

---

## Recommended Principle

The architecture should be boring in the best sense:
- clear
- stable
- easy to reason about
- ready for growth
- not overbuilt too early
