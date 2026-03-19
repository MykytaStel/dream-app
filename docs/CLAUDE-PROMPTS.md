# CLAUDE-PROMPTS.md

## Purpose

This document contains reusable prompt templates for working with Claude on Kaleidoscope of Dreams.

These prompts are designed to:
- keep context focused
- reduce token waste
- avoid overengineering
- move from ideas to implementation
- support feature-by-feature delivery

---

## General Rule

Reference only the docs needed for the current task.

Examples:
- UX task -> `CLAUDE.md`, `docs/PRODUCT.md`, `docs/DESIGN.md`
- architecture task -> `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/TECH-STACK.md`
- native task -> `CLAUDE.md`, `docs/NATIVE-FEATURES.md`, `docs/WIDGETS.md`

---

## 1. Feature Planning Prompt

```text
Use the relevant project docs and help me plan this feature for Kaleidoscope of Dreams.

Please structure the answer as:
1. product intent
2. UX / technical goal
3. files to update
4. components / modules to update
5. data model or state changes
6. implementation order
7. risk areas
8. what should be done first for the highest impact with the lowest risk

Important:
- keep it practical
- avoid overengineering
- do not suggest a rewrite unless truly necessary
- keep the app premium, calm, and non-generic
```

---

## 2. One-Feature Implementation Prompt

```text
We are working on one feature only.

Use the relevant docs and help me implement this feature step by step.

Important:
- do not rewrite the whole screen or module
- show only the minimal code changes needed
- explain where each change goes
- preserve the existing working logic where possible
- keep the solution scalable and production-friendly

Start with the first highest-impact, lowest-risk change only.
```

---

## 3. UX Improvement Prompt

```text
Use `CLAUDE.md`, `docs/PRODUCT.md`, and `docs/DESIGN.md`.

Suggest improvements for this screen so it feels premium, calm, and non-generic.

Please structure the answer as:
1. what already works
2. what feels generic or weak
3. what to change
4. why it improves the emotional quality of the app
5. priority order
6. what should be implemented first
```

---

## 4. Code Review Prompt

```text
Use `docs/SKILLS.md`.

Review this code with the following format:
1. critical issues
2. why they matter
3. minimal safe fix
4. optional improvement

Important:
- do not rewrite the entire file
- preserve working logic where possible
- keep the review practical
- focus on real problems first
```

---

## 5. Refactor Prompt

```text
Use `docs/SKILLS.md` and `docs/ARCHITECTURE.md`.

Help me refactor this module with minimal disruption.

Please:
- identify safe extraction boundaries first
- avoid a big-bang rewrite
- keep behavior stable
- explain the step-by-step refactor order
- recommend the smallest useful refactor first
```

---

## 6. Native Feature Prompt

```text
Use `CLAUDE.md`, `docs/NATIVE-FEATURES.md`, and the relevant feature brief.

Help me design and implement this native feature for Kaleidoscope of Dreams.

Please structure the answer as:
1. user value
2. MVP scope
3. platform-specific requirements
4. React Native responsibilities
5. native layer responsibilities
6. bridge/module needs
7. implementation order
8. risks to avoid

Keep it minimal, scalable, and product-driven.
```

---

## 7. Widget Prompt

```text
Use `CLAUDE.md`, `docs/NATIVE-FEATURES.md`, and `docs/WIDGETS.md`.

Help me define and implement the first widget for Kaleidoscope of Dreams.

Please structure the answer as:
1. widget goal
2. widget states
3. content and copy
4. data needed from the app
5. deep links
6. React Native responsibilities
7. iOS WidgetKit plan
8. Android Glance plan
9. implementation order
10. what to avoid in MVP
```

---

## 8. Chat Compression Prompt

```text
Summarize all decisions made in this chat into:
1. final decisions
2. implementation priorities
3. files involved
4. constraints to preserve
5. unresolved issues
6. recommended next step

Keep it short and practical so I can use it as the starting context for a new chat.
```

---

## 9. “Only One Step” Prompt

```text
Do not solve the entire feature yet.

Help me only with the first implementation step.

Show:
- what changes now
- where the code goes
- what to leave for later
- why this is the safest first step
```

---

## 10. Final Verification Prompt

```text
Review the current implementation against the project docs.

Check:
- product alignment
- UX quality
- architectural fit
- unnecessary complexity
- missing edge cases
- what should be improved next

Be practical and concise.
```
