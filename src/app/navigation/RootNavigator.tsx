import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import notifee from '@notifee/react-native';
import DreamDetailScreen from '../../features/dreams/screens/DreamDetailScreen';
import EditDreamScreen from '../../features/dreams/screens/EditDreamScreen';
import WakeEntryScreen from '../../features/dreams/screens/WakeEntryScreen';
import MonthlyReportScreen from '../../features/stats/screens/MonthlyReportScreen';
import PatternDetailScreen from '../../features/stats/screens/PatternDetailScreen';
import ProgressScreen from '../../features/stats/screens/ProgressScreen';
import {
  consumePendingWakeOpenFromReminder,
  isReminderInitialNotificationTarget,
  isReminderNotificationPress,
} from '../../features/reminders/services/dreamReminderService';
import Tabs from './tabs';
import { useTheme } from '@shopify/restyle';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from './routes';
import { navigationRef, openWakeEntry } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const t = useTheme<any>();

  React.useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (isReminderNotificationPress(type, detail)) {
        openWakeEntry({ source: 'reminder' });
      }
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function openFromNotification() {
      const initialNotification = await notifee.getInitialNotification();
      const shouldOpen = consumePendingWakeOpenFromReminder() ||
        isReminderInitialNotificationTarget(initialNotification);

      if (!shouldOpen || cancelled) {
        return;
      }

      const retryOpen = (attempt = 0) => {
        if (cancelled) {
          return;
        }

        const opened = openWakeEntry({ source: 'reminder' });
        if (opened || attempt >= 8) {
          return;
        }

        setTimeout(() => retryOpen(attempt + 1), 150);
      };

      retryOpen();
    }

    openFromNotification();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        ...DarkTheme,
        dark: true,
        colors: {
          ...DarkTheme.colors,
          primary: t.colors.primary,
          background: t.colors.background,
          card: t.colors.surface,
          text: t.colors.text,
          border: t.colors.border,
          notification: t.colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name={ROOT_ROUTE_NAMES.Tabs} component={Tabs} />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.WakeEntry}
          component={WakeEntryScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.DreamDetail}
          component={DreamDetailScreen}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.DreamEditor}
          component={EditDreamScreen}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.Progress}
          component={ProgressScreen}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.MonthlyReport}
          component={MonthlyReportScreen}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.PatternDetail}
          component={PatternDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
