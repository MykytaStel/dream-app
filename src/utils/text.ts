/**
 * Text helpers that count characters the way a reader sees them, not the way
 * UTF-16 stores them. `normalizeUnicode` folds the two spellings of an accented
 * word (precomposed vs. combining) so tag dedup and search match either.
 * `truncateChars` cuts on code-point boundaries so an emoji is never sliced
 * into a lone-surrogate "�" (NFC first, so a code-point split is also a
 * grapheme split for European scripts; ZWJ emoji can still split).
 */

/** Compose text to Unicode NFC so two spellings of the same string compare equal. */
export function normalizeUnicode(value: string): string {
  return value.normalize('NFC');
}

/**
 * Shorten `value` to at most `maxLength` characters (ellipsis included),
 * appending `ellipsis` only when the text was cut. Counts by code point, so an
 * emoji at the boundary is kept or dropped whole, never cut into a "�".
 */
export function truncateChars(
  value: string,
  maxLength: number,
  ellipsis = '…',
): string {
  const normalized = normalizeUnicode(value);
  const characters = Array.from(normalized);

  if (characters.length <= maxLength) {
    return normalized;
  }

  const keep = Math.max(0, maxLength - Array.from(ellipsis).length);
  return characters.slice(0, keep).join('').trimEnd() + ellipsis;
}
