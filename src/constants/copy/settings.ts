import { AppLocale } from '../../i18n/types';

const SETTINGS_COPY_EN = {
  title: 'Settings',
  subtitle: 'Architecture and product controls will grow here.',
  versionTitle: 'Current release',
  versionValue: 'v0.0.2',
  reminderTitle: 'Dream reminder',
  reminderDescription:
    'Schedule one daily reminder after waking so you can record dreams faster.',
  reminderStatusLabel: 'Status',
  reminderEnabled: 'Enabled',
  reminderDisabled: 'Disabled',
  reminderEnableButton: 'Enable reminder',
  reminderDisableButton: 'Disable reminder',
  reminderTimeLabel: 'Reminder time',
  reminderPermissionDeniedTitle: 'Notifications disabled',
  reminderPermissionDeniedDescription:
    'Allow notifications in system settings to enable dream reminders.',
  reminderSaveErrorTitle: 'Reminder error',
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
  reminderEnabled: 'Увімкнено',
  reminderDisabled: 'Вимкнено',
  reminderEnableButton: 'Увімкнути нагадування',
  reminderDisableButton: 'Вимкнути нагадування',
  reminderTimeLabel: 'Час нагадування',
  reminderPermissionDeniedTitle: 'Сповіщення вимкнені',
  reminderPermissionDeniedDescription:
    'Дозволь сповіщення в системних налаштуваннях, щоб увімкнути нагадування.',
  reminderSaveErrorTitle: 'Помилка нагадування',
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
