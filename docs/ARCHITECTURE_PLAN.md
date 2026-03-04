# Kaleidoskop Architecture Plan

## Goal

Build Kaleidoskop as a mobile product that can start as a clean offline MVP and
grow into a cloud-connected app without rewriting the core architecture.

The system should be:

- modular
- predictable
- design-system friendly
- backend-ready
- easy to refactor in small steps

## Core engineering principles

- UI and business logic must be separated
- styles, copy, spacing, and repeated values should move into constants/tokens
- screens should orchestrate feature modules, not own all logic
- data access should go through repositories, not direct storage calls from many places
- new technologies should be added behind adapters, not spread across the app
- the app should remain usable offline even after backend integration starts

## Recommended frontend architecture

### Target structure

```txt
src/
  app/
    navigation/
    providers/
  components/
    ui/
    animation/
  constants/
    copy/
    limits/
    routes/
  features/
    dreams/
      components/
      screens/
      hooks/
      services/
      repository/
      model/
      utils/
    stats/
      components/
      hooks/
      services/
      model/
    settings/
      components/
      hooks/
      services/
    reminders/
    ai/
  services/
    api/
    storage/
    analytics/
    audio/
    auth/
  theme/
    tokens/
    variants/
  types/
  utils/
```

### Responsibility split

- `components/ui`: reusable presentational building blocks
- `theme`: colors, spacing, radii, typography, shadows, semantic tokens
- `constants`: labels, limits, route names, shared enums that are not domain state
- `features/*`: domain-specific UI and logic
- `services/api`: backend client and network adapters
- `services/storage`: MMKV and later sync/cache helpers
- `services/audio`: recording/playback abstraction
- `features/*/repository`: read/write access for a specific domain

## UI and logic separation rules

### UI layer

Should contain:

- layout
- rendering
- user input wiring
- loading, empty, and error states

Should not contain:

- storage writes
- fetch logic
- analytics calls
- backend shape mapping
- business calculations beyond trivial display formatting

### Hooks / services / repository layer

Should contain:

- create/update/delete logic
- validation
- derived stats
- sync orchestration
- transformation between local models and backend DTOs

## Design-system direction before final design exists

Even without a full design, the code should already be structured like a design
system.

### Start with semantic tokens

- `colors.background`
- `colors.surface`
- `colors.surfaceMuted`
- `colors.textPrimary`
- `colors.textSecondary`
- `colors.border`
- `colors.success`
- `colors.warning`
- `colors.danger`
- `colors.accent`

### Extract reusable constants

- form labels
- placeholder text
- button titles
- spacing values
- max lengths
- tag limits
- date formats

### Build reusable patterns

- `ScreenContainer`
- `SectionHeader`
- `StatCard`
- `TagChip`
- `MoodSelector`
- `FormField`
- `EmptyState`

This lets the app become visually consistent before Figma is ready.

## Localization strategy

Kaleidoskop should be built with localization in mind from the early MVP stage.

### Initial language scope

- English
- Ukrainian

### Rules

- do not hardcode user-facing copy directly in feature logic long-term
- keep translation keys grouped by domain
- use a single localization layer across the app
- dates, pluralization, and future notifications should also go through locale-aware formatting

### Recommended structure

```txt
src/
  constants/
    i18n/
      en/
        common.ts
        dreams.ts
        stats.ts
        settings.ts
      uk/
        common.ts
        dreams.ts
        stats.ts
        settings.ts
```

### Recommended approach

- start with extracted copy/constants now
- migrate those constants into translation dictionaries next
- use a library such as `i18next` with a thin app wrapper
- keep the default locale simple and deterministic during MVP

### Practical note

The current copy extraction step is a good transition point. We do not need full
runtime language switching today, but all new user-facing copy should be written
so it can move into localization files cleanly.

## State management strategy

For current scope:

- local component state for isolated form state
- repositories for persistence
- React Query for async/server state when backend arrives

Avoid introducing global Zustand stores everywhere unless there is a real shared
state need. Use it only for app-wide state such as:

- auth session
- onboarding state
- user preferences cache
- active sync status

## Data architecture

### Current direction

- local-first with MMKV
- explicit typed model for dream entries
- repository entry point instead of direct `listDreams()` from screens later

### Next refactor step

Move from this:

- `screens -> storage`

To this:

- `screens -> hooks/useDreams -> repository -> storage adapter`

### Suggested domain model

```ts
type DreamEntry = {
  id: string;
  createdAt: number;
  updatedAt: number;
  sleepDate: string;
  title?: string;
  text?: string;
  transcript?: string;
  audioLocalUri?: string;
  audioRemoteUrl?: string;
  mood?: 'negative' | 'neutral' | 'positive';
  tags: string[];
  lucidity?: 0 | 1 | 2 | 3;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
};
```

## Backend recommendation

## Recommended choice: Supabase

For Kaleidoskop, Supabase is the best default choice right now because it gives:

- Postgres database
- auth
- storage for audio and images
- row-level security
- edge functions
- acceptable speed for MVP
- an easier path to production than building custom backend infrastructure too early

### Why not custom backend first

A custom Node.js backend is valid later, but right now it adds too much work:

- auth
- file storage
- database design
- admin tooling
- security
- deployment
- migrations

That is too much overhead before the product loop is stable.

### Why not Firebase first

Firebase is viable, but Supabase is a better fit if you want:

- relational dream data
- flexible reporting queries
- cleaner future analytics
- easier AI/report pipelines

## Suggested backend stack

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions
- OpenAI API later for summaries/transcription/image prompts

## Suggested backend data model

### Tables

`profiles`

- `id`
- `display_name`
- `created_at`

`dream_entries`

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `sleep_date`
- `title`
- `text`
- `transcript`
- `mood`
- `lucidity`
- `audio_path`
- `ai_summary`
- `ai_sentiment`

`dream_tags`

- `id`
- `dream_entry_id`
- `tag`

`pre_sleep_surveys`

- `id`
- `user_id`
- `sleep_date`
- `stress`
- `alcohol`
- `major_event`

`user_settings`

- `user_id`
- `reminder_enabled`
- `morning_reminder_time`
- `theme_preference`
- `ai_enabled`

### Storage buckets

- `dream-audio`
- `dream-images`

## Backend integration strategy

### Phase 1

Offline only:

- keep MMKV as source of truth
- no auth
- no sync

### Phase 2

Backend-ready local architecture:

- add repository interfaces
- add DTO mappers
- add `syncStatus`
- add user/session abstraction even before auth is enabled

### Phase 3

Cloud integration:

- add Supabase client
- implement sign-in
- upload audio to storage
- sync dream entries to Postgres
- keep local cache for offline reads

### Phase 4

AI and reports:

- edge functions for summarization
- scheduled monthly report generation
- optional transcription pipeline

## Suggested interfaces

```ts
interface DreamsRepository {
  list(): Promise<DreamEntry[]>;
  getById(id: string): Promise<DreamEntry | null>;
  create(input: CreateDreamInput): Promise<DreamEntry>;
  update(id: string, patch: UpdateDreamInput): Promise<DreamEntry>;
  remove(id: string): Promise<void>;
}

interface AudioService {
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ localUri?: string }>;
  play(uri: string): Promise<void>;
  stop(): Promise<void>;
}
```

These interfaces matter because later you can swap:

- MMKV storage implementation
- Supabase implementation
- local transcription
- remote transcription

without rewriting every screen.

## Rules for adding new technologies

When adding any new technology:

- create one adapter module
- keep the library import isolated there
- expose app-friendly functions/interfaces
- do not couple screen code to vendor-specific APIs

Examples:

- HealthKit goes behind `healthService`
- notifications go behind `reminderService`
- OpenAI goes behind `aiService`
- Supabase goes behind `apiClient` + repositories

## Testing strategy

Testing should grow with the product, not become ceremony too early. The right
goal is confidence around core flows, not maximum test count.

### Testing layers

#### 1. UI smoke tests

Start early.

Use for:

- screen rendering
- empty states
- button presence
- basic form interactions
- critical text appearing in the UI

Recommended tools:

- Jest
- React Native Testing Library

#### 2. Domain/unit tests

Add when logic becomes non-trivial.

Use for:

- dream validation
- streak calculations
- tag normalization
- date helpers
- repository transformations

#### 3. Integration tests

Add when repositories, sync, or backend orchestration appear.

Use for:

- repository behavior
- storage persistence
- sync status transitions
- API mapping

#### 4. End-to-end tests

Add when the main journaling flow stabilizes and release risk becomes real.

Use for:

- create dream flow
- save and reopen flow
- reminder-triggered open and save flow
- future auth/sync flows

Recommended tool:

- Detox

### Testing priority for Kaleidoskop

#### Now

- UI tests for core screens
- unit tests for pure helpers only when extracted

#### Next

- repository tests
- stats calculation tests

#### Later

- E2E coverage for critical flows

### Practical rule

- do not test implementation details
- test behavior that protects product confidence
- prioritize dream creation and persistence over visual micro-details
- add tests when a module becomes reusable or risky

## Immediate cleanup plan

### Step 1

Refactor current code into feature folders without changing behavior.

### Step 2

Introduce constants for:

- labels
- placeholders
- limits
- stat titles

### Step 3

Create reusable UI building blocks:

- `FormField`
- `Chip`
- `InfoRow`
- `ScreenContainer`

### Step 4

Replace direct storage usage with repository functions.

### Step 5

Prepare backend contracts and Supabase schema, but do not integrate auth/sync
until the offline loop feels stable.

## Suggested order of implementation

### v0.0.1

- finish offline dream flow
- add detail screen
- add edit flow
- add local reminders
- refactor to feature/repository structure
- add base UI smoke tests for critical screens

### v0.0.2

- add search/filter
- add pre-sleep survey
- extract shared UI/form primitives
- prepare backend schema and sync contract
- introduce English/Ukrainian localization layer

### v0.1.0

- add Supabase auth
- add cloud sync
- upload audio
- user settings persistence
- add repository/integration tests for sync-related flows

### v0.2.0

- add transcription
- add AI summaries
- add monthly reports
- add E2E tests for critical release flows

## Decision summary

- Frontend: React Native with feature-based modular architecture
- Local data: MMKV behind repositories
- Backend: Supabase
- AI layer: add later behind service adapters
- Design approach: semantic tokens + reusable primitives before final Figma
- Localization: English and Ukrainian from the early architecture stage
- Testing: UI smoke tests early, broader automated coverage as complexity grows
- Main priority: structure the code now so later growth does not create chaos
