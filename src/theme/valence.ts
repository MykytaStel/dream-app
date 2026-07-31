import type { Theme } from './theme';

/**
 * The colour that means "how this dream felt".
 *
 * Three places each kept their own copy of the same three hex values —
 * `#63D9FF`, `#8D7CFF`, `#C57EFF` — with a comment naming the very tokens they
 * were copied from: auroraStart, auroraMid, auroraEnd. Each also said "static,
 * safe for off-screen capture", which was true of the share card and not true
 * of the other two: both draw on screen, where a light theme would leave them
 * unreadable.
 *
 * Mapping to token names rather than values keeps the meaning in the model —
 * a mood is positive, not cyan — and lets whichever theme is active decide what
 * that looks like.
 */

export type Valence = 'positive' | 'neutral' | 'negative';

export const VALENCE_COLOR_TOKEN = {
  positive: 'auroraStart',
  neutral: 'auroraMid',
  negative: 'auroraEnd',
} as const satisfies Record<Valence, keyof Theme['colors']>;

export function valenceColor(theme: Theme, valence: Valence): string {
  return theme.colors[VALENCE_COLOR_TOKEN[valence]];
}
