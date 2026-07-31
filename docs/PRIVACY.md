# Privacy

This describes what the app actually does with your data, checked against the code
rather than against intentions. It is the source for the privacy policy the app stores
require, and for the in-app privacy screen.

Last verified against the code: 2026-07-30.

## The short version

Your dreams are stored on your device. Nothing is sent anywhere unless you turn on a
feature that sends it, and each of those is off until you turn it on.

There are exactly three ways data leaves the device, listed below. If none of them are
enabled, the app makes no network requests at all.

## What is stored, and where

| Data | Where it lives |
|---|---|
| Dream text, titles, tags, moods, sleep context | On the device, in local storage |
| Voice recordings | On the device, as files |
| Transcripts | On the device |
| Patterns, streaks, statistics | Computed on the device, not stored elsewhere |
| Settings and preferences | On the device |

There is no account, no profile and no analytics service. The app works fully without
an internet connection.

## What can leave the device

### 1. Cloud backup and sync — off by default

If you turn on cloud backup, your dreams are uploaded to the project's Supabase
instance so a second device can read them. **Everything that is content is encrypted
on your device first, with a key the server never receives:** titles, text,
transcripts, tags, moods, sleep notes, analysis, and the voice recordings.

The server stores one sealed blob per dream. It cannot open them. Neither can anyone
with access to that database, including whoever runs it.

### What the server can still see

Encryption hides what is in your dreams. It does not hide that they exist:

| Visible | Why it has to be |
|---|---|
| How many dreams you have | each is a row |
| When each was last changed | conflict resolution compares this before anything is decrypted |
| Your account id | it is what separates your rows from anyone else's |
| That a recording exists, and roughly how long | the file has to be stored somewhere |
| Roughly how long each dream is | the encrypted blob grows with the text inside it |

That last row is measured, not theoretical: a one-line dream seals to about 770
characters and a two-page one to about 9,300. So the server can tell a jotted
note from a long entry, without being able to read either. Closing that would mean
padding every record to a fixed size, which costs storage and bandwidth for
everyone; it has not been done, and this page says so rather than leaving it out.

So someone with database access could tell that you wrote four dreams last week and
none for the month before. They could not tell you anything about a single one of
them. This is a real limit, and it is stated here rather than left out.

### The key

The key is 32 random bytes generated on your device. It is never sent to the server.

It reaches your other devices on its own — through iCloud Keychain on iOS, or Android's
backup of a single file that holds nothing else. You do not have to do anything, and
turning on sync does not ask you to write anything down.

A recovery code — 24 words — is available in settings. You need it in two situations:
moving between iOS and Android, or restoring a device that had no backup. The app asks
for it at the moment it is actually needed rather than warning you in advance.

**If you lose both the key and the code, the archive cannot be recovered.** Not by us,
not by anyone. That is what "the server never receives the key" means.

Turning sync off stops the uploads. It does not delete what was already uploaded;
deleting a dream does, through a deletion record that propagates to other devices.

### 2. Crash reports — only in builds configured for it

If the build was made with a crash-reporting key, a crash sends:

- the error and its stack trace
- app version, platform, and which screen was open
- the name of the operation that failed

Dream content is removed before an event is sent: titles, text, transcripts, tags,
audio paths and any user identity are stripped by `redactSentryEvent`
(`src/services/observability/sentryRedaction.ts`). That behaviour is covered by tests,
so it cannot regress unnoticed.

Builds without a crash-reporting key send nothing at all.

### 3. Downloading the speech model — on first voice transcription

Transcription runs entirely on the device, but the model it needs is not shipped inside
the app. The first time you transcribe a recording, the app downloads it from
`huggingface.co`.

That request contains no dream data — it is an ordinary file download — but it does
reveal your IP address to that host, in the same way visiting any website does. After
the download, transcription is fully offline.

Which model is downloaded follows the app's language, because a model trained only on
English transcribes Ukrainian into confident nonsense rather than failing. English
downloads about 74 MB, Ukrainian about 141 MB. Changing the language downloads the
other one and deletes the one no longer used, so only one is ever kept.

## What never leaves the device

- The dreams themselves, when cloud sync is off
- Anything you type, when cloud sync is off
- Pattern detection, streaks and statistics: computed locally, always
- Reminders: scheduled by the operating system on the device, never sent anywhere

## The lock

The app can be locked with the device's biometrics. That check happens on the device
through the system; the app never sees your fingerprint or face data, only whether the
system accepted them.

The lock protects the app's screens. It does not encrypt the stored data: someone with
access to the device's filesystem could read it regardless.

## Deleting your data

Deleting the app removes everything stored locally: dreams, recordings, the downloaded
speech model and drafts. Export first if you want to keep them — the app can write a
PDF, Markdown or plain text copy.

If you used cloud backup, deleting the app does not remove what was uploaded. Delete
the dreams first, while sync is on, so the deletion reaches the server.

## Children

The app is not directed at children and collects nothing that identifies anyone.

## Changes

The dated line at the top says when this was last checked against the code. If a
feature changes what leaves the device, this file changes in the same commit — a
privacy statement that lags the code is worse than none, because it is believed.
