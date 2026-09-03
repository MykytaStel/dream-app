import { Theme } from '../../../theme/theme';
import { createHomeShellStyles } from './HomeScreen.styles.shell';
import { createHomeHeroStyles } from './HomeScreen.styles.hero';
import { createHomeTimelineStyles } from './HomeScreen.styles.timeline';
import { createHomeControlsStyles } from './HomeScreen.styles.controls';
import { createHomeDreamRowStyles } from './HomeScreen.styles.dreamRow';

export function createHomeScreenStyles(theme: Theme) {
  return {
    ...createHomeShellStyles(theme),
    ...createHomeHeroStyles(theme),
    ...createHomeTimelineStyles(theme),
    ...createHomeControlsStyles(theme),
    ...createHomeDreamRowStyles(theme),
  };
}
