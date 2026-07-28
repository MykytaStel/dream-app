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

Three themes, each defined as a full palette in `src/theme/tokens.ts` and registered in
`src/theme/theme.ts`:

| Theme | Mood | Base |
|---|---|---|
| `kaleidoscope` | midnight blue and violet, the default | `#141826` |
| `ember` | warm dark, rust and rose | `#1A1214` |
| `moss` | muted green dark | see `palette.moss` |

**All three are dark.** `AppThemeAppearance` allows `'light'`, and `appThemeMetadata`
currently registers every theme as `'dark'`. A light palette does not exist. Any UI
work that assumes a light background is assuming something the app cannot currently do.

## Tokens

Never hardcode a colour. The palette keys, defined by `ThemePalette` in
`src/theme/tokens.ts`, are:

| Group | Keys |
|---|---|
| Surfaces | `bg`, `surface`, `surfaceAlt`, `surfaceElevated` |
| Text | `text`, `textDim`, `ink` |
| Brand | `primary`, `primaryAlt`, `accent`, `glow` |
| Aurora gradient | `auroraStart`, `auroraMid`, `auroraEnd` |
| Semantic | `danger`, `success`, `border`, `tabIcon`, `switchTrackOff` |

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

There are currently 23 lint warnings for inline styles. They are tracked as debt and
removed before the `--max-warnings=0` gate is switched on.

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
