# Transcription Spike for 0.0.5

## Goal

Decide whether Kaleidoskop should add dream audio transcription in `0.0.5`,
and choose the smallest viable technical path.

## Why this is a spike

Transcription looks like a simple feature, but it changes the product and
infrastructure in several ways:

- new storage shape for transcript state
- long-running audio processing on mobile
- privacy expectations for sensitive dream data
- model/runtime size on device
- possible backend requirement if transcription is cloud-based

The spike goal is not to ship the full feature now. The goal is to choose the
right implementation direction for `0.0.5`.

## Current product constraints

- The app is local-first
- There is no user account system
- There is no backend for secure API calls
- Audio capture already exists and is a differentiator
- Dream data is privacy-sensitive

These constraints matter more than raw model quality.

## Options considered

### Option A: Cloud transcription via OpenAI Audio API

Use OpenAI transcription models such as `gpt-4o-transcribe` or
`gpt-4o-mini-transcribe`.

Pros:

- best accuracy path
- no model files bundled in the app
- simpler inference logic on device
- easier future support for multilingual audio

Cons:

- not safe to call directly from a mobile app because API keys would be exposed
- requires backend or signed upload flow first
- sends dream audio off device, which weakens the current privacy story
- adds network latency and failure modes
- Audio API file limits exist; OpenAI Help currently documents a 25 MB maximum
  file size

Conclusion:

- technically strong, but not the right first transcription path for `0.0.5`
- better fit after backend/sync work exists

Sources:

- [OpenAI Audio API Reference](https://platform.openai.com/docs/api-reference/audio/createTranscription.class)
- [OpenAI Pricing](https://platform.openai.com/pricing)
- [OpenAI GPT-4o Transcribe model page](https://developers.openai.com/api/docs/models/gpt-4o-transcribe)
- [OpenAI Audio API FAQ](https://help.openai.com/en/articles/7031512)

### Option B: On-device transcription with `whisper.cpp` via `whisper.rn`

Use `whisper.cpp` through the React Native binding `whisper.rn`.

Pros:

- aligns with local-first product direction
- no backend required
- stronger privacy story because inference can stay on device
- good fit for “transcribe existing voice note” after save
- real React Native path already exists

Cons:

- adds native complexity and model asset management
- app size and runtime memory become important
- slower than cloud on weaker devices
- model choice must stay small and disciplined
- realtime transcription would expand scope too much

Conclusion:

- best first path for `0.0.5`
- but only as manual, post-save transcription of existing dream audio
- do not attempt realtime or background batch queues in the first release

Sources:

- [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp)
- [mybigday/whisper.rn](https://github.com/mybigday/whisper.rn)

### Option C: Do nothing in 0.0.5

Pros:

- zero risk to current release cadence
- no native/model complexity

Cons:

- leaves the strongest differentiator underused
- keeps audio useful only as playback, not retrieval
- delays a high-value loop: voice capture -> transcript -> searchable dream

Conclusion:

- too conservative if `0.0.5` is intended to add a meaningful new user benefit

## Recommendation

For `0.0.5`, choose:

- on-device transcription
- manual trigger from the dream detail screen
- process only already-saved audio files
- store transcript locally on the dream entry
- English-first rollout

Do not choose for `0.0.5`:

- cloud transcription
- realtime transcription while recording
- auto-transcribe every audio note immediately after save
- translation
- diarization

## Recommended `0.0.5` scope

### User flow

1. User records and saves a dream with audio
2. User opens dream detail
3. User taps `Transcribe audio`
4. App runs on-device transcription
5. Transcript is saved locally into the dream entry
6. Transcript becomes visible in detail and searchable in timeline

### Data model changes

Add a minimal transcription state to `Dream`:

```ts
type Dream = {
  // existing fields...
  transcript?: string;
  transcriptStatus?: 'idle' | 'processing' | 'ready' | 'error';
  transcriptUpdatedAt?: number;
};
```

### UI changes

- `DreamDetailScreen`:
  - add `Transcribe audio` button when `audioUri` exists and transcript is absent
  - show `processing` and `error` states
  - show transcript block after success
- `HomeScreen`:
  - search should include `transcript`
- `SettingsScreen`:
  - small privacy note that transcription runs on device if enabled in `0.0.5`

## Technical implementation outline

### Phase 1: feasibility branch

- integrate `whisper.rn`
- validate native build on iOS and Android
- confirm model download/bundling strategy
- test transcription on 2-3 real recordings from this app

### Phase 2: MVP integration

- add transcript fields to dream model
- add repository update path for transcript state
- implement `transcribeDreamAudio(dreamId)` service
- wire manual button in detail screen
- extend timeline search to include transcript
- add tests for transcript persistence and searchability

## Model recommendation

Start with:

- `tiny.en` if speed and package size are the main concern
- `base.en` only if `tiny.en` quality is clearly too weak on real dream audio

Do not start with:

- `small`, `medium`, or `large`

Reason:

- `whisper.cpp` documents large memory growth across model sizes
- the first app version should bias toward reliability and acceptable speed
- dream audio is usually short, so fast completion matters more than maximum accuracy

Notes from `whisper.cpp` README:

- `tiny` model disk size is about 75 MiB with much lower memory than larger
  models
- `base` is already materially heavier
- Core ML acceleration exists on Apple devices and can improve speed on iOS

Source:

- [whisper.cpp README](https://github.com/ggml-org/whisper.cpp)

## Key risks

### 1. Native integration risk

`whisper.rn` adds native setup, model file handling, and possible platform
differences.

Mitigation:

- first land a spike branch only
- validate both iOS and Android before product work starts

### 2. App size risk

Bundling models will increase app size.

Mitigation:

- start with one small English model
- prefer runtime download later if bundling is too heavy

### 3. Performance risk

Older devices may transcribe too slowly.

Mitigation:

- use manual transcription, not automatic
- show clear processing state
- test on at least one lower-end Android device

### 4. Quality risk

Dream audio may be whispered, sleepy, or noisy.

Mitigation:

- evaluate against real recordings from this app
- only ship if transcript is “usefully searchable,” not necessarily perfect

## Success criteria for 0.0.5 transcription MVP

- transcription works fully offline
- transcript persists locally after app relaunch
- transcript can be searched from timeline
- failed transcription does not damage the original audio entry
- user-facing processing/error states are clear
- iOS and Android builds remain stable

## Decision

Recommended decision for `0.0.5`:

- proceed with an on-device transcription MVP using `whisper.rn`
- keep it manual and detail-screen initiated
- keep it English-first and offline-first
- cut cloud transcription until backend/auth/privacy architecture exists

## Suggested next implementation order for 0.0.5

1. Native feasibility branch with `whisper.rn`
2. Extend dream model with transcript fields
3. Manual transcript action on detail screen
4. Persist transcript and include it in timeline search
5. QA on short real-world dream recordings
