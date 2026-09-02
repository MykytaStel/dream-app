/**
 * String helpers that treat text the way a reader sees it rather than the way
 * UTF-16 stores it.
 *
 * Two problems keep recurring in this codebase:
 *
 *   1. `String.prototype.slice` counts UTF-16 code units. Slicing a preview at a
 *      fixed offset can land inside a surrogate pair and leave a lone surrogate
 *      that renders as "�".
 *   2. The same word can be typed two ways — "é" as one code point, or "e" plus
 *      a combining accent. They are different strings, so tag de-duplication and
 *      search silently miss one of them. iOS and macOS paste often produce the
 *      decomposed form.
 *
 * `normalizeUnicode` fixes (2). `truncateChars` fixes (1), and normalizes first
 * so that for every European language — including Ukrainian — a code-point
 * split is also a grapheme split. ZWJ emoji sequences (👨‍👩‍👧, flags) can still
 * be split between their parts; the result is two valid emoji, never a broken
 * glyph, and chasing full grapheme-cluster correctness would mean a dependency
 * or `Intl.Segmenter`, which Hermes does not reliably ship.
 */

/** Compose text to Unicode NFC so two spellings of the same string compare equal. */
export function normalizeUnicode(value: string): string {
  return value.normalize('NFC');
}

/**
 * Shorten `value` so that the result is at most `maxLength` characters,
 * appending `ellipsis` only when the text was actually cut. `maxLength` is the
 * ceiling on the whole result, ellipsis included — the same number every call
 * site's `text.length > N` check already expresses.
 *
 * Characters are counted by code point, so an emoji at the boundary is kept
 * whole or dropped whole — never cut into a "�".
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
