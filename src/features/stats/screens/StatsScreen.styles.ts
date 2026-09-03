import { Theme } from '../../../theme/theme';
import { createStatsHeroStyles } from './StatsScreen.styles.hero';
import { createStatsOverviewStyles } from './StatsScreen.styles.overview';
import { createStatsReviewStyles } from './StatsScreen.styles.review';
import { createStatsInsightsStyles } from './StatsScreen.styles.insights';
import { createStatsThreadsStyles } from './StatsScreen.styles.threads';
import { createStatsDetailStyles } from './StatsScreen.styles.detail';

export function createStatsScreenStyles(theme: Theme) {
  return {
    ...createStatsHeroStyles(theme),
    ...createStatsOverviewStyles(theme),
    ...createStatsReviewStyles(theme),
    ...createStatsInsightsStyles(theme),
    ...createStatsThreadsStyles(theme),
    ...createStatsDetailStyles(theme),
  };
}
