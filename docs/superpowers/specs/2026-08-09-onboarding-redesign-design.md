# Onboarding redesign — Part A (the onboarding screen itself)

Date: 2026-08-09
Plan section: `~/.claude/plans/dream-app-product-plan-2026-08-03.md` §3.5.

## Problem, with evidence

`src/features/onboarding/screens/OnboardingScreen.tsx` shows four information
slides — Capture, Reflect, Support, Private — a feature tour, before dropping the
user on the Home tab (`navigation.replace(ROOT_ROUTE_NAMES.Tabs)` with no target
screen, so React Navigation's default first tab, `Home`, wins). The plan's diagnosis:
*"Зараз чотири інформаційні слайди. Треба: (1) обіцянка; (2) необов'язкова основна
ціль...; (3) одразу quick capture."*

## Program: two independent parts

§3.5 covers two separable pieces of work, confirmed by exploration before writing
this spec:

- **Part A (this spec):** replace the onboarding screen's four slides with a single
  promise + an immediate path into capture.
- **Part B (not this spec, future work):** contextual prompts for reminders, backup,
  biometric lock, and the Whisper transcription model, shown after the first or third
  entry instead of during onboarding. Only one of these four already exists —
  `backupOnboardingService.ts`, a 3-dream-threshold flag checked from
  `HomeScreen.tsx`. Reminder, biometric, and Whisper have no equivalent: grepped for
  any contextual-prompt component or service for each and found none. Building the
  other three is three separate small features, each its own scope — not a
  continuation of Part A's screen rewrite.

## Explicitly out of scope / dropped

- **The "optional main goal" step** (§3.5's item 2 — better memory / notice repeats /
  lucid / nightmares, said to "only reorder secondary cards"). Checked
  `HomeScreen.tsx`'s actual render tree: hero, draft prompt, list header, the backup
  onboarding modal, one "return to this dream" card, and the recent-dreams row. No
  lucid/nightmare/practice-specific secondary cards exist to reorder — Home was
  already reduced to this minimal set by earlier IA work. A goal picker with nothing
  to visibly change would be a UI element that configures no behavior. Dropped rather
  than built with a placeholder effect; can be added later once there is a concrete
  personalization it would drive.
- **Slides 2-4's content** (patterns/lucid/nightmare tools/privacy). Not preserved
  anywhere by this change — simplification, not a relocation. Only reminders, backup,
  biometric, and Whisper are named by the plan as needing a later contextual home
  (Part B); the rest of the removed slide content has no such promise attached.
- **Part B** in its entirety (see above).

## Design

### Screen structure

`OnboardingScreen.tsx` keeps its existing visual chrome (the glowing icon area, safe
area handling, `FadeIn` entrance) but drops the slide carousel, dot indicator, and
skip button — there is nothing left to skip past or paginate through.

Content becomes one eyebrow/title/description block (the promise) followed by three
actions instead of one "Continue"/"Get started" button:

1. **Primary — voice.** Copy: "Record a voice memo" / "Записати голосом". Finishes
   onboarding into capture with `entryMode: 'voice', autoStartRecording: true`.
2. **Secondary — text.** Copy: "Write it down" / "Написати текстом". Finishes into
   capture with `entryMode: 'default'`.
3. **Tertiary (ghost, visually smaller) — no memory.** Copy: "I don't remember, but I
   want to start" / "Не пам'ятаю сон, але хочу почати". Finishes into capture with
   `entryMode: 'default'` — technically identical to the text action. This button
   exists only as a lower-pressure entry point for someone who feels they have
   nothing to write; it does not need new composer behavior, a different placeholder,
   or any other special-cased logic. Building that is out of scope here — if it turns
   out to matter, it's a Part-B-sized follow-up on its own.

### Finishing onboarding

All three actions call the same two steps: `markOnboardingSeen()` (existing,
`src/features/onboarding/services/onboardingService.ts`, unchanged), then navigate
directly into capture rather than landing on Home. `src/app/navigation/navigationRef.ts`
already has a proven shape for this exact navigation
(`openNewDreamTab` calls `navigate(ROOT_ROUTE_NAMES.Tabs, { screen: TAB_ROUTE_NAMES.New,
params })`), used today for deep links and reminder taps. `OnboardingScreen.tsx`
already holds its own typed `navigation` via `useNavigation<NativeStackNavigationProp<RootStackParamList>>()`,
so it calls `navigation.replace` with the same nested shape directly, rather than
importing the global `navigationRef` — same navigation target, no new mechanism.

### Copy

`src/constants/copy/onboarding.ts` — remove all twelve `slideNEyebrow/Title/Description`
keys (four slides × three fields) and `continueAction`/`getStartedAction`/`skipAction`.
Add:

- `promiseEyebrow`, `promiseTitle`, `promiseDescription` — the single promise block.
  English: "Write before it fades" / "Dreams disappear in minutes. See what keeps
  coming back — privately, without your journal leaving the device." (the second
  sentence is the product's own stated thesis, reused rather than invented — see
  `dream-app-product-plan-2026-08-03.md`'s §1). Ukrainian: "Запиши, поки не забув" /
  "Сни зникають за лічені хвилини. Побач, що повертається у твоїх снах — приватно,
  без хмари."
- `voiceAction`, `textAction`, `noMemoryAction` — the three button labels above, both
  locales.

## Testing

- `npx tsc --noEmit` — the `OnboardingCopy` type is inferred from
  `ONBOARDING_COPY_EN`, and `ONBOARDING_COPY_UK` is typed against it (`const
  ONBOARDING_COPY_UK: OnboardingCopy = {...}`), so a missing key in either locale is a
  compile error, same guarantee this codebase already relies on elsewhere (e.g.
  `SETTINGS_COPY_UK`).
- `npx eslint` on both changed files.
- `npx jest` (full suite) — no existing test targets `OnboardingScreen.tsx`'s slide
  content by name (checked before writing this spec), so no test should reference the
  removed slide copy; if one does, that's a real gap this plan's execution needs to
  close, not paper over.
- Manual: run onboarding on a clean install (no `resetOnboardingSeen` helper exists in
  `onboardingService.ts` today, so clear the app's storage/reinstall to see it again),
  confirm each of the three actions
  lands in the composer with the right entry mode and immediately ready to use — voice
  action actually starts recording, text and no-memory actions both open a ready
  text composer. Check both locales and both themes.
