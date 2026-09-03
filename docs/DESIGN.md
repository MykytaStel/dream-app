# Design

## Principles

**Calm over noise.** Restraint is the default. A screen that competes for attention
fails a user who opened it half-awake.

**Capture first.** The path from opening the app to a saved dream is the one path that
may never grow. Every addition to it needs an argument for why it costs less than the
memory it risks losing.

**Warmth without sweetness.** Human, not clinical; never cute. The user is writing down
something private, not being congratulated.

**Readability under bad conditions.** The typical session is early morning or late
night, in the dark, with poor focus. Contrast and type size answer to that, not to a
screenshot.

**Depth without clutter.** Advanced tools exist, but they wait to be looked for.

## Themes

Four themes, each defined as a full palette in `src/theme/tokens.ts` and registered in
`src/theme/theme.ts`:

| Theme | Mood | Appearance | Base |
|---|---|---|---|
| `kaleidoscope` | midnight blue and violet, the default | dark | `#141826` |
| `ember` | warm dark, rust and rose | dark | `#1A1214` |
| `moss` | muted green dark | dark | see `palette.moss` |
| `daylight` | cool off-white, the light option | light | `#F4F6FC` |

`appThemeMetadata` records each theme's `appearance` (`'dark'` or `'light'`), which
drives the status bar and system chrome. `daylight` is a real light palette, not a
tint of a dark one — a UI that assumed a dark background before now has to hold up on
both, which is what `__tests__/themeContrast.test.ts` checks (13 pairs × 4 themes).

## Tokens

Never hardcode a colour. Colours come in two layers:

**Raw palette** — `ThemePalette` in `src/theme/tokens.ts`, one full set of values per
theme:

| Group | Keys |
|---|---|
| Surfaces | `bg`, `surface`, `surfaceAlt`, `surfaceElevated` |
| Text | `text`, `textDim` |
| Brand | `primary`, `primaryAlt`, `accent`, `glow` |
| Aurora | `auroraStart`, `auroraMid`, `auroraEnd` |
| Semantic | `danger`, `success`, `border`, `tabIcon`, `switchTrackOff`, `switchThumb` |
| Depth | `scrim` (the dim laid over content), `shadow` (what a shadow is cast in) |

**Restyle theme** — `createAppTheme` in `src/theme/theme.ts` exposes the palette to
components, renaming `bg` → `background` and adding derived roles that a raw palette
cannot express:

| Key | Is | Why it exists |
|---|---|---|
| `onPrimary` | the colour of text/icons drawn on a `primary`/`danger`/`accent` fill | `text` and `background` were both being misused for this; on the light theme that failed contrast |
| `destructiveSurface` | `danger` at low alpha | a tinted destructive background that stays legible in every theme |
| `destructiveBorder` | `danger` at mid alpha | the matching border |

`ink` was renamed to `scrim` — a `theme.colors.ink` reference is now a compile error.
The remaining surface-role tokens the product plan's §7.1 lists (`surfacePrimary`,
`onSurface`, `controlThumb`, `selectedFill`, `focusRing`) are **not built yet**; only
phase A landed.

Spacing and radii come from the same file:

```ts
spacing = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, xxxl: 40 }
radius  = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 }
```

Typography lives in `typography` in `tokens.ts` and uses the families from
`src/theme/fonts.ts`. Display type is reserved for headings; body type carries
everything a user reads at length.

## Styling rules

Styles go through Restyle and `StyleSheet`. Inline style objects are not allowed: they
allocate on every render, they bypass theming, and they scatter design decisions across
components where nobody can find them.

The inline-style backlog is cleared and `eslint . --max-warnings=0` is the CI gate, so
a new inline style object fails the build rather than adding to a list.

### Where styles live

- **One style module per component**, named `<Component>.styles.ts`, exporting
  `export function create<Component>Styles(theme: Theme)` that returns a single
  `StyleSheet.create({...})`.
- **The call site uses `useStyles`** (`src/theme/useStyles.ts`), passing the
  module-level factory: `const styles = useStyles(createHomeScreenStyles);`. It
  memoises by factory and theme, so it replaces both the hand-rolled
  `useMemo(() => createX(theme), [theme])` and the per-file `WeakMap` caches.
  Never pass an inline arrow — that defeats the cache.
- **Styles are never passed as a prop.** A component that needs styles owns its
  own `.styles.ts`. Threading one screen's sheet down to its subcomponents is
  what turns a style file into a thousand-line monster.
- **Big screens split by area, not by component.** When a screen legitimately
  owns 400+ lines of its own styles, break them into
  `<Screen>.styles.<area>.ts` files (`createHomeHeroStyles`, …) and keep
  `<Screen>.styles.ts` as the barrel that spreads them together. The
  `create<Screen>Styles` function and its `ReturnType` stay unchanged.
- **Repeated visual treatments are fragments** in `src/theme/surfaces.ts`
  (`createControlPill`, `createSoftTile`, `createFieldSurface`), spread into a
  style: `{ ...createSoftTile(theme), gap: 8 }`. Add a fragment once a treatment
  appears in three places.
- **Values come from theme tokens** (`theme.colors.*`, `theme.spacing.*`,
  `theme.borderRadii.*`). Raw hex only through `hexToRgba(theme.colors.x, a)`.

### Migration state

The `create*Styles` + `useStyles` shape is the target. Screens touched since it
landed follow it; the older `useMemo(() => createX(theme), [theme])` call sites
and the `components/ui` `WeakMap` getters (`getCardStyles`, `getTextStyles`, …)
are migrated opportunistically as those files are edited, not in a sweep.

## What to avoid

| Avoid | Why |
|---|---|
| Mystical clichés — third eyes, tarot, runes | positions the product as occult rather than reflective |
| Galaxy and nebula backgrounds | the cheapest visual signal in this category |
| Neon saturation | unreadable at 3am, which is when the app is used |
| Childlike fantasy illustration | the content is often heavy; nightmares are a supported entry type |
| Many colours competing | the aurora gradient is the accent; it does not need company |

## Copy tone

Warm but not familiar. Reflective but never pseudo-scientific. The app does not tell a
user what a dream means — it offers a prompt and leaves the reading to them. The
difference between "this symbolises loss" and "this image has come back three times —
does it connect to anything?" is the entire product's tone.

Nightmare and distress-adjacent copy is written plainly and without drama. A user
recording a bad night does not need atmosphere.

## Motion

Reanimated, with worklets on the UI thread.

Motion clarifies a transition — where a thing came from, where it went. It is not
decoration and never delays the user. The capture path carries no animation heavy
enough to make saving feel slower than it is.

Shared layout transitions use a short duration (`detailLayoutTransition` in
`features/dreams/components/DreamDetailSections.tsx` is 160ms) — long enough to read as
motion, short enough not to be waited on.
