import { getReviewWorkspaceViewModel } from '../src/features/stats/model/reviewWorkspace';

describe('getReviewWorkspaceViewModel', () => {
  it('marks workspace as non-empty when any review source exists', () => {
    const viewModel = getReviewWorkspaceViewModel({
      workQueueCount: 1,
      importantDreamCount: 2,
      savedSetCount: 3,
      copy: {
        reviewWorkspaceSummaryContinueLabel: 'Local follow-ups',
        reviewWorkspaceSummaryImportantLabel: 'Important dreams',
        reviewWorkspaceSummarySavedSetsLabel: 'Saved sets',
      },
    });

    expect(viewModel.hasItems).toBe(true);
    expect(viewModel.summaryTiles).toEqual([
      { label: 'Local follow-ups', value: 1 },
      { label: 'Important dreams', value: 2 },
      { label: 'Saved sets', value: 3 },
    ]);
  });

  it('marks workspace as empty when every review source is empty', () => {
    const viewModel = getReviewWorkspaceViewModel({
      workQueueCount: 0,
      importantDreamCount: 0,
      savedSetCount: 0,
      copy: {
        reviewWorkspaceSummaryContinueLabel: 'Local follow-ups',
        reviewWorkspaceSummaryImportantLabel: 'Important dreams',
        reviewWorkspaceSummarySavedSetsLabel: 'Saved sets',
      },
    });

    expect(viewModel.hasItems).toBe(false);
  });
});
