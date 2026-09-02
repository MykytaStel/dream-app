import { normalizeUnicode, truncateChars } from '../src/utils/text';

describe('normalizeUnicode', () => {
  it('folds a decomposed accent into its precomposed form', () => {
    const decomposed = 'café'; // e + combining acute accent
    const precomposed = 'café'; // é

    expect(decomposed).not.toBe(precomposed);
    expect(normalizeUnicode(decomposed)).toBe(precomposed);
  });

  it('leaves already-normalized text untouched', () => {
    expect(normalizeUnicode('привіт')).toBe('привіт');
    expect(normalizeUnicode('')).toBe('');
  });

  it('makes two spellings of the same word compare equal', () => {
    const a = normalizeUnicode('Élise'); // É + lise, decomposed
    const b = normalizeUnicode('Élise'); // precomposed

    expect(a).toBe(b);
  });
});

describe('truncateChars', () => {
  it('returns a short string unchanged (normalized)', () => {
    expect(truncateChars('a quiet dream', 100)).toBe('a quiet dream');
  });

  it('keeps the whole result within maxLength, ellipsis included', () => {
    const text = 'x'.repeat(50);

    const result = truncateChars(text, 10);

    expect(Array.from(result)).toHaveLength(10);
    expect(result).toBe('xxxxxxxxx…');
  });

  it('reserves room for a multi-character ellipsis', () => {
    expect(truncateChars('x'.repeat(20), 5, '...')).toBe('xx...');
  });

  it('never cuts an emoji into a lone surrogate', () => {
    // 8 emoji = 16 UTF-16 code units. A naive slice by code unit would split an
    // emoji and leave a lone surrogate that renders as "�".
    const text = '😀😀😀😀😀😀😀😀';

    const result = truncateChars(text, 3);

    expect(result).toBe('😀😀…');
    expect(result).not.toMatch(/�/);
    expect(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(
        result,
      ),
    ).toBe(false);
  });

  it('counts by characters, not UTF-16 code units', () => {
    const text = '😀😀😀😀😀'; // 5 characters, 10 code units

    expect(truncateChars(text, 5)).toBe(text);
    expect(truncateChars(text, 6)).toBe(text);
  });

  it('trims trailing whitespace before the ellipsis', () => {
    expect(truncateChars('word     morewords', 5)).toBe('word…');
  });

  it('truncates Ukrainian text by character count', () => {
    const text = 'сон про море та політ над хвилями';

    // keep 7 characters ("сон про", trailing space trimmed), then the ellipsis
    expect(truncateChars(text, 8)).toBe('сон про…');
  });
});
