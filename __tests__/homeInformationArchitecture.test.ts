import { selectHomeReturnReason } from '../src/features/dreams/model/homeReturnReason';

const emptyState = {
  hasSpotlightPattern: false,
  hasRevisitCue: false,
  hasAttentionCue: false,
  hasLastViewedDream: false,
  canOpenLastViewedDream: false,
};

describe('Home return reason', () => {
  test.each([
    { hasSpotlightPattern: true },
    { hasRevisitCue: true },
    { hasAttentionCue: true },
  ])('prioritizes a data-led signal: %o', signal => {
    expect(
      selectHomeReturnReason({
        ...emptyState,
        ...signal,
        hasLastViewedDream: true,
        canOpenLastViewedDream: true,
      }),
    ).toBe('spotlight');
  });

  test('falls back to the last viewed dream when it can be opened', () => {
    expect(
      selectHomeReturnReason({
        ...emptyState,
        hasLastViewedDream: true,
        canOpenLastViewedDream: true,
      }),
    ).toBe('lastViewed');
  });

  test.each([
    emptyState,
    { ...emptyState, hasLastViewedDream: true },
    { ...emptyState, canOpenLastViewedDream: true },
  ])('starts with the timeline when no actionable return reason exists', state => {
    expect(selectHomeReturnReason(state)).toBe('timeline');
  });
});
