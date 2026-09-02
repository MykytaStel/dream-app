import type { Dream } from './dream';
import { truncateChars } from '../../../utils/text';

const MAX_DERIVED_TITLE_CHARS = 48;

/**
 * The title to show for a dream. Its own title wins; otherwise the opening of
 * the body (or transcript) stands in, so a quick capture is not "Untitled
 * dream" on every surface. Falls back to `fallback` only when there is nothing.
 */
export function getDreamDisplayTitle(
  dream: Pick<Dream, 'title' | 'text' | 'transcript'>,
  fallback: string,
): string {
  const title = dream.title?.trim();
  if (title) {
    return title;
  }

  const body = (dream.text ?? dream.transcript ?? '').trim();
  if (!body) {
    return fallback;
  }

  // First line, first sentence, collapsed whitespace.
  const firstLine = body.split(/\r?\n/, 1)[0]?.trim() ?? '';
  const firstSentence = firstLine.split(/(?<=[.!?…])\s/, 1)[0]?.trim() ?? '';
  const source = (firstSentence || firstLine).replace(/\s+/g, ' ');
  if (!source) {
    return fallback;
  }

  return truncateChars(source, MAX_DERIVED_TITLE_CHARS).replace(
    /[.,;:—-]+$/,
    '',
  );
}
