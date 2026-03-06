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
  privacyTitle: 'Privacy and storage',
  privacyDescription:
    'This MVP keeps dream data on your device and avoids account setup until the core journaling loop is stable.',
  privacyStorageLabel: 'Dream data',
  privacyStorageValue: 'Stored locally on device',
  privacySyncLabel: 'Cloud sync',
  privacySyncValue: 'Not enabled in v0.0.4',
  privacyAccountLabel: 'Account',
  privacyAccountValue: 'No sign-in required',
  privacyReminderLabel: 'Reminders',
  privacyReminderValue: 'Scheduled as local notifications',
  privacyFootnote:
    'If you delete the app, local entries and drafts may be removed with it until export or sync exists.',
  exportTitle: 'Local export',
  exportDescription:
    'Create a versioned JSON snapshot of your local archive so the data is portable before sync exists.',
  exportIncludesLabel: 'Includes',
  exportIncludesValue: 'Dreams, draft, locale, reminder settings, and export metadata',
  exportFormatLabel: 'Format',
  exportFormatValue: 'JSON v1',
  exportLatestPathLabel: 'Latest file',
  exportFootnote:
    'Import and share sheet are not included yet. For now, export creates a local file path you can access later.',
  exportButton: 'Export JSON',
  exportButtonBusy: 'Exporting...',
  exportSuccessTitle: 'Export created',
  exportSuccessDescription: 'A local JSON snapshot was written to:',
  exportErrorTitle: 'Export failed',
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
  privacyTitle: 'Приватність і зберігання',
  privacyDescription:
    'Цей MVP зберігає дані про сни на пристрої і не вимагає акаунта, доки базовий journaling loop ще стабілізується.',
  privacyStorageLabel: 'Дані про сни',
  privacyStorageValue: 'Зберігаються локально на пристрої',
  privacySyncLabel: 'Хмарна синхронізація',
  privacySyncValue: 'У v0.0.4 не ввімкнена',
  privacyAccountLabel: 'Акаунт',
  privacyAccountValue: 'Вхід не потрібен',
  privacyReminderLabel: 'Нагадування',
  privacyReminderValue: 'Працюють як локальні сповіщення',
  privacyFootnote:
    'Якщо видалити застосунок, локальні записи і чернетки можуть зникнути, доки не зʼявиться експорт або синхронізація.',
  exportTitle: 'Локальний експорт',
  exportDescription:
    'Створи versioned JSON snapshot локального архіву, щоб дані були переносимими ще до появи sync.',
  exportIncludesLabel: 'Що входить',
  exportIncludesValue: 'Сни, чернетка, мова, нагадування і metadata експорту',
  exportFormatLabel: 'Формат',
  exportFormatValue: 'JSON v1',
  exportLatestPathLabel: 'Останній файл',
  exportFootnote:
    'Імпорт і share sheet поки не додані. Наразі експорт створює локальний файл із шляхом, до якого можна повернутися.',
  exportButton: 'Експортувати JSON',
  exportButtonBusy: 'Експорт...',
  exportSuccessTitle: 'Експорт створено',
  exportSuccessDescription: 'Локальний JSON snapshot записано в:',
  exportErrorTitle: 'Помилка експорту',
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
