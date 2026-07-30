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

If you turn on cloud backup, these are uploaded to the project's Supabase instance so a
second device can read them:

- dream titles and text
- transcripts
- voice recordings
- the timestamps and flags needed to resolve conflicts between devices

**These are stored unencrypted.** The server can read them, and so can anyone with
access to that database. This is the honest current state, not a design goal:
end-to-end encryption is planned before the first release, and until it ships, cloud
sync trades privacy for the ability to recover an archive if a phone is lost.

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
