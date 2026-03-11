# Release 0.2.3

## Goal

Ship a stabilization pass on top of `0.2.2` without changing the product
direction or visual identity.

`0.2.3` should make the current memory-first shell safer to release by locking
font delivery, aligning release metadata, and tightening theme consistency.

## Must-have

- app and build metadata point to `0.2.3`
- custom fonts are linked reliably on iOS and Android
- `Manrope` remains the default reading face and `Playfair Display` remains
  limited to display headings
- no font fallback or missing-font regressions in `Home`, `Wake`, `Memory`,
  `Settings`, or `Dream Detail`
- obvious hardcoded UI colors move toward semantic theme usage

## Visual direction

- keep the current aurora palette
- do not add a new hue family for this release
- do not add decorative motion just to make the build feel newer
- prefer semantic theme tokens over one-off hex values

## What not to do

- no product pivot
- no new dashboard complexity
- no extra gradients, badges, or surface chrome unless they solve a clarity issue
- no typography expansion beyond the current `Manrope` and `Playfair Display`
  pairing

## Decision on colors and visual extras

`0.2.3` does not need more colors.

The better move is to keep the existing palette, remove the most visible
hardcoded values, and preserve contrast and readability across the current
surfaces.

## Related docs

- [docs/RELEASE_0.2.2_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.2_PLAN.md)
- [docs/BACKEND_0.2.x_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/BACKEND_0.2.x_PLAN.md)
