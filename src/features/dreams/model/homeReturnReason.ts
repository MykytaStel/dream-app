export type HomeReturnReason = 'spotlight' | 'lastViewed' | 'timeline';

type SelectHomeReturnReasonInput = {
  hasSpotlightPattern: boolean;
  hasRevisitCue: boolean;
  hasAttentionCue: boolean;
  hasLastViewedDream: boolean;
  canOpenLastViewedDream: boolean;
};

/**
 * Chooses the single contextual block shown before the Home timeline.
 *
 * Data-led signals have priority over navigation history. When neither is
 * available, Home starts directly with the recent-dream timeline.
 */
export function selectHomeReturnReason({
  hasSpotlightPattern,
  hasRevisitCue,
  hasAttentionCue,
  hasLastViewedDream,
  canOpenLastViewedDream,
}: SelectHomeReturnReasonInput): HomeReturnReason {
  if (hasSpotlightPattern || hasRevisitCue || hasAttentionCue) {
    return 'spotlight';
  }

  if (hasLastViewedDream && canOpenLastViewedDream) {
    return 'lastViewed';
  }

  return 'timeline';
}
