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
import { getPracticeCopy } from '../../../constants/copy/practice';
import { getStoredLocale } from '../../../i18n/localeStore';
import { kv } from '../../../services/storage/mmkv';
import { DREAM_PRACTICE_REMINDER_SETTINGS_KEY } from '../../../services/storage/keys';
import { type DreamPracticeFocus } from '../../../app/navigation/routes';

const PRACTICE_REMINDER_CHANNEL_ID = 'dream-practice-reminders';
const PRACTICE_NOTIFICATION_TARGET = 'dream-practice';
const REALITY_CHECK_NOTIFICATION_IDS = ['practice-reality-check-0', 'practice-reality-check-1', 'practice-reality-check-2'] as const;

export type DreamPracticeReminderConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type DreamPracticeRealityCheckSettings = {
  enabled: boolean;
  startHour: number;
  endHour: number;
  intervalHours: number;
};

export type DreamPracticeReminderSettings = {
  morning_capture: DreamPracticeReminderConfig;
  reality_checks: DreamPracticeRealityCheckSettings;
  evening_intention: DreamPracticeReminderConfig;
  wbtb: DreamPracticeReminderConfig;
};

export const DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS: DreamPracticeReminderSettings = {
  morning_capture: { enabled: false, hour: 7, minute: 15 },
  reality_checks: { enabled: false, startHour: 10, endHour: 18, intervalHours: 4 },
  evening_intention: { enabled: false, hour: 21, minute: 15 },
  wbtb: { enabled: false, hour: 4, minute: 30 },
};

function normalizeHour(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(23, Math.max(0, Math.floor(value)));
}

function normalizeMinute(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(59, Math.max(0, Math.floor(value)));
}

function normalizeReminderConfig(
  value: Partial<DreamPracticeReminderConfig> | undefined,
  fallback: DreamPracticeReminderConfig,
): DreamPracticeReminderConfig {
  return {
    enabled: Boolean(value?.enabled),
    hour: normalizeHour(value?.hour, fallback.hour),
    minute: normalizeMinute(value?.minute, fallback.minute),
  };
}

function normalizeRealityCheckConfig(
  value: Partial<DreamPracticeRealityCheckSettings> | undefined,
): DreamPracticeRealityCheckSettings {
  const startHour = normalizeHour(value?.startHour, DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS.reality_checks.startHour);
  const endHour = normalizeHour(value?.endHour, DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS.reality_checks.endHour);
  const intervalHours =
    typeof value?.intervalHours === 'number' && Number.isFinite(value.intervalHours)
      ? Math.min(8, Math.max(2, Math.floor(value.intervalHours)))
      : DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS.reality_checks.intervalHours;

  return {
    enabled: Boolean(value?.enabled),
    startHour: Math.min(startHour, endHour),
    endHour: Math.max(startHour, endHour),
    intervalHours,
  };
}

function normalizeSettings(
  value: Partial<DreamPracticeReminderSettings> | undefined,
): DreamPracticeReminderSettings {
  return {
    morning_capture: normalizeReminderConfig(
      value?.morning_capture,
      DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS.morning_capture,
    ),
    reality_checks: normalizeRealityCheckConfig(value?.reality_checks),
    evening_intention: normalizeReminderConfig(
      value?.evening_intention,
      DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS.evening_intention,
    ),
    wbtb: normalizeReminderConfig(value?.wbtb, DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS.wbtb),
  };
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
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

async function ensurePracticeReminderChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: PRACTICE_REMINDER_CHANNEL_ID,
    name: 'Dream practice reminders',
    importance: AndroidImportance.DEFAULT,
  });
}

function getNotificationCopy() {
  const locale = typeof getStoredLocale === 'function' ? getStoredLocale() : 'en';
  return getPracticeCopy(locale);
}

function createNotificationBase(input: {
  id: string;
  title: string;
  body: string;
  slot: string;
  focus: DreamPracticeFocus;
}) {
  return {
    id: input.id,
    title: input.title,
    body: input.body,
    data: {
      target: PRACTICE_NOTIFICATION_TARGET,
      practice_focus: input.focus,
      practice_slot: input.slot,
    },
    android: {
      channelId: PRACTICE_REMINDER_CHANNEL_ID,
      pressAction: { id: 'default' },
    },
    ios: {
      foregroundPresentationOptions: {
        alert: true,
        badge: false,
        sound: true,
        banner: true,
        list: true,
      },
    },
  };
}

async function scheduleDailyReminder(
  id: string,
  config: DreamPracticeReminderConfig,
  title: string,
  body: string,
  slot: string,
  focus: DreamPracticeFocus,
) {
  await notifee.cancelNotification(id);
  if (!config.enabled) {
    return;
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: getNextTriggerTimestamp(config.hour, config.minute),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    createNotificationBase({ id, title, body, slot, focus }),
    trigger,
  );
}

async function scheduleRealityChecks(settings: DreamPracticeRealityCheckSettings) {
  await Promise.all(REALITY_CHECK_NOTIFICATION_IDS.map(id => notifee.cancelNotification(id)));
  if (!settings.enabled) {
    return;
  }

  const copy = getNotificationCopy();
  const slots: Array<{ hour: number; minute: number }> = [];
  let cursor = settings.startHour;
  while (cursor <= settings.endHour && slots.length < REALITY_CHECK_NOTIFICATION_IDS.length) {
    slots.push({ hour: cursor, minute: 0 });
    cursor += settings.intervalHours;
  }

  await Promise.all(
    slots.map((slot, index) =>
      notifee.createTriggerNotification(
        createNotificationBase({
          id: REALITY_CHECK_NOTIFICATION_IDS[index],
          title: copy.reminderNotificationRealityTitle,
          body: copy.reminderNotificationRealityBody,
          slot: 'reality_checks',
          focus: 'lucid',
        }),
        {
          type: TriggerType.TIMESTAMP,
          timestamp: getNextTriggerTimestamp(slot.hour, slot.minute),
          repeatFrequency: RepeatFrequency.DAILY,
        },
      ),
    ),
  );
}

export function getDreamPracticeReminderSettings() {
  const raw = kv.getString(DREAM_PRACTICE_REMINDER_SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS;
  }

  try {
    return normalizeSettings(JSON.parse(raw) as Partial<DreamPracticeReminderSettings>);
  } catch {
    return DEFAULT_DREAM_PRACTICE_REMINDER_SETTINGS;
  }
}

export function saveDreamPracticeReminderSettings(settings: DreamPracticeReminderSettings) {
  kv.set(DREAM_PRACTICE_REMINDER_SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

export async function getDreamPracticeReminderPermissionGranted() {
  const settings = await notifee.getNotificationSettings();
  return isAuthorized(settings.authorizationStatus);
}

export async function applyDreamPracticeReminderSettings(settings: DreamPracticeReminderSettings) {
  const normalized = normalizeSettings(settings);
  saveDreamPracticeReminderSettings(normalized);

  const permissionGranted = await getDreamPracticeReminderPermissionGranted();
  if (!permissionGranted) {
    const disabled = normalizeSettings({
      ...normalized,
      morning_capture: { ...normalized.morning_capture, enabled: false },
      reality_checks: { ...normalized.reality_checks, enabled: false },
      evening_intention: { ...normalized.evening_intention, enabled: false },
      wbtb: { ...normalized.wbtb, enabled: false },
    });
    saveDreamPracticeReminderSettings(disabled);
    return disabled;
  }

  await ensurePracticeReminderChannel();
  const copy = getNotificationCopy();
  await Promise.all([
    scheduleDailyReminder(
      'practice-morning-capture',
      normalized.morning_capture,
      copy.reminderNotificationMorningTitle,
      copy.reminderNotificationMorningBody,
      'morning_capture',
      'lucid',
    ),
    scheduleDailyReminder(
      'practice-evening-intention',
      normalized.evening_intention,
      copy.reminderNotificationEveningTitle,
      copy.reminderNotificationEveningBody,
      'evening_intention',
      'lucid',
    ),
    scheduleDailyReminder(
      'practice-wbtb',
      normalized.wbtb,
      copy.reminderNotificationWbtbTitle,
      copy.reminderNotificationWbtbBody,
      'wbtb',
      'lucid',
    ),
    scheduleRealityChecks(normalized.reality_checks),
  ]);

  return normalized;
}

export async function syncDreamPracticeReminderState() {
  return applyDreamPracticeReminderSettings(getDreamPracticeReminderSettings());
}

export function isPracticeNotificationPress(eventType: EventType, detail?: EventDetail) {
  if (eventType !== EventType.PRESS && eventType !== EventType.ACTION_PRESS) {
    return false;
  }

  return detail?.notification?.data?.target === PRACTICE_NOTIFICATION_TARGET;
}

export function isPracticeInitialNotificationTarget(initial: {
  notification?: { data?: { [key: string]: string | object | number } };
} | null) {
  return initial?.notification?.data?.target === PRACTICE_NOTIFICATION_TARGET;
}

export function getPracticeFocusFromNotification(detail?: {
  notification?: { data?: { [key: string]: string | object | number } };
} | null): DreamPracticeFocus {
  return detail?.notification?.data?.practice_focus === 'nightmares' ? 'nightmares' : 'lucid';
}
