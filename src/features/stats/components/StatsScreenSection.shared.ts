import { LinearTransition } from 'react-native-reanimated';
import { getStatsCopy } from '../../../constants/copy/stats';
import { createStatsScreenStyles } from '../screens/StatsScreen.styles';

export type StatsCopy = ReturnType<typeof getStatsCopy>;
export type StatsStyles = ReturnType<typeof createStatsScreenStyles>;
export type MemoryMode = 'overview' | 'threads' | 'monthly';

export const statsLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

export const disabledRangeChipStyle = { opacity: 0.45 };
