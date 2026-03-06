import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import {
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_SIDE_OFFSET,
  getTabBarHeight,
} from './tabBarLayout';

export function createTabsStyles(theme: Theme, _focused: boolean, bottomInset: number) {
  return StyleSheet.create({
    tabBar: {
      position: 'absolute',
      left: TAB_BAR_SIDE_OFFSET,
      right: TAB_BAR_SIDE_OFFSET,
      bottom: TAB_BAR_BOTTOM_OFFSET,
      height: getTabBarHeight(bottomInset),
      paddingTop: 10,
      paddingBottom: Math.max(bottomInset, 10),
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 26,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.24,
      shadowRadius: 30,
      elevation: 14,
    },
    tabBarLabel: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '600',
      includeFontPadding: false,
    },
  });
}
