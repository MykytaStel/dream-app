import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../features/dreams/screens/HomeScreen';
import NewDreamScreen from '../../features/dreams/screens/NewDreamScreen';
import StatsScreen from '../../features/stats/screens/StatsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
export default function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="New" component={NewDreamScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
