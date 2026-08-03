import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import { hexToRgba } from '../../theme/color';
import {
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_SIDE_OFFSET,
  getTabBarHeight,
  getTabBarReservedSpace,
} from './tabBarLayout';

export function createTabsStyles(theme: Theme, bottomInset: number) {
  const barHeight = getTabBarHeight(bottomInset);
  const bottomPadding = Math.max(Math.min(bottomInset, 8), 6);
  const reservedSpace = getTabBarReservedSpace(bottomInset);

  return StyleSheet.create({
    tabBarRoot: {
      height: reservedSpace,
      overflow: 'visible',
      zIndex: 100,
    },
    tabBarShell: {
      position: 'absolute',
      left: TAB_BAR_SIDE_OFFSET,
      right: TAB_BAR_SIDE_OFFSET,
      bottom: TAB_BAR_BOTTOM_OFFSET,
      zIndex: 100,
      height: barHeight,
      paddingTop: 7,
      paddingBottom: bottomPadding,
      paddingHorizontal: 12,
      backgroundColor: hexToRgba(theme.colors.surface, 0.96),
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.07),
      borderRadius: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 10,
      overflow: 'visible',
    },
    tabBarGlowLeft: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 999,
      backgroundColor: hexToRgba(theme.colors.accent, 0.14),
      left: -8,
      bottom: 4,
      opacity: 0.16,
    },
    tabBarGlowRight: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 999,
      backgroundColor: hexToRgba(theme.colors.auroraMid, 0.15),
      right: -10,
      top: -12,
      opacity: 0.14,
    },
    tabBarEdgeHighlight: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 0,
      height: 1,
      backgroundColor: hexToRgba(theme.colors.text, 0.14),
      borderRadius: 999,
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
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    centerSlot: {
      width: 82,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerButtonFrame: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.14,
      shadowRadius: 14,
      elevation: 8,
      transform: [{ translateY: -6 }],
    },
    centerButtonFrameActive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
    },
    centerButtonAuraOuter: {
      position: 'absolute',
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
      opacity: 0.48,
    },
    centerButtonAuraOuterActive: {
      width: 68,
      height: 68,
      backgroundColor: hexToRgba(theme.colors.primary, 0.18),
      opacity: 0.7,
    },
    centerButtonAuraInner: {
      position: 'absolute',
      width: 54,
      height: 54,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.08),
    },
    centerButtonAuraInnerActive: {
      borderColor: hexToRgba(theme.colors.text, 0.14),
    },
    centerButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.12),
    },
    centerButtonActive: {
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 5,
    },
    centerButtonPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.97 }],
    },
    tabItem: {
      flex: 1,
      minHeight: 40,
      justifyContent: 'center',
    },
    tabItemNearCenter: {
      marginHorizontal: 6,
    },
    tabItemInner: {
      minHeight: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
      paddingVertical: 3,
    },
    tabItemInnerActive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.03),
    },
    tabItemInnerPressed: {
      opacity: 0.88,
    },
    tabItemContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    tabIconShell: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    tabIconShellActive: {
      // The radius is repeated from `tabIconShell` on purpose. On Android the
      // rounded outline is baked into the background drawable when the view is
      // created; a background colour added later, on a style update, arrives
      // without it. The result was that the tab focused at mount rendered a
      // circle and every tab focused by tapping rendered a square — four of
      // five, on Android only, and invisible to every test.
      borderRadius: 13,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 4,
    },
    tabLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
      includeFontPadding: false,
      maxWidth: 54,
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
      ...StyleSheet.absoluteFill,
      backgroundColor: hexToRgba(theme.colors.ink, 0.6),
    },
    quickAddSheet: {
      marginHorizontal: TAB_BAR_SIDE_OFFSET,
      marginBottom:
        TAB_BAR_BOTTOM_OFFSET + Math.max(bottomInset, theme.spacing.sm),
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.md,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.08),
      backgroundColor: hexToRgba(theme.colors.surfaceAlt, 0.98),
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.36,
      shadowRadius: 28,
      elevation: 20,
      overflow: 'hidden',
      position: 'relative',
    },
    quickAddGlowLarge: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 999,
      backgroundColor: hexToRgba(theme.colors.auroraMid, 0.18),
      top: -64,
      right: -48,
      opacity: 0.32,
    },
    quickAddGlowSmall: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: hexToRgba(theme.colors.accent, 0.16),
      bottom: -32,
      left: -28,
      opacity: 0.24,
    },
    quickAddHandle: {
      alignSelf: 'center',
      width: 56,
      height: 4,
      borderRadius: 999,
      backgroundColor: hexToRgba(theme.colors.text, 0.16),
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
      borderColor: hexToRgba(theme.colors.text, 0.06),
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
      borderColor: hexToRgba(theme.colors.text, 0.06),
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
      // A deeper pour of the same tint the other rows use, rather than a wash
      // of the text colour. The text wash was symmetric in theory and not in
      // practice: white at 0.2 over a dark surface is a hint, black at 0.2
      // over a pale one is a grey disc, so the highlighted row was the only
      // one whose icon sat on something muddy.
      backgroundColor: hexToRgba(theme.colors.primary, 0.26),
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
