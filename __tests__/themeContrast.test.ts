import {
  blend,
  contrastRatio,
  CONTRAST_BODY_TEXT,
  CONTRAST_LARGE_TEXT,
} from '../src/theme/contrast';
import { appThemeMetadata, themes, type Theme } from '../src/theme/theme';

/**
 * Whether the app is readable, as a number.
 *
 * A light theme is designed on a bright desk and read on a dim one, and the
 * mistake it invites is subtle: `#78B8FF` is lovely on a dark background and
 * nearly invisible on a pale one. Nobody notices while building it. The ratios
 * do.
 *
 * WCAG 2.1: 4.5:1 for body text, 3:1 for interface elements and large text.
 * These are floors, not targets — the dark themes clear 16:1 on body text.
 */

type Pairing = {
  /** What is drawn. */
  foreground: keyof Theme['colors'];
  /** What it is drawn on. */
  background: keyof Theme['colors'];
  minimum: number;
  because: string;
};

const PAIRINGS: Pairing[] = [
  {
    foreground: 'text',
    background: 'background',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the dream itself',
  },
  {
    foreground: 'text',
    background: 'surface',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the same text inside a card',
  },
  {
    foreground: 'text',
    background: 'surfaceAlt',
    minimum: CONTRAST_BODY_TEXT,
    because: 'and inside the alternate surface',
  },
  {
    foreground: 'textDim',
    background: 'background',
    minimum: CONTRAST_BODY_TEXT,
    because: 'dates, counts and hints are still prose',
  },
  {
    foreground: 'textDim',
    background: 'surface',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the same, on a card',
  },
  {
    foreground: 'onPrimary',
    background: 'primary',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the label on a primary button',
  },
  {
    foreground: 'onPrimary',
    background: 'danger',
    minimum: CONTRAST_BODY_TEXT,
    because: 'the same on a destructive button, where misreading costs most',
  },
  {
    foreground: 'onPrimary',
    minimum: CONTRAST_LARGE_TEXT,
    background: 'accent',
    because:
      'icons sitting on an accent fill — the pairing that was missing when ' +
      'six sites used `ink`, which is dark in every theme and so vanished ' +
      'against a light theme’s darker primary',
  },
  {
    foreground: 'auroraStart',
    background: 'background',
    minimum: CONTRAST_LARGE_TEXT,
    because: 'a positive mood dot',
  },
  {
    foreground: 'auroraMid',
    background: 'background',
    minimum: CONTRAST_LARGE_TEXT,
    because: 'a neutral one',
  },
  {
    foreground: 'auroraEnd',
    background: 'background',
    minimum: CONTRAST_LARGE_TEXT,
    because:
      'a negative one — three dots a colourblind user tells apart by ' +
      'position, and everyone else by contrast',
  },
  {
    foreground: 'tabIcon',
    background: 'background',
    minimum: CONTRAST_LARGE_TEXT,
    because: 'an unselected tab is still a target',
  },
  {
    foreground: 'success',
    background: 'background',
    minimum: CONTRAST_LARGE_TEXT,
    because: 'confirmation the user has to see',
  },
];

describe('theme contrast', () => {
  describe.each(Object.entries(themes))('%s', (name, theme) => {
    test.each(PAIRINGS)(
      '$foreground on $background — $because',
      ({ foreground, background, minimum }) => {
        const ratio = contrastRatio(
          theme.colors[foreground],
          theme.colors[background],
        );

        expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(minimum);
      },
    );

    test('the border is visible without being a line of text', () => {
      const ratio = contrastRatio(theme.colors.border, theme.colors.background);

      // Low enough to stay quiet, high enough to exist. A border that matches
      // its background is a border nobody can see.
      expect(ratio).toBeGreaterThan(1.15);
      expect(ratio).toBeLessThan(4);
    });
  });

  /**
   * Where the real defect hid.
   *
   * The quick-add icon sits on `rgba(text, 0.2)` laid over `rgba(primary,
   * 0.16)` laid over a surface. Every layer moves with the theme, so checking
   * tokens against each other says nothing about what reaches the eye — the
   * composite came out at 1.75:1 on the light theme while every token-pair
   * assertion passed.
   */
  describe.each(Object.entries(themes))('%s composites', (_name, theme) => {
    test('an icon on the quick-add tint stays legible', () => {
      const row = blend(
        theme.colors.primary,
        0.16,
        theme.colors.surfaceElevated,
      );
      const circle = blend(theme.colors.text, 0.2, row);

      expect(contrastRatio(theme.colors.text, circle)).toBeGreaterThanOrEqual(
        CONTRAST_LARGE_TEXT,
      );
    });

    test('text on a subtle surface tint is still body text', () => {
      const tinted = blend(theme.colors.text, 0.06, theme.colors.surface);

      expect(contrastRatio(theme.colors.text, tinted)).toBeGreaterThanOrEqual(
        CONTRAST_BODY_TEXT,
      );
    });

    test('the warning glyph reads on the destructive-tinted icon badge', () => {
      const badge = blend(
        theme.colors.danger,
        0x14 / 255,
        theme.colors.background,
      );
      expect(contrastRatio(theme.colors.danger, badge)).toBeGreaterThanOrEqual(
        CONTRAST_LARGE_TEXT,
      );
    });
  });

  test('there is at least one theme of each appearance', () => {
    const appearances = Object.values(appThemeMetadata).map(
      entry => entry.appearance,
    );

    // The light one existed only as a type for months: AppThemeAppearance
    // allowed 'light' while all three registered themes were dark.
    expect(appearances).toContain('dark');
    expect(appearances).toContain('light');
  });

  test('a light theme is actually lighter than the dark ones', () => {
    // Guards the obvious mistake of registering a dark palette as light and
    // leaving the status bar unreadable.
    for (const [id, meta] of Object.entries(appThemeMetadata)) {
      const background = themes[id as keyof typeof themes].colors.background;
      const white = contrastRatio(background, '#FFFFFF');

      if (meta.appearance === 'light') {
        expect(white).toBeLessThan(1.5);
      } else {
        expect(white).toBeGreaterThan(4);
      }
    }
  });
});
