import { AppLocale } from '../../i18n/types';

const SETTINGS_COPY_EN = {
  title: 'Settings',
  subtitle: 'Architecture and product controls will grow here.',
  versionTitle: 'Current release',
  reminderTitle: 'Dream reminder',
  reminderDescription:
    'Schedule one daily reminder after waking so you can record dreams faster.',
  reminderStatusLabel: 'Status',
  reminderPermissionLabel: 'Notifications',
  reminderEnabled: 'Enabled',
  reminderDisabled: 'Disabled',
  reminderPermissionAllowed: 'Allowed',
  reminderPermissionBlocked: 'Blocked',
  reminderEnableButton: 'Enable reminder',
  reminderDisableButton: 'Disable reminder',
  reminderTimeLabel: 'Reminder time',
  reminderPermissionDeniedTitle: 'Notifications disabled',
  reminderPermissionDeniedDescription:
    'Allow notifications in system settings to enable dream reminders.',
  reminderSaveErrorTitle: 'Reminder error',
  reminderStateHint:
    'Time is saved locally. If system notifications are blocked, the reminder stays off until permission is restored.',
  reminderNotificationTitle: 'Record your dream',
  reminderNotificationBody: 'Capture it while details are still fresh.',
  languageTitle: 'Language',
  languageDescription: 'Choose your app language.',
  languageEnglish: 'English',
  languageUkrainian: 'Українська',
  architectureTitle: 'Foundation status',
  architectureDescription:
    'Local-first data, feature-based structure, extracted styles, and an upcoming i18n layer.',
  plannedTitle: 'Planned controls',
  plannedDescription:
    'Notifications, privacy, export, AI preferences, and Health integrations should live here.',
};

const SETTINGS_COPY_UK: typeof SETTINGS_COPY_EN = {
  ...SETTINGS_COPY_EN,
  title: 'Налаштування',
  subtitle: 'Архітектура та керування продуктом будуть розширюватися тут.',
  versionTitle: 'Поточний реліз',
  reminderTitle: 'Нагадування про сон',
  reminderDescription:
    'Щоденне нагадування після пробудження, щоб швидко зафіксувати сон.',
  reminderStatusLabel: 'Статус',
  reminderPermissionLabel: 'Сповіщення',
  reminderEnabled: 'Увімкнено',
  reminderDisabled: 'Вимкнено',
  reminderPermissionAllowed: 'Дозволені',
  reminderPermissionBlocked: 'Заблоковані',
  reminderEnableButton: 'Увімкнути нагадування',
  reminderDisableButton: 'Вимкнути нагадування',
  reminderTimeLabel: 'Час нагадування',
  reminderPermissionDeniedTitle: 'Сповіщення вимкнені',
  reminderPermissionDeniedDescription:
    'Дозволь сповіщення в системних налаштуваннях, щоб увімкнути нагадування.',
  reminderSaveErrorTitle: 'Помилка нагадування',
  reminderStateHint:
    'Час зберігається локально. Якщо системні сповіщення заблоковані, нагадування лишається вимкненим, доки дозвіл не повернеться.',
  reminderNotificationTitle: 'Запиши свій сон',
  reminderNotificationBody: 'Зафіксуй його, поки деталі ще свіжі.',
  languageTitle: 'Мова',
  languageDescription: 'Обери мову застосунку.',
  architectureTitle: 'Стан фундаменту',
  architectureDescription:
    'Local-first дані, feature-структура, винесені стилі та базовий i18n-шар.',
  plannedTitle: 'Заплановані розділи',
  plannedDescription:
    'Сповіщення, приватність, експорт, AI-параметри та інтеграції зі Здоров’ям.',
};

export type SettingsCopy = typeof SETTINGS_COPY_EN;

export function getSettingsCopy(locale: AppLocale): SettingsCopy {
  return locale === 'uk' ? SETTINGS_COPY_UK : SETTINGS_COPY_EN;
}
