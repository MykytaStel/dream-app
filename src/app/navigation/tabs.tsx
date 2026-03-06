/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../../features/dreams/screens/HomeScreen';
import NewDreamScreen from '../../features/dreams/screens/NewDreamScreen';
import StatsScreen from '../../features/stats/screens/StatsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import { Theme } from '../../theme/theme';
import { createTabsStyles } from './tabs.styles';
import { getTabRouteLabels, TAB_ROUTE_NAMES, type TabParamList } from './routes';
import { useI18n } from '../../i18n/I18nProvider';

const Tab = createBottomTabNavigator<TabParamList>();
export default function Tabs() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const insets = useSafeAreaInsets();
  const labels = React.useMemo(() => getTabRouteLabels(locale), [locale]);
  const tabStyles = createTabsStyles(t, false, insets.bottom);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.tabIcon,
        tabBarStyle: tabStyles.tabBar,
        tabBarLabelStyle: tabStyles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          const styles = createTabsStyles(t, focused, insets.bottom);
          const icon =
            route.name === TAB_ROUTE_NAMES.Home
              ? 'time-outline'
              : route.name === TAB_ROUTE_NAMES.New
                ? 'mic'
                : route.name === TAB_ROUTE_NAMES.Stats
                  ? 'bar-chart-outline'
                  : 'settings-outline';

          if (route.name === TAB_ROUTE_NAMES.New) {
            if (!focused) {
              return <Ionicons name={icon} size={22} color={color} />;
            }

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
        name={TAB_ROUTE_NAMES.Home}
        component={HomeScreen}
        options={{ tabBarLabel: labels[TAB_ROUTE_NAMES.Home] }}
      />
      <Tab.Screen
        name={TAB_ROUTE_NAMES.New}
        component={NewDreamScreen}
        options={{ tabBarLabel: labels[TAB_ROUTE_NAMES.New] }}
      />
      <Tab.Screen
        name={TAB_ROUTE_NAMES.Stats}
        component={StatsScreen}
        options={{ tabBarLabel: labels[TAB_ROUTE_NAMES.Stats] }}
      />
      <Tab.Screen
        name={TAB_ROUTE_NAMES.Settings}
        component={SettingsScreen}
        options={{ tabBarLabel: labels[TAB_ROUTE_NAMES.Settings] }}
      />
    </Tab.Navigator>
  );
}
