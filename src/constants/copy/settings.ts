import { AppLocale } from '../../i18n/types';

const SETTINGS_COPY_EN = {
  title: 'Settings',
  subtitle:
    'Local-first controls for reminders, privacy, backups, and analysis.',
  toggleShow: 'Show',
  toggleHide: 'Hide',
  // The hub. Every row below opens one screen; the value on the right is what
  // that screen currently says, so the list answers most questions without
  // being opened at all.
  hubAppearanceTitle: 'Appearance and language',
  hubAppearanceMeta: 'Palette, and the language the app speaks',
  hubRemindersTitle: 'Reminders',
  hubRemindersMeta: 'When to ask you about last night',
  hubRemindersOff: 'Off',
  hubBackupTitle: 'Backup and sync',
  hubSecurityTitle: 'Privacy and lock',
  hubSecurityMeta: 'Where dreams live, and who can open them',
  hubSecurityLocked: 'Locked',
  hubSecurityUnlocked: 'No lock',
  hubAnalysisTitle: 'Analysis and transcription',
  hubAnalysisMeta: 'Reading patterns, and turning voice into text',
  hubAboutTitle: 'About',
  hubAboutMeta: 'Version, storage, and export',
  footerBuildLabel: 'Kaleidoskop',
  footerStorageMetaPrefix: 'Schema',
  footerExportMetaPrefix: 'Export',
  reminderTitle: 'Dream reminder',
  reminderDescription:
    'One daily nudge after waking so you capture dreams faster.',
  reminderPermissionLabel: 'Notifications',
  reminderPermissionBlocked: 'Blocked',
  reminderCurrentScheduleLabel: 'Current schedule',
  reminderEnableHint: 'Turn it on to choose a daily reminder time.',
  reminderOffValue: 'Off',
  reminderTimeLabel: 'Reminder time',
  reminderTimeHint: 'Tap to change.',
  reminderSmartSuggestionLabel: 'Based on your recording patterns',
  reminderSmartSuggestionApply: 'Set to',
  reminderStyleTitle: 'Reminder style',
  reminderStyleDescription:
    'Changes the tone only. Timing and delivery stay the same.',
  reminderStyleBalancedLabel: 'Steady',
  reminderStyleBalancedDescription: 'Clear and neutral.',
  reminderStyleGentleLabel: 'Gentle',
  reminderStyleGentleDescription: 'Softer and more reflective.',
  reminderStyleDirectLabel: 'Direct',
  reminderStyleDirectDescription: 'Short and more immediate.',
  reminderStylePreviewLabel: 'Notification preview',
  reminderStyleFootnote:
    'You can choose the tone now even if reminders are off.',
  reminderPreviewWakeAction: 'Preview wake flow',
  reminderPreviewWakeMeta:
    'Open the reminder entry screen without waiting for the next notification.',
  devPreviewMonthlyReport: 'Preview monthly report',
  devPreviewBackupOnboarding: 'Preview backup onboarding',
  devPreviewBackupOnboardingMeta:
    'Open the one-time modal preview and reset its seen state.',
  devPreviewSyncDiagnostics: 'Preview sync diagnostics',
  devPreviewSyncDiagnosticsMeta:
    'Open the debug-only screen with the latest sync snapshot and recent sync attempts.',
  actionCancel: 'Cancel',
  reminderPermissionDeniedTitle: 'Notifications disabled',
  reminderPermissionDeniedDescription:
    'Allow notifications in system settings to enable dream reminders.',
  reminderSaveErrorTitle: 'Reminder error',
  reminderNotificationTitle: 'Record your dream',
  reminderNotificationBody: 'Capture it while details are still fresh.',
  reminderStyleGentleNotificationTitle: 'Keep the dream close',
  reminderStyleGentleNotificationBody:
    'A few calm words now can save the feeling before the day gets loud.',
  reminderStyleDirectNotificationTitle: 'Write it down now',
  reminderStyleDirectNotificationBody: 'Catch the key images before they slip.',
  languageTitle: 'Language',
  languageDescription: 'Choose your app language.',
  languageEnglish: 'EN',
  languageUkrainian: 'UA',
  calmModeTitle: 'Calm mode',
  calmModeHint:
    'Hides the explanations under headings and fields. Values, counts and errors stay.',
  nightCaptureTitle: 'Night capture',
  nightCaptureHint:
    'Between 22:00 and 07:00 the capture screen goes warm and dark, whichever theme is set.',
  themeTitle: 'Appearance',
  themeDescription: 'Choose the palette used across the app.',
  themeFootnote: 'Kaleido keeps the current look stable as the default theme.',
  themeOptionKaleido: 'Kaleido',
  themeOptionEmber: 'Ember',
  themeOptionMoss: 'Moss',
  themeOptionDaylight: 'Daylight',
  privacyTitle: 'Privacy and storage',
  privacyDescription:
    'Dream data stays on your device by default. Cloud stays optional and does not block first capture.',
  privacyStorageLabel: 'Dream data',
  privacyStorageValue: 'On this device',
  privacyReminderLabel: 'Reminders',
  privacyReminderValue: 'Local notifications only',
  privacyFootnote:
    'If you delete the app, local entries, downloaded transcription model, and drafts may be removed with it until export or sync exists.',
  privacyOpenAction: 'How your data is handled',
  privacyScreenTitle: 'Your data',
  privacyScreenIntro:
    'Your dreams are stored on this device. Nothing is sent anywhere unless you turn on a feature that sends it, and each of those starts off.',
  privacyLocalTitle: 'Stays on this device',
  privacyLocalBody:
    'Dream text, titles, tags, moods, voice recordings and transcripts. Patterns, streaks and statistics are worked out here too, never on a server.',
  privacyLeavesTitle: 'What can leave, and when',
  privacyCloudTitle: 'Cloud backup, if you turn it on',
  privacyCloudBody:
    'Uploads your dream text, transcripts and recordings, encrypted on this device with a key the server never receives. The server can see how many dreams you have and when you last changed one — nothing about what is in them. The key travels to your other devices through iCloud Keychain or Android backup, and a recovery code is in these settings if you ever need it.',
  privacyCrashTitle: 'Crash reports, in builds set up for them',
  privacyCrashBody:
    'Sends the error, the app version and which screen was open. Dream text, titles, transcripts, tags and your identity are stripped out before anything is sent.',
  privacyModelTitle: 'The speech model, once',
  privacyModelBody:
    'Transcription runs on this device, but the model is downloaded the first time you use it. That request carries no dream data. Afterwards transcription works offline.',
  privacyLockTitle: 'The lock',
  privacyLockBody:
    'Biometrics are checked by the system; the app only learns whether it was accepted. The lock hides the screens — it does not encrypt the stored files.',
  privacyDeleteTitle: 'Deleting everything',
  privacyDeleteBody:
    'Removing the app deletes what is stored here, including recordings and drafts. Export first if you want to keep them. Anything already uploaded stays until you delete those dreams while backup is on.',
  privacyNoAccountNote:
    'There is no account, no profile and no analytics service. Offline, the app is complete.',
  archiveKeyTitle: 'The key to your archive',
  archiveKeyDescription:
    'Your dreams are encrypted before they are uploaded. This is the key that opens them.',
  archiveKeyTravelsIcloud:
    'Carried to your other Apple devices by iCloud Keychain. Nothing for you to do.',
  archiveKeyTravelsAndroid:
    'Carried to your next Android device by Google backup. Nothing for you to do.',
  archiveKeyStranded:
    'This key cannot leave this phone on its own — device backup is off. Save the recovery code, or the archive will only ever open here.',
  archiveKeyMissingForArchive:
    'The archive in the cloud was encrypted with a different key. Enter its recovery code to read it here. Nothing on this phone has been changed or deleted.',
  archiveKeyNotYetCreated:
    'The key is created the first time you sync. Until then there is nothing to keep.',
  archiveKeyRevealAction: 'Show recovery code',
  archiveKeyHideAction: 'Hide recovery code',
  archiveKeyCodeIntro:
    'Twenty-four words, in this order. They are the key itself — anyone who has them can read your archive. You need them only to move between iPhone and Android, or to restore a phone that had no backup.',
  archiveKeyEntryLabel: 'Recovery code',
  archiveKeyEntryPlaceholder: 'Paste or type the twenty-four words',
  archiveKeyEntryAction: 'Use this code',
  archiveKeyEntryInvalid:
    'That is not a complete code. Check for a missing or mistyped word — the code carries a checksum, so it can tell.',
  archiveKeyEntryAccepted: 'Key accepted. Sync again to read the archive.',
  cloudTitle: 'Cloud backup',
  cloudDescription: 'Optional device-to-device sync for one archive.',
  cloudConfigLabel: 'Runtime config',
  cloudConfigReady: 'Ready',
  cloudConfigMissing: 'Missing',
  cloudConfigUrlLabel: 'Supabase URL',
  cloudConfigUrlHint: 'Project URL, usually *.supabase.co.',
  cloudConfigAnonKeyLabel: 'Anon key',
  cloudConfigAnonKeyHint: 'Public anon key used by the mobile client.',
  cloudSessionLabel: 'Backup',
  cloudSessionSignedOut: 'Off',
  cloudSessionSignedIn: 'On',
  cloudAccountLabel: 'Account',
  cloudAccountDisconnected: 'Not linked yet',
  cloudAccountAnonymous: 'Needs email account',
  cloudPathTitle: 'What do you need on this device?',
  cloudPathDescription:
    'Choose whether this is the device where backup starts or one that should open an existing archive.',
  cloudPathThisDevice: 'Start here',
  cloudPathAnotherDevice: 'Open existing',
  cloudFirstDeviceTitle: 'Start backup on this device',
  cloudFirstDeviceDescription:
    'Create the backup on this device first, then save it under an email account if you want another device to open the same archive.',
  cloudGuideTitle: 'How backup works',
  cloudGuideStepOne: 'Turn on backup on your first device.',
  cloudGuideStepTwo:
    'Save it under an email account if you want the same archive on another device.',
  cloudGuideStepThree: 'Open that same backup on another device and run sync.',
  cloudGuideExistingStepOne:
    'Enter the same email and password you used for this backup before.',
  cloudGuideExistingStepTwo:
    'Open that archive on this device and let sync pull the latest changes.',
  cloudGuideExistingStepThree:
    'Keep sync on so edits and deletes continue moving between devices.',
  cloudGuideAnonymousStepOne: 'This device is already connected to backup.',
  cloudGuideAnonymousStepTwo: 'Save this backup under an email account next.',
  cloudGuideAnonymousStepThree: 'Then open the same backup on another device.',
  cloudGuideNamedStepOne: 'This backup is already linked to your account.',
  cloudGuideNamedStepTwo:
    'Open the same backup with this email on another device.',
  cloudGuideNamedStepThree: 'Keep sync on so changes move between devices.',
  cloudSuccessTitle: 'Next step',
  cloudConnectedSuccessTitle: 'Backup is on for this device',
  cloudConnectedSuccessDescription:
    'Save this backup under an email account next if you want another device to open the same archive.',
  cloudSignedInSuccessTitle: 'Existing backup opened',
  cloudSignedInSuccessDescription:
    'This device is now linked to your backup. Run sync now to pull the latest archive changes.',
  cloudUpgradedSuccessTitle: 'Backup account saved',
  cloudUpgradedSuccessDescription:
    'This backup is now linked to your email account. Open the same backup on another device with these credentials.',
  cloudResetSuccessTitle: 'Check your inbox',
  cloudResetSuccessDescription:
    'Open the reset link from that email, then come back and sign in with the new password.',
  backupCueOpenAction: 'Open backup',
  backupCueConnectTitle: 'Back up this archive',
  backupCueConnectDescription:
    'Keep this archive available on another device before more local-only changes pile up.',
  backupCueSyncOffTitle: 'Backup is connected, but sync is off',
  backupCueSyncOffDescription:
    'Turn sync back on before switching devices so newer local changes do not stay behind.',
  backupCueReviewPendingTitle: 'Saved review sets are newer on this device',
  backupCueReviewPendingDescription:
    'Saved months and threads changed locally. Open backup and run sync before switching devices.',
  backupOnboardingEyebrow: 'Archive started',
  backupOnboardingDismissAction: 'Close',
  backupOnboardingTitle: 'You already have dreams worth keeping',
  backupOnboardingDescription:
    'After a few entries, backup starts paying off. Save this archive before it becomes device-bound.',
  backupOnboardingDreamsLabel: 'Saved dreams',
  backupOnboardingThresholdLabel: 'Prompt threshold',
  backupOnboardingValueTitle: 'Why now',
  backupOnboardingValueDescription:
    'Backup keeps this archive restorable and makes saved review sets useful across devices once they start to accumulate.',
  backupOnboardingPrimaryAction: 'Open backup',
  backupOnboardingLaterAction: 'Later',
  backupOnboardingPreviewTitle: 'Backup onboarding preview',
  backupOnboardingPreviewDescription:
    'Debug the one-time backup prompt without waiting for a fresh account.',
  backupOnboardingPreviewSeenTitle: 'Seen state',
  backupOnboardingPreviewSeenValue: 'Seen',
  backupOnboardingPreviewUnseenValue: 'Unseen',
  backupOnboardingPreviewEligibilityTitle: 'Production gate',
  backupOnboardingPreviewEligibilityReady: 'Would open on Home now.',
  backupOnboardingPreviewEligibilityWaiting:
    'Needs 3 saved dreams and an unseen state.',
  backupOnboardingPreviewEligibilityReadyValue: 'Ready',
  backupOnboardingPreviewEligibilityWaitingValue: 'Waiting',
  backupOnboardingPreviewOpenAction: 'Open modal preview',
  backupOnboardingPreviewResetAction: 'Reset seen state',
  backupOnboardingPreviewMarkSeenAction: 'Mark as seen',
  backupOnboardingPreviewFootnote:
    'In production this modal opens once after the archive reaches 3 saved dreams.',
  backupScreenTitle: 'Backup & sync',
  backupScreenSubtitle:
    'Restore backups bring data back into the app. Markdown, text, and PDFs are for reading or moving elsewhere. Cloud backup stays optional.',
  backupSummaryDescription:
    'Restore files, Markdown/text exports, PDFs, and optional cloud backup live here.',
  backupSummaryOpenTitle: 'Open backup workspace',
  backupLocalSectionTitle: 'Local files',
  backupLocalSectionDescription:
    'Create a restore backup, export readable Markdown or text, restore from backup, or export a PDF.',
  backupCloudSectionTitle: 'Cloud backup',
  backupCloudSectionDescription:
    'Optional sync for one archive across devices.',
  backupStatusTitle: 'Status details',
  backupStatusDescription:
    'Open this only when you need sync state or local-only details.',
  backupStatusToggleTitle: 'Cloud sync and local-only status',
  backupStatusToggleMetaCollapsed:
    'Hidden by default so the screen stays focused on backup, restore, and PDF actions.',
  backupStatusToggleMetaExpanded:
    'Shows recent sync state, latest restore backup, and what is still only on this device.',
  backupFlowGuideTitle: 'Choose the right file',
  backupFlowGuideDescription:
    'Each action creates or uses a different kind of file.',
  backupFlowBackupTitle: 'Backup export',
  backupFlowBackupMeta:
    'Creates a JSON restore file for this app. Use it later in Local restore or save it somewhere else.',
  backupFlowBackupValue: 'Restore file',
  backupFlowPortableTitle: 'Markdown / text export',
  backupFlowPortableMeta:
    'Creates readable .md or .txt files with stable structure and dream metadata. They are not restore files.',
  backupFlowPortableValue: 'Portable file',
  backupFlowPdfTitle: 'PDF export',
  backupFlowPdfMeta:
    'Creates a readable snapshot for reading or sharing. It is not a restore file.',
  backupFlowPdfValue: 'Readable file',
  backupFlowRestoreTitle: 'Restore',
  backupFlowRestoreMeta:
    'Applies a backup export to this device after preview. PDFs never appear here.',
  backupFlowRestoreValue: 'Applies backup',
  backupTimelineTitle: 'Cloud sync activity',
  backupTimelineDescription:
    'See the last cloud sync, latest restore backup, and this device state.',
  backupTimelineSyncTitle: 'Last successful sync',
  backupTimelineSnapshotTitle: 'Latest restore backup',
  backupTimelineDeviceTitle: 'This device',
  backupTimelineDeviceFreshnessLabel: 'Freshest local change',
  backupTimelineSnapshotMissing: 'No restore backup yet',
  backupTimelineSnapshotMissingMeta:
    'Create one restore backup and the latest preview will appear here.',
  backupTimelineDeviceLocalOnly: 'Local only',
  backupTimelineDeviceNeedsAttention: 'Needs attention',
  backupTimelineDeviceAheadSingle: '1 change ahead',
  backupTimelineDeviceAheadPlural: '{count} changes ahead',
  backupTimelineDeviceReviewAhead: 'Review sets ahead',
  backupTimelineDeviceCaughtUp: 'Caught up',
  backupTimelineDeviceWaitingFirstSync: 'Waiting for first sync',
  backupTimelineDeviceNoLocalChanges: 'No local changes yet',
  backupTimelineReviewSetsLabel: 'Review sets',
  backupTimelineReviewSetsPending: 'Review sets waiting for sync',
  backupContentTrustTitle: 'What is still only on this device',
  backupContentTrustDescription:
    'These counts show what has not reached cloud backup yet. Local backup files and PDFs are separate from this.',
  backupContentTrustAudioTitle: 'Voice notes',
  backupContentTrustAudioMeta: '{total} saved • {synced} already in cloud',
  backupContentTrustAudioEmpty: 'No voice notes yet',
  backupContentTrustAudioEmptyMeta:
    'Audio trust will appear here once a dream includes a voice note.',
  backupContentTrustAudioAllBackedUp: 'In cloud backup',
  backupContentTrustAudioStillLocalSingle: '1 still local',
  backupContentTrustAudioStillLocalPlural: '{count} still local',
  backupContentTrustTranscriptTitle: 'Saved transcripts',
  backupContentTrustTranscriptMeta: '{total} saved • {edited} edited',
  backupContentTrustTranscriptEmpty: 'No saved transcripts',
  backupContentTrustTranscriptEmptyMeta:
    'Transcript trust will appear here once a dream includes saved transcript text.',
  backupContentTrustTranscriptCaughtUp: 'Up to date in cloud',
  backupContentTrustTranscriptStillLocalSingle: '1 newer locally',
  backupContentTrustTranscriptStillLocalPlural: '{count} newer locally',
  backupContentTrustReviewTitle: 'Saved review sets',
  backupContentTrustReviewMeta:
    '{total} saved • {months} months • {threads} threads',
  backupContentTrustReviewEmpty: 'No saved sets yet',
  backupContentTrustReviewEmptyMeta:
    'Saved months and threads will appear here once you start curating review work.',
  backupContentTrustReviewCaughtUp: 'Up to date in cloud',
  backupContentTrustReviewStillLocal: 'Newer locally',
  backupContentTrustLocalOnly: 'Local only',
  cloudExistingBackupTitle: 'Open existing backup',
  cloudSaveBackupTitle: 'Save this backup',
  cloudIdentityTitle: 'Named account',
  cloudIdentityDescriptionSignedOut:
    'Sign in with the same email and password on another device to open the same archive.',
  cloudIdentityDescriptionAnonymous:
    'Save this backup under an email account so another device can open it.',
  cloudIdentityEmailLabel: 'Email',
  cloudIdentityEmailHint: 'Used for the same cloud account across devices.',
  cloudIdentityPasswordLabel: 'Password',
  cloudIdentityPasswordHint: 'Use at least 6 characters.',
  cloudCredentialsMissingTitle: 'Missing credentials',
  cloudCredentialsMissingDescription:
    'Enter an email and password before continuing.',
  cloudEmailMissingTitle: 'Missing email',
  cloudEmailMissingDescription: 'Enter the email for the backup account first.',
  cloudSyncToggleLabel: 'Auto sync',
  cloudSyncToggleHint:
    'Auto sync can be enabled only after cloud backup is connected.',
  cloudSyncDisabled: 'Off',
  cloudSyncEnabled: 'On',
  cloudPendingLabel: 'Pending',
  cloudSyncedLabel: 'Synced',
  cloudPulledLabel: 'Pulled',
  cloudSkippedLabel: 'Skipped',
  cloudConflictsLabel: 'Conflicts',
  cloudLocalWinsLabel: 'Local wins',
  cloudRemoteWinsLabel: 'Remote wins',
  cloudErrorsLabel: 'Errors',
  cloudSaveConfigButton: 'Save config',
  cloudClearConfigButton: 'Clear config',
  cloudConnectButton: 'Turn on backup',
  cloudConnectButtonBusy: 'Connecting...',
  cloudSignInExistingButton: 'Open existing backup',
  cloudSignInExistingButtonBusy: 'Signing in...',
  cloudResetPasswordButton: 'Send reset email',
  cloudResetPasswordButtonBusy: 'Sending email...',
  cloudUpgradeAccountButton: 'Save backup account',
  cloudUpgradeAccountButtonBusy: 'Saving account...',
  cloudDisconnectButton: 'Turn off backup',
  cloudDisconnectButtonBusy: 'Disconnecting...',
  cloudSyncNowButton: 'Sync now',
  cloudSyncNowButtonBusy: 'Syncing...',
  cloudLastSyncLabel: 'Last sync',
  cloudLastSyncNever: 'Never',
  cloudSyncStateIdle: 'Idle',
  cloudSyncStateSyncing: 'Syncing',
  cloudSyncStateSuccess: 'Synced',
  cloudSyncStateError: 'Needs attention',
  cloudSyncManualErrorTitle: 'Backup sync failed',
  cloudConfigMissingTitle: 'Supabase config missing',
  cloudConfigMissingDescription:
    'Add a valid project URL and anon key before connecting cloud.',
  cloudConfigErrorTitle: 'Cloud config error',
  cloudConnectErrorTitle: 'Backup connect failed',
  cloudAccountSignInErrorTitle: 'Account sign-in failed',
  cloudPasswordResetErrorTitle: 'Password reset failed',
  cloudPasswordResetSuccessTitle: 'Reset email sent',
  cloudPasswordResetSuccessDescription:
    'If this backup account exists, check that inbox for the password reset link.',
  cloudAccountUpgradeErrorTitle: 'Account upgrade failed',
  cloudDisconnectErrorTitle: 'Backup disconnect failed',
  cloudFootnote:
    'Cloud backup is optional sync between connected devices. Restore backups and PDFs are separate files, and this app does not add end-to-end encryption to them.',
  backupExportTitle: 'Backup export',
  backupExportDescription:
    'Create a JSON backup file for restore on this or another device.',
  backupExportFootnote:
    'Backup exports are plain files. Anyone with the file can read or import it. This app does not encrypt the file.',
  portableExportTitle: 'Markdown and text export',
  portableExportDescription:
    'Create a readable Markdown or plain-text file for portability. These files are not restore backups.',
  portableExportFootnote:
    'Markdown and text exports are plain files for reading, saving, or importing elsewhere. They stay separate from restore backups and PDFs.',
  pdfExportTitle: 'PDF export',
  pdfExportDescription:
    'Create a readable PDF for reference, printing, or sharing. It cannot be restored into the app.',
  pdfExportFootnote:
    'PDF exports are plain files for reading or sharing. This app does not encrypt the file.',
  exportTitle: 'Local export',
  exportDescription: 'Create a restore backup or a readable PDF snapshot.',
  exportLatestPathLabel: 'Latest file',
  exportFootnote: 'Backup is for restore later. PDF is for reading or sharing.',
  exportButton: 'Create backup',
  exportButtonBusy: 'Creating backup...',
  exportMarkdownButton: 'Create Markdown',
  exportMarkdownButtonBusy: 'Creating Markdown...',
  exportPdfButton: 'Create PDF',
  exportPdfButtonBusy: 'Rendering PDF...',
  exportTextButton: 'Create text',
  exportTextButtonBusy: 'Creating text...',
  exportOpenMarkdownButton: 'Open Markdown',
  exportOpenPdfButton: 'Open PDF',
  exportOpenTextButton: 'Open text',
  exportShareBackupButton: 'Share backup',
  exportShareMarkdownButton: 'Share Markdown',
  exportSharePdfButton: 'Share PDF',
  exportShareTextButton: 'Share text',
  exportBackupReadyTitle: 'Backup ready',
  exportBackupReadyDescription:
    'Use it later in Local restore, or share it to save a copy elsewhere.',
  exportMarkdownReadyTitle: 'Markdown export ready',
  exportMarkdownReadyDescription:
    'Open it to read now, or share it to keep a portable copy with stable structure.',
  exportPdfReadyTitle: 'PDF snapshot ready',
  exportPdfReadyDescription:
    'Open it now to read, or share it when you want to send it somewhere.',
  exportTextReadyTitle: 'Text export ready',
  exportTextReadyDescription:
    'Open it to read now, or share it to save a plain-text copy anywhere.',
  exportPdfOpenErrorTitle: 'Could not open PDF',
  exportPdfOpenErrorDescription:
    'Open failed on this device. Use Share PDF instead.',
  exportReadableOpenErrorTitle: 'Could not open export',
  exportReadableOpenErrorDescription:
    'Open failed on this device. Use Share instead.',
  exportErrorTitle: 'Export failed',
  exportPdfErrorTitle: 'PDF export failed',
  restoreTitle: 'Local restore',
  restoreDescription:
    'Choose a backup export, review it, then restore it on this device. PDFs cannot be restored.',
  restoreAvailableLabel: 'Available restore backups',
  restoreLoading: 'Loading restore backups...',
  restoreEmptyTitle: 'No restore backups yet',
  restoreEmptyDescription:
    'Create a backup export first, then it will appear here for preview and restore.',
  restorePreviewTitle: 'Restore preview',
  restoreSelectedValue: 'Selected',
  restoreModeLabel: 'Mode',
  restoreModeReplace: 'Replace',
  restoreModeMerge: 'Merge',
  restoreModeReplaceHint:
    'Replace local dreams, draft, locale, reminders, and analysis settings.',
  restoreModeMergeHint:
    'Add backup dreams, keep current settings, and import the backup draft only if the local draft is empty.',
  restoreNoBackupAction: 'Create a restore backup first',
  restoreSelectBackupAction: 'Choose a restore backup first',
  restoreLoadingAction: 'Preparing restore preview...',
  restoreReplaceWarning: 'Replace overwrites the local archive on this device.',
  restoreMergeGuidance:
    'Merge keeps current settings and adds dreams from the backup.',
  restoreFileLabel: 'File',
  restoreVersionLabel: 'Backup',
  restoreLocaleLabel: 'Locale',
  restoreDreamCountLabel: 'Dreams',
  restoreCurrentCountLabel: 'Now',
  restoreIncomingCountLabel: 'From backup',
  restoreNewCountLabel: 'New',
  restoreResultCountLabel: 'Result',
  restoreOverlapCountLabel: 'Overlap',
  restoreDraftLabel: 'Draft',
  restoreDraftPresent: 'Included',
  restoreDraftMissing: 'None',
  restoreSettingsLabel: 'Settings',
  restoreSettingsReplace: 'Backup settings replace local',
  restoreSettingsKeepCurrent: 'Current settings stay as they are',
  restoreDraftActionLabel: 'Draft',
  restoreDraftActionReplace: 'Backup draft replaces local draft',
  restoreDraftActionImportIfEmpty:
    'Backup draft imports only if local draft is empty',
  restoreExportedAtLabel: 'Exported',
  restoreAppVersionLabel: 'App',
  restoreRestoreButton: 'Replace with this backup',
  restoreMergeButton: 'Merge from this backup',
  restoreRestoreButtonBusy: 'Restoring...',
  restoreConfirmTitle: 'Replace local data?',
  restoreConfirmDescription:
    'This will replace local dreams, draft, locale, reminder settings, and analysis settings with the selected backup.',
  restoreMergeConfirmTitle: 'Merge backup into local data?',
  restoreMergeConfirmDescription:
    'This will add backup dreams to the current archive, keep current settings, and import the backup draft only if the local draft is empty.',
  restoreSuccessTitle: 'Backup restored',
  restoreSuccessDescription: 'Local data was replaced from:',
  restoreSuccessModeLabel: 'Applied mode',
  restoreSuccessCountLabel: 'Dreams now on device',
  restoreErrorTitle: 'Restore failed',
  transcriptionTitle: 'Offline transcription',
  transcriptionDescription:
    'Transcribe voice notes on device after one model download.',
  transcriptionStatusLabel: 'Model',
  transcriptionStatusInstalled: 'Downloaded',
  transcriptionStatusMissing: 'Not downloaded yet',
  transcriptionSizeLabel: 'Size',
  transcriptionPathLabel: 'Local file',
  transcriptionDownloadButton: 'Download offline model',
  transcriptionDownloadButtonBusy: 'Downloading model...',
  transcriptionDownloadSuccessTitle: 'Model ready',
  transcriptionDownloadSuccessDescription:
    'The offline transcription model is now stored locally on this device.',
  transcriptionDownloadErrorTitle: 'Could not download model',
  transcriptionDeleteButton: 'Delete local model',
  transcriptionDeleteButtonBusy: 'Deleting model...',
  transcriptionMissingHint:
    'Download the model once to enable offline transcription.',
  transcriptionDeleteSuccessTitle: 'Model removed',
  transcriptionDeleteSuccessDescription:
    'The offline transcription model was removed from local storage.',
  transcriptionDeleteErrorTitle: 'Could not remove model',
  scaleTestTitle: 'Scale test',
  scaleTestDescription: 'Generate sample dreams for stress testing.',
  developerToolsTitle: 'Developer tools',
  developerToolsDescription:
    'Debug-only tools for previews, seed data, and stress testing.',
  devSyncHistoryTitle: 'Recent sync attempts',
  devSyncHistoryDescription:
    'Debug-only history of the latest cloud sync outcomes on this device.',
  devSyncReasonManual: 'Manual',
  devSyncReasonLaunch: 'Launch',
  devSyncSnapshotTitle: 'Latest sync snapshot',
  devSyncSnapshotDescription:
    'Debug-only view of the latest stored sync result on this device.',
  devSyncSnapshotStatusTitle: 'Status',
  devSyncSnapshotReasonTitle: 'Reason',
  devSyncSnapshotPendingTitle: 'Pending changes',
  devSyncSnapshotPendingDreamsTitle: 'Pending dreams',
  devSyncSnapshotPendingDeletesTitle: 'Pending deletions',
  devSyncSnapshotPendingReviewTitle: 'Pending review sets',
  devSyncSnapshotUploadsTitle: 'Uploaded',
  devSyncSnapshotPullsTitle: 'Pulled',
  devSyncSnapshotConflictsTitle: 'Conflicts',
  devSyncSnapshotErrorsTitle: 'Last error',
  devSyncHistoryEmptyTitle: 'No sync attempts yet',
  devSyncHistoryEmptyDescription:
    'Run backup sync once and the latest debug history will appear here.',
  scaleTestSeededLabel: 'Sample dreams',
  scaleTestAdd250: 'Add 250',
  scaleTestAdd1000: 'Add 1000',
  scaleTestClear: 'Clear samples',
  scaleTestBusy: 'Working...',
  scaleTestClearTitle: 'Clear sample dreams?',
  scaleTestClearDescription:
    'This removes only generated sample dreams. Your own entries stay untouched.',
  scaleTestSeededTitle: 'Sample dreams ready',
  scaleTestSeededDescription:
    'The archive was filled with generated dreams for scale testing.',
  scaleTestErrorTitle: 'Could not prepare sample dreams',
  biometricLockTitle: 'App lock',
  biometricLockDescription:
    'Require Face ID, Touch ID, or fingerprint when opening the app.',
  biometricLockEnabledValue: 'On',
  biometricLockDisabledValue: 'Off',
  biometricLockNotSupportedValue: 'Not supported',
  biometricLockNotEnrolledValue: 'Not enrolled',
  biometricLockPrompt: 'Unlock Kaleidoscope',
  biometricLockUnlockLabel: 'Unlock',
  biometricLockScreenSubtitle: 'Your dreams are protected.',
  biometricLockAppName: 'Kaleidoscope',
  biometricLockEnableErrorTitle: 'Could not enable app lock',
  biometricLockEnableErrorUnsupported:
    'Your device does not support biometric authentication.',
  biometricLockEnableErrorNotEnrolled:
    'No biometrics are set up on this device. Enable Face ID or fingerprint in system settings first.',
  biometricLockEnableErrorFailed:
    'Biometric check failed. App lock was not enabled.',
  analysisTitle: 'Dream analysis',
  analysisDescription: 'Generate a local reflection from saved dream data.',
  analysisProviderLabel: 'Provider',
  analysisProviderManual: 'Local manual',
  analysisProviderOpenAi: 'OpenAI (planned)',
  analysisNetworkLabel: 'Network',
  analysisNetworkAllowed: 'Allowed',
  analysisNetworkBlocked: 'Blocked',
  analysisLocalNetworkHint: 'Local analysis does not need network access.',
};

const SETTINGS_COPY_UK: typeof SETTINGS_COPY_EN = {
  ...SETTINGS_COPY_EN,
  title: 'Налаштування',
  subtitle:
    'Локальні керування нагадуваннями, приватністю, копіями й аналізом.',
  toggleShow: 'Показати',
  toggleHide: 'Сховати',
  hubAppearanceTitle: 'Вигляд і мова',
  hubAppearanceMeta: 'Палітра та мова, якою говорить застосунок',
  hubRemindersTitle: 'Нагадування',
  hubRemindersMeta: 'Коли питати тебе про минулу ніч',
  hubRemindersOff: 'Вимкнено',
  hubBackupTitle: 'Копії та синхронізація',
  hubSecurityTitle: 'Приватність і замок',
  hubSecurityMeta: 'Де живуть сни й хто може їх відкрити',
  hubSecurityLocked: 'Із замком',
  hubSecurityUnlocked: 'Без замка',
  hubAnalysisTitle: 'Аналіз і транскрипція',
  hubAnalysisMeta: 'Читання патернів і перетворення голосу на текст',
  hubAboutTitle: 'Про застосунок',
  hubAboutMeta: 'Версія, сховище та експорт',
  footerBuildLabel: 'Kaleidoskop',
  footerStorageMetaPrefix: 'Схема',
  footerExportMetaPrefix: 'Експорт',
  reminderTitle: 'Нагадування про сон',
  reminderDescription:
    'Одне щоденне нагадування після пробудження, щоб швидше фіксувати сни.',
  reminderPermissionLabel: 'Сповіщення',
  reminderPermissionBlocked: 'Заблоковані',
  reminderCurrentScheduleLabel: 'Поточний розклад',
  reminderEnableHint: 'Увімкни, щоб вибрати щоденний час нагадування.',
  reminderOffValue: 'Вимкнено',
  reminderTimeLabel: 'Час нагадування',
  reminderTimeHint: 'Натисни, щоб змінити.',
  reminderSmartSuggestionLabel: 'На основі твоїх патернів запису',
  reminderSmartSuggestionApply: 'Встановити на',
  reminderStyleTitle: 'Стиль нагадування',
  reminderStyleDescription:
    'Змінює лише тон. Час і доставка лишаються тими самими.',
  reminderStyleBalancedLabel: 'Спокійний',
  reminderStyleBalancedDescription: 'Чітко й нейтрально.',
  reminderStyleGentleLabel: 'М’який',
  reminderStyleGentleDescription: 'М’якше й більш рефлексивно.',
  reminderStyleDirectLabel: 'Прямий',
  reminderStyleDirectDescription: 'Коротко й більш терміново.',
  reminderStylePreviewLabel: 'Попередній перегляд сповіщення',
  reminderStyleFootnote:
    'Можна вибрати тон заздалегідь, навіть якщо нагадування вимкнені.',
  reminderPreviewWakeAction: 'Переглянути ранковий режим',
  reminderPreviewWakeMeta:
    'Відкрий екран після нагадування без очікування наступного сповіщення.',
  devPreviewMonthlyReport: 'Переглянути місячний звіт',
  devPreviewBackupOnboarding: 'Переглянути backup onboarding',
  devPreviewBackupOnboardingMeta:
    'Відкрий preview одноразового modal і скинь його seen state.',
  devPreviewSyncDiagnostics: 'Переглянути sync diagnostics',
  devPreviewSyncDiagnosticsMeta:
    'Відкрий debug-only екран з останнім sync snapshot і недавніми sync спробами.',
  actionCancel: 'Скасувати',
  reminderPermissionDeniedTitle: 'Сповіщення вимкнені',
  reminderPermissionDeniedDescription:
    'Дозволь сповіщення в системних налаштуваннях, щоб увімкнути нагадування.',
  reminderSaveErrorTitle: 'Помилка нагадування',
  reminderNotificationTitle: 'Запиши свій сон',
  reminderNotificationBody: 'Зафіксуй його, поки деталі ще свіжі.',
  reminderStyleGentleNotificationTitle: 'Втримай сон поруч',
  reminderStyleGentleNotificationBody:
    'Кілька спокійних слів зараз допоможуть зберегти відчуття, поки день не розігнався.',
  reminderStyleDirectNotificationTitle: 'Запиши це зараз',
  reminderStyleDirectNotificationBody:
    'Схопи головні образи, поки вони не вислизнули.',
  languageTitle: 'Мова',
  languageDescription: 'Обери мову застосунку.',
  languageEnglish: 'EN',
  languageUkrainian: 'UA',
  calmModeTitle: 'Спокійний режим',
  calmModeHint:
    'Ховає пояснення під заголовками й полями. Значення, лічильники та помилки лишаються.',
  nightCaptureTitle: 'Нічний запис',
  nightCaptureHint:
    'Між 22:00 і 07:00 екран запису стає теплим і темним — незалежно від обраної теми.',
  themeTitle: 'Оформлення',
  themeDescription: 'Обери палітру, яка використовується в усьому застосунку.',
  themeFootnote:
    'Kaleido зберігає поточний вигляд застосунку як тему за замовчуванням.',
  themeOptionKaleido: 'Kaleido',
  themeOptionEmber: 'Ember',
  themeOptionMoss: 'Moss',
  themeOptionDaylight: 'Денне',
  privacyTitle: 'Приватність і зберігання',
  privacyDescription:
    'Дані про сни лишаються на пристрої за замовчуванням. Хмара лишається опційною і не блокує перший запис.',
  privacyStorageLabel: 'Дані про сни',
  privacyStorageValue: 'Лише на цьому пристрої',
  privacyReminderLabel: 'Нагадування',
  privacyReminderValue: 'Локальні сповіщення',
  privacyFootnote:
    'Якщо видалити застосунок, локальні записи, завантажена модель транскрипції і чернетки можуть зникнути, доки не зʼявиться експорт або синхронізація.',
  privacyOpenAction: 'Як ми поводимось з даними',
  privacyScreenTitle: 'Ваші дані',
  privacyScreenIntro:
    'Ваші сни зберігаються на цьому пристрої. Нікуди нічого не надсилається, доки ви самі не ввімкнете відповідну функцію, а кожна з них вимкнена від початку.',
  privacyLocalTitle: 'Лишається на пристрої',
  privacyLocalBody:
    'Текст снів, заголовки, теги, настрої, голосові записи й розшифровки. Патерни, серії та статистика теж обчислюються тут, а не на сервері.',
  privacyLeavesTitle: 'Що може вийти назовні та коли',
  privacyCloudTitle: 'Хмарна копія, якщо ви її ввімкнете',
  privacyCloudBody:
    'Вивантажує текст снів, розшифровки й записи, зашифровані на цьому пристрої ключем, якого сервер ніколи не отримує. Сервер бачить, скільки у вас снів і коли ви востаннє щось змінювали, — і нічого про їхній зміст. Ключ переїжджає на ваші інші пристрої через iCloud Keychain або резервну копію Android, а код відновлення є в цих налаштуваннях, якщо він знадобиться.',
  privacyCrashTitle: 'Звіти про збої, у складаннях із цією опцією',
  privacyCrashBody:
    'Надсилає помилку, версію застосунку й екран, який був відкритий. Текст снів, заголовки, розшифровки, теги та ваша особа вирізаються до надсилання.',
  privacyModelTitle: 'Модель розпізнавання, один раз',
  privacyModelBody:
    'Розшифровка працює на цьому пристрої, але модель завантажується під час першого використання. Той запит не містить даних про сни. Далі розшифровка працює офлайн.',
  privacyLockTitle: 'Замок',
  privacyLockBody:
    'Біометрію перевіряє система; застосунок дізнається лише, чи її прийнято. Замок ховає екрани — він не шифрує збережені файли.',
  privacyDeleteTitle: 'Як видалити все',
  privacyDeleteBody:
    'Видалення застосунку прибирає все, що зберігається тут, разом із записами й чернетками. Спершу зробіть експорт, якщо хочете зберегти. Те, що вже вивантажено, лишається, доки ви не видалите ті сни з увімкненою копією.',
  privacyNoAccountNote:
    'Немає ані облікового запису, ані профілю, ані аналітики. Офлайн застосунок повноцінний.',
  archiveKeyTitle: 'Ключ до вашого архіву',
  archiveKeyDescription:
    'Ваші сни шифруються перед вивантаженням. Це ключ, який їх відкриває.',
  archiveKeyTravelsIcloud:
    'iCloud Keychain переносить його на ваші інші пристрої Apple. Робити нічого не треба.',
  archiveKeyTravelsAndroid:
    'Резервна копія Google переносить його на ваш наступний пристрій Android. Робити нічого не треба.',
  archiveKeyStranded:
    'Резервне копіювання вимкнене, тож ключ нікуди не поїде сам. Збережи код відновлення — інакше архів відкриватиметься лише тут.',
  archiveKeyMissingForArchive:
    'Архів у хмарі зашифрований іншим ключем. Введи його код відновлення, щоб прочитати архів тут. На цьому телефоні нічого не змінилося.',
  archiveKeyNotYetCreated:
    'Ключ створюється під час першої синхронізації. Доти зберігати нічого.',
  archiveKeyRevealAction: 'Показати код відновлення',
  archiveKeyHideAction: 'Сховати код відновлення',
  archiveKeyCodeIntro:
    'Двадцять чотири слова, саме в такому порядку. Це і є ключ — хто має ці слова, той прочитає ваш архів. Вони потрібні лише для переходу між iPhone та Android або для відновлення телефона без резервної копії.',
  archiveKeyEntryLabel: 'Код відновлення',
  archiveKeyEntryPlaceholder: 'Вставте або введіть двадцять чотири слова',
  archiveKeyEntryAction: 'Використати цей код',
  archiveKeyEntryInvalid:
    'Код неповний. Перевір, чи не пропущене або не переплутане слово — у коді є контрольна сума, тож це видно.',
  archiveKeyEntryAccepted:
    'Ключ прийнято. Синхронізуйте ще раз, щоб прочитати архів.',
  cloudTitle: 'Хмарний backup',
  cloudDescription: 'Опційний sync одного архіву між пристроями.',
  cloudConfigLabel: 'Runtime-конфіг',
  cloudConfigReady: 'Готово',
  cloudConfigMissing: 'Відсутній',
  cloudConfigUrlLabel: 'Supabase URL',
  cloudConfigUrlHint: 'URL проєкту, зазвичай *.supabase.co.',
  cloudConfigAnonKeyLabel: 'Anon key',
  cloudConfigAnonKeyHint: 'Публічний anon key для mobile-клієнта.',
  cloudSessionLabel: 'Резервна копія',
  cloudSessionSignedOut: 'Вимкнено',
  cloudSessionSignedIn: 'Увімкнено',
  cloudAccountLabel: 'Акаунт',
  cloudAccountDisconnected: 'Ще не привʼязано',
  cloudAccountAnonymous: 'Потрібен email-акаунт',
  cloudPathTitle: 'Що тобі потрібно на цьому пристрої?',
  cloudPathDescription:
    'Обери, чи це пристрій, на якому backup починається, чи той, що має відкрити вже існуючий архів.',
  cloudPathThisDevice: 'Почати тут',
  cloudPathAnotherDevice: 'Відкрити існуючий',
  cloudFirstDeviceTitle: 'Почати backup на цьому пристрої',
  cloudFirstDeviceDescription:
    'Спершу створи backup на цьому пристрої, а потім збережи його під email-акаунтом, якщо хочеш відкрити той самий архів на іншому пристрої.',
  cloudGuideTitle: 'Як працює backup',
  cloudGuideStepOne: 'Увімкни backup на своєму першому пристрої.',
  cloudGuideStepTwo:
    'Збережи його під email-акаунтом, якщо хочеш той самий архів на іншому пристрої.',
  cloudGuideStepThree:
    'Відкрий той самий backup на іншому пристрої й запусти sync.',
  cloudGuideExistingStepOne:
    'Введи ту саму пошту і пароль, які вже використовуються для цього backup.',
  cloudGuideExistingStepTwo:
    'Відкрий цей архів на пристрої й дай sync підтягнути останні зміни.',
  cloudGuideExistingStepThree:
    'Тримай sync увімкненим, щоб редагування і видалення ходили між пристроями.',
  cloudGuideAnonymousStepOne: 'Цей пристрій уже підключений до backup.',
  cloudGuideAnonymousStepTwo: 'Тепер збережи цей backup під email-акаунтом.',
  cloudGuideAnonymousStepThree:
    'Після цього відкрий той самий backup на іншому пристрої.',
  cloudGuideNamedStepOne: 'Цей backup уже привʼязаний до твого акаунта.',
  cloudGuideNamedStepTwo:
    'Відкрий той самий backup з цією поштою на іншому пристрої.',
  cloudGuideNamedStepThree:
    'Тримай sync увімкненим, щоб зміни ходили між пристроями.',
  cloudSuccessTitle: 'Що далі',
  cloudConnectedSuccessTitle: 'Backup увімкнено на цьому пристрої',
  cloudConnectedSuccessDescription:
    'Тепер збережи цей backup під email-акаунтом, якщо хочеш відкрити той самий архів на іншому пристрої.',
  cloudSignedInSuccessTitle: 'Існуючий backup відкрито',
  cloudSignedInSuccessDescription:
    'Цей пристрій уже підключений до твого backup. Тепер запусти sync, щоб підтягнути останні зміни архіву.',
  cloudUpgradedSuccessTitle: 'Backup-акаунт збережено',
  cloudUpgradedSuccessDescription:
    'Тепер цей backup привʼязаний до твоєї пошти. Відкрий той самий backup на іншому пристрої з цими даними.',
  cloudResetSuccessTitle: 'Перевір пошту',
  cloudResetSuccessDescription:
    'Відкрий посилання зі листа для скидання пароля, а потім повернись сюди й увійди з новим паролем.',
  backupCueOpenAction: 'Відкрити backup',
  backupCueConnectTitle: 'Збережи цей архів у backup',
  backupCueConnectDescription:
    'Зроби архів доступним на іншому пристрої, поки локальних змін не стало більше.',
  backupCueSyncOffTitle: 'Backup підключено, але sync вимкнений',
  backupCueSyncOffDescription:
    'Увімкни sync знову перед переходом на інший пристрій, щоб нові локальні зміни не лишилися тут.',
  backupCueReviewPendingTitle:
    'Збережені набори ревʼю новіші на цьому пристрої',
  backupCueReviewPendingDescription:
    'Збережені місяці й нитки змінилися локально. Відкрий backup і запусти sync перед переходом на інший пристрій.',
  backupOnboardingEyebrow: 'Архів уже почався',
  backupOnboardingDismissAction: 'Закрити',
  backupOnboardingTitle: 'У тебе вже є сни, які варто зберегти',
  backupOnboardingDescription:
    'Після кількох записів backup уже має сенс. Збережи цей архів, поки він не лишився прив’язаним до одного пристрою.',
  backupOnboardingDreamsLabel: 'Збережених снів',
  backupOnboardingThresholdLabel: 'Поріг показу',
  backupOnboardingValueTitle: 'Чому саме зараз',
  backupOnboardingValueDescription:
    'Backup тримає архів придатним до відновлення і робить saved review sets корисними між пристроями, коли вони починають накопичуватись.',
  backupOnboardingPrimaryAction: 'Відкрити backup',
  backupOnboardingLaterAction: 'Пізніше',
  backupOnboardingPreviewTitle: 'Preview backup onboarding',
  backupOnboardingPreviewDescription:
    'Перевір одноразовий backup prompt без очікування нового акаунта.',
  backupOnboardingPreviewSeenTitle: 'Стан показу',
  backupOnboardingPreviewSeenValue: 'Вже показано',
  backupOnboardingPreviewUnseenValue: 'Ще не показано',
  backupOnboardingPreviewEligibilityTitle: 'Умова показу в продакшені',
  backupOnboardingPreviewEligibilityReady: 'На Home уже відкрився б.',
  backupOnboardingPreviewEligibilityWaiting:
    'Потрібно 3 збережені сни і unseen state.',
  backupOnboardingPreviewEligibilityReadyValue: 'Готово',
  backupOnboardingPreviewEligibilityWaitingValue: 'Очікує',
  backupOnboardingPreviewOpenAction: 'Відкрити modal preview',
  backupOnboardingPreviewResetAction: 'Скинути seen state',
  backupOnboardingPreviewMarkSeenAction: 'Позначити як показаний',
  backupOnboardingPreviewFootnote:
    'У production цей modal відкривається один раз після 3 збережених снів.',
  backupScreenTitle: 'Backup і sync',
  backupScreenSubtitle:
    'Restore-backup повертає дані в застосунок. Markdown, text і PDF потрібні для читання або перенесення деінде. Хмарний backup лишається опційним.',
  backupSummaryDescription:
    'Тут живуть restore-файли, Markdown/text-експорт, PDF і опційний хмарний backup.',
  backupSummaryOpenTitle: 'Відкрити простір backup',
  backupLocalSectionTitle: 'Локальні файли',
  backupLocalSectionDescription:
    'Створи restore-backup, читабельний Markdown або text-експорт, відновися з backup або експортуй PDF.',
  backupCloudSectionTitle: 'Хмарний backup',
  backupCloudSectionDescription: 'Опційний sync одного архіву між пристроями.',
  backupStatusTitle: 'Деталі статусу',
  backupStatusDescription:
    'Відкривай лише коли треба перевірити sync-стан або що лишилось тільки локально.',
  backupStatusToggleTitle: 'Статус cloud sync і локальних даних',
  backupStatusToggleMetaCollapsed:
    'Сховано за замовчуванням, щоб екран лишався сфокусованим на backup, restore і PDF.',
  backupStatusToggleMetaExpanded:
    'Показує недавній sync-стан, останній restore-backup і що ще є лише на цьому пристрої.',
  backupFlowGuideTitle: 'Обери правильний файл',
  backupFlowGuideDescription:
    'Кожна дія створює або використовує інший тип файла.',
  backupFlowBackupTitle: 'Експорт backup',
  backupFlowBackupMeta:
    'Створює JSON-файл для відновлення в цьому застосунку. Його можна використати пізніше в Локальному відновленні або зберегти деінде.',
  backupFlowBackupValue: 'Файл для restore',
  backupFlowPortableTitle: 'Експорт у Markdown / текст',
  backupFlowPortableMeta:
    'Створює читабельні .md або .txt файли зі стабільною структурою і метаданими снів. Це не restore-файли.',
  backupFlowPortableValue: 'Портативний файл',
  backupFlowPdfTitle: 'Експорт PDF',
  backupFlowPdfMeta:
    'Створює читабельний знімок для читання або поширення. Це не файл для відновлення.',
  backupFlowPdfValue: 'Файл для читання',
  backupFlowRestoreTitle: 'Відновлення',
  backupFlowRestoreMeta:
    'Застосовує backup-експорт на цьому пристрої після preview. PDF тут ніколи не зʼявляється.',
  backupFlowRestoreValue: 'Застосовує backup',
  backupTimelineTitle: 'Активність хмарного sync',
  backupTimelineDescription:
    'Подивись на останній хмарний sync, останній restore-backup і стан цього пристрою.',
  backupTimelineSyncTitle: 'Останній успішний синк',
  backupTimelineSnapshotTitle: 'Останній restore-backup',
  backupTimelineDeviceTitle: 'Цей пристрій',
  backupTimelineDeviceFreshnessLabel: 'Найсвіжіша локальна зміна',
  backupTimelineSnapshotMissing: 'Restore-backup ще немає',
  backupTimelineSnapshotMissingMeta:
    'Створи restore-backup один раз, і тут з’явиться найновіший preview.',
  backupTimelineDeviceLocalOnly: 'Лише локально',
  backupTimelineDeviceNeedsAttention: 'Потрібна увага',
  backupTimelineDeviceAheadSingle: 'На 1 зміну попереду',
  backupTimelineDeviceAheadPlural: 'На {count} змін попереду',
  backupTimelineDeviceReviewAhead: 'Набори ревʼю попереду',
  backupTimelineDeviceCaughtUp: 'Актуально',
  backupTimelineDeviceWaitingFirstSync: 'Чекає на перший синк',
  backupTimelineDeviceNoLocalChanges: 'Локальних змін ще немає',
  backupTimelineReviewSetsLabel: 'Набори ревʼю',
  backupTimelineReviewSetsPending: 'Набори ревʼю чекають на синк',
  backupContentTrustTitle: 'Що ще є лише на цьому пристрої',
  backupContentTrustDescription:
    'Ці числа показують, що ще не дійшло до хмарного backup. Локальні backup-файли й PDF рахуються окремо.',
  backupContentTrustAudioTitle: 'Голосові нотатки',
  backupContentTrustAudioMeta: '{total} збережено • {synced} уже в хмарі',
  backupContentTrustAudioEmpty: 'Ще немає голосових нотаток',
  backupContentTrustAudioEmptyMeta:
    'Статус аудіо з’явиться тут, щойно якийсь сон матиме голосову нотатку.',
  backupContentTrustAudioAllBackedUp: 'Є в хмарному backup',
  backupContentTrustAudioStillLocalSingle: '1 ще локально',
  backupContentTrustAudioStillLocalPlural: '{count} ще локально',
  backupContentTrustTranscriptTitle: 'Збережені транскрипти',
  backupContentTrustTranscriptMeta:
    '{total} збережено • {edited} відредаговано',
  backupContentTrustTranscriptEmpty: 'Ще немає збережених транскриптів',
  backupContentTrustTranscriptEmptyMeta:
    'Статус транскриптів з’явиться тут, щойно якийсь сон матиме збережений текст транскрипту.',
  backupContentTrustTranscriptCaughtUp: 'Актуально в хмарі',
  backupContentTrustTranscriptStillLocalSingle: '1 новіший локально',
  backupContentTrustTranscriptStillLocalPlural: '{count} новіші локально',
  backupContentTrustReviewTitle: 'Збережені набори ревʼю',
  backupContentTrustReviewMeta:
    '{total} збережено • {months} місяців • {threads} ниток',
  backupContentTrustReviewEmpty: 'Ще немає збережених наборів',
  backupContentTrustReviewEmptyMeta:
    'Збережені місяці й нитки зʼявляться тут, щойно ти почнеш збирати ревʼю-набори.',
  backupContentTrustReviewCaughtUp: 'Актуально в хмарі',
  backupContentTrustReviewStillLocal: 'Новіше локально',
  backupContentTrustLocalOnly: 'Лише локально',
  cloudExistingBackupTitle: 'Відкрити існуючий backup',
  cloudSaveBackupTitle: 'Зберегти цей backup',
  cloudIdentityTitle: 'Іменний акаунт',
  cloudIdentityDescriptionSignedOut:
    'Увійди з тією ж поштою і паролем на іншому пристрої, щоб відкрити той самий архів.',
  cloudIdentityDescriptionAnonymous:
    'Збережи цей backup під email-акаунтом, щоб інший пристрій міг відкрити його.',
  cloudIdentityEmailLabel: 'Email',
  cloudIdentityEmailHint:
    'Використовується для того самого хмарного акаунта на різних пристроях.',
  cloudIdentityPasswordLabel: 'Пароль',
  cloudIdentityPasswordHint: 'Використай щонайменше 6 символів.',
  cloudCredentialsMissingTitle: 'Немає даних для входу',
  cloudCredentialsMissingDescription:
    'Введи email і пароль перед продовженням.',
  cloudEmailMissingTitle: 'Немає email',
  cloudEmailMissingDescription: 'Спершу введи email для backup-акаунта.',
  cloudSyncToggleLabel: 'Автосинк',
  cloudSyncToggleHint:
    'Автосинк можна увімкнути лише після підключення backup.',
  cloudSyncDisabled: 'Вимкнено',
  cloudSyncEnabled: 'Увімкнено',
  cloudPendingLabel: 'У черзі',
  cloudSyncedLabel: 'Синхронізовано',
  cloudPulledLabel: 'Підтягнуто',
  cloudSkippedLabel: 'Пропущено',
  cloudConflictsLabel: 'Конфлікти',
  cloudLocalWinsLabel: 'Переміг локальний стан',
  cloudRemoteWinsLabel: 'Переміг remote стан',
  cloudErrorsLabel: 'Помилки',
  cloudSaveConfigButton: 'Зберегти конфіг',
  cloudClearConfigButton: 'Очистити конфіг',
  cloudConnectButton: 'Увімкнути backup',
  cloudConnectButtonBusy: 'Підключення...',
  cloudSignInExistingButton: 'Відкрити існуючий backup',
  cloudSignInExistingButtonBusy: 'Вхід...',
  cloudResetPasswordButton: 'Надіслати лист для скидання',
  cloudResetPasswordButtonBusy: 'Надсилаємо лист...',
  cloudUpgradeAccountButton: 'Зберегти backup-акаунт',
  cloudUpgradeAccountButtonBusy: 'Збереження акаунта...',
  cloudDisconnectButton: 'Вимкнути backup',
  cloudDisconnectButtonBusy: 'Відключення...',
  cloudSyncNowButton: 'Синхронізувати',
  cloudSyncNowButtonBusy: 'Синхронізація...',
  cloudLastSyncLabel: 'Останній синк',
  cloudLastSyncNever: 'Ще не було',
  cloudSyncStateIdle: 'Очікує',
  cloudSyncStateSyncing: 'Синхронізація',
  cloudSyncStateSuccess: 'Синхронізовано',
  cloudSyncStateError: 'Потрібна увага',
  cloudSyncManualErrorTitle: 'Помилка синхронізації backup',
  cloudConfigMissingTitle: 'Немає Supabase-конфігу',
  cloudConfigMissingDescription:
    'Додай валідний URL проєкту та anon key перед підключенням хмари.',
  cloudConfigErrorTitle: 'Помилка cloud-конфігу',
  cloudConnectErrorTitle: 'Не вдалося підключити backup',
  cloudAccountSignInErrorTitle: 'Не вдалося увійти в акаунт',
  cloudPasswordResetErrorTitle: 'Не вдалося надіслати лист для скидання',
  cloudPasswordResetSuccessTitle: 'Лист для скидання надіслано',
  cloudPasswordResetSuccessDescription:
    'Якщо такий backup-акаунт існує, перевір пошту й відкрий посилання для скидання пароля.',
  cloudAccountUpgradeErrorTitle: 'Не вдалося оновити акаунт',
  cloudDisconnectErrorTitle: 'Не вдалося вимкнути backup',
  cloudFootnote:
    'Хмарний backup це опційний sync між підключеними пристроями. Restore-backup і PDF це окремі файли, і застосунок не додає їм end-to-end encryption.',
  backupExportTitle: 'Експорт backup',
  backupExportDescription:
    'Створи JSON-файл backup для відновлення на цьому або іншому пристрої.',
  backupExportFootnote:
    'Backup-експорт це звичайний файл. Будь-хто з доступом до файла може його прочитати або імпортувати. Застосунок не шифрує цей файл.',
  portableExportTitle: 'Markdown і text-експорт',
  portableExportDescription:
    'Створи читабельний файл Markdown або plain text для portability. Це не restore-backup.',
  portableExportFootnote:
    'Markdown і text-експорт це звичайні файли для читання, збереження або імпорту деінде. Вони окремі від restore-backup і PDF.',
  pdfExportTitle: 'Експорт PDF',
  pdfExportDescription:
    'Створи читабельний PDF для довідки, друку або поширення. Його не можна відновити назад у застосунок.',
  pdfExportFootnote:
    'PDF-експорт це звичайний файл для читання або поширення. Застосунок не шифрує цей файл.',
  exportTitle: 'Локальний експорт',
  exportDescription:
    'Створи backup для відновлення або читабельний PDF-знімок.',
  exportLatestPathLabel: 'Останній файл',
  exportFootnote:
    'Backup потрібен для відновлення пізніше. PDF підходить для читання або поширення.',
  exportButton: 'Створити backup',
  exportButtonBusy: 'Створення backup...',
  exportMarkdownButton: 'Створити Markdown',
  exportMarkdownButtonBusy: 'Створення Markdown...',
  exportPdfButton: 'Створити PDF',
  exportPdfButtonBusy: 'Створення PDF...',
  exportTextButton: 'Створити text',
  exportTextButtonBusy: 'Створення text...',
  exportOpenMarkdownButton: 'Відкрити Markdown',
  exportOpenPdfButton: 'Відкрити PDF',
  exportOpenTextButton: 'Відкрити text',
  exportShareBackupButton: 'Поширити backup',
  exportShareMarkdownButton: 'Поширити Markdown',
  exportSharePdfButton: 'Поширити PDF',
  exportShareTextButton: 'Поширити text',
  exportBackupReadyTitle: 'Backup готовий',
  exportBackupReadyDescription:
    'Пізніше його можна використати в Локальному відновленні або поширити й зберегти деінде.',
  exportMarkdownReadyTitle: 'Markdown-експорт готовий',
  exportMarkdownReadyDescription:
    'Відкрий його зараз для читання або пошир, щоб зберегти portable-копію зі стабільною структурою.',
  exportPdfReadyTitle: 'PDF-знімок готовий',
  exportPdfReadyDescription:
    'Відкрий його зараз для читання або пошир, коли захочеш кудись надіслати.',
  exportTextReadyTitle: 'Text-експорт готовий',
  exportTextReadyDescription:
    'Відкрий його зараз для читання або пошир, щоб зберегти plain-text копію будь-де.',
  exportPdfOpenErrorTitle: 'Не вдалося відкрити PDF',
  exportPdfOpenErrorDescription:
    'На цьому пристрої файл не відкрився. Скористайся Поширити PDF.',
  exportReadableOpenErrorTitle: 'Не вдалося відкрити експорт',
  exportReadableOpenErrorDescription:
    'На цьому пристрої файл не відкрився. Скористайся Поширити.',
  exportErrorTitle: 'Помилка експорту',
  exportPdfErrorTitle: 'Помилка PDF-експорту',
  restoreTitle: 'Локальне відновлення',
  restoreDescription:
    'Обери backup-експорт, переглянь його і віднови на цьому пристрої. PDF відновити не можна.',
  restoreAvailableLabel: 'Доступні restore-backup',
  restoreLoading: 'Завантаження restore-backup...',
  restoreEmptyTitle: 'Restore-backup ще немає',
  restoreEmptyDescription:
    'Спершу створи backup-експорт, і він з’явиться тут для preview та відновлення.',
  restorePreviewTitle: 'Preview відновлення',
  restoreSelectedValue: 'Вибрано',
  restoreModeLabel: 'Режим',
  restoreModeReplace: 'Замінити',
  restoreModeMerge: 'Об’єднати',
  restoreModeReplaceHint:
    'Замінити локальні сни, чернетку, мову, нагадування й налаштування аналізу.',
  restoreModeMergeHint:
    'Додати сни з копії, лишити поточні налаштування і взяти чернетку з копії лише якщо локальна порожня.',
  restoreNoBackupAction: 'Спершу створи restore-backup',
  restoreSelectBackupAction: 'Спершу обери restore-backup',
  restoreLoadingAction: 'Готуємо preview відновлення...',
  restoreReplaceWarning:
    'Replace перезапише локальний архів на цьому пристрої.',
  restoreMergeGuidance:
    'Merge лишає поточні налаштування й додає сни з backup.',
  restoreFileLabel: 'Файл',
  restoreVersionLabel: 'Копія',
  restoreLocaleLabel: 'Мова',
  restoreDreamCountLabel: 'Снів',
  restoreCurrentCountLabel: 'Зараз',
  restoreIncomingCountLabel: 'З копії',
  restoreNewCountLabel: 'Нових',
  restoreResultCountLabel: 'Результат',
  restoreOverlapCountLabel: 'Збігів',
  restoreDraftLabel: 'Чернетка',
  restoreDraftPresent: 'Є',
  restoreDraftMissing: 'Немає',
  restoreSettingsLabel: 'Налаштування',
  restoreSettingsReplace: 'Налаштування з копії замінять локальні',
  restoreSettingsKeepCurrent: 'Поточні налаштування лишаться як є',
  restoreDraftActionLabel: 'Чернетка',
  restoreDraftActionReplace: 'Чернетка з копії замінить локальну',
  restoreDraftActionImportIfEmpty:
    'Чернетка з копії імпортується, лише якщо локальна порожня',
  restoreExportedAtLabel: 'Експортовано',
  restoreAppVersionLabel: 'Застосунок',
  restoreRestoreButton: 'Замінити цією копією',
  restoreMergeButton: 'Об’єднати з цієї копії',
  restoreRestoreButtonBusy: 'Відновлення...',
  restoreConfirmTitle: 'Замінити локальні дані?',
  restoreConfirmDescription:
    'Це замінить сни, чернетку, мову, налаштування нагадувань і налаштування аналізу вибраною копією.',
  restoreMergeConfirmTitle: 'Об’єднати копію з локальними даними?',
  restoreMergeConfirmDescription:
    'Це додасть сни з копії у поточний архів, лишить поточні налаштування і імпортує чернетку з копії лише якщо локальна порожня.',
  restoreSuccessTitle: 'Копію відновлено',
  restoreSuccessDescription: 'Локальні дані замінено з:',
  restoreSuccessModeLabel: 'Застосований режим',
  restoreSuccessCountLabel: 'Снів тепер на пристрої',
  restoreErrorTitle: 'Помилка відновлення',
  transcriptionTitle: 'Офлайн-транскрипція',
  transcriptionDescription:
    'Транскрибуй голосові нотатки локально після одного завантаження моделі.',
  transcriptionStatusLabel: 'Модель',
  transcriptionStatusInstalled: 'Завантажена',
  transcriptionStatusMissing: 'Ще не завантажена',
  transcriptionSizeLabel: 'Розмір',
  transcriptionPathLabel: 'Локальний файл',
  transcriptionDownloadButton: 'Завантажити офлайн-модель',
  transcriptionDownloadButtonBusy: 'Завантаження моделі...',
  transcriptionDownloadSuccessTitle: 'Модель готова',
  transcriptionDownloadSuccessDescription:
    'Офлайн-модель транскрипції тепер збережена локально на цьому пристрої.',
  transcriptionDownloadErrorTitle: 'Не вдалося завантажити модель',
  transcriptionDeleteButton: 'Видалити локальну модель',
  transcriptionDeleteButtonBusy: 'Видалення моделі...',
  transcriptionMissingHint:
    'Завантаж модель один раз, щоб увімкнути офлайн-транскрипцію.',
  transcriptionDeleteSuccessTitle: 'Модель видалено',
  transcriptionDeleteSuccessDescription:
    'Офлайн-модель транскрипції видалено з локального сховища.',
  transcriptionDeleteErrorTitle: 'Не вдалося видалити модель',
  scaleTestTitle: 'Перевірка масштабу',
  scaleTestDescription: 'Згенеруй тестові сни для stress test.',
  developerToolsTitle: 'Інструменти розробника',
  developerToolsDescription:
    'Інструменти лише для debug: preview, seed data і stress test.',
  devSyncHistoryTitle: 'Останні sync спроби',
  devSyncHistoryDescription:
    'Історія лише для debug з останніми результатами cloud sync на цьому пристрої.',
  devSyncReasonManual: 'Вручну',
  devSyncReasonLaunch: 'При запуску',
  devSyncSnapshotTitle: 'Останній sync snapshot',
  devSyncSnapshotDescription:
    'Debug-only перегляд останнього збереженого результату sync на цьому пристрої.',
  devSyncSnapshotStatusTitle: 'Статус',
  devSyncSnapshotReasonTitle: 'Причина',
  devSyncSnapshotPendingTitle: 'Зміни у черзі',
  devSyncSnapshotPendingDreamsTitle: 'Сни у черзі',
  devSyncSnapshotPendingDeletesTitle: 'Видалення у черзі',
  devSyncSnapshotPendingReviewTitle: 'Набори ревʼю у черзі',
  devSyncSnapshotUploadsTitle: 'Відправлено',
  devSyncSnapshotPullsTitle: 'Отримано',
  devSyncSnapshotConflictsTitle: 'Конфлікти',
  devSyncSnapshotErrorsTitle: 'Остання помилка',
  devSyncHistoryEmptyTitle: 'Ще не було sync спроб',
  devSyncHistoryEmptyDescription:
    'Запусти backup sync один раз, і тут зʼявиться debug history.',
  scaleTestSeededLabel: 'Тестових снів',
  scaleTestAdd250: 'Додати 250',
  scaleTestAdd1000: 'Додати 1000',
  scaleTestClear: 'Очистити тести',
  scaleTestBusy: 'Працюю...',
  scaleTestClearTitle: 'Очистити тестові сни?',
  scaleTestClearDescription:
    'Це видалить лише згенеровані тестові сни. Твої власні записи лишаться.',
  scaleTestSeededTitle: 'Тестові сни готові',
  scaleTestSeededDescription:
    'Архів заповнено згенерованими снами для перевірки масштабу.',
  scaleTestErrorTitle: 'Не вдалося підготувати тестові сни',
  biometricLockTitle: 'Блокування застосунку',
  biometricLockDescription:
    'Вимагати Face ID, Touch ID або відбиток пальця під час відкриття застосунку.',
  biometricLockEnabledValue: 'Увімкнено',
  biometricLockDisabledValue: 'Вимкнено',
  biometricLockNotSupportedValue: 'Не підтримується',
  biometricLockNotEnrolledValue: 'Не налаштовано',
  biometricLockPrompt: 'Розблокуй Kaleidoscope',
  biometricLockUnlockLabel: 'Розблокувати',
  biometricLockScreenSubtitle: 'Твої сни захищені.',
  biometricLockAppName: 'Kaleidoscope',
  biometricLockEnableErrorTitle: 'Не вдалося увімкнути блокування',
  biometricLockEnableErrorUnsupported:
    'Цей пристрій не підтримує біометричну автентифікацію.',
  biometricLockEnableErrorNotEnrolled:
    'На цьому пристрої не налаштовано біометрію. Спочатку увімкни Face ID або відбиток у системних налаштуваннях.',
  biometricLockEnableErrorFailed:
    'Біометрична перевірка не пройшла. Блокування не увімкнено.',
  analysisTitle: 'Аналіз сну',
  analysisDescription: 'Генеруй локальну рефлексію зі збережених даних сну.',
  analysisProviderLabel: 'Провайдер',
  analysisProviderManual: 'Локальний',
  analysisProviderOpenAi: 'OpenAI (заплановано)',
  analysisNetworkLabel: 'Мережа',
  analysisNetworkAllowed: 'Дозволена',
  analysisNetworkBlocked: 'Заблокована',
  analysisLocalNetworkHint: 'Локальний аналіз не потребує доступу до мережі.',
};

export type SettingsCopy = typeof SETTINGS_COPY_EN;

export function getSettingsCopy(locale: AppLocale): SettingsCopy {
  return locale === 'uk' ? SETTINGS_COPY_UK : SETTINGS_COPY_EN;
}
