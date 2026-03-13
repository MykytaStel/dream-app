import { getStatsCopy } from '../../../constants/copy/stats';

type StatsCopy = ReturnType<typeof getStatsCopy>;

export type ReviewWorkspaceSummaryTile = {
  label: string;
  value: number;
};

export type ReviewWorkspaceViewModel = {
  hasItems: boolean;
  summaryTiles: ReviewWorkspaceSummaryTile[];
};

export function getReviewWorkspaceViewModel(input: {
  workQueueCount: number;
  savedMonthCount: number;
  savedThreadCount: number;
  copy: Pick<
    StatsCopy,
    | 'reviewWorkspaceSummaryContinueLabel'
    | 'reviewWorkspaceSummaryMonthsLabel'
    | 'reviewWorkspaceSummaryThreadsLabel'
  >;
}): ReviewWorkspaceViewModel {
  const { workQueueCount, savedMonthCount, savedThreadCount, copy } = input;

  return {
    hasItems: workQueueCount > 0 || savedMonthCount > 0 || savedThreadCount > 0,
    summaryTiles: [
      {
        label: copy.reviewWorkspaceSummaryContinueLabel,
        value: workQueueCount,
      },
      {
        label: copy.reviewWorkspaceSummaryMonthsLabel,
        value: savedMonthCount,
      },
      {
        label: copy.reviewWorkspaceSummaryThreadsLabel,
        value: savedThreadCount,
      },
    ],
  };
}
