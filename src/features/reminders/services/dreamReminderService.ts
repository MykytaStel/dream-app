import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventDetail,
  EventType,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { kv } from '../../../services/storage/mmkv';

const REMINDER_CHANNEL_ID = 'dream-reminders';
const REMINDER_NOTIFICATION_ID = 'dream-record-reminder';
const REMINDER_SETTINGS_KEY = 'dream-reminder-settings';
const REMINDER_PENDING_OPEN_KEY = 'dream-reminder-pending-open-record';
const REMINDER_TARGET_RECORD = 'record';

export type DreamReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export const REMINDER_TIME_OPTIONS: Array<{ label: string; hour: number; minute: number }> = [
  { label: '06:30', hour: 6, minute: 30 },
  { label: '07:00', hour: 7, minute: 0 },
  { label: '07:30', hour: 7, minute: 30 },
  { label: '08:00', hour: 8, minute: 0 },
  { label: '08:30', hour: 8, minute: 30 },
];

export const DEFAULT_REMINDER_SETTINGS: DreamReminderSettings = {
  enabled: false,
  hour: 7,
  minute: 30,
};

function parseSettings(raw?: string): DreamReminderSettings {
  if (!raw) {
    return DEFAULT_REMINDER_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DreamReminderSettings>;
    return {
      enabled: Boolean(parsed.enabled),
      hour: typeof parsed.hour === 'number' ? parsed.hour : DEFAULT_REMINDER_SETTINGS.hour,
      minute: typeof parsed.minute === 'number' ? parsed.minute : DEFAULT_REMINDER_SETTINGS.minute,
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

function getNextTriggerTimestamp(hour: number, minute: number) {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime();
}

function isAuthorized(status: AuthorizationStatus) {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

async function ensureReminderChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Dream reminders',
    importance: AndroidImportance.HIGH,
  });
}

export function getDreamReminderSettings() {
  return parseSettings(kv.getString(REMINDER_SETTINGS_KEY));
}

export function saveDreamReminderSettings(settings: DreamReminderSettings) {
  kv.set(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}

export async function requestReminderPermission() {
  const settings = await notifee.requestPermission();
  return isAuthorized(settings.authorizationStatus);
}

export async function scheduleDreamReminder(settings: DreamReminderSettings) {
  await notifee.cancelNotification(REMINDER_NOTIFICATION_ID);

  if (!settings.enabled) {
    return;
  }

  await ensureReminderChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: getNextTriggerTimestamp(settings.hour, settings.minute),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: REMINDER_NOTIFICATION_ID,
      title: 'Record your dream',
      body: 'Capture it while details are still fresh.',
      data: {
        target: REMINDER_TARGET_RECORD,
      },
      android: {
        channelId: REMINDER_CHANNEL_ID,
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    },
    trigger,
  );
}

export async function applyDreamReminderSettings(settings: DreamReminderSettings) {
  saveDreamReminderSettings(settings);
  await scheduleDreamReminder(settings);
}

export function isReminderNotificationPress(eventType: EventType, detail?: EventDetail) {
  if (eventType !== EventType.PRESS && eventType !== EventType.ACTION_PRESS) {
    return false;
  }

  return detail?.notification?.data?.target === REMINDER_TARGET_RECORD;
}

export function isReminderInitialNotificationTarget(initial: {
  notification?: { data?: { [key: string]: string | object | number } };
} | null) {
  return initial?.notification?.data?.target === REMINDER_TARGET_RECORD;
}

export function markPendingRecordOpenFromReminder() {
  kv.set(REMINDER_PENDING_OPEN_KEY, '1');
}

export function consumePendingRecordOpenFromReminder() {
  const hasPending = kv.getString(REMINDER_PENDING_OPEN_KEY) === '1';
  if (hasPending) {
    kv.remove(REMINDER_PENDING_OPEN_KEY);
  }
  return hasPending;
}
