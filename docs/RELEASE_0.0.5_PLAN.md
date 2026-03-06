# Release 0.0.5 Plan

## Goal

Ship the first voice-intelligence release after `0.0.4`: make saved audio notes
meaningfully useful by turning them into searchable local transcripts without
breaking the app's offline-first and privacy-first product direction.

## Release theme

- Voice notes become usable, not just replayable
- Search gets stronger through transcript text
- Privacy remains understandable because transcription stays on device

## Product bet for 0.0.5

`0.0.4` made the app more reusable through retrieval, achievements, draft
restore, and export. `0.0.5` should unlock the product's strongest
differentiator: voice capture.

The best disciplined next release is not AI summaries, sync, or cloud speech.
The strongest small release is:

- users can save a dream as audio first and turn it into text later
- transcript text becomes searchable from the timeline
- transcription feels safe because the audio stays local
- failures are recoverable and do not damage the original recording

## Scope lock

### 1. Manual on-device transcription MVP

- Add manual transcription for dreams that already have `audioUri`
- Trigger transcription from `DreamDetailScreen`
- Keep transcription explicitly user-initiated:
  - no auto-transcribe on save
  - no background queue
  - no realtime transcription during recording
- Save transcript locally on the dream entry
- Show clear states:
  - idle
  - processing
  - ready
  - error

### 2. Transcript-aware retrieval

- Extend timeline search to include:
  - `dream.transcript`
  - existing title/text/tag/context fields
- Keep search behavior deterministic with mixed entries:
  - text-only
  - audio-only
  - text + audio
  - audio + transcript
- Make transcript presence visible in detail and, if space allows, lightly
  visible in timeline metadata

### 3. Safe transcript lifecycle and persistence

- Extend `Dream` with minimal transcription fields:
  - `transcript?: string`
  - `transcriptStatus?: 'idle' | 'processing' | 'ready' | 'error'`
  - `transcriptUpdatedAt?: number`
  - optional `transcriptLanguage?: string` only if the library requires it
- Add storage migration for old local data so `0.0.4` records remain valid
- Ensure transcript updates do not overwrite:
  - original `text`
  - original `audioUri`
  - other dream metadata
- Decide clear retry behavior after failure

### 4. Audio trust UX

- `DreamDetailScreen` should become the control point for voice-note follow-up:
  - show attached audio
  - show transcript block separately from authored text
  - expose `Transcribe audio` only when it makes sense
  - expose retry action when the previous attempt failed
- Keep privacy copy simple:
  - transcription runs on device
  - original audio stays local
  - cloud processing is not used in `0.0.5`
- Update `SettingsScreen` copy for the new capability and limitations

### 5. Quality and release readiness

- Add tests for:
  - dream model migration with transcript fields
  - transcript persistence and update path
  - timeline search including transcript text
  - manual transcription state transitions
  - failure/retry behavior that preserves original audio
- Validate native integration on iOS and Android
- Run manual QA on real recordings from this app, not synthetic fixtures only

## Recommended functional additions for 0.0.5

If we keep the release disciplined, these are the best additions:

1. Offline manual transcription for existing voice dreams
2. Search indexing of transcript text
3. Transcript status UX in detail view
4. Settings/privacy copy for local transcription

These four additions reinforce each other and fit the current product direction.

## Features to postpone

Do not let `0.0.5` turn into an AI platform rewrite. Postpone these:

- Cloud transcription through OpenAI or any other API
- Realtime transcription while recording
- Automatic transcription immediately after saving audio
- Background batch transcription of all historical audio
- Translation of transcripts
- Speaker diarization
- AI summaries or theme extraction on top of transcript text
- Sync or account system for transcript backup
- Transcript editing workflows beyond minimal text correction, if scope slips

## Definition of done

- A user can open an audio dream and manually start transcription
- Transcription completes fully offline on supported builds
- Transcript is stored locally and survives app relaunch
- Timeline search can find a dream by transcript text
- Processing and error states are clear and recoverable
- Failed transcription never corrupts or removes the original audio note
- `yarn typecheck`, `yarn lint`, and `yarn test:ci` pass
- Manual smoke test passes on iOS and Android

## Suggested implementation order

1. Land a native feasibility branch for `whisper.rn` and verify builds
2. Extend `Dream` model, repository helpers, and storage migration
3. Add a transcription service around one manual entry point
4. Wire `DreamDetailScreen` states and actions
5. Extend timeline search to include transcript text
6. Add settings copy, tests, and manual QA on real recordings

## Priority breakdown

### P0: must ship in 0.0.5

- Native transcription feasibility proven on iOS and Android
- Manual `Transcribe audio` action in `DreamDetailScreen`
- Transcript fields persisted on dream entries
- Search includes transcript text
- Processing, success, and error states implemented
- Privacy copy updated for on-device transcription
- Tests for migration, repository updates, and transcript search
- `yarn typecheck`, `yarn lint`, and `yarn test:ci` pass

### P1: important, ship if P0 is clean

- Retry button for failed transcription
- Lightweight transcript badge or preview signal in timeline cards
- Minimal transcript editing after generation
- Model-management UX if runtime model download is required
- Analytics/observability events around transcription start, success, and error

### P2: nice to have, cut first if scope slips

- Ukrainian-audio evaluation or beta support
- Replace transcript flow after manual edits
- Detail-screen comparison view between user text and generated transcript
- Better timeline ranking when both text and transcript match search
- Release-time export schema update to include transcript metadata explicitly

## Suggested technical direction

- Use on-device transcription through `whisper.rn` as the primary implementation
  path
- Keep the first release manual and synchronous from the user's perspective,
  even if the underlying library runs work asynchronously
- Create a dedicated service under `src/features/dreams/services`, for example:
  - `dreamTranscriptionService.ts`
- Keep screen components thin:
  - service handles transcription orchestration
  - repository handles persistence
  - model helpers handle transcript status and search matching
- Do not mix generated transcript with the user's authored `text`
- If transcription can take noticeable time, persist `processing` state so the
  UI stays honest across navigation or relaunch
- Prefer one small English model first:
  - `tiny.en` if acceptable on real samples
  - `base.en` only if `tiny.en` is clearly too weak

## Suggested data model changes

```ts
type DreamTranscriptStatus = 'idle' | 'processing' | 'ready' | 'error';

type Dream = {
  id: string;
  createdAt: number;
  archivedAt?: number;
  sleepDate?: string;
  title?: string;
  text?: string;
  audioUri?: string;
  transcript?: string;
  transcriptStatus?: DreamTranscriptStatus;
  transcriptUpdatedAt?: number;
  tags: string[];
  mood?: Mood;
  sleepContext?: SleepContext;
  lucidity?: 0 | 1 | 2 | 3;
};
```

Search helper direction:

```ts
const searchableParts = [
  dream.title,
  dream.text,
  dream.transcript,
  dream.sleepContext?.importantEvents,
  dream.sleepContext?.medications,
  dream.sleepContext?.healthNotes,
  ...dream.tags,
];
```

## Platform assumptions

- `0.0.5` ships with bilingual UI copy as the rest of the app does
- transcription quality target is English-first unless real-device tests show
  Ukrainian audio is already good enough with the chosen model
- if Android low-end performance is unacceptable, keep the feature but label it
  as a heavier manual action rather than broadening scope into cloud fallback

## Open decisions

These should be decided before implementation starts:

1. Should transcript appear in the same card as `text`, or as a separate
   generated section in `DreamDetailScreen`?
2. Should we persist `processing` state immediately before inference starts, or
   keep it purely in memory for the first cut?
3. Do we bundle the first model in the app binary, or support runtime download?
4. Is `0.0.5` explicitly English-only for transcription, or best-effort for all
   audio with English-focused QA?
5. Should transcript metadata be added to export payloads in `0.0.5`, or wait
   for the next export-schema revision?

## Suggested release metadata

- Release branch candidate: `codex/release-v0.0.5`
- Suggested release commit title:
  - `release(v0.0.5): add offline transcription for voice dreams`
- Suggested tag after merge:
  - `v0.0.5`

## Open risks

- Native integration may be slower than expected because `whisper.rn` adds
  build-system and model-asset complexity
- App size may jump materially if the model is bundled
- Low-end Android devices may transcribe too slowly for a good first impression
- Dream audio quality may be weak because users are sleepy, quiet, or noisy
- Mixing authored text and generated transcript can confuse users if the UI is
  not explicit
- A cloud fallback would seem tempting mid-release and should be resisted unless
  the product direction changes
