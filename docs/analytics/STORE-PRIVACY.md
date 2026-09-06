# Store privacy declarations — what to enter, and why

The single source of truth is [`docs/PRIVACY.md`](../PRIVACY.md). This file turns
it into the exact answers the two store consoles ask for. If the code changes
what leaves the device, `PRIVACY.md` changes first and this file follows.

Last checked against the code: 2026-09-06.

## The facts these declarations rest on

- **Dream content never leaves the device** unless cloud sync is on, and then only
  as a blob the server cannot decrypt.
- **Usage analytics** (`product.*` events) is **on by default during the beta**,
  with a switch in Settings → Your data. Payloads are counts and short enums,
  guarded by an allowlist with a test. Keyed on a random per-install id that is
  never joined to the sync account, an email, or an ad identifier.
- **Crash + diagnostic reports** (Sentry) are sent **only in builds that ship with
  a `SENTRY_DSN`**. Dream content is stripped by `redactSentryEvent` before send.
- **No advertising, no tracking SDKs, no data sold or shared with third parties.**
  `NSPrivacyTracking` is `false`.
- The analytics and crash backends (Supabase, Sentry) are processors, not
  audiences — they hold the data on our behalf.

---

## Apple — App Store Connect › App Privacy

**"Do you or your third-party partners collect data from this app?" → Yes**
(the analytics pipeline, and Sentry in DSN builds).

For every type below: **not used to track you** (no linking to third-party data
for advertising), and **not linked to the user's identity** unless the row says
so.

| Data type (Apple's category) | Collected | Linked to identity | Tracking | Purposes |
|---|---|---|---|---|
| **Usage Data › Product Interaction** | Yes | No | No | Analytics, App Functionality |
| **Diagnostics › Crash Data** | Yes (DSN builds) | No | No | App Functionality |
| **Diagnostics › Performance Data** | No | – | – | – |
| **Diagnostics › Other Diagnostic Data** | Yes (DSN builds) | No | No | App Functionality |
| **Identifiers › User ID** | Yes — the per-install id | No | No | Analytics, App Functionality |

**Everything else Apple lists → Not Collected.** Specifically not: Contact Info,
Health & Fitness, Financial Info, Location, Sensitive Info, Contacts, Browsing
History, Search History, Purchases, Audio Data, Photos or Videos, and — while
sync is off — User Content.

### The one judgement call: cloud sync (opt-in)

When a user turns on cloud backup, the encrypted blobs and their sync-account id
are stored on Supabase. Apple counts stored data as "collected" even when the
developer cannot read it. If you want to be maximally conservative, add:

| **User Content › Other User Content** | Yes (only if user enables sync) | Yes | No | App Functionality |

The argument for leaving it off: it is end-to-end encrypted with a key the server
never receives, so nothing that is *content* is ever accessible to us or Apple.
The argument for putting it on: the row exists, sync stores data under an
account, and an under-declaration is the expensive mistake. **Recommendation:
declare it.** It costs nothing and the encryption story is a selling point on the
label, not a liability.

### Privacy Policy URL

App Store Connect requires a public URL. `docs/PRIVACY.md` is the text; host it
somewhere stable (a GitHub Pages render of that file is enough for the beta) and
paste the URL into both "App Privacy" and the app's metadata.

### The privacy manifest

`ios/DreamApp/PrivacyInfo.xcprivacy` already declares the three data types above
plus the required-reason API uses (file timestamp, user defaults, system boot
time). Keep the manifest and this table in sync — Apple cross-checks them.

---

## Google — Play Console › App content › Data safety

**"Does your app collect or share any of the required user data types?" → Yes.**

**Data collected (not shared with anyone):**

| Category → type | Collected | Optional? | Purposes | Notes |
|---|---|---|---|---|
| **App activity › App interactions** | Yes | On by default, can be turned off | Analytics, App functionality | `product.*` events |
| **App info & performance › Crash logs** | Yes | Only in DSN builds | App functionality, Analytics | Sentry, content redacted |
| **App info & performance › Diagnostics** | Yes | Only in DSN builds | App functionality, Analytics | Sentry `diag.*` |
| **Device or other IDs** | Yes | No | Analytics, App functionality | random per-install id, not an ad id |

If you declare the opt-in sync content (mirror of the Apple call above):

| **Files and docs** | Yes | Only if user enables sync | App functionality | end-to-end encrypted |

**Security section answers:**

- *Is data encrypted in transit?* **Yes** (HTTPS to Supabase and Sentry; sync
  content is additionally E2E encrypted).
- *Can users request data deletion?* **Yes.** Turning off "Share usage counts"
  clears the on-device queue; server-side events are purged on request during the
  beta. Provide a contact route (email) for the deletion request.
- *Committed to Play Families Policy?* Not directed at children; answer per your
  target-audience selection.

**Everything else → Not collected.** No name, email, address, phone, financial
info, health, messages, photos/videos, audio, location, contacts, search history,
or browsing history leaves the device through any path.

---

## Before you submit — the checklist

- [x] `SENTRY_DSN` — bundled and on for release builds
      (`src/services/observability/sentryObservability.ts`). The Crash and
      Diagnostics rows are **required**, not optional.
- [ ] `ITSAppUsesNonExemptEncryption` is `false` in `Info.plist` — re-read the
      rationale there and confirm it before the first submission. It is your
      export self-classification, not the SDK's.
- [ ] Privacy policy hosted at a stable URL, URL pasted into both consoles.
- [ ] `PrivacyInfo.xcprivacy` table matches the Apple table above.
- [ ] The "Identifiers / Device IDs" row is entered — the per-install id is easy
      to forget because it feels anonymous, but it is still collected.
- [ ] Cloud-sync content row decided (recommendation: declare it).
- [ ] A deletion-request contact address exists and is in the policy.
