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

Last verified against the code: 2026-07-28.

## Capture

| Capability | Status | Where |
|---|---|---|
| Create, edit, delete a dream | `works` | `features/dreams/repository/dreamsRepository.ts` |
| Draft autosave and recovery | `works` | `features/dreams/model/dreamDraftPresentation.ts` |
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
| Home timeline | `works` | `features/dreams/model/homeTimeline.ts`, `homeLayout.ts` |
| Home recap and overview | `works` | `features/dreams/model/homeOverview.ts` |
| Archive browsing, comfortable and compact modes | `works` | `features/dreams/model/archiveBrowser.ts` (`ArchiveViewMode`) |
| Month calendar panel with mood dots | `works` | `features/dreams/components/archive/ArchiveMonthPanel.tsx`, `archiveBrowser.ts` (`ArchiveCalendarCell`) |
| Debounced local search | `works` | `features/dreams/hooks/useArchiveBrowseState.ts` |
| Filters: all, active, archived, starred | `works` | `archiveBrowser.ts` (`ArchiveFilter`) |
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
it does not understand text. That is what H3 changes.

## Privacy and trust

| Capability | Status | Where |
|---|---|---|
| Biometric app lock | `works` | `services/security/biometricService.ts`, `features/security/components/AppLockGate.tsx` |
| Local-first storage | `works` | `services/storage/` (MMKV) |
| Storage migrations | `works` | `services/storage/migrations.ts` |
| Explicit local-vs-cloud settings | `works` | `features/settings/screens/SettingsScreen.tsx` |
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
| Sync diagnostics | `works` | `features/settings/screens/SyncDiagnosticsPreviewScreen.tsx` |

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
| Three themes: kaleidoscope, ember, moss | `works` | `theme/theme.ts` (`APP_THEME_IDS`) |
| Dark and light appearance per theme | `works` | `theme/theme.ts` (`AppThemeAppearance`) |
| Theme preferences | `works` | `theme/themePreferences.ts` |
| Locale support | `works` | `i18n/` |
| Reminder scheduling preferences | `works` | `features/reminders/services/` |
| Custom reminder styles | `planned` | — |

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
| Crash reporting to a service | `planned` | only `consoleObservability.ts` exists; Sentry lands in H0 |

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
