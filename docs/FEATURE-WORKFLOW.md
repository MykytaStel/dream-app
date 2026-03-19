# FEATURE-WORKFLOW.md

## Purpose

This document explains how to work with Claude one feature at a time.

The goal is to avoid:
- giant chats
- vague ideation loops
- oversized prompts
- rewriting entire screens too early
- wasting tokens on unrelated context

---

## Core Rule

One chat should usually cover one feature area, not the whole app.

Good examples:
- Dream Screen UX
- Dream Capture Flow
- Widgets
- Biometrics
- Notifications
- Voice Capture
- Journal Search
- Insights

Bad example:
- one endless chat for the whole project forever

---

## Recommended Chat Strategy

### Keep one chat for:
- one screen
- one feature module
- one architecture area
- one product decision area

### Start a new chat when:
- the topic changes significantly
- the old chat is getting long and noisy
- the model starts repeating itself
- you want a clean implementation-focused discussion
- you have already completed a batch of decisions

---

## The Best Feature Workflow

### Step 1 — Give focused context
Reference only the relevant docs.

Examples:
- `CLAUDE.md + DESIGN.md + PRODUCT.md`
- `CLAUDE.md + ARCHITECTURE.md + TECH-STACK.md`
- `CLAUDE.md + NATIVE-FEATURES.md + WIDGETS.md`

Do not reference every document every time.

---

### Step 2 — Ask for a practical plan first
Before asking for code, ask for:
- files to update
- components to change
- data model changes
- UI logic changes
- implementation order
- risk areas

This turns ideas into an execution plan.

---

### Step 3 — Implement one change at a time
Ask Claude to help with one concrete change.

Examples:
- add stacked date badge
- add widget snapshot bridge
- implement biometrics toggle
- create quick action routing
- add haptics for save dream

Avoid asking for “the whole feature” unless the scope is already very small.

---

### Step 4 — Review after each step
After implementing a change, ask:
- did we keep the product direction?
- did we introduce unnecessary complexity?
- what should be cleaned up next?
- what is now safe to build after this?

---

### Step 5 — Summarize and compress
When the chat gets long, ask Claude for a short decision summary.

Suggested format:
- final decisions
- files involved
- constraints
- unresolved items
- next step

Use that summary to start a fresh chat if needed.

---

## Recommended Scope Size

Good scope:
- one widget
- one row UI improvement
- one settings toggle
- one bridge module
- one notification flow
- one deep link map

Bad scope:
- the entire native strategy
- all widgets for both platforms in one implementation pass
- the whole design system plus feature code plus analytics

---

## Prompting Pattern for One Feature

### First prompt
Ask for a feature implementation plan.

### Second prompt
Ask to implement only the first highest-impact low-risk piece.

### Third prompt
Ask for review and cleanup.

### Fourth prompt
Move to the next piece.

---

## Token-Saving Rules

- use one feature per chat
- do not paste the whole project
- do not reference all docs every time
- send only the relevant file or code block
- ask for minimal safe changes first
- ask for a short summary before starting a new chat

---

## Compression Template

Use this when a chat becomes long:

```text
Summarize all decisions made in this chat into:
1. final decisions
2. implementation priorities
3. files and modules involved
4. constraints to keep
5. unresolved questions

Keep it short and practical so I can use it as the starting context for a new chat.
```

---

## Feature Execution Template

1. Product intent
2. UX or technical plan
3. Smallest safe implementation
4. Review
5. Summary
6. Next step

This should be the default workflow for most features.
