import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import {
  isReminderNotificationPress,
  markPendingWakeOpenFromReminder,
} from './src/features/reminders/services/dreamReminderService';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (isReminderNotificationPress(type, detail)) {
    markPendingWakeOpenFromReminder();
  }
});

AppRegistry.registerComponent(appName, () => App);
