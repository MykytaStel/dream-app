import type { AppLocale } from '../../i18n/types';

const EN = {
  hubTitle: 'Archive health',
  hubMeta: 'Check references, drafts, transcripts, and derived indexes',
  title: 'Archive health',
  subtitle:
    'Run a local integrity check without sending dream content anywhere. Repairs create a restore backup first.',
  statusHealthy: 'Healthy',
  statusAttention: 'Needs attention',
  statusBlocked: 'Repair blocked',
  statusDescriptionHealthy:
    'No integrity problems were found in the current local archive.',
  statusDescriptionAttention:
    'The archive is readable, but some references or derived data can be repaired.',
  statusDescriptionBlocked:
    'The archive contains a condition that must not be changed automatically.',
  dreamsLabel: 'Dreams checked',
  audioLabel: 'Audio references',
  issuesLabel: 'Issues',
  checkedLabel: 'Checked',
  runCheckAction: 'Run check again',
  repairAction: 'Back up and repair',
  repairingAction: 'Creating backup and repairing…',
  loadingTitle: 'Checking archive integrity',
  loadingDescription:
    'Reading structure and file references without opening dream text in the interface.',
  issueSectionTitle: 'Findings',
  issueArchiveUnreadableTitle: 'Dream archive cannot be read',
  issueArchiveUnreadableBody:
    'Automatic repair is disabled because writing could replace unreadable stored data. Use restore or inspect the backup source first.',
  issueDuplicateDreamIdTitle: 'Duplicate dream identifiers',
  issueDuplicateDreamIdBody:
    'Two records identify as the same dream. Choosing which one wins requires review, so automatic repair stays disabled.',
  issueMissingAudioTitle: 'Missing recording files',
  issueMissingAudioBody:
    'Some dreams still point to local recordings that no longer exist. Repair removes only the broken local references; transcripts remain.',
  issueStaleTranscriptTitle: 'Stale transcription state',
  issueStaleTranscriptBody:
    'Some dreams still say transcription is processing after the operation can no longer be active. Repair normalizes those states.',
  issueDerivedIndexMissingTitle: 'Dream list index is missing',
  issueDerivedIndexMissingBody:
    'The main archive is intact. Repair rebuilds the faster list representation.',
  issueDerivedIndexInvalidTitle: 'Dream list index is invalid',
  issueDerivedIndexInvalidBody:
    'The derived list cannot be parsed. Repair rebuilds it from the main archive.',
  issueDerivedMetaMissingTitle: 'Archive summary is missing',
  issueDerivedMetaMissingBody:
    'Counts and month summaries will be rebuilt from the main archive.',
  issueDerivedMetaInvalidTitle: 'Archive summary is invalid',
  issueDerivedMetaInvalidBody:
    'The derived summary cannot be parsed. Repair rebuilds it from the main archive.',
  issueOrphanEditDraftTitle: 'Edit drafts without a dream',
  issueOrphanEditDraftBody:
    'Some edit drafts refer to dreams that no longer exist. Repair removes only those orphan draft records.',
  issueUnreadableEditDraftTitle: 'Unreadable edit draft',
  issueUnreadableEditDraftBody:
    'An unfinished edit cannot be parsed. Automatic deletion is blocked because it may contain unsaved work.',
  countTemplate: '{count} found',
  noIssuesTitle: 'No findings',
  noIssuesBody: 'The archive, local audio references, drafts, and derived data agree.',
  repairConfirmTitle: 'Create backup and repair?',
  repairConfirmDescription:
    'A restore backup will be created first. Repair can rebuild derived data, remove orphan edit drafts, normalize stale states, and detach missing local audio references.',
  repairConfirmAction: 'Back up and repair',
  repairSuccessTitle: 'Archive repaired',
  repairSuccessDescription:
    'Applied {actions} repair groups, detached {audio} missing audio references, and removed {drafts} orphan drafts.',
  repairBackupLabel: 'Restore backup',
  repairBlockedTitle: 'Repair not started',
  repairBlockedArchiveChanged:
    'The archive changed after the check. Run the check again before repairing.',
  repairBlockedUnreadable:
    'Automatic repair is disabled while stored data cannot be read safely.',
  repairBlockedDuplicate:
    'Duplicate identifiers require manual review or restore from a known backup.',
  repairFailedBackup:
    'The restore backup could not be created, so no repair was attempted.',
  repairFailedGeneric:
    'Repair did not complete. The backup created before the operation remains available.',
  actionCancel: 'Cancel',
  unknownError: 'Archive health check failed.',
  privacyNote:
    'Diagnostics events include counts and status only. Dream text, titles, transcripts, filenames, and audio paths are not sent.',
};

type Copy = { [K in keyof typeof EN]: string };

const UK: Copy = {
  hubTitle: 'Стан архіву',
  hubMeta: 'Перевірка посилань, чернеток, транскриптів та індексів',
  title: 'Стан архіву',
  subtitle:
    'Локальна перевірка цілісності без надсилання вмісту снів. Перед виправленням створюється backup для відновлення.',
  statusHealthy: 'Усе гаразд',
  statusAttention: 'Потрібна увага',
  statusBlocked: 'Виправлення заблоковане',
  statusDescriptionHealthy:
    'У поточному локальному архіві не знайдено проблем цілісності.',
  statusDescriptionAttention:
    'Архів читається, але деякі посилання або похідні дані можна виправити.',
  statusDescriptionBlocked:
    'Знайдено стан, який не можна безпечно змінювати автоматично.',
  dreamsLabel: 'Перевірено снів',
  audioLabel: 'Аудіопосилання',
  issuesLabel: 'Проблеми',
  checkedLabel: 'Перевірено',
  runCheckAction: 'Перевірити ще раз',
  repairAction: 'Створити backup і виправити',
  repairingAction: 'Створюю backup і виправляю…',
  loadingTitle: 'Перевіряю цілісність архіву',
  loadingDescription:
    'Читаю структуру та файлові посилання, не показуючи текст снів у цьому інтерфейсі.',
  issueSectionTitle: 'Знайдені проблеми',
  issueArchiveUnreadableTitle: 'Архів снів не читається',
  issueArchiveUnreadableBody:
    'Автоматичне виправлення вимкнене, бо запис може перезаписати пошкоджені дані. Спочатку використайте відновлення або перевірте джерело backup.',
  issueDuplicateDreamIdTitle: 'Однакові ідентифікатори снів',
  issueDuplicateDreamIdBody:
    'Два записи мають один ідентифікатор. Вибір правильного запису потребує перевірки, тому автоматичне виправлення вимкнене.',
  issueMissingAudioTitle: 'Відсутні файли записів',
  issueMissingAudioBody:
    'Деякі сни посилаються на локальні записи, яких уже немає. Виправлення прибере лише зламані локальні посилання; транскрипти залишаться.',
  issueStaleTranscriptTitle: 'Застарілий стан транскрипції',
  issueStaleTranscriptBody:
    'Деякі сни досі позначені як такі, що транскрибуються, хоча операція вже не може тривати. Виправлення нормалізує ці стани.',
  issueDerivedIndexMissingTitle: 'Відсутній індекс списку снів',
  issueDerivedIndexMissingBody:
    'Основний архів цілий. Виправлення відбудує швидке представлення списку.',
  issueDerivedIndexInvalidTitle: 'Індекс списку снів пошкоджений',
  issueDerivedIndexInvalidBody:
    'Похідний список не читається. Виправлення відбудує його з основного архіву.',
  issueDerivedMetaMissingTitle: 'Відсутній підсумок архіву',
  issueDerivedMetaMissingBody:
    'Лічильники та підсумки за місяцями будуть відбудовані з основного архіву.',
  issueDerivedMetaInvalidTitle: 'Підсумок архіву пошкоджений',
  issueDerivedMetaInvalidBody:
    'Похідний підсумок не читається. Виправлення відбудує його з основного архіву.',
  issueOrphanEditDraftTitle: 'Чернетки редагування без сну',
  issueOrphanEditDraftBody:
    'Деякі чернетки редагування належать снам, яких уже немає. Виправлення видалить лише ці осиротілі записи.',
  issueUnreadableEditDraftTitle: 'Чернетка редагування не читається',
  issueUnreadableEditDraftBody:
    'Незавершене редагування не вдалося прочитати. Автоматичне видалення заблоковане, бо там можуть бути незбережені зміни.',
  countTemplate: 'Знайдено: {count}',
  noIssuesTitle: 'Проблем не знайдено',
  noIssuesBody:
    'Архів, локальні аудіопосилання, чернетки та похідні дані узгоджені.',
  repairConfirmTitle: 'Створити backup і виправити?',
  repairConfirmDescription:
    'Спочатку буде створено backup для відновлення. Потім можна відбудувати похідні дані, видалити осиротілі edit-чернетки, нормалізувати застарілі стани та прибрати відсутні локальні аудіопосилання.',
  repairConfirmAction: 'Backup і виправлення',
  repairSuccessTitle: 'Архів виправлено',
  repairSuccessDescription:
    'Застосовано груп виправлень: {actions}; прибрано відсутніх аудіопосилань: {audio}; видалено осиротілих чернеток: {drafts}.',
  repairBackupLabel: 'Backup для відновлення',
  repairBlockedTitle: 'Виправлення не розпочато',
  repairBlockedArchiveChanged:
    'Після перевірки архів змінився. Запустіть перевірку ще раз перед виправленням.',
  repairBlockedUnreadable:
    'Автоматичне виправлення вимкнене, доки збережені дані не читаються безпечно.',
  repairBlockedDuplicate:
    'Однакові ідентифікатори потребують ручної перевірки або відновлення з відомого backup.',
  repairFailedBackup:
    'Не вдалося створити backup для відновлення, тому виправлення не запускалося.',
  repairFailedGeneric:
    'Виправлення не завершилося. Backup, створений перед операцією, залишається доступним.',
  actionCancel: 'Скасувати',
  unknownError: 'Не вдалося перевірити стан архіву.',
  privacyNote:
    'Діагностичні події містять лише лічильники та статус. Текст, назви, транскрипти, імена файлів і шляхи аудіо не надсилаються.',
};

export function getArchiveHealthCopy(locale: AppLocale) {
  return locale === 'uk' ? UK : EN;
}
