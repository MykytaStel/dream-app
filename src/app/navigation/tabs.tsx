/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../../features/dreams/screens/HomeScreen';
import NewDreamScreen from '../../features/dreams/screens/NewDreamScreen';
import StatsScreen from '../../features/stats/screens/StatsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import { Theme } from '../../theme/theme';
import { createTabsStyles } from './tabs.styles';

const Tab = createBottomTabNavigator();
export default function Tabs() {
  const t = useTheme<Theme>();
  const tabStyles = createTabsStyles(t, false);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.tabIcon,
        tabBarStyle: tabStyles.tabBar,
        tabBarLabelStyle: [
          tabStyles.tabBarLabel,
          route.name === 'New' ? tabStyles.recordTabBarLabel : undefined,
        ],
        tabBarIcon: ({ color, focused }) => {
          const styles = createTabsStyles(t, focused);
          const icon =
            route.name === 'Home'
              ? 'time-outline'
              : route.name === 'New'
                ? 'mic'
                : route.name === 'Stats'
                  ? 'bar-chart-outline'
                  : 'settings-outline';

          if (route.name === 'New') {
            return (
              <View style={styles.recordIconContainer}>
                <Ionicons
                  name={icon}
                  size={24}
                  color={focused ? t.colors.background : color}
                />
              </View>
            );
          }

          return <Ionicons name={icon} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Timeline' }}
      />
      <Tab.Screen
        name="New"
        component={NewDreamScreen}
        options={{ tabBarLabel: 'Record' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}
