# Capabilities

## How to read this

This document describes what the code does today, not what is planned. Every `works`
row was checked against the file listed beside it. When a feature changes, this file
changes in the same commit — a capability list that drifts from the code is worse than
no list at all.

| Status | Meaning |
|---|---|
| `works` | complete flow, usable end to end |
| `partial` | real implementation exists, the flow or polish is incomplete |
| `planned` | intent only, no meaningful code |

Last verified against the code: 2026-08-04, at `abf6f59`.

The commit matters more than the date. A date says when someone looked; a SHA says
what they looked at, and lets the next person diff the code since. A row whose
`Where` path no longer exists is the cheapest drift to catch — grep for the paths
before trusting the statuses.

## Capture

| Capability | Status | Where |
|---|---|---|
| Create, edit, delete a dream | `works` | `features/dreams/repository/dreamsRepository.ts` |
| Draft autosave and recovery | `works` | `features/dreams/services/dreamDraftService.ts` — 400ms debounce, plus an immediate write when the app backgrounds |
| Draft recovery while editing a saved dream | `works` | `features/dreams/services/dreamDraftService.ts` (`saveDreamEditDraft`), one key per dream, restored only when newer than the dream |
| Recording survives an interruption | `works` | `ios/DreamApp/AudioRecorderModule.swift` (`AVAudioSession` observer), `AudioRecorderModule.kt` (audio focus + `onHostPause`) — the partial file is kept and reported |
| Title and body | `works` | `features/dreams/model/dream.ts` |
| Sleep date, separate from creation time | `works` | `dream.ts` (`sleepDate`), `dreamRules.ts` (`resolveDreamSleepDate`) |
| Voice capture with on-device transcription | `works` | `features/dreams/services/whisperNative.ts`, `dreamTranscriptionService.ts` |
| Transcript status and source tracking | `works` | `dream.ts` (`transcriptStatus`, `transcriptSource`) |
| Entry templates | `works` | `features/dreams/model/dreamTemplates.ts` |
| Tags | `works` | `dream.ts` (`tags`) |
| Mood, wake emotions, dream intensity | `works` | `dream.ts` (`mood`, `wakeEmotions`, `dreamIntensity`) |
| Sleep context notes | `works` | `dream.ts` (`sleepContext`) |
| Lucidity level and lucid practice | `works` | `dream.ts` (`lucidity`, `lucidPractice`) |
| Nightmare support, including ending rescripting | `works` | `dream.ts` (`nightmare`, `rewrittenEnding`, `rescriptStatus`) |
| Star and archive an entry | `works` | `dream.ts` (`starredAt`, `archivedAt`) |
| Post-save follow-up prompts | `works` | `features/dreams/model/postSaveFollowUp.ts` |

## Revisit

| Capability | Status | Where |
|---|---|---|
| Home recent-dream timeline | `works` | `features/dreams/hooks/useHomeTimelineState.ts`, `features/dreams/model/dreamList.ts` |
| Home contextual return reason | `works` | `features/dreams/model/homeReturnReason.ts`, `homeOverview.ts` |
| Archive list and calendar surfaces | `works` | `features/dreams/model/archiveSurface.ts`, `archiveBrowseQuery.ts`, `archiveBrowseSections.ts` |
| Archive comfortable and compact row modes | `works` | `features/dreams/model/archiveBrowser.ts` (`ArchiveViewMode`) |
| Month calendar panel with mood dots | `works` | `features/dreams/components/archive/ArchiveMonthPanel.tsx`, `archiveBrowser.ts` (`ArchiveCalendarCell`) |
| Debounced local search across the full list or selected calendar month | `works` | `features/dreams/hooks/useArchiveBrowseState.ts`, `archiveBrowseQuery.ts` |
| Filters: all, active, archived, starred | `works` | `archiveBrowser.ts` (`ArchiveFilter`), `useArchiveBrowseState.ts` |
| Dream detail view | `works` | `features/dreams/screens/DreamDetailScreen.tsx` |
| Related dreams | `works` | `features/dreams/model/relatedDreams.ts` |
| Resurfacing and revisit cues | `works` | `features/dreams/model/resurfacingCue.ts`, `archiveBrowser.ts` |

## Insight

| Capability | Status | Where |
|---|---|---|
| Dream analytics and streaks | `works` | `features/dreams/model/dreamAnalytics.ts` |
| Achievements and milestones | `works` | `features/stats/model/achievements.ts` |
| Emotional trend cards | `works` | `features/stats/components/EmotionalTrendSection.tsx` |
| Pattern detail view | `works` | `features/stats/screens/PatternDetailScreen.tsx` |
| Weekly pattern cards | `works` | `features/stats/model/weeklyPatternCards.ts` |
| Monthly report | `works` | `features/stats/screens/MonthlyReportScreen.tsx` |
| Review workspace | `works` | `features/stats/screens/ReviewWorkspaceScreen.tsx` |
| Dream analysis, heuristic | `works` | `features/analysis/services/manualDreamAnalysisProvider.ts` |
| Dream analysis, network provider | `planned` | `dreamAnalysisProvider.ts` — the `openai` provider throws `openai-analysis-provider-not-implemented` |
| Dream practice guidance | `works` | `features/practice/screens/DreamPracticeScreen.tsx` |

The insight layer today is heuristic, not learned. It counts, groups and compares —
it does not understand text. Semantic search and learned text analysis remain post-beta
work and start only after real archives show that they are needed.

## Privacy and trust

| Capability | Status | Where |
|---|---|---|
| Biometric app lock | `works` | `services/security/biometricService.ts`, `features/security/components/AppLockGate.tsx` |
| Local-first storage | `works` | `services/storage/` (MMKV) |
| Storage migrations | `works` | `services/storage/migrations.ts` |
| Explicit local-vs-cloud settings | `works` | `features/settings/screens/SettingsSecurityScreen.tsx`, `PrivacyScreen.tsx` |
| Network analysis off by default | `works` | `features/analysis/model/dreamAnalysis.ts` (`allowNetwork: false`) |

## Cloud

All cloud features are optional. The app is fully usable without an account.

| Capability | Status | Where |
|---|---|---|
| Account and session | `works` | `services/auth/cloudAuth.ts`, `session.ts` |
| Backup | `works` | `features/settings/screens/BackupScreen.tsx` |
| Sync across devices | `works` | `services/cloud/sync.ts` |
| Conflict resolution | `works` | `services/cloud/syncResolution.ts` |
| Deletion tombstones | `works` | `services/cloud/sync.ts` |
| Audio upload and download | `works` | `services/cloud/audioUpload.ts`, `audioDownload.ts` |
| Sync diagnostics | `partial` | `features/settings/screens/SyncDiagnosticsPreviewScreen.tsx` — reachable only from the `__DEV__` section of Settings |

## Platform integration

| Capability | Status | Where |
|---|---|---|
| iOS home screen widget | `works` | `ios/DreamWidgetExtension/` |
| Android home screen widget | `works` | `android/app/src/main/java/com/dreamapp/DreamWidgetProvider.kt` |
| Widget snapshot bridge | `works` | `features/widgets/services/dreamWidgetSyncService.ts` |
| Widget pin prompt | `works` | `features/widgets/services/dreamWidgetPinService.ts` |
| Quick actions | `works` | `android/app/src/main/res/xml/shortcuts.xml`, `ios/DreamApp/AppDelegate.swift` |
| Deep links | `works` | `app/navigation/linking.ts` |
| Local notifications | `works` | `features/reminders/services/dreamReminderService.ts` (notifee) |
| Practice reminders | `works` | `features/reminders/services/dreamPracticeReminderService.ts` |
| Haptics | `works` | `services/haptics/hapticService.ts` |

## Personalization

| Capability | Status | Where |
|---|---|---|
| Four themes: kaleidoscope, ember, moss, daylight | `works` | `theme/theme.ts` (`APP_THEME_IDS`) |
| Light appearance | `works` | `daylight` is registered `'light'` in `appThemeMetadata`; contrast is asserted per theme in `__tests__/themeContrast.test.ts` |
| Calm mode | `works` | `app/CalmModeProvider.tsx` — read inside `SectionHeader`, `FormField`, `SettingsSectionHeader`, `SettingsActionRow` |
| Night capture | `works` | `features/dreams/hooks/useNightCapture.ts`, `model/nightCapture.ts` — the wake screen renders in `ember` between 22:00 and 07:00 |
| Theme preferences | `works` | `theme/themePreferences.ts` |
| Locale support | `works` | `i18n/` |
| Reminder scheduling preferences | `works` | `features/reminders/services/` |
| Reminder styles | `works` | `dreamReminderService.ts` (`DREAM_REMINDER_STYLE_OPTIONS`: balanced, gentle, direct) |

## Export and import

| Capability | Status | Where |
|---|---|---|
| PDF archive export | `works` | `features/settings/services/dreamArchivePdf.ts` |
| Markdown export | `works` | `features/settings/services/dreamArchiveReadable.ts` (`DreamReadableExportFormat`) |
| Plain text export | `works` | same file |
| Structured data export | `works` | `features/settings/services/dataExportService.ts` |
| Data import | `works` | `features/settings/services/dataImportService.ts` |

## Onboarding and observability

| Capability | Status | Where |
|---|---|---|
| Onboarding flow | `works` | `features/onboarding/screens/OnboardingScreen.tsx` |
| Backup onboarding | `works` | `features/settings/services/backupOnboardingService.ts` |
| Event and error instrumentation | `works` | `services/observability/events.ts`, `errorReporting.ts` |
| Crash reporting to a service | `works` | `services/observability/sentryObservability.ts`, wired in `app/AppProvider.tsx` |

## Known gaps

These are genuinely absent, not merely rough:

- semantic search over dream text
- AI summaries and symbol extraction
- image attachments and dream boards
- pre-sleep intention prompts
- premium insight reports and curated symbol libraries
- custom reminder styles

## A note on the previous backlog

This file replaces a hand-maintained backlog that had drifted badly from the code. It
listed themes, widgets, lucid tracking, nightmare tracking and Markdown export as
missing — all five are implemented. Statuses maintained by hand decay; statuses checked
against file paths do not.
