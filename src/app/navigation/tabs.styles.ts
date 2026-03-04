import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import {
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_SIDE_OFFSET,
  getTabBarHeight,
} from './tabBarLayout';

export function createTabsStyles(theme: Theme, focused: boolean, bottomInset: number) {
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
      fontSize: 10,
      fontWeight: '600',
    },
    recordIconContainer: {
      width: focused ? 56 : 44,
      height: focused ? 56 : 44,
      borderRadius: focused ? 18 : 14,
      marginTop: focused ? -26 : -8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? theme.colors.primary : theme.colors.surface,
      borderWidth: 1,
      borderColor: focused ? theme.colors.primary : theme.colors.border,
      shadowColor: focused ? theme.colors.glow : '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: focused ? 0.22 : 0.04,
      shadowRadius: focused ? 22 : 8,
      elevation: focused ? 10 : 2,
    },
  });
}
