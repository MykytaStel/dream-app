# WIDGET-CONTRACT.md

## Purpose

This document defines the shared contract between the React Native app and the native widget layers on iOS and Android.

It covers:
- widget snapshot data
- widget rendering modes
- storage key
- deep link routing
- CTA mapping by widget state

This contract must be stable before native widget implementation starts.

---

## Widget Snapshot Model

The widget uses one shared JSON object.

This object is:
- written by the React Native app
- stored in shared storage
- read by both native widget implementations
- versioned to support future changes safely

### Snapshot Example

```json
{
  "v": 1,
  "mode": "capture",
  "lastDreamTitle": "Falling into a glass ocean",
  "lastDreamDate": "2026-03-19T07:14:00Z",
  "hasDraft": false,
  "streakCount": 3
}