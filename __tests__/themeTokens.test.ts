import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { themes } from '../src/theme/theme';

/**
 * A colour written into a stylesheet cannot change when the theme does.
 *
 * That is the whole reason a light theme was impossible: 57 literals sat in
 * screens and components, most of them near-misses of tokens that already
 * existed — `rgba(20, 24, 38, …)` was `bg` exactly, `#8D7CFF` was `auroraMid`
 * exactly, and `#5CBF92` was `success` eyeballed slightly wrong.
 *
 * Some literals are correct, and they are listed rather than pattern-matched,
 * so that adding one is a decision somebody writes down.
 */

const SRC = join(__dirname, '..', 'src');

/**
 * Files allowed to hold fixed colours, and why.
 *
 * The rule for being here: the output is not app UI and must not follow the
 * reader's theme.
 */
const FIXED_PALETTE_FILES: Record<string, string> = {
  'theme/tokens.ts': 'the palettes themselves',
  'theme/color.ts': 'the helper that mixes them',
  'features/settings/services/dreamArchivePdf.ts':
    'a printed document — a dark PDF wastes ink and is unreadable on paper',
  'features/settings/services/dataExportService.ts':
    'the same, for the exported file',
  'features/dreams/model/dreamCardPresentation.ts':
    'the share card, captured off-screen: an image sent to someone else must ' +
    'not change with the sender’s theme',
  'features/dreams/components/DreamShareCard.tsx': 'renders that share card',
};

const COLOUR = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/;

/**
 * Comments are not code.
 *
 * Without this the rule fails on the doc comment in `theme/valence.ts` that
 * explains which literals were removed and why — the same way the Gradle
 * signing test failed on the comment describing the rule it enforces. A check
 * on source has to read source.
 */
function isComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*')
  );
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return /[.]tsx?$/.test(entry) ? [full] : [];
  });
}

describe('theme tokens', () => {
  test('no colour is written into a screen or component', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
      const key = relative(SRC, file);
      if (FIXED_PALETTE_FILES[key]) {
        continue;
      }

      const contents = readFileSync(file, 'utf8');
      contents.split('\n').forEach((line, index) => {
        if (!isComment(line) && COLOUR.test(line)) {
          offenders.push(`${key}:${index + 1}  ${line.trim()}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  test('a colour-filled surface does not draw its own foreground with text or background', () => {
    const offenders: string[] = [];
    const FILL_TOKENS = ['primary', 'danger', 'accent'];
    const WRONG_FOREGROUND_TOKENS = ['text', 'background'];

    for (const file of walk(SRC)) {
      const key = relative(SRC, file);
      const contents = readFileSync(file, 'utf8');

      // One block per `StyleSheet.create({ ... })` call — matched non-greedily
      // up to the first top-level closing `});`, which is how every style
      // object in this codebase is written.
      const blocks = contents.match(/StyleSheet\.create\(\{[\s\S]*?\n\}\);/g) ?? [];

      for (const block of blocks) {
        const hasFillBackground = FILL_TOKENS.some(token =>
          new RegExp(`backgroundColor:\\s*theme\\.colors\\.${token}\\b`).test(
            block,
          ),
        );
        const wrongForeground = WRONG_FOREGROUND_TOKENS.find(token =>
          new RegExp(`\\bcolor:\\s*theme\\.colors\\.${token}\\b`).test(block),
        );

        if (hasFillBackground && wrongForeground) {
          offenders.push(`${key}: color: theme.colors.${wrongForeground} in a block with a primary/danger/accent backgroundColor`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  test('every exception is a real file, so the list cannot rot', () => {
    for (const key of Object.keys(FIXED_PALETTE_FILES)) {
      expect(() => readFileSync(join(SRC, key), 'utf8')).not.toThrow();
    }
  });

  test('every theme defines every token', () => {
    const names = Object.keys(themes.kaleidoscope.colors).sort();

    for (const theme of Object.values(themes)) {
      expect(Object.keys(theme.colors).sort()).toEqual(names);
      for (const [name, value] of Object.entries(theme.colors)) {
        expect(`${name}=${String(value)}`).toMatch(/[=]#[0-9a-fA-F]{3,8}$/);
      }
    }
  });

  test('shadow is a token, because `#000` was standing in for it', () => {
    // A pure-black shadow is right on a dark surface and reads as dirt on a
    // pale one, so it cannot be a literal.
    for (const theme of Object.values(themes)) {
      expect(theme.colors.shadow).toBeTruthy();
    }
  });
});
