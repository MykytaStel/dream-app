import type { Dream } from './dream';
import {
  getArchiveSearchMatchReasons,
  getArchiveSearchScore,
  matchesArchiveSpecialFilter,
  type ArchiveSearchMatchReason,
  type ArchiveSpecialFilter,
} from './archiveSearch';
import {
  isDreamArchived,
  isDreamStarred,
  sortDreamsNewestFirst,
} from './dreamList';

/**
 * @deprecated Transitional exports for remaining UI and hook callers that
 * still use the retired Home timeline module name. New code belongs in
 * `dreamList` or `archiveSearch`.
 */
export type HomeSortOrder = 'newest' | 'oldest';
export type HomeSpecialFilter = ArchiveSpecialFilter;
export type DreamSearchMatchReason = ArchiveSearchMatchReason;

export const getDreamSearchMatchReasons = getArchiveSearchMatchReasons;
export const getDreamSearchScore = getArchiveSearchScore;
export const matchesDreamSpecialFilter = matchesArchiveSpecialFilter;

export { isDreamArchived, isDreamStarred };

export function sortDreamsForTimeline(
  dreams: Dream[],
  sortOrder: HomeSortOrder,
) {
  const newestFirst = sortDreamsNewestFirst(dreams);
  return sortOrder === 'oldest' ? newestFirst.reverse() : newestFirst;
}
