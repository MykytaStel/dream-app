import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createTabsStyles(theme: Theme, focused: boolean) {
  return StyleSheet.create({
    tabBar: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      height: 76,
      paddingTop: 10,
      paddingBottom: 10,
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
    recordTabBarLabel: {
      marginTop: 4,
    },
    recordIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 18,
      marginTop: -26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? theme.colors.primary : theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: focused ? theme.colors.primary : theme.colors.border,
      shadowColor: focused ? theme.colors.glow : '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: focused ? 0.22 : 0.12,
      shadowRadius: 22,
      elevation: 10,
    },
  });
}
