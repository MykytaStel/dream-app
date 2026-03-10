import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../features/dreams/screens/HomeScreen';
import NewDreamScreen from '../../features/dreams/screens/NewDreamScreen';
import ArchiveScreen from '../../features/dreams/screens/ArchiveScreen';
import StatsScreen from '../../features/stats/screens/StatsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import { TAB_ROUTE_NAMES, type TabParamList } from './routes';
import { AppTabBar } from './AppTabBar';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<TabParamList>();

function renderAppTabBar(props: BottomTabBarProps) {
  return <AppTabBar {...props} />;
}

export default function Tabs() {
  return (
    <Tab.Navigator
      tabBar={renderAppTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name={TAB_ROUTE_NAMES.Home} component={HomeScreen} />
      <Tab.Screen name={TAB_ROUTE_NAMES.Archive} component={ArchiveScreen} />
      <Tab.Screen name={TAB_ROUTE_NAMES.New} component={NewDreamScreen} />
      <Tab.Screen name={TAB_ROUTE_NAMES.Stats} component={StatsScreen} />
      <Tab.Screen name={TAB_ROUTE_NAMES.Settings} component={SettingsScreen} />
    </Tab.Navigator>
  );
}
