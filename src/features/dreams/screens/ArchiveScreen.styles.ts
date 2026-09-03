import { Theme } from '../../../theme/theme';
import { createArchiveToolbarStyles } from './ArchiveScreen.styles.toolbar';
import { createArchiveCalendarStyles } from './ArchiveScreen.styles.calendar';
import { createArchiveListStyles } from './ArchiveScreen.styles.list';

export function createArchiveScreenStyles(theme: Theme) {
  return {
    ...createArchiveToolbarStyles(theme),
    ...createArchiveCalendarStyles(theme),
    ...createArchiveListStyles(theme),
  };
}
