# Dream App Product Strategy

## Product thesis

Dream App is a mobile dream journal focused on one high-value moment: the first
minutes after waking up. The product should help the user capture a dream fast,
preserve the original memory, and turn raw entries into patterns, insights, and
motivation to keep recording.

## Target user

- People who want to remember dreams consistently
- Users interested in self-reflection, lucid dreaming, and sleep habits
- Users who will not tolerate a slow or complex morning flow

## Core product principles

- Capture must be possible in under 30 seconds
- Voice-first is a differentiator, not a side feature
- Local-first storage is acceptable for MVP
- AI should summarize and enrich, not block the core journaling loop
- Privacy must be understandable and explicit because dream data is sensitive
- The product should be ready for English and Ukrainian support

## MVP scope

### Entry creation

- Create one dream entry with title, free text, optional voice recording
- Preserve original audio
- Save locally with offline support
- Show entry history in reverse chronological order

### Lightweight metadata

- Mood after waking
- Tags
- Sleep date

### Motivation

- Basic stats: total entries, total words, current streak, weekly frequency
- Simple achievement layer:
  - first dream saved
  - three days in a row
  - ten dreams recorded
  - first voice dream

### Reminders

- Morning reminder window
- Optional evening reminder to prepare for sleep tracking

### Languages

- English
- Ukrainian

## Post-MVP roadmap

### Phase 2

- Speech-to-text transcription
- Edit transcript before save
- Pre-sleep questionnaire:
  - stress level
  - alcohol
  - important events
  - sleep quality expectation
- Search and filters by tag, mood, and date

### Phase 3

- AI monthly reports with themes, sentiment, recurring symbols
- AI-generated cover image for a dream
- Export/share flow
- Cloud sync and account system

### Phase 4

- HealthKit and Google Health Connect integrations
- Community mode with explicit opt-in and anonymity controls
- Premium subscription and advanced analytics

## Recommended technical direction

### Frontend

- React Native is the right choice for current stage
- Keep local-first architecture while product assumptions are still changing
- Add a typed feature structure as the app grows:
  - `src/features/dreams`
  - `src/features/stats`
  - `src/features/settings`
  - `src/features/ai`

### Storage

- Continue with MMKV for fast local state
- Move from single-array persistence to repository helpers with migrations
- Introduce explicit schemas for dream entries and settings

### Backend

- Do not build a full backend in MVP unless sync is required immediately
- If sync becomes necessary, prefer:
  - Supabase for auth, Postgres, storage, and edge functions
  - or Firebase if you want faster managed mobile primitives

### AI services

- Transcription:
  - on-device first if quality is acceptable
  - otherwise Whisper API or equivalent speech API
- Text analysis:
  - LLM-generated summaries and theme extraction
- Images:
  - optional and premium-oriented, not MVP-critical

## Data model direction

```ts
type DreamEntry = {
  id: string;
  createdAt: number;
  sleepDate: string;
  title?: string;
  text?: string;
  transcript?: string;
  audioUri?: string;
  mood?: 'negative' | 'neutral' | 'positive';
  tags: string[];
  lucidity?: 0 | 1 | 2 | 3;
  preSleep?: {
    stress?: 1 | 2 | 3 | 4 | 5;
    alcohol?: boolean;
    majorEvent?: string;
  };
  ai?: {
    summary?: string;
    themes?: string[];
    sentiment?: 'negative' | 'neutral' | 'positive';
    imageUri?: string;
  };
};
```

## Immediate engineering priorities

1. Make the current app compile and run reliably
2. Expand `NewDreamScreen` to support text, mood, tags, and save validation
3. Improve `HomeScreen` with entry preview and empty state
4. Add real `StatsScreen` metrics from local storage
5. Add local notification reminders
6. Decide whether transcription is local-only or server-assisted
7. Prepare the UI copy layer for English and Ukrainian

## Current repo issues found

- `Tabs` referenced missing screens
- `App.tsx` imported providers from a non-existent path
- Navigation theme shape was incomplete for React Navigation typing
- Audio recorder options were using keys that do not exist in the installed package

## Suggested next milestone

Build a complete offline MVP around this loop:

1. User wakes up
2. Taps one button to record or type
3. Saves the dream with mood and tags
4. Sees streak/stat feedback on the home or stats screen
5. Returns later for browsing and basic reflection

That milestone is small enough to ship, test with users, and use as the base for
AI and monetization later.

## Signature feature backlog

- Dream Score (0-100) with weekly level progression and achievement badges
- Constellation Timeline: animated nodes with size/color from dream intensity and mood
- Wake Flow 30s: one-tap capture mode right after reminder/alarm
- Archetypes cards: recurring symbols/characters/places extracted from entries
- Night Experiments: 7-day challenges with before/after comparison
- Dream Cards Share: generated visual cards for sharing without sensitive details
