/**
 * Contrast, as a number rather than an opinion.
 *
 * A light theme is easy to get wrong in a way nobody notices while building it
 * on a bright desk: `#78B8FF` reads beautifully on a dark background and almost
 * vanishes on a white one. The only way to know is to compute it, so the ratios
 * are checked the same way the rest of the app is.
 *
 * WCAG 2.1 relative luminance and contrast ratio. Thresholds:
 *   4.5 — body text
 *   3.0 — large text, icons, and the boundary of an interactive control
 */

function channelLuminance(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map(value => `${value}${value}`)
          .join('')
      : normalized;

  const r = channelLuminance(Number.parseInt(expanded.slice(0, 2), 16));
  const g = channelLuminance(Number.parseInt(expanded.slice(2, 4), 16));
  const b = channelLuminance(Number.parseInt(expanded.slice(4, 6), 16));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

export const CONTRAST_BODY_TEXT = 4.5;
export const CONTRAST_LARGE_TEXT = 3;

/**
 * The colour that actually reaches the eye when a translucent layer sits on
 * something else.
 *
 * Token pairs cannot express this, and the gap is where a real defect hid: the
 * quick-add icon sits on `rgba(text, 0.2)` over `rgba(primary, 0.16)` over a
 * surface, and every one of those layers moves when the theme does. Checking
 * the tokens in isolation says nothing about the result.
 */
export function blend(
  foreground: string,
  alpha: number,
  background: string,
): string {
  const parse = (hex: string) => {
    const normalized = hex.replace('#', '');
    const expanded =
      normalized.length === 3
        ? normalized
            .split('')
            .map(value => `${value}${value}`)
            .join('')
        : normalized;
    return [0, 2, 4].map(index =>
      Number.parseInt(expanded.slice(index, index + 2), 16),
    );
  };

  const front = parse(foreground);
  const back = parse(background);

  return `#${front
    .map((channel, index) =>
      Math.round(channel * alpha + back[index] * (1 - alpha))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}
