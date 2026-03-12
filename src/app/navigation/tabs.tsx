import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../../features/dreams/screens/HomeScreen';
import NewDreamScreen from '../../features/dreams/screens/NewDreamScreen';
import ArchiveScreen from '../../features/dreams/screens/ArchiveScreen';
import StatsScreen from '../../features/stats/screens/StatsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import { useI18n } from '../../i18n/I18nProvider';
import type { Theme } from '../../theme/theme';
import { AppTabBar } from './AppTabBar';
import { getTabRouteLabels, TAB_ROUTE_NAMES, type TabParamList } from './routes';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  [TAB_ROUTE_NAMES.Home]: 'time-outline',
  [TAB_ROUTE_NAMES.Archive]: 'albums-outline',
  [TAB_ROUTE_NAMES.New]: 'add-circle-outline',
  [TAB_ROUTE_NAMES.Stats]: 'git-compare-outline',
  [TAB_ROUTE_NAMES.Settings]: 'settings-outline',
};

function createTabBarIcon(routeName: keyof TabParamList) {
  return ({
    color,
    focused,
    size,
  }: {
    color: string;
    focused: boolean;
    size: number;
  }) => (
    <Ionicons
      name={focused && routeName === TAB_ROUTE_NAMES.New ? 'add-circle' : TAB_ICONS[routeName]}
      size={routeName === TAB_ROUTE_NAMES.New ? size + 5 : size}
      color={color}
    />
  );
}

export default function Tabs() {
  const { locale } = useI18n();
  const theme = useTheme<Theme>();
  const labels = React.useMemo(() => getTabRouteLabels(locale), [locale]);

  const homeOptions = React.useMemo(
    () => ({
      tabBarLabel: labels[TAB_ROUTE_NAMES.Home],
      tabBarIcon: createTabBarIcon(TAB_ROUTE_NAMES.Home),
    }),
    [labels],
  );
  const archiveOptions = React.useMemo(
    () => ({
      tabBarLabel: labels[TAB_ROUTE_NAMES.Archive],
      tabBarIcon: createTabBarIcon(TAB_ROUTE_NAMES.Archive),
    }),
    [labels],
  );
  const newOptions = React.useMemo(
    () => ({
      tabBarLabel: labels[TAB_ROUTE_NAMES.New],
      tabBarIcon: createTabBarIcon(TAB_ROUTE_NAMES.New),
    }),
    [labels],
  );
  const statsOptions = React.useMemo(
    () => ({
      tabBarLabel: labels[TAB_ROUTE_NAMES.Stats],
      tabBarIcon: createTabBarIcon(TAB_ROUTE_NAMES.Stats),
    }),
    [labels],
  );
  const settingsOptions = React.useMemo(
    () => ({
      tabBarLabel: labels[TAB_ROUTE_NAMES.Settings],
      tabBarIcon: createTabBarIcon(TAB_ROUTE_NAMES.Settings),
    }),
    [labels],
  );

  const renderTabBar = React.useCallback(
    (props: Parameters<typeof AppTabBar>[0]) => <AppTabBar {...props} />,
    [],
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.tabIcon,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name={TAB_ROUTE_NAMES.Home} component={HomeScreen} options={homeOptions} />
      <Tab.Screen
        name={TAB_ROUTE_NAMES.Archive}
        component={ArchiveScreen}
        options={archiveOptions}
      />
      <Tab.Screen name={TAB_ROUTE_NAMES.New} component={NewDreamScreen} options={newOptions} />
      <Tab.Screen name={TAB_ROUTE_NAMES.Stats} component={StatsScreen} options={statsOptions} />
      <Tab.Screen
        name={TAB_ROUTE_NAMES.Settings}
        component={SettingsScreen}
        options={settingsOptions}
      />
    </Tab.Navigator>
  );
}
