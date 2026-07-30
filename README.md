# Kaleidoscope of Dreams

A dream journal that captures an entry before it fades, keeps it on the device, and
surfaces what keeps coming back.

> A private dream archive that gets smarter without leaving your phone.

React Native, TypeScript, local-first, with optional cloud sync.

## Requirements

- Node `>=20`
- Yarn `3.6.4` (via Corepack)
- Xcode with CocoaPods, for iOS
- Android SDK, for Android

## Getting started

```bash
yarn install
```

Start the Metro bundler:

```bash
yarn start
```

Run on a device or simulator:

```bash
yarn ios
```

```bash
yarn android
```

## Checks

All three must pass before a merge.

```bash
yarn typecheck
```

```bash
yarn test
```

```bash
yarn lint
```

## Documentation

| Document | What it covers |
|---|---|
| [PRODUCT.md](docs/PRODUCT.md) | what the product is, who it is for, the privacy model |
| [ROADMAP.md](docs/ROADMAP.md) | horizons H0–H3, exit criteria, what is out of scope |
| [CAPABILITIES.md](docs/CAPABILITIES.md) | what the app does today, checked against the code |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | layering, sync, widget contract, native modules |
| [TECH-STACK.md](docs/TECH-STACK.md) | dependencies with versions, deliberate omissions, known debt |
| [DESIGN.md](docs/DESIGN.md) | principles, theme tokens, copy tone, motion |
| [CODE-STANDARDS.md](docs/CODE-STANDARDS.md) | rules for size, types, tests and CI gates |

Start with `PRODUCT.md` for intent and `CAPABILITIES.md` for the current state.
