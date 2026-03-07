import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import {
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_SIDE_OFFSET,
  getTabBarHeight,
} from './tabBarLayout';

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const chunk =
    normalized.length === 3
      ? normalized
          .split('')
          .map(value => `${value}${value}`)
          .join('')
      : normalized;
  const int = Number.parseInt(chunk, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createTabsStyles(theme: Theme, bottomInset: number) {
  const barHeight = getTabBarHeight(bottomInset);
  const bottomPadding = Math.max(Math.min(bottomInset, 8), 6);

  return StyleSheet.create({
    tabBarShell: {
      position: 'absolute',
      left: TAB_BAR_SIDE_OFFSET,
      right: TAB_BAR_SIDE_OFFSET,
      bottom: TAB_BAR_BOTTOM_OFFSET,
      height: barHeight,
      paddingTop: 8,
      paddingBottom: bottomPadding,
      paddingHorizontal: 10,
      backgroundColor: hexToRgba(theme.colors.surface, 0.97),
      borderWidth: 1,
      borderColor: hexToRgba('#FFFFFF', 0.06),
      borderRadius: 22,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 10,
      overflow: 'visible',
    },
    tabBarRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tabCluster: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
    },
    centerSlot: {
      width: 68,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerButtonFrame: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 9,
      transform: [{ translateY: -9 }],
    },
    centerButtonFrameActive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.18),
    },
    centerButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: hexToRgba('#FFFFFF', 0.12),
    },
    centerButtonPressed: {
      opacity: 0.92,
    },
    tabItem: {
      flex: 1,
      minHeight: 42,
      justifyContent: 'center',
    },
    tabItemInner: {
      minHeight: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingVertical: 2,
      gap: 2,
    },
    tabItemInnerActive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.08),
    },
    tabItemInnerPressed: {
      opacity: 0.88,
    },
    tabLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
      includeFontPadding: false,
      maxWidth: 56,
      textAlign: 'center',
    },
    tabLabelActive: {
      color: theme.colors.text,
    },
    tabLabelInactive: {
      color: theme.colors.tabIcon,
    },
    quickAddRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    quickAddBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(6, 9, 16, 0.6)',
    },
    quickAddSheet: {
      marginHorizontal: TAB_BAR_SIDE_OFFSET,
      marginBottom: TAB_BAR_BOTTOM_OFFSET + Math.max(bottomInset, theme.spacing.sm),
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.md,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: hexToRgba('#FFFFFF', 0.08),
      backgroundColor: hexToRgba(theme.colors.surfaceAlt, 0.98),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.36,
      shadowRadius: 28,
      elevation: 20,
    },
    quickAddHandle: {
      alignSelf: 'center',
      width: 56,
      height: 4,
      borderRadius: 999,
      backgroundColor: hexToRgba('#FFFFFF', 0.16),
    },
    quickAddHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    quickAddHeaderCopy: {
      flex: 1,
      gap: 4,
    },
    quickAddKicker: {
      color: theme.colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    quickAddTitle: {
      color: theme.colors.text,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
    },
    quickAddSubtitle: {
      color: theme.colors.textDim,
      fontSize: 15,
      lineHeight: 21,
    },
    quickAddClose: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(theme.colors.surfaceElevated, 0.78),
      borderWidth: 1,
      borderColor: hexToRgba('#FFFFFF', 0.06),
    },
    quickAddClosePressed: {
      opacity: 0.86,
    },
    quickAddOptions: {
      gap: theme.spacing.sm,
    },
    quickAddOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: 22,
      borderWidth: 1,
    },
    quickAddOptionPrimary: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.16),
      borderColor: hexToRgba(theme.colors.primary, 0.24),
    },
    quickAddOptionSecondary: {
      backgroundColor: hexToRgba(theme.colors.surfaceElevated, 0.8),
      borderColor: hexToRgba('#FFFFFF', 0.06),
    },
    quickAddOptionPressed: {
      opacity: 0.92,
    },
    quickAddOptionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
    },
    quickAddOptionIconWrapPrimary: {
      backgroundColor: hexToRgba('#FFFFFF', 0.2),
    },
    quickAddOptionCopy: {
      flex: 1,
      gap: 2,
    },
    quickAddOptionTitle: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
    },
    quickAddOptionDescription: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
