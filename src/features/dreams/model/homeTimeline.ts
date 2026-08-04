import {
  getArchiveSearchMatchReasons,
  type ArchiveSearchMatchReason,
} from './archiveSearch';
import { isDreamArchived, isDreamStarred } from './dreamList';

/**
 * @deprecated Transitional exports for the remaining Home row and swipe-action
 * callers. New code belongs in `dreamList` or `archiveSearch`.
 */
export type DreamSearchMatchReason = ArchiveSearchMatchReason;

export const getDreamSearchMatchReasons = getArchiveSearchMatchReasons;

export { isDreamArchived, isDreamStarred };
