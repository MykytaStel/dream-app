import type { AppLocale } from '../../i18n/types';
import type {
  ArchiveHealthIssueCode,
  ArchiveHealthRepairMode,
  ArchiveHealthSeverity,
  ArchiveHealthStatus,
} from '../../features/settings/services/archiveHealthService';

type ArchiveHealthCopy = {
  title: string;
  subtitle: string;
  storageEntryTitle: string;
  storageEntryDescription: string;
  statusTitle: string;
  status: Record<ArchiveHealthStatus, string>;
  statusDescription: Record<ArchiveHealthStatus, string>;
  dreamsLabel: string;
  draftsLabel: string;
  editDraftsLabel: string;
  tombstonesLabel: string;
  issuesLabel: string;
  repairableLabel: string;
  scanAction: string;
  scanningAction: string;
  repairAction: string;
  repairingAction: string;
  repairConfirmTitle: string;
  repairConfirmDescription: string;
  repairCompletedTitle: string;
  repairCompletedDescription: string;
  repairNothingTitle: string;
  repairNothingDescription: string;
  repairBlockedTitle: string;
  repairBlockedDescription: string;
  repairFailedTitle: string;
  repairFailedDescription: string;
  checkpointTitle: string;
  checkpointDescription: string;
  checkpointShareAction: string;
  issuesTitle: string;
  issuesEmptyTitle: string;
  issuesEmptyDescription: string;
  historyTitle: string;
  historyEmpty: string;
  historyScan: string;
  historyRepair: string;
  historyIssues: string;
  historyRepaired: string;
  openBackupAction: string;
  openBackupDescription: string;
  loadingTitle: string;
  loadingDescription: string;
  retryAction: string;
  unknownError: string;
  severity: Record<ArchiveHealthSeverity, string>;
  repairMode: Record<ArchiveHealthRepairMode, string>;
  issue: Record<ArchiveHealthIssueCode, { title: string; description: string }>;
};

const EN: ArchiveHealthCopy = {
  title: 'Archive health and recovery',
  subtitle:
    'Check structural consistency before backup, restore, or cleanup. Safe repairs create a recovery checkpoint first.',
  storageEntryTitle: 'Archive health and recovery',
  storageEntryDescription:
    'Find broken references, stale operations, draft conflicts, and restore risks.',
  statusTitle: 'Current archive health',
  status: {
    healthy: 'Healthy',
    attention: 'Needs attention',
    critical: 'Critical',
  },
  statusDescription: {
    healthy: 'No structural issues were found in the local archive.',
    attention:
      'The archive is readable. Some issues can be repaired automatically after a checkpoint.',
    critical:
      'Automatic repair is blocked because at least one issue needs a restore file or manual decision.',
  },
  dreamsLabel: 'Dreams',
  draftsLabel: 'Create drafts',
  editDraftsLabel: 'Edit drafts',
  tombstonesLabel: 'Deletion records',
  issuesLabel: 'Issues',
  repairableLabel: 'Safe repairs',
  scanAction: 'Scan again',
  scanningAction: 'Scanning…',
  repairAction: 'Create checkpoint and repair',
  repairingAction: 'Repairing…',
  repairConfirmTitle: 'Repair safe archive issues?',
  repairConfirmDescription:
    'A JSON recovery checkpoint will be created before any local data changes. Critical issues are never repaired automatically.',
  repairCompletedTitle: 'Archive repair complete',
  repairCompletedDescription: 'Safely repaired {count} archive issues.',
  repairNothingTitle: 'Nothing to repair',
  repairNothingDescription: 'No automatic repairs are currently available.',
  repairBlockedTitle: 'Automatic repair blocked',
  repairBlockedDescription:
    'Resolve the critical issue with a valid restore file or a manual decision first.',
  repairFailedTitle: 'Archive repair failed',
  repairFailedDescription:
    'The previous archive state was restored. Review the latest scan before trying again.',
  checkpointTitle: 'Recovery checkpoint',
  checkpointDescription:
    'Created before the last repair. Keep it until you have checked the archive.',
  checkpointShareAction: 'Share checkpoint',
  issuesTitle: 'Detected issues',
  issuesEmptyTitle: 'No issues found',
  issuesEmptyDescription:
    'Dreams, drafts, audio references, and deletion records are structurally consistent.',
  historyTitle: 'Recent health activity',
  historyEmpty: 'No scans or repairs have been recorded yet.',
  historyScan: 'Scan',
  historyRepair: 'Repair',
  historyIssues: 'issues',
  historyRepaired: 'repaired',
  openBackupAction: 'Open backup and restore',
  openBackupDescription:
    'Critical archive problems are intentionally not guessed. Restore from a trusted checkpoint or backup.',
  loadingTitle: 'Checking archive health',
  loadingDescription:
    'Reading structure and file existence without sending dream content anywhere.',
  retryAction: 'Try again',
  unknownError: 'An unknown archive health error occurred.',
  severity: {
    info: 'Info',
    warning: 'Warning',
    critical: 'Critical',
  },
  repairMode: {
    automatic: 'Safe repair',
    manual: 'Manual decision',
    none: 'Restore required',
  },
  issue: {
    'newer-storage-schema': {
      title: 'Newer storage schema',
      description:
        'This archive was written by a newer app version. Opening it here could discard fields.',
    },
    'dream-store-unreadable': {
      title: 'Dream archive cannot be read',
      description:
        'The raw dream collection is not valid JSON. Automatic writes are blocked to avoid replacing it.',
    },
    'invalid-dream-record': {
      title: 'Invalid dream records',
      description:
        'One or more records are missing required identity, time, or saveable content.',
    },
    'duplicate-dream-id': {
      title: 'Duplicate dream IDs',
      description:
        'Two records claim the same identity. Choosing one automatically could discard the newer or fuller copy.',
    },
    'invalid-sleep-date': {
      title: 'Invalid sleep dates',
      description:
        'Dates that are not real calendar days can be rebuilt from the dream creation time.',
    },
    'stale-transcript-processing': {
      title: 'Stale transcription jobs',
      description:
        'Transcriptions marked as processing for too long can be reset to an error state and retried.',
    },
    'missing-dream-audio': {
      title: 'Missing optional dream audio',
      description:
        'The dream still has written content, so the broken local audio reference can be removed safely.',
    },
    'missing-audio-only-dream': {
      title: 'Audio-only dream file is missing',
      description:
        'Removing the reference would leave the dream without saveable content, so recovery needs a backup or manual decision.',
    },
    'draft-store-unreadable': {
      title: 'Create draft cannot be read',
      description:
        'The unfinished create draft is malformed. It is preserved until you decide whether to discard or restore it.',
    },
    'missing-draft-audio': {
      title: 'Create draft audio is missing',
      description:
        'The draft contains other work, so only its broken audio reference can be removed.',
    },
    'missing-audio-only-draft': {
      title: 'Audio-only create draft is missing',
      description:
        'The draft has no other recoverable content. Automatic repair would erase its last reference.',
    },
    'edit-draft-unreadable': {
      title: 'Edit draft cannot be read',
      description:
        'An unfinished edit is malformed and is preserved for manual recovery.',
    },
    'orphan-edit-draft': {
      title: 'Edit draft has no dream',
      description:
        'The dream was deleted, so the edit draft can no longer be resumed and can be removed safely.',
    },
    'missing-edit-draft-audio': {
      title: 'Edit draft audio is missing',
      description:
        'The draft contains other changes, so only its broken audio reference can be removed.',
    },
    'missing-audio-only-edit-draft': {
      title: 'Audio-only edit draft is missing',
      description:
        'The edit draft has no other recoverable content and needs a manual decision.',
    },
    'tombstone-store-unreadable': {
      title: 'Deletion records cannot be read',
      description:
        'Cloud deletion history is malformed. Automatic sync repair is blocked to avoid resurrecting or deleting dreams incorrectly.',
    },
    'tombstone-conflict': {
      title: 'Dream and deletion record conflict',
      description:
        'A current dream is also marked as deleted. The live dream wins and the conflicting deletion record can be removed.',
    },
    'duplicate-tombstone': {
      title: 'Duplicate deletion records',
      description:
        'Repeated records for the same dream can be reduced to one normalized entry.',
    },
  },
};

const UK: ArchiveHealthCopy = {
  ...EN,
  title: 'Стан архіву та відновлення',
  subtitle:
    'Перевіряйте цілісність перед backup, restore або очищенням. Безпечний ремонт спочатку створює recovery checkpoint.',
  storageEntryTitle: 'Стан архіву та відновлення',
  storageEntryDescription:
    'Знайдіть биті посилання, завислі операції, конфлікти чернеток і ризики відновлення.',
  statusTitle: 'Поточний стан архіву',
  status: {
    healthy: 'Справний',
    attention: 'Потребує уваги',
    critical: 'Критичний',
  },
  statusDescription: {
    healthy: 'Структурних проблем у локальному архіві не знайдено.',
    attention:
      'Архів читається. Частину проблем можна безпечно виправити після створення checkpoint.',
    critical:
      'Автоматичний ремонт заблокований: щонайменше одна проблема потребує restore-файла або ручного рішення.',
  },
  dreamsLabel: 'Сни',
  draftsLabel: 'Чернетки створення',
  editDraftsLabel: 'Чернетки редагування',
  tombstonesLabel: 'Записи видалення',
  issuesLabel: 'Проблеми',
  repairableLabel: 'Безпечні ремонти',
  scanAction: 'Сканувати знову',
  scanningAction: 'Сканую…',
  repairAction: 'Створити checkpoint і виправити',
  repairingAction: 'Виправляю…',
  repairConfirmTitle: 'Виправити безпечні проблеми архіву?',
  repairConfirmDescription:
    'Перед будь-якими змінами локальних даних буде створено JSON recovery checkpoint. Критичні проблеми ніколи не виправляються автоматично.',
  repairCompletedTitle: 'Ремонт архіву завершено',
  repairCompletedDescription: 'Безпечно виправлено проблем: {count}.',
  repairNothingTitle: 'Немає чого виправляти',
  repairNothingDescription: 'Зараз немає доступних автоматичних ремонтів.',
  repairBlockedTitle: 'Автоматичний ремонт заблокований',
  repairBlockedDescription:
    'Спочатку вирішіть критичну проблему через надійний restore-файл або вручну.',
  repairFailedTitle: 'Не вдалося виправити архів',
  repairFailedDescription:
    'Попередній стан архіву відновлено. Перегляньте останній scan перед повторною спробою.',
  checkpointTitle: 'Recovery checkpoint',
  checkpointDescription:
    'Створений перед останнім ремонтом. Зберігайте його, доки не перевірите архів.',
  checkpointShareAction: 'Поділитися checkpoint',
  issuesTitle: 'Знайдені проблеми',
  issuesEmptyTitle: 'Проблем не знайдено',
  issuesEmptyDescription:
    'Сни, чернетки, аудіопосилання та записи видалення структурно узгоджені.',
  historyTitle: 'Останні перевірки',
  historyEmpty: 'Сканувань або ремонтів ще не записано.',
  historyScan: 'Сканування',
  historyRepair: 'Ремонт',
  historyIssues: 'проблем',
  historyRepaired: 'виправлено',
  openBackupAction: 'Відкрити backup і restore',
  openBackupDescription:
    'Критичні проблеми навмисно не виправляються навмання. Відновіть архів із надійного checkpoint або backup.',
  loadingTitle: 'Перевіряю стан архіву',
  loadingDescription:
    'Перевіряю структуру та існування файлів, не надсилаючи вміст снів назовні.',
  retryAction: 'Спробувати ще раз',
  unknownError: 'Сталася невідома помилка перевірки архіву.',
  severity: {
    info: 'Інформація',
    warning: 'Попередження',
    critical: 'Критична',
  },
  repairMode: {
    automatic: 'Безпечний ремонт',
    manual: 'Ручне рішення',
    none: 'Потрібне відновлення',
  },
  issue: {
    'newer-storage-schema': {
      title: 'Новіша схема сховища',
      description:
        'Цей архів записаний новішою версією застосунку. Відкриття тут може втратити невідомі поля.',
    },
    'dream-store-unreadable': {
      title: 'Архів снів не читається',
      description:
        'Колекція снів не є коректним JSON. Запис заблоковано, щоб не замінити її порожнім архівом.',
    },
    'invalid-dream-record': {
      title: 'Некоректні записи снів',
      description:
        'Один або кілька записів не мають коректного ID, часу чи вмісту, який можна зберегти.',
    },
    'duplicate-dream-id': {
      title: 'Повторювані ID снів',
      description:
        'Два записи мають одну ідентичність. Автоматичний вибір може відкинути новішу або повнішу копію.',
    },
    'invalid-sleep-date': {
      title: 'Некоректні дати сну',
      description:
        'Нереальні календарні дати можна відновити з часу створення сну.',
    },
    'stale-transcript-processing': {
      title: 'Завислі транскрипції',
      description:
        'Транскрипції, які надто довго мають статус processing, можна перевести в error і повторити.',
    },
    'missing-dream-audio': {
      title: 'Відсутнє необов’язкове аудіо сну',
      description:
        'У сну є письмовий текст, тому бите локальне аудіопосилання можна безпечно прибрати.',
    },
    'missing-audio-only-dream': {
      title: 'Відсутній файл audio-only сну',
      description:
        'Видалення посилання залишить сон без вмісту. Потрібен backup або ручне рішення.',
    },
    'draft-store-unreadable': {
      title: 'Чернетка створення не читається',
      description:
        'Незавершена чернетка пошкоджена й збережена до ручного рішення.',
    },
    'missing-draft-audio': {
      title: 'Відсутнє аудіо чернетки створення',
      description:
        'У чернетці є інша робота, тому можна прибрати лише бите аудіопосилання.',
    },
    'missing-audio-only-draft': {
      title: 'Відсутня audio-only чернетка',
      description:
        'Іншого відновлюваного вмісту немає. Автоматичний ремонт прибере останнє посилання.',
    },
    'edit-draft-unreadable': {
      title: 'Чернетка редагування не читається',
      description:
        'Незавершене редагування пошкоджене й збережене для ручного відновлення.',
    },
    'orphan-edit-draft': {
      title: 'Чернетка редагування без сну',
      description:
        'Сон уже видалено, тому цю чернетку більше неможливо продовжити й можна безпечно прибрати.',
    },
    'missing-edit-draft-audio': {
      title: 'Відсутнє аудіо чернетки редагування',
      description:
        'У чернетці є інші зміни, тому можна прибрати лише бите аудіопосилання.',
    },
    'missing-audio-only-edit-draft': {
      title: 'Відсутня audio-only edit-чернетка',
      description:
        'Іншого відновлюваного вмісту немає, тому потрібне ручне рішення.',
    },
    'tombstone-store-unreadable': {
      title: 'Записи видалення не читаються',
      description:
        'Історія видалень для sync пошкоджена. Автоматичне виправлення заблоковано, щоб не воскресити або не видалити сон помилково.',
    },
    'tombstone-conflict': {
      title: 'Конфлікт сну та запису видалення',
      description:
        'Поточний сон одночасно позначений видаленим. Живий сон має пріоритет, а конфліктний запис можна прибрати.',
    },
    'duplicate-tombstone': {
      title: 'Повторювані записи видалення',
      description:
        'Кілька записів одного сну можна звести до одного нормалізованого запису.',
    },
  },
};

export function getArchiveHealthCopy(locale: AppLocale): ArchiveHealthCopy {
  return locale === 'uk' ? UK : EN;
}
