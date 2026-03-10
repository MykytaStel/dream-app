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
import {
  REMINDER_PENDING_WAKE_OPEN_KEY,
  REMINDER_SETTINGS_KEY,
} from '../../../services/storage/keys';
import { getStoredLocale } from '../../../i18n/localeStore';
import { getSettingsCopy } from '../../../constants/copy/settings';

const REMINDER_CHANNEL_ID = 'dream-reminders';
const REMINDER_NOTIFICATION_ID = 'dream-record-reminder';
const REMINDER_TARGET_RECORD = 'record';
export const REMINDER_ERROR_CODES = {
  permissionDenied: 'permission-denied',
} as const;

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

function normalizeReminderSettings(
  settings: Partial<DreamReminderSettings> | DreamReminderSettings,
): DreamReminderSettings {
  const rawHour =
    typeof settings.hour === 'number' ? Math.trunc(settings.hour) : DEFAULT_REMINDER_SETTINGS.hour;
  const rawMinute =
    typeof settings.minute === 'number'
      ? Math.trunc(settings.minute)
      : DEFAULT_REMINDER_SETTINGS.minute;

  return {
    enabled: Boolean(settings.enabled),
    hour: Math.min(Math.max(rawHour, 0), 23),
    minute: Math.min(Math.max(rawMinute, 0), 59),
  };
}

function parseSettings(raw?: string): DreamReminderSettings {
  if (!raw) {
    return DEFAULT_REMINDER_SETTINGS;
  }

  try {
    return normalizeReminderSettings(JSON.parse(raw) as Partial<DreamReminderSettings>);
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
  kv.set(REMINDER_SETTINGS_KEY, JSON.stringify(normalizeReminderSettings(settings)));
}

export async function requestReminderPermission() {
  const settings = await notifee.requestPermission();
  return isAuthorized(settings.authorizationStatus);
}

export async function getDreamReminderPermissionGranted() {
  const settings = await notifee.getNotificationSettings();
  return isAuthorized(settings.authorizationStatus);
}

async function cancelDreamReminder() {
  await notifee.cancelNotification(REMINDER_NOTIFICATION_ID);
}

async function scheduleAuthorizedDreamReminder(settings: DreamReminderSettings) {
  await ensureReminderChannel();
  const copy = getSettingsCopy(getStoredLocale());

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: getNextTriggerTimestamp(settings.hour, settings.minute),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: REMINDER_NOTIFICATION_ID,
      title: copy.reminderNotificationTitle,
      body: copy.reminderNotificationBody,
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

export async function scheduleDreamReminder(settings: DreamReminderSettings) {
  const normalized = normalizeReminderSettings(settings);
  await cancelDreamReminder();

  if (!normalized.enabled) {
    return;
  }

  const permissionGranted = await getDreamReminderPermissionGranted();
  if (!permissionGranted) {
    throw new Error(REMINDER_ERROR_CODES.permissionDenied);
  }

  await scheduleAuthorizedDreamReminder(normalized);
}

export async function applyDreamReminderSettings(settings: DreamReminderSettings) {
  const normalized = normalizeReminderSettings(settings);

  if (!normalized.enabled) {
    saveDreamReminderSettings(normalized);
    await cancelDreamReminder();
    return normalized;
  }

  const permissionGranted = await getDreamReminderPermissionGranted();
  if (!permissionGranted) {
    const next = {
      ...normalized,
      enabled: false,
    };
    saveDreamReminderSettings(next);
    await cancelDreamReminder();
    return next;
  }

  saveDreamReminderSettings(normalized);
  await scheduleAuthorizedDreamReminder(normalized);
  return normalized;
}

export async function syncDreamReminderState() {
  return applyDreamReminderSettings(getDreamReminderSettings());
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

export function markPendingWakeOpenFromReminder() {
  kv.set(REMINDER_PENDING_WAKE_OPEN_KEY, '1');
}

export function consumePendingWakeOpenFromReminder() {
  const hasPending = kv.getString(REMINDER_PENDING_WAKE_OPEN_KEY) === '1';
  if (hasPending) {
    kv.remove(REMINDER_PENDING_WAKE_OPEN_KEY);
  }
  return hasPending;
}
