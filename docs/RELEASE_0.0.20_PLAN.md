# Release 0.0.20 Plan

## Goal

Ship the first capture-flow release after `0.0.19`: make new entry creation
feel more guided, faster after save, and less like a static landing page.

## Release theme

- Capture should move the user toward action faster
- Voice-first and text-first paths should both feel natural
- Ship one small new feature inside this release, not only visual polish

## Scope

### 1. Post-save decision flow

- Add the small new feature for this version:
  - a post-save action sheet with fast next-step choices
- Support three immediate paths after save:
  - capture another
  - open detail
  - return to feed
- Keep this flow only for create mode, not edit mode

### 2. Faster create composer

- Reduce any leftover “explanatory landing page” feeling in the create flow
- Keep the primary action obvious from the first screenful
- Make voice state and core text state easier to scan while capturing

### 3. Better quick paths

- Strengthen voice-first re-entry after a saved capture
- Keep text-first capture lightweight when the user does not need more fields
- Preserve draft and save behavior without adding friction

### 4. Capture motion and transitions

- Add calm motion around post-save flow and short follow-up actions
- Keep motion functional:
  - open the next-step sheet clearly
  - dismiss quickly
  - avoid decorative delay

### 5. Consistency with the current shell

- Keep the capture flow aligned with the shared card, chip, and button system
- Avoid adding another oversized hero or duplicate CTA
- Continue trimming copy where the layout already explains the next step

## Suggested release notes

- Added a post-save action sheet after capturing a dream
- Improved the flow for capturing another entry, opening detail, or returning home
- Continued streamlining the create flow for faster voice and text capture

## Scope lock

- no backend or sync
- no cloud upload flow
- no full recorder redesign yet
- no subscription or account gating in capture

## Definition of done

- Saving a new dream no longer forces a single next step
- Users can continue capturing without reorienting manually
- Edit flow stays simple and unaffected
- Create flow feels faster than in `0.0.19`
- Version `0.0.20` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.20): add capture post-save flow and quick next actions`
