# Capture diet + first impressions — design

**Goal:** Cut the text and nested wrappers on the three screens that carry the
first impression — capture, the saved sheet, dream detail — and replace the
stock React Native launch screen with a branded one. Fix the systemic
status-bar overlap while we are in the shared container.

**Source:** the 2026-09-07 testing pass (`.dev/research/2026-09-07-pre-beta-ux-review.md`)
and the owner's three decisions in the brainstorm:

1. Capture screen → **field-first, no cards**
2. Saved sheet → **minimal confirmation**
3. Detail → **age-aware** (fresh dream = content only; older = revisit prompts)

**Alignment:** `docs/ROADMAP.md` stage 1 already specifies Quick Capture as
"text or voice, sleep date, optional title, save, in thirty to sixty seconds".
`docs/DESIGN.md`: "Calm over noise", "Capture first", "Depth without clutter",
"Warmth without sweetness — never cute", motion "never delays the user".

## Global constraints

- No new npm/native dependency. Launch screens are static (`react-native-bootsplash`
  is explicitly out — fragile pod install here).
- Copy in both `en` and `uk`. No `Co-Authored-By` in commits.
- Gates: `npx tsc --noEmit`, `npx eslint . --max-warnings=0`,
  `npx prettier --check`, `npx jest --ci` — all green, node v20.19.4 path.
- RTL-RN 14: `await` every `render()` and `fireEvent.*`; one `render()` per `it()`.
- The save-guarantee path (draft recovery, `useDreamComposerForm`, the 8
  "nothing is lost" gates) is not touched — only the presentation around it.

---

## 1. Capture screen — field-first

### Now
`DreamComposerHeroCard` (eyebrow `QUICK ADD` + "Capture before it fades" +
subtitle) → `DreamComposerQuickCaptureCard` (a `<Card>` wrapping a
`<SectionHeader>` "Start with a quick capture" / "Start with text or voice…" +
the `FormField` + the meta toggle) → save button → `DreamComposerVoiceCard` (a
full second `<Card>` with its own `<SectionHeader>`). Three stacked headers, two
full mode cards.

### Target
For **create mode, non-wake** only (edit and wake are untouched beyond removing
their own duplicate hero, see below):

```
[ScreenContainer scroll — no hero ]

Що ти пам'ятаєш?                        ← copy.captureRecallPrompt, the only prompt
┌──────────────────────────────────┐
│ Запиши, поки свіже…               │    ← FormField, NO Card wrapper; a flat
│ (autofocus, multiline, grows)     │      field surface (styles.captureInput)
└──────────────────────────────────┘
12 слів                  🎙 Записати  ← styles.captureFootRow: word count left,
                                          a ghost Button right that flips to voice
⌄ Заголовок + дата                    ← unchanged meta toggle + disclosed fields

[            Зберегти            ]     ← unchanged inline save button
```

**Voice as the active mode** (entered by the voice CTA in onboarding / the `+`
sheet / the in-screen flip): mirror image — the record control is the body, and
`✏️ Написати натомість` is the ghost link back to text. The voice body keeps its
recording UI (status pill, timer, stop, attached-audio playback) but **loses its
`<SectionHeader>` and its `<Card>` wrapper** — it is the screen's content, not a
section within it.

### Mechanics
- `DreamComposer` gains `const [activeMode, setActiveMode] = React.useState<'text' | 'voice'>(entryMode === 'voice' ? 'voice' : 'text')`.
  All create-mode branching keys off `activeMode`, not `entryMode` directly.
  `autoStartRecordingKey` still only fires on the initial voice entry.
- `isCreateTextFlow` / `isCreateVoiceFlow` become `activeMode === 'text' && isCreateMode && !isWakeMode` etc.
- The secondary mode is **not rendered** — only its one-line switch Button.
- `DreamComposerHeroCard`: the `!isEdit && !isWakeMode` branch returns `null`.
  The wake branch drops its eyebrow + `SectionHeader` down to a single line
  (keep the sleep-date chip). Edit branch unchanged.
  The `helperChips` (sleep date / audio attached / draft restored) that lived in
  the hero move nowhere for create — the sleep date lives in the meta section,
  "draft restored" already has its own `showRestoredDraftCard`, and
  "audio attached" shows in the voice body. Net: no signal lost.
- `DreamComposerQuickCaptureCard` → `DreamComposerQuickCapture` (no `Card`, no
  `SectionHeader`). New prop `onSwitchToVoice`. Keep every other prop and the
  meta disclosure exactly.
- `DreamComposerVoiceCard`: new prop `flat?: boolean`. When `flat`, render a
  `<View>` not a `<Card>`, and omit the `<SectionHeader>`. New prop
  `onSwitchToText` for the secondary link — but when secondary the whole card is
  replaced by the switch Button, so `onSwitchToText` is only used inside the
  primary body's… actually no. Secondary = a Button in the other mode's foot
  row. So `DreamComposerVoiceCard` only ever renders as the primary (flat) body.

### Copy (new / changed)
| key | en | uk |
|---|---|---|
| `captureRecallPrompt` | "What do you remember?" | "Що ти пам'ятаєш?" |
| `captureSwitchToVoice` | "Record instead" | "Записати натомість" |
| `captureSwitchToText` | "Write instead" | "Написати натомість" |

Remove uses of `recordEmptyTitle`, `recordEmptyDescription`, `createHeroTitle`,
`createSubtitle`, `quickAddKicker` from the create path (keep the keys if wake/
edit still use them; delete if fully orphaned — checked at implementation).

### Out of scope
Wake capture layout, edit layout, the meta/mood/context/tags/practice cards,
`postSaveFollowUp`, analytics events.

---

## 2. Saved sheet — minimal confirmation

### Now
`CaptureSavedSheet`: eyebrow `SAVED` + "Capture saved" + subtitle + 2 chips +
a dream card (derived title **and** body, duplicated) + a nested "NEXT STEP"
card + `Open revisit prompts` + `Keep capturing` + `Reflect later`.

### Target
```
        ✓                          ← checkmark + glow, unchanged (identity beat)
     Збережено                     ← copy.captureSavedTitle
"Ш ції відлига еркщгпр…"           ← one line: getDreamDisplayTitle(dream), styles.savedPreview
     7 вер · 00:19                 ← one line: date · time, styles.savedMeta

[  + Записати ще  ]                ← primary  → onCaptureAnother
   Відкрити                        ← ghost    → onOpenDetail (no focusSection)
   Готово                          ← text     → onClose
```

Remove: `SAVED` eyebrow, the subtitle, both chips, the dream card, the NEXT STEP
card, `Open revisit prompts`. `onOpenDetail` no longer takes a
`DreamDetailFocusSection` — it opens the dream plainly. `getPostSaveFocusSection`
in `NewDreamScreen` and the `focusSection` plumbing for this path are removed
(the detail screen decides its own layout now — see §3).

### Copy (changed)
`captureSavedTitle` stays "Saved" / "Збережено". Drop `captureSavedSubtitle`,
`captureSavedNextStep*`, `captureSavedOpenPrompts` if orphaned. `onCaptureAnother`
label → "Record another" / "Записати ще". Keep `onOpenDetail` label "Open" /
"Відкрити", `onClose` label "Done" / "Готово".

---

## 3. Dream detail — age-aware

### The age test
`isFreshCapture = justSaved === true || (Date.now() - dream.createdAt) < 24 * 60 * 60 * 1000`.
`justSaved` is already a route param. Add the age fallback so a dream opened from
Home an hour after saving is still "fresh".

### Fresh capture
Render only:
- the header row, trimmed: `‹ back` · `✎ edit` · `☆ star` · `··· more`
  (archive, share, delete move into the `···` action sheet)
- title + date
- the `Capture` section (written notes / transcript / audio — the actual content)
- one button: `✎ Доповнити` → opens the editor (`DreamEditor`)

Hide: `Revisit now`, `Leave a trace for later`, and the `Dream analysis` section
when analysis is off.

### Older dream
Current sections, with copy fixes applied to all ages:
- "Leave a trace for later" → "Add a note" / "Додати нотатку"; body
  "Add one short note your future self would thank you for." →
  "One detail you'll want later." / "Одна деталь, яка знадобиться пізніше."
- `Dream analysis` when **off** (any age): collapse the whole section+card to one
  muted line — "Analysis is off · Settings" / "Аналіз вимкнено · Налаштування",
  linking to the analysis settings spoke. When **on**, unchanged.

### Mechanics
- `useDreamDetailController` (or `dreamDetailPresentation/viewModel.ts`) computes
  `isFreshCapture` and returns a filtered section list.
- The `···` menu: a small action sheet (`Alert.alert` with options, or the
  existing pattern if there is one) for archive / share / delete. Delete keeps
  its confirm.
- `dreamDetailPresentation/sections.ts` gains the age gate; the tests in
  `__tests__/` that assert section presence get an `isFreshCapture` axis.

### Out of scope
The reflection-prompt content itself, the analysis provider, the editor screen.

---

## 4. Status-bar mask

`ScreenContainer`, scroll variant, when `padded && withTopInset`:

```tsx
return (
  <View style={styles.base}>
    <ScrollView
      style={styles.base}
      contentContainerStyle={[...]}
      {...rest}
    />
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: t.colors.background,
      }}
    />
  </View>
);
```

Solid bar in `theme.colors.background` — every theme handled by the token,
content disappears cleanly at the status-bar line, matching how a native nav bar
behaves. `pointerEvents="none"` so it never eats a touch. The static (`scroll:
false`) branch is unchanged. Screens with `withTopInset={false}` (they own a
native header) get no mask, as before.

Verify: screenshot Home / Archive / Memory / DreamDetail scrolled, in
`kaleidoscope` and `daylight`.

---

## 5. Branded launch screen

### iOS — `ios/DreamApp/LaunchScreen.storyboard`
- Background: solid `#141826` (create a `LaunchBackground` color set in
  `Images.xcassets`, or set the view's backgroundColor directly).
- Centre: the flower + orbit mark. Add `LaunchLogo.imageset` to
  `Images.xcassets` from `ios/DreamApp/AppIcon-Night.icon/Assets/flower.png`
  (white orbit + dot on dark reads on `#141826`) or the default foreground —
  pick at implementation by eye. Constrain centre X/Y, ~140pt wide.
- Remove the "DreamApp" label and the "Powered by React Native" label.

### Android
- `res/values/styles.xml`: add
  ```xml
  <style name="LaunchTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowBackground">@drawable/launch_screen</item>
    <item name="android:windowSplashScreenBackground" tools:targetApi="s">#141826</item>
    <item name="android:windowSplashScreenAnimatedIcon" tools:targetApi="s">@drawable/launch_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>
  ```
- `res/drawable/launch_screen.xml`: a layer-list — `#141826` colour, the flower
  bitmap centred (`ic_launcher_default_foreground_bitmap` or a copied mono
  variant).
- `AndroidManifest.xml`: `android:theme="@style/LaunchTheme"` on the
  `<activity>`; `MainActivity` switches to `AppTheme` in `onCreate` before
  `super` (RN template pattern) — or rely on `postSplashScreenTheme` +
  `SplashScreen.installSplashScreen(this)` if the AndroidX core-splashscreen
  dep is already present (check; do not add it — fall back to the theme swap).

### The white-flash fix
Launch background `#141826` == the default theme's `background`, so when the RN
root view mounts there is no visible seam. A `daylight`-theme user sees a brief
dark splash then a light app; accepted.

Verify: cold-launch the built app on the simulator, confirm no
"DreamApp / Powered by React Native", no white flash.

---

## Task order

1. Status-bar mask (§4) — isolated, unblocks nothing, low risk, visual check
2. Launch screen (§5) — isolated, build + cold-launch check
3. Capture screen (§1) — the big one
4. Saved sheet (§2) — small, depends on §1's `NewDreamScreen` edits landing
5. Detail age-aware (§3) — isolated from the rest

One branch, five commits, one merge.
