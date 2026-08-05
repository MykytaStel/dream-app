import { AppLocale } from '../../i18n/types';

const STORAGE_DIAGNOSTICS_COPY_EN = {
  hubTitle: 'Storage and maintenance',
  hubMeta: 'Recordings, transcription model, exports, and local data',
  title: 'Storage and maintenance',
  subtitle:
    'See what the app keeps on this device and remove only files that are safe to recreate or no longer linked to a dream.',
  totalKnownTitle: 'Known local storage',
  totalKnownDescription:
    'The total below includes recordings, the downloaded speech model, generated exports, and an estimate of local metadata.',
  incompleteTotalNote:
    'Some categories could not be measured, so the visible total is a minimum.',
  refreshedLabel: 'Updated',
  refreshAction: 'Refresh usage',
  loadingTitle: 'Reading local storage',
  loadingDescription: 'Counting app-owned files without opening dream content.',
  loadErrorTitle: 'Storage details unavailable',
  retryAction: 'Try again',
  unavailableValue: 'Unavailable',
  notInstalledValue: 'Not installed',
  filesLabel: 'Files',
  sizeLabel: 'Size',
  audioTitle: 'Voice recordings',
  audioDescription:
    'Recordings referenced by saved dreams or drafts remain protected. Unlinked files are files no current owner points to.',
  audioProtectedLabel: 'Protected',
  audioUnlinkedLabel: 'Unlinked',
  audioMaintenanceEligibleLabel: 'Old enough for scheduled cleanup',
  audioOwnershipIncomplete:
    'Ownership could not be read completely. Cleanup is disabled until every dream and draft can be checked.',
  audioCleanupAction: 'Remove unlinked recordings',
  audioCleanupConfirmTitle: 'Remove unlinked recordings?',
  audioCleanupConfirmDescription:
    'Only app-owned recordings that are not referenced by any saved dream, create draft, edit draft, or active recording will be removed. This cannot be undone.',
  audioCleanupSuccessTitle: 'Audio cleanup complete',
  audioCleanupSuccessDescription: 'Removed {count} unlinked recording files.',
  audioCleanupNothingDescription: 'No unlinked recording files were removed.',
  audioCleanupDeferredDescription:
    'Cleanup was deferred because recording is active. Stop recording and try again.',
  audioCleanupBlockedDescription:
    'Cleanup stayed disabled because ownership could not be read completely.',
  audioCleanupErrorDescription: 'The recording cleanup could not be completed.',
  transcriptionTitle: 'Offline transcription model',
  transcriptionDescription:
    'The speech model can be downloaded again later. Removing it does not remove transcripts already saved in dreams.',
  transcriptionDeleteAction: 'Delete model',
  transcriptionDeleteConfirmTitle: 'Delete transcription model?',
  transcriptionDeleteConfirmDescription:
    'Voice-to-text will need to download the model again before the next transcription.',
  transcriptionDeleteSuccessTitle: 'Model deleted',
  transcriptionDeleteSuccessDescription:
    'Saved transcripts remain available. The model can be downloaded again from Analysis and transcription.',
  exportsTitle: 'Generated exports',
  exportsDescription:
    'Backup, Markdown, text, and PDF files created by the app stay in its export directory until you remove them.',
  exportsDeleteAction: 'Delete generated exports',
  exportsDeleteConfirmTitle: 'Delete generated exports?',
  exportsDeleteConfirmDescription:
    'This removes files still stored in the app export directory. Copies already shared or saved elsewhere are unaffected.',
  exportsDeleteSuccessTitle: 'Exports deleted',
  exportsDeleteSuccessDescription: 'Removed {count} generated export files.',
  exportsDeletePartialDescription:
    'Removed {count} generated export files; {failed} could not be deleted.',
  exportsDeleteNothingDescription:
    'There were no generated export files to remove.',
  localDataTitle: 'Dream data and settings',
  localDataDescription:
    'Dreams, drafts, transcripts, settings, and sync metadata live in the local key-value store. The size shown is an estimate of serialized keys and values, not the database file on disk.',
  localDataKeysLabel: 'Stored keys',
  noDeleteNote:
    'This screen never bulk-deletes dream data. Use archive actions or restore workflows when changing the dream collection.',
  actionCancel: 'Cancel',
  actionDelete: 'Delete',
  actionRemove: 'Remove',
  unknownError: 'An unknown storage error occurred.',
};

const STORAGE_DIAGNOSTICS_COPY_UK: typeof STORAGE_DIAGNOSTICS_COPY_EN = {
  ...STORAGE_DIAGNOSTICS_COPY_EN,
  hubTitle: 'Сховище й обслуговування',
  hubMeta: 'Записи, модель транскрипції, експорти та локальні дані',
  title: 'Сховище й обслуговування',
  subtitle:
    'Перегляньте, що застосунок зберігає на цьому пристрої, та видаляйте лише файли, які можна відновити або які більше не прив’язані до сну.',
  totalKnownTitle: 'Відомий локальний обсяг',
  totalKnownDescription:
    'Сума включає аудіозаписи, завантажену модель мовлення, створені експорти та оцінку локальних метаданих.',
  incompleteTotalNote:
    'Деякі категорії не вдалося виміряти, тому показана сума є мінімальною.',
  refreshedLabel: 'Оновлено',
  refreshAction: 'Оновити дані',
  loadingTitle: 'Читаю локальне сховище',
  loadingDescription: 'Підраховую файли застосунку, не відкриваючи вміст снів.',
  loadErrorTitle: 'Дані сховища недоступні',
  retryAction: 'Спробувати ще раз',
  unavailableValue: 'Недоступно',
  notInstalledValue: 'Не встановлено',
  filesLabel: 'Файли',
  sizeLabel: 'Обсяг',
  audioTitle: 'Голосові записи',
  audioDescription:
    'Записи, прив’язані до збережених снів або чернеток, залишаються захищеними. Неприв’язані файли — це файли, на які не вказує жоден поточний власник.',
  audioProtectedLabel: 'Захищені',
  audioUnlinkedLabel: 'Неприв’язані',
  audioMaintenanceEligibleLabel: 'Достатньо старі для планового очищення',
  audioOwnershipIncomplete:
    'Не вдалося повністю прочитати власників. Очищення вимкнене, доки не будуть перевірені всі сни й чернетки.',
  audioCleanupAction: 'Видалити неприв’язані записи',
  audioCleanupConfirmTitle: 'Видалити неприв’язані записи?',
  audioCleanupConfirmDescription:
    'Буде видалено лише файли застосунку, які не належать збереженому сну, чернетці створення, чернетці редагування чи активному запису. Дію не можна скасувати.',
  audioCleanupSuccessTitle: 'Очищення аудіо завершено',
  audioCleanupSuccessDescription:
    'Видалено неприв’язаних аудіофайлів: {count}.',
  audioCleanupNothingDescription:
    'Неприв’язаних аудіофайлів для видалення немає.',
  audioCleanupDeferredDescription:
    'Очищення відкладено, бо зараз триває запис. Зупиніть його та повторіть спробу.',
  audioCleanupBlockedDescription:
    'Очищення не виконано, бо власників не вдалося прочитати повністю.',
  audioCleanupErrorDescription: 'Не вдалося завершити очищення записів.',
  transcriptionTitle: 'Офлайн-модель транскрипції',
  transcriptionDescription:
    'Модель мовлення можна завантажити повторно. Її видалення не прибирає вже збережені транскрипти.',
  transcriptionDeleteAction: 'Видалити модель',
  transcriptionDeleteConfirmTitle: 'Видалити модель транскрипції?',
  transcriptionDeleteConfirmDescription:
    'Перед наступною транскрипцією застосунку доведеться знову завантажити модель.',
  transcriptionDeleteSuccessTitle: 'Модель видалено',
  transcriptionDeleteSuccessDescription:
    'Збережені транскрипти залишилися. Модель можна повторно завантажити в розділі аналізу й транскрипції.',
  exportsTitle: 'Створені експорти',
  exportsDescription:
    'Backup-, Markdown-, текстові та PDF-файли залишаються в каталозі експорту застосунку, доки ви їх не видалите.',
  exportsDeleteAction: 'Видалити створені експорти',
  exportsDeleteConfirmTitle: 'Видалити створені експорти?',
  exportsDeleteConfirmDescription:
    'Буде видалено файли, які ще зберігаються в каталозі експорту застосунку. Копії, уже надіслані або збережені в іншому місці, не зміняться.',
  exportsDeleteSuccessTitle: 'Експорти видалено',
  exportsDeleteSuccessDescription: 'Видалено файлів експорту: {count}.',
  exportsDeletePartialDescription:
    'Видалено файлів експорту: {count}; не вдалося видалити: {failed}.',
  exportsDeleteNothingDescription:
    'Створених файлів експорту для видалення немає.',
  localDataTitle: 'Дані снів і налаштування',
  localDataDescription:
    'Сни, чернетки, транскрипти, налаштування та sync-метадані зберігаються в локальному key-value сховищі. Показаний обсяг — оцінка серіалізованих ключів і значень, а не розмір файла бази на диску.',
  localDataKeysLabel: 'Збережені ключі',
  noDeleteNote:
    'Цей екран ніколи не видаляє всі дані снів. Для зміни колекції використовуйте дії архіву або відновлення.',
  actionCancel: 'Скасувати',
  actionDelete: 'Видалити',
  actionRemove: 'Прибрати',
  unknownError: 'Сталася невідома помилка сховища.',
};

export function getStorageDiagnosticsCopy(locale: AppLocale) {
  return locale === 'uk'
    ? STORAGE_DIAGNOSTICS_COPY_UK
    : STORAGE_DIAGNOSTICS_COPY_EN;
}
