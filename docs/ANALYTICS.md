# ANALYTICS.md

## Analytics Goal

Analytics should help improve the product without violating user trust.

This app handles personal dream content, so analytics must be minimal, intentional, and privacy-conscious.

---

## Core Principles

- do not log raw dream text
- do not send sensitive personal content unnecessarily
- track product behavior, not intimate content
- make analytics useful for product decisions
- keep event taxonomy simple and maintainable

---

## What to Measure First

### Acquisition / Activation
- app_install
- first_open
- onboarding_started
- onboarding_completed
- first_dream_created

### Core Usage
- dream_created
- dream_edited
- dream_deleted
- search_used
- filter_used
- favorite_toggled
- reminder_enabled
- reminder_opened

### Retention Signals
- returned_day_1
- returned_day_7
- dreams_created_week_1
- journal_viewed
- dream_detail_viewed
- calendar_viewed

### Premium / Future
- paywall_viewed
- premium_trial_started
- subscription_started
- subscription_renewed

---

## Suggested Event Properties

Keep properties lightweight.

Examples:
- entry_length_bucket
- tags_count
- moods_count
- used_voice_input
- used_template
- source_screen
- has_symbols
- has_favorite

Do not include raw dream text.

---

## Funnel Ideas

### Activation Funnel
- first_open
- onboarding_completed
- first_dream_created
- second_dream_created

### Retention Funnel
- first_dream_created
- journal_viewed_again
- reminder_opened
- week_1_return

### Premium Funnel
- insight_viewed
- paywall_viewed
- premium_started

---

## Qualitative Feedback Layer

Do not rely only on analytics.
Also collect:
- app store reviews
- optional in-app feedback prompts
- early tester interviews
- notes on why users stop after the first few days

---

## Analytics Summary

Measure enough to answer:
- are users completing their first dream entry?
- do they come back?
- do they revisit old dreams?
- which features actually increase retention?

Anything beyond that should be added carefully.
