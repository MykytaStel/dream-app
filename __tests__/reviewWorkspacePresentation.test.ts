import { getReviewWorkspaceViewModel } from '../src/features/stats/model/reviewWorkspace';

describe('getReviewWorkspaceViewModel', () => {
  it('marks workspace as non-empty when any review source exists', () => {
    const viewModel = getReviewWorkspaceViewModel({
      workQueueCount: 1,
      savedMonthCount: 0,
      savedThreadCount: 2,
      copy: {
        reviewWorkspaceSummaryContinueLabel: 'Local follow-ups',
        reviewWorkspaceSummaryMonthsLabel: 'Saved months',
        reviewWorkspaceSummaryThreadsLabel: 'Saved threads',
      },
    });

    expect(viewModel.hasItems).toBe(true);
    expect(viewModel.summaryTiles).toEqual([
      { label: 'Local follow-ups', value: 1 },
      { label: 'Saved months', value: 0 },
      { label: 'Saved threads', value: 2 },
    ]);
  });

  it('marks workspace as empty when every review source is empty', () => {
    const viewModel = getReviewWorkspaceViewModel({
      workQueueCount: 0,
      savedMonthCount: 0,
      savedThreadCount: 0,
      copy: {
        reviewWorkspaceSummaryContinueLabel: 'Local follow-ups',
        reviewWorkspaceSummaryMonthsLabel: 'Saved months',
        reviewWorkspaceSummaryThreadsLabel: 'Saved threads',
      },
    });

    expect(viewModel.hasItems).toBe(false);
  });
});
