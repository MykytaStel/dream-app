import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import notifee from '@notifee/react-native';
import { useTheme } from '@shopify/restyle';
import DreamDetailScreen from '../../features/dreams/screens/DreamDetailScreen';
import EditDreamScreen from '../../features/dreams/screens/EditDreamScreen';
import WakeEntryScreen from '../../features/dreams/screens/WakeEntryScreen';
import MonthlyReportScreen from '../../features/stats/screens/MonthlyReportScreen';
import PatternDetailScreen from '../../features/stats/screens/PatternDetailScreen';
import ProgressScreen from '../../features/stats/screens/ProgressScreen';
import ReviewWorkspaceScreen from '../../features/stats/screens/ReviewWorkspaceScreen';
import BackupOnboardingPreviewScreen from '../../features/settings/screens/BackupOnboardingPreviewScreen';
import BackupScreen from '../../features/settings/screens/BackupScreen';
import OnboardingScreen from '../../features/onboarding/screens/OnboardingScreen';
import DreamPracticeScreen from '../../features/practice/screens/DreamPracticeScreen';
import { hasSeenOnboarding } from '../../features/onboarding/services/onboardingService';
import SyncDiagnosticsPreviewScreen from '../../features/settings/screens/SyncDiagnosticsPreviewScreen';
import {
  consumePendingWakeOpenFromReminder,
  isReminderInitialNotificationTarget,
  isReminderNotificationPress,
} from '../../features/reminders/services/dreamReminderService';
import {
  getPracticeFocusFromNotification,
  isPracticeInitialNotificationTarget,
  isPracticeNotificationPress,
} from '../../features/reminders/services/dreamPracticeReminderService';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { Theme } from '../../theme/theme';
import { appLinking } from './linking';
import Tabs from './tabs';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from './routes';
import { navigationRef, openDreamPractice, openWakeEntry } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const t = useTheme<Theme>();
  const { appearance } = useAppTheme();
  const initialRouteName = React.useMemo(
    () => (hasSeenOnboarding() ? ROOT_ROUTE_NAMES.Tabs : ROOT_ROUTE_NAMES.Onboarding),
    [],
  );
  const navigationTheme = React.useMemo(() => {
    const baseTheme = appearance === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: appearance === 'dark',
      colors: {
        ...baseTheme.colors,
        primary: t.colors.primary,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.text,
        border: t.colors.border,
        notification: t.colors.accent,
      },
    };
  }, [appearance, t]);

  React.useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (isReminderNotificationPress(type, detail)) {
        openWakeEntry({ source: 'reminder' });
        return;
      }

      if (isPracticeNotificationPress(type, detail)) {
        openDreamPractice({
          focus: getPracticeFocusFromNotification(detail),
          entrySource: 'reminder',
        });
      }
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function openFromNotification() {
      const initialNotification = await notifee.getInitialNotification();
      const shouldOpenWake = consumePendingWakeOpenFromReminder() ||
        isReminderInitialNotificationTarget(initialNotification);
      const shouldOpenPractice = isPracticeInitialNotificationTarget(initialNotification);

      if (cancelled) {
        return;
      }

      if (shouldOpenWake) {
        const retryOpenWake = (attempt = 0) => {
          if (cancelled) {
            return;
          }

          const opened = openWakeEntry({ source: 'reminder' });
          if (opened || attempt >= 8) {
            return;
          }

          setTimeout(() => retryOpenWake(attempt + 1), 150);
        };

        retryOpenWake();
        return;
      }

      if (shouldOpenPractice) {
        const retryOpenPractice = (attempt = 0) => {
          if (cancelled) {
            return;
          }

          const opened = openDreamPractice({
            focus: getPracticeFocusFromNotification(initialNotification),
            entrySource: 'reminder',
          });
          if (opened || attempt >= 8) {
            return;
          }

          setTimeout(() => retryOpenPractice(attempt + 1), 150);
        };

        retryOpenPractice();
      }
    }

    openFromNotification();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NavigationContainer
      linking={appLinking}
      ref={navigationRef}
      theme={navigationTheme}
    >
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: {
            backgroundColor: t.colors.surface,
          },
          headerShadowVisible: false,
          headerTintColor: t.colors.text,
          headerTitleStyle: {
            color: t.colors.text,
          },
          statusBarStyle: appearance === 'dark' ? 'light' : 'dark',
          statusBarBackgroundColor: t.colors.background,
        }}
      >
        <Stack.Screen name={ROOT_ROUTE_NAMES.Onboarding} component={OnboardingScreen} />
        <Stack.Screen name={ROOT_ROUTE_NAMES.Tabs} component={Tabs} />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.Backup}
          component={BackupScreen}
          options={{
            headerShown: true,
            title: 'Backup & sync',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.BackupOnboardingPreview}
          component={BackupOnboardingPreviewScreen}
          options={{
            headerShown: true,
            title: 'Backup onboarding',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.SyncDiagnosticsPreview}
          component={SyncDiagnosticsPreviewScreen}
          options={{
            headerShown: true,
            title: 'Sync diagnostics',
          }}
        />
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
          options={{
            headerShown: true,
            title: 'Progress',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.MonthlyReport}
          component={MonthlyReportScreen}
          options={{
            headerShown: true,
            title: 'Monthly report',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.ReviewWorkspace}
          component={ReviewWorkspaceScreen}
          options={{
            headerShown: true,
            title: 'Review workspace',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.PatternDetail}
          component={PatternDetailScreen}
          options={{
            headerShown: true,
            title: 'Pattern detail',
          }}
        />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.DreamPractice}
          component={DreamPracticeScreen}
          options={{
            headerShown: true,
            title: 'Dream practice',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
