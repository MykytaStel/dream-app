import { SETTINGS_COPY_EN, type SettingsCopy } from './en';

export const SETTINGS_COPY_UK: SettingsCopy = {
  ...SETTINGS_COPY_EN,
  title: 'Налаштування',
  subtitle:
    'Локальні керування нагадуваннями, приватністю, копіями й аналізом.',
  toggleShow: 'Показати',
  toggleHide: 'Сховати',
  hubAppearanceTitle: 'Вигляд і мова',
  hubAppearanceMeta: 'Палітра та мова, якою говорить застосунок',
  hubRemindersTitle: 'Нагадування',
  hubRemindersMeta: 'Коли питати тебе про минулу ніч',
  hubRemindersOff: 'Вимкнено',
  hubBackupTitle: 'Копії та синхронізація',
  hubSecurityTitle: 'Приватність і замок',
  hubSecurityMeta: 'Де живуть сни й хто може їх відкрити',
  hubSecurityLocked: 'Із замком',
  hubSecurityUnlocked: 'Без замка',
  hubAnalysisTitle: 'Аналіз і транскрипція',
  hubAnalysisMeta: 'Читання патернів і перетворення голосу на текст',
  hubAboutTitle: 'Про застосунок',
  hubAboutMeta: 'Версія, сховище та експорт',
  footerBuildLabel: 'Kaleidoskop',
  footerStorageMetaPrefix: 'Схема',
  footerExportMetaPrefix: 'Експорт',
  reminderTitle: 'Нагадування про сон',
  reminderDescription:
    'Одне щоденне нагадування після пробудження, щоб швидше фіксувати сни.',
  reminderPermissionLabel: 'Сповіщення',
  reminderPermissionBlocked: 'Заблоковані',
  reminderCurrentScheduleLabel: 'Поточний розклад',
  reminderEnableHint: 'Увімкни, щоб вибрати щоденний час нагадування.',
  reminderOffValue: 'Вимкнено',
  reminderTimeLabel: 'Час нагадування',
  reminderTimeHint: 'Натисни, щоб змінити.',
  reminderSmartSuggestionLabel: 'На основі твоїх патернів запису',
  reminderSmartSuggestionApply: 'Встановити на',
  reminderStyleTitle: 'Стиль нагадування',
  reminderStyleDescription:
    'Змінює лише тон. Час і доставка лишаються тими самими.',
  reminderStyleBalancedLabel: 'Спокійний',
  reminderStyleBalancedDescription: 'Чітко й нейтрально.',
  reminderStyleGentleLabel: 'М’який',
  reminderStyleGentleDescription: 'М’якше й більш рефлексивно.',
  reminderStyleDirectLabel: 'Прямий',
  reminderStyleDirectDescription: 'Коротко й більш терміново.',
  reminderStylePreviewLabel: 'Попередній перегляд сповіщення',
  reminderStyleFootnote:
    'Можна вибрати тон заздалегідь, навіть якщо нагадування вимкнені.',
  reminderPreviewWakeAction: 'Переглянути ранковий режим',
  reminderPreviewWakeMeta:
    'Відкрий екран після нагадування без очікування наступного сповіщення.',
  devPreviewMonthlyReport: 'Переглянути місячний звіт',
  devPreviewBackupOnboarding: 'Переглянути backup onboarding',
  devPreviewBackupOnboardingMeta:
    'Відкрий preview одноразового modal і скинь його seen state.',
  devPreviewSyncDiagnostics: 'Переглянути sync diagnostics',
  devPreviewSyncDiagnosticsMeta:
    'Відкрий debug-only екран з останнім sync snapshot і недавніми sync спробами.',
  actionCancel: 'Скасувати',
  reminderPermissionDeniedTitle: 'Сповіщення вимкнені',
  reminderPermissionDeniedDescription:
    'Дозволь сповіщення в системних налаштуваннях, щоб увімкнути нагадування.',
  reminderSaveErrorTitle: 'Помилка нагадування',
  reminderNotificationTitle: 'Запиши свій сон',
  reminderNotificationBody: 'Зафіксуй його, поки деталі ще свіжі.',
  reminderStyleGentleNotificationTitle: 'Втримай сон поруч',
  reminderStyleGentleNotificationBody:
    'Кілька спокійних слів зараз допоможуть зберегти відчуття, поки день не розігнався.',
  reminderStyleDirectNotificationTitle: 'Запиши це зараз',
  reminderStyleDirectNotificationBody:
    'Схопи головні образи, поки вони не вислизнули.',
  languageTitle: 'Мова',
  languageDescription: 'Обери мову застосунку.',
  languageEnglish: 'EN',
  languageUkrainian: 'UA',
  calmModeTitle: 'Спокійний режим',
  calmModeHint:
    'Ховає пояснення під заголовками й полями. Значення, лічильники та помилки лишаються.',
  nightCaptureTitle: 'Нічний запис',
  nightCaptureHint:
    'Між 22:00 і 07:00 екран запису стає теплим і темним — незалежно від обраної теми.',
  themeTitle: 'Оформлення',
  themeDescription: 'Обери палітру, яка використовується в усьому застосунку.',
  themeFootnote:
    'Kaleido зберігає поточний вигляд застосунку як тему за замовчуванням.',
  themeOptionKaleido: 'Kaleido',
  themeOptionEmber: 'Ember',
  themeOptionMoss: 'Moss',
  themeOptionDaylight: 'Денне',
  privacyTitle: 'Приватність і зберігання',
  privacyDescription:
    'Дані про сни лишаються на пристрої за замовчуванням. Хмара лишається опційною і не блокує перший запис.',
  privacyStorageLabel: 'Дані про сни',
  privacyStorageValue: 'Лише на цьому пристрої',
  privacyReminderLabel: 'Нагадування',
  privacyReminderValue: 'Локальні сповіщення',
  privacyFootnote:
    'Якщо видалити застосунок, локальні записи, завантажена модель транскрипції і чернетки можуть зникнути, доки не зʼявиться експорт або синхронізація.',
  privacyOpenAction: 'Як ми поводимось з даними',
  privacyScreenTitle: 'Ваші дані',
  privacyScreenIntro:
    'Ваші сни зберігаються на цьому пристрої. Нікуди нічого не надсилається, доки ви самі не ввімкнете відповідну функцію, а кожна з них вимкнена від початку.',
  privacyLocalTitle: 'Лишається на пристрої',
  privacyLocalBody:
    'Текст снів, заголовки, теги, настрої, голосові записи й розшифровки. Патерни, серії та статистика теж обчислюються тут, а не на сервері.',
  privacyLeavesTitle: 'Що може вийти назовні та коли',
  privacyCloudTitle: 'Хмарна копія, якщо ви її ввімкнете',
  privacyCloudBody:
    'Вивантажує текст снів, розшифровки й записи, зашифровані на цьому пристрої ключем, якого сервер ніколи не отримує. Сервер бачить, скільки у вас снів і коли ви востаннє щось змінювали, — і нічого про їхній зміст. Ключ переїжджає на ваші інші пристрої через iCloud Keychain або резервну копію Android, а код відновлення є в цих налаштуваннях, якщо він знадобиться.',
  privacyCrashTitle: 'Звіти про збої, у складаннях із цією опцією',
  privacyCrashBody:
    'Надсилає помилку, версію застосунку й екран, який був відкритий. Текст снів, заголовки, розшифровки, теги та ваша особа вирізаються до надсилання.',
  privacyAnalyticsTitle: 'Підрахунки використання',
  privacyAnalyticsBody:
    'Підрахунки того, які екрани й дії використовуються, щоб покращувати застосунок там, де він справді підводить. Ніколи не ваші сни, розшифровки, заголовки, теги, символи, пошуки чи настрої — подія пошуку несе лише довжину запиту й кількість результатів, а не те, що ви ввели. Не пов’язано з вашим акаунтом.',
  privacyAnalyticsToggleLabel: 'Ділитися підрахунками',
  privacyModelTitle: 'Модель розпізнавання, один раз',
  privacyModelBody:
    'Розшифровка працює на цьому пристрої, але модель завантажується під час першого використання. Той запит не містить даних про сни. Далі розшифровка працює офлайн.',
  privacyLockTitle: 'Замок',
  privacyLockBody:
    'Біометрію перевіряє система; застосунок дізнається лише, чи її прийнято. Замок ховає екрани — він не шифрує збережені файли.',
  privacyDeleteTitle: 'Як видалити все',
  privacyDeleteBody:
    'Видалення застосунку прибирає все, що зберігається тут, разом із записами й чернетками. Спершу зробіть експорт, якщо хочете зберегти. Те, що вже вивантажено, лишається, доки ви не видалите ті сни з увімкненою копією.',
  privacyNoAccountNote:
    'Немає ані облікового запису, ані профілю, ані аналітики. Офлайн застосунок повноцінний.',
  archiveKeyTitle: 'Ключ до вашого архіву',
  archiveKeyDescription:
    'Ваші сни шифруються перед вивантаженням. Це ключ, який їх відкриває.',
  archiveKeyTravelsIcloud:
    'iCloud Keychain переносить його на ваші інші пристрої Apple. Робити нічого не треба.',
  archiveKeyTravelsAndroid:
    'Резервна копія Google переносить його на ваш наступний пристрій Android. Робити нічого не треба.',
  archiveKeyStranded:
    'Резервне копіювання вимкнене, тож ключ нікуди не поїде сам. Збережи код відновлення — інакше архів відкриватиметься лише тут.',
  archiveKeyMissingForArchive:
    'Архів у хмарі зашифрований іншим ключем. Введи його код відновлення, щоб прочитати архів тут. На цьому телефоні нічого не змінилося.',
  archiveKeyNotYetCreated:
    'Ключ створюється під час першої синхронізації. Доти зберігати нічого.',
  archiveKeyRevealAction: 'Показати код відновлення',
  archiveKeyHideAction: 'Сховати код відновлення',
  archiveKeyCodeIntro:
    'Двадцять чотири слова, саме в такому порядку. Це і є ключ — хто має ці слова, той прочитає ваш архів. Вони потрібні лише для переходу між iPhone та Android або для відновлення телефона без резервної копії.',
  archiveKeyEntryLabel: 'Код відновлення',
  archiveKeyEntryPlaceholder: 'Вставте або введіть двадцять чотири слова',
  archiveKeyEntryAction: 'Використати цей код',
  archiveKeyEntryInvalid:
    'Код неповний. Перевір, чи не пропущене або не переплутане слово — у коді є контрольна сума, тож це видно.',
  archiveKeyEntryAccepted:
    'Ключ прийнято. Синхронізуйте ще раз, щоб прочитати архів.',
  archiveKeyStrandedDisclosureTitle:
    'Цей ключ не може сам покинути цей телефон',
  archiveKeyStrandedDisclosureAction: 'Зрозуміло',
  cloudTitle: 'Хмарний backup',
  cloudDescription: 'Опційний sync одного архіву між пристроями.',
  cloudConfigLabel: 'Runtime-конфіг',
  cloudConfigReady: 'Готово',
  cloudConfigMissing: 'Відсутній',
  cloudConfigUrlLabel: 'Supabase URL',
  cloudConfigUrlHint: 'URL проєкту, зазвичай *.supabase.co.',
  cloudConfigAnonKeyLabel: 'Anon key',
  cloudConfigAnonKeyHint: 'Публічний anon key для mobile-клієнта.',
  cloudSessionLabel: 'Резервна копія',
  cloudSessionSignedOut: 'Вимкнено',
  cloudSessionSignedIn: 'Увімкнено',
  cloudAccountLabel: 'Акаунт',
  cloudAccountDisconnected: 'Ще не привʼязано',
  cloudAccountAnonymous: 'Потрібен email-акаунт',
  cloudPathTitle: 'Що тобі потрібно на цьому пристрої?',
  cloudPathDescription:
    'Обери, чи це пристрій, на якому backup починається, чи той, що має відкрити вже існуючий архів.',
  cloudPathThisDevice: 'Почати тут',
  cloudPathAnotherDevice: 'Відкрити існуючий',
  cloudFirstDeviceTitle: 'Почати backup на цьому пристрої',
  cloudFirstDeviceDescription:
    'Спершу створи backup на цьому пристрої, а потім збережи його під email-акаунтом, якщо хочеш відкрити той самий архів на іншому пристрої.',
  cloudGuideTitle: 'Як працює backup',
  cloudGuideStepOne: 'Увімкни backup на своєму першому пристрої.',
  cloudGuideStepTwo:
    'Збережи його під email-акаунтом, якщо хочеш той самий архів на іншому пристрої.',
  cloudGuideStepThree:
    'Відкрий той самий backup на іншому пристрої й запусти sync.',
  cloudGuideExistingStepOne:
    'Введи ту саму пошту і пароль, які вже використовуються для цього backup.',
  cloudGuideExistingStepTwo:
    'Відкрий цей архів на пристрої й дай sync підтягнути останні зміни.',
  cloudGuideExistingStepThree:
    'Тримай sync увімкненим, щоб редагування і видалення ходили між пристроями.',
  cloudGuideAnonymousStepOne: 'Цей пристрій уже підключений до backup.',
  cloudGuideAnonymousStepTwo: 'Тепер збережи цей backup під email-акаунтом.',
  cloudGuideAnonymousStepThree:
    'Після цього відкрий той самий backup на іншому пристрої.',
  cloudGuideNamedStepOne: 'Цей backup уже привʼязаний до твого акаунта.',
  cloudGuideNamedStepTwo:
    'Відкрий той самий backup з цією поштою на іншому пристрої.',
  cloudGuideNamedStepThree:
    'Тримай sync увімкненим, щоб зміни ходили між пристроями.',
  cloudSuccessTitle: 'Що далі',
  cloudConnectedSuccessTitle: 'Backup увімкнено на цьому пристрої',
  cloudConnectedSuccessDescription:
    'Тепер збережи цей backup під email-акаунтом, якщо хочеш відкрити той самий архів на іншому пристрої.',
  cloudSignedInSuccessTitle: 'Існуючий backup відкрито',
  cloudSignedInSuccessDescription:
    'Цей пристрій уже підключений до твого backup. Тепер запусти sync, щоб підтягнути останні зміни архіву.',
  cloudUpgradedSuccessTitle: 'Backup-акаунт збережено',
  cloudUpgradedSuccessDescription:
    'Тепер цей backup привʼязаний до твоєї пошти. Відкрий той самий backup на іншому пристрої з цими даними.',
  cloudResetSuccessTitle: 'Перевір пошту',
  cloudResetSuccessDescription:
    'Відкрий посилання зі листа для скидання пароля, а потім повернись сюди й увійди з новим паролем.',
  backupCueOpenAction: 'Відкрити backup',
  backupCueConnectTitle: 'Збережи цей архів у backup',
  backupCueConnectDescription:
    'Зроби архів доступним на іншому пристрої, поки локальних змін не стало більше.',
  backupCueSyncOffTitle: 'Backup підключено, але sync вимкнений',
  backupCueSyncOffDescription:
    'Увімкни sync знову перед переходом на інший пристрій, щоб нові локальні зміни не лишилися тут.',
  backupCueReviewPendingTitle:
    'Збережені набори ревʼю новіші на цьому пристрої',
  backupCueReviewPendingDescription:
    'Збережені місяці й нитки змінилися локально. Відкрий backup і запусти sync перед переходом на інший пристрій.',
  backupOnboardingEyebrow: 'Архів уже почався',
  backupOnboardingDismissAction: 'Закрити',
  backupOnboardingTitle: 'У тебе вже є сни, які варто зберегти',
  backupOnboardingDescription:
    'Після кількох записів backup уже має сенс. Збережи цей архів, поки він не лишився прив’язаним до одного пристрою.',
  backupOnboardingDreamsLabel: 'Збережених снів',
  backupOnboardingThresholdLabel: 'Поріг показу',
  backupOnboardingValueTitle: 'Чому саме зараз',
  backupOnboardingValueDescription:
    'Backup тримає архів придатним до відновлення і робить saved review sets корисними між пристроями, коли вони починають накопичуватись.',
  backupOnboardingPrimaryAction: 'Відкрити backup',
  backupOnboardingLaterAction: 'Пізніше',
  backupOnboardingPreviewTitle: 'Preview backup onboarding',
  backupOnboardingPreviewDescription:
    'Перевір одноразовий backup prompt без очікування нового акаунта.',
  backupOnboardingPreviewSeenTitle: 'Стан показу',
  backupOnboardingPreviewSeenValue: 'Вже показано',
  backupOnboardingPreviewUnseenValue: 'Ще не показано',
  backupOnboardingPreviewEligibilityTitle: 'Умова показу в продакшені',
  backupOnboardingPreviewEligibilityReady: 'На Home уже відкрився б.',
  backupOnboardingPreviewEligibilityWaiting:
    'Потрібно 3 збережені сни і unseen state.',
  backupOnboardingPreviewEligibilityReadyValue: 'Готово',
  backupOnboardingPreviewEligibilityWaitingValue: 'Очікує',
  backupOnboardingPreviewOpenAction: 'Відкрити modal preview',
  backupOnboardingPreviewResetAction: 'Скинути seen state',
  backupOnboardingPreviewMarkSeenAction: 'Позначити як показаний',
  backupOnboardingPreviewFootnote:
    'У production цей modal відкривається один раз після 3 збережених снів.',
  reminderOnboardingEyebrow: 'Формуй звичку',
  reminderOnboardingTitle: 'Нагадування записати сон',
  reminderOnboardingDescription:
    'М’яке нагадування перед звичним часом пробудження — ніколи не вимагає, і його легко вимкнути.',
  reminderOnboardingPrimaryAction: 'Увімкнути нагадування',
  reminderOnboardingLaterAction: 'Не зараз',
  backupScreenTitle: 'Backup і sync',
  backupScreenSubtitle:
    'Restore-backup повертає дані в застосунок. Markdown, text і PDF потрібні для читання або перенесення деінде. Хмарний backup лишається опційним.',
  backupSummaryDescription:
    'Тут живуть restore-файли, Markdown/text-експорт, PDF і опційний хмарний backup.',
  backupSummaryOpenTitle: 'Відкрити простір backup',
  backupLocalSectionTitle: 'Локальні файли',
  backupLocalSectionDescription:
    'Створи restore-backup, читабельний Markdown або text-експорт, відновися з backup або експортуй PDF.',
  backupCloudSectionTitle: 'Хмарний backup',
  backupCloudSectionDescription: 'Опційний sync одного архіву між пристроями.',
  backupStatusTitle: 'Деталі статусу',
  backupStatusDescription:
    'Відкривай лише коли треба перевірити sync-стан або що лишилось тільки локально.',
  backupStatusToggleTitle: 'Статус cloud sync і локальних даних',
  backupStatusToggleMetaCollapsed:
    'Сховано за замовчуванням, щоб екран лишався сфокусованим на backup, restore і PDF.',
  backupStatusToggleMetaExpanded:
    'Показує недавній sync-стан, останній restore-backup і що ще є лише на цьому пристрої.',
  backupFlowGuideTitle: 'Обери правильний файл',
  backupFlowGuideDescription:
    'Кожна дія створює або використовує інший тип файла.',
  backupFlowBackupTitle: 'Експорт backup',
  backupFlowBackupMeta:
    'Створює JSON-файл для відновлення в цьому застосунку. Його можна використати пізніше в Локальному відновленні або зберегти деінде.',
  backupFlowBackupValue: 'Файл для restore',
  backupFlowPortableTitle: 'Експорт у Markdown / текст',
  backupFlowPortableMeta:
    'Створює читабельні .md або .txt файли зі стабільною структурою і метаданими снів. Це не restore-файли.',
  backupFlowPortableValue: 'Портативний файл',
  backupFlowPdfTitle: 'Експорт PDF',
  backupFlowPdfMeta:
    'Створює читабельний знімок для читання або поширення. Це не файл для відновлення.',
  backupFlowPdfValue: 'Файл для читання',
  backupFlowRestoreTitle: 'Відновлення',
  backupFlowRestoreMeta:
    'Застосовує backup-експорт на цьому пристрої після preview. PDF тут ніколи не зʼявляється.',
  backupFlowRestoreValue: 'Застосовує backup',
  backupTimelineTitle: 'Активність хмарного sync',
  backupTimelineDescription:
    'Подивись на останній хмарний sync, останній restore-backup і стан цього пристрою.',
  backupTimelineSyncTitle: 'Останній успішний синк',
  backupTimelineSnapshotTitle: 'Останній restore-backup',
  backupTimelineDeviceTitle: 'Цей пристрій',
  backupTimelineDeviceFreshnessLabel: 'Найсвіжіша локальна зміна',
  backupTimelineSnapshotMissing: 'Restore-backup ще немає',
  backupTimelineSnapshotMissingMeta:
    'Створи restore-backup один раз, і тут з’явиться найновіший preview.',
  backupTimelineDeviceLocalOnly: 'Лише локально',
  backupTimelineDeviceNeedsAttention: 'Потрібна увага',
  backupTimelineDeviceAheadSingle: 'На 1 зміну попереду',
  backupTimelineDeviceAheadPlural: 'На {count} змін попереду',
  backupTimelineDeviceReviewAhead: 'Набори ревʼю попереду',
  backupTimelineDeviceCaughtUp: 'Актуально',
  backupTimelineDeviceWaitingFirstSync: 'Чекає на перший синк',
  backupTimelineDeviceNoLocalChanges: 'Локальних змін ще немає',
  backupTimelineReviewSetsLabel: 'Набори ревʼю',
  backupTimelineReviewSetsPending: 'Набори ревʼю чекають на синк',
  backupContentTrustTitle: 'Що ще є лише на цьому пристрої',
  backupContentTrustDescription:
    'Ці числа показують, що ще не дійшло до хмарного backup. Локальні backup-файли й PDF рахуються окремо.',
  backupContentTrustAudioTitle: 'Голосові нотатки',
  backupContentTrustAudioMeta: '{total} збережено • {synced} уже в хмарі',
  backupContentTrustAudioEmpty: 'Ще немає голосових нотаток',
  backupContentTrustAudioEmptyMeta:
    'Статус аудіо з’явиться тут, щойно якийсь сон матиме голосову нотатку.',
  backupContentTrustAudioAllBackedUp: 'Є в хмарному backup',
  backupContentTrustAudioStillLocalSingle: '1 ще локально',
  backupContentTrustAudioStillLocalPlural: '{count} ще локально',
  backupContentTrustTranscriptTitle: 'Збережені транскрипти',
  backupContentTrustTranscriptMeta:
    '{total} збережено • {edited} відредаговано',
  backupContentTrustTranscriptEmpty: 'Ще немає збережених транскриптів',
  backupContentTrustTranscriptEmptyMeta:
    'Статус транскриптів з’явиться тут, щойно якийсь сон матиме збережений текст транскрипту.',
  backupContentTrustTranscriptCaughtUp: 'Актуально в хмарі',
  backupContentTrustTranscriptStillLocalSingle: '1 новіший локально',
  backupContentTrustTranscriptStillLocalPlural: '{count} новіші локально',
  backupContentTrustReviewTitle: 'Збережені набори ревʼю',
  backupContentTrustReviewMeta:
    '{total} збережено • {months} місяців • {threads} ниток',
  backupContentTrustReviewEmpty: 'Ще немає збережених наборів',
  backupContentTrustReviewEmptyMeta:
    'Збережені місяці й нитки зʼявляться тут, щойно ти почнеш збирати ревʼю-набори.',
  backupContentTrustReviewCaughtUp: 'Актуально в хмарі',
  backupContentTrustReviewStillLocal: 'Новіше локально',
  backupContentTrustLocalOnly: 'Лише локально',
  cloudExistingBackupTitle: 'Відкрити існуючий backup',
  cloudSaveBackupTitle: 'Зберегти цей backup',
  cloudIdentityTitle: 'Іменний акаунт',
  cloudIdentityDescriptionSignedOut:
    'Увійди з тією ж поштою і паролем на іншому пристрої, щоб відкрити той самий архів.',
  cloudIdentityDescriptionAnonymous:
    'Збережи цей backup під email-акаунтом, щоб інший пристрій міг відкрити його.',
  cloudIdentityEmailLabel: 'Email',
  cloudIdentityEmailHint:
    'Використовується для того самого хмарного акаунта на різних пристроях.',
  cloudIdentityPasswordLabel: 'Пароль',
  cloudIdentityPasswordHint: 'Використай щонайменше 6 символів.',
  cloudCredentialsMissingTitle: 'Немає даних для входу',
  cloudCredentialsMissingDescription:
    'Введи email і пароль перед продовженням.',
  cloudEmailMissingTitle: 'Немає email',
  cloudEmailMissingDescription: 'Спершу введи email для backup-акаунта.',
  cloudSyncToggleLabel: 'Автосинк',
  cloudSyncToggleHint:
    'Автосинк можна увімкнути лише після підключення backup.',
  cloudSyncDisabled: 'Вимкнено',
  cloudSyncEnabled: 'Увімкнено',
  cloudPendingLabel: 'У черзі',
  cloudSyncedLabel: 'Синхронізовано',
  cloudPulledLabel: 'Підтягнуто',
  cloudSkippedLabel: 'Пропущено',
  cloudConflictsLabel: 'Конфлікти',
  cloudLocalWinsLabel: 'Переміг локальний стан',
  cloudRemoteWinsLabel: 'Переміг remote стан',
  cloudErrorsLabel: 'Помилки',
  cloudSaveConfigButton: 'Зберегти конфіг',
  cloudClearConfigButton: 'Очистити конфіг',
  cloudConnectButton: 'Увімкнути backup',
  cloudConnectButtonBusy: 'Підключення...',
  cloudSignInExistingButton: 'Відкрити існуючий backup',
  cloudSignInExistingButtonBusy: 'Вхід...',
  cloudResetPasswordButton: 'Надіслати лист для скидання',
  cloudResetPasswordButtonBusy: 'Надсилаємо лист...',
  cloudUpgradeAccountButton: 'Зберегти backup-акаунт',
  cloudUpgradeAccountButtonBusy: 'Збереження акаунта...',
  cloudDisconnectButton: 'Вимкнути backup',
  cloudDisconnectButtonBusy: 'Відключення...',
  cloudSyncNowButton: 'Синхронізувати',
  cloudSyncNowButtonBusy: 'Синхронізація...',
  cloudLastSyncLabel: 'Останній синк',
  cloudLastSyncNever: 'Ще не було',
  cloudSyncStateIdle: 'Очікує',
  cloudSyncStateSyncing: 'Синхронізація',
  cloudSyncStateSuccess: 'Синхронізовано',
  cloudSyncStateError: 'Потрібна увага',
  cloudSyncManualErrorTitle: 'Помилка синхронізації backup',
  cloudConfigMissingTitle: 'Немає Supabase-конфігу',
  cloudConfigMissingDescription:
    'Додай валідний URL проєкту та anon key перед підключенням хмари.',
  cloudConfigErrorTitle: 'Помилка cloud-конфігу',
  cloudConnectErrorTitle: 'Не вдалося підключити backup',
  cloudAccountSignInErrorTitle: 'Не вдалося увійти в акаунт',
  cloudPasswordResetErrorTitle: 'Не вдалося надіслати лист для скидання',
  cloudPasswordResetSuccessTitle: 'Лист для скидання надіслано',
  cloudPasswordResetSuccessDescription:
    'Якщо такий backup-акаунт існує, перевір пошту й відкрий посилання для скидання пароля.',
  cloudAccountUpgradeErrorTitle: 'Не вдалося оновити акаунт',
  cloudDisconnectErrorTitle: 'Не вдалося вимкнути backup',
  cloudFootnote:
    'Хмарний backup це опційний sync між підключеними пристроями. Restore-backup і PDF це окремі файли, і застосунок не додає їм end-to-end encryption.',
  backupExportTitle: 'Експорт backup',
  backupExportDescription:
    'Створи JSON-файл backup для відновлення на цьому або іншому пристрої.',
  backupExportFootnote:
    'Backup-експорт це звичайний файл. Будь-хто з доступом до файла може його прочитати або імпортувати. Застосунок не шифрує цей файл.',
  portableExportTitle: 'Markdown і text-експорт',
  portableExportDescription:
    'Створи читабельний файл Markdown або plain text для portability. Це не restore-backup.',
  portableExportFootnote:
    'Markdown і text-експорт це звичайні файли для читання, збереження або імпорту деінде. Вони окремі від restore-backup і PDF.',
  pdfExportTitle: 'Експорт PDF',
  pdfExportDescription:
    'Створи читабельний PDF для довідки, друку або поширення. Його не можна відновити назад у застосунок.',
  pdfExportFootnote:
    'PDF-експорт це звичайний файл для читання або поширення. Застосунок не шифрує цей файл.',
  exportTitle: 'Локальний експорт',
  exportDescription:
    'Створи backup для відновлення або читабельний PDF-знімок.',
  exportLatestPathLabel: 'Останній файл',
  exportFootnote:
    'Backup потрібен для відновлення пізніше. PDF підходить для читання або поширення.',
  exportButton: 'Створити backup',
  exportButtonBusy: 'Створення backup...',
  exportMarkdownButton: 'Створити Markdown',
  exportMarkdownButtonBusy: 'Створення Markdown...',
  exportPdfButton: 'Створити PDF',
  exportPdfButtonBusy: 'Створення PDF...',
  exportTextButton: 'Створити text',
  exportTextButtonBusy: 'Створення text...',
  exportOpenMarkdownButton: 'Відкрити Markdown',
  exportOpenPdfButton: 'Відкрити PDF',
  exportOpenTextButton: 'Відкрити text',
  exportShareBackupButton: 'Поширити backup',
  exportShareMarkdownButton: 'Поширити Markdown',
  exportSharePdfButton: 'Поширити PDF',
  exportShareTextButton: 'Поширити text',
  exportBackupReadyTitle: 'Backup готовий',
  exportBackupReadyDescription:
    'Пізніше його можна використати в Локальному відновленні або поширити й зберегти деінде.',
  exportMarkdownReadyTitle: 'Markdown-експорт готовий',
  exportMarkdownReadyDescription:
    'Відкрий його зараз для читання або пошир, щоб зберегти portable-копію зі стабільною структурою.',
  exportPdfReadyTitle: 'PDF-знімок готовий',
  exportPdfReadyDescription:
    'Відкрий його зараз для читання або пошир, коли захочеш кудись надіслати.',
  exportTextReadyTitle: 'Text-експорт готовий',
  exportTextReadyDescription:
    'Відкрий його зараз для читання або пошир, щоб зберегти plain-text копію будь-де.',
  exportPdfOpenErrorTitle: 'Не вдалося відкрити PDF',
  exportPdfOpenErrorDescription:
    'На цьому пристрої файл не відкрився. Скористайся Поширити PDF.',
  exportReadableOpenErrorTitle: 'Не вдалося відкрити експорт',
  exportReadableOpenErrorDescription:
    'На цьому пристрої файл не відкрився. Скористайся Поширити.',
  exportErrorTitle: 'Помилка експорту',
  exportPdfErrorTitle: 'Помилка PDF-експорту',
  restoreTitle: 'Локальне відновлення',
  restoreDescription:
    'Обери backup-експорт, переглянь його і віднови на цьому пристрої. PDF відновити не можна.',
  restoreAvailableLabel: 'Доступні restore-backup',
  restoreLoading: 'Завантаження restore-backup...',
  restoreEmptyTitle: 'Restore-backup ще немає',
  restoreEmptyDescription:
    'Спершу створи backup-експорт, і він з’явиться тут для preview та відновлення.',
  restorePreviewTitle: 'Preview відновлення',
  restoreSelectedValue: 'Вибрано',
  restoreModeLabel: 'Режим',
  restoreModeReplace: 'Замінити',
  restoreModeMerge: 'Об’єднати',
  restoreModeReplaceHint:
    'Замінити локальні сни, чернетку, мову, нагадування й налаштування аналізу.',
  restoreModeMergeHint:
    'Додати сни з копії, лишити поточні налаштування і взяти чернетку з копії лише якщо локальна порожня.',
  restoreNoBackupAction: 'Спершу створи restore-backup',
  restoreSelectBackupAction: 'Спершу обери restore-backup',
  restoreLoadingAction: 'Готуємо preview відновлення...',
  restoreReplaceWarning:
    'Replace перезапише локальний архів на цьому пристрої.',
  restoreMergeGuidance:
    'Merge лишає поточні налаштування й додає сни з backup.',
  restoreFileLabel: 'Файл',
  restoreVersionLabel: 'Копія',
  restoreLocaleLabel: 'Мова',
  restoreDreamCountLabel: 'Снів',
  restoreCurrentCountLabel: 'Зараз',
  restoreIncomingCountLabel: 'З копії',
  restoreNewCountLabel: 'Нових',
  restoreResultCountLabel: 'Результат',
  restoreOverlapCountLabel: 'Збігів',
  restoreDraftLabel: 'Чернетка',
  restoreDraftPresent: 'Є',
  restoreDraftMissing: 'Немає',
  restoreSettingsLabel: 'Налаштування',
  restoreSettingsReplace: 'Налаштування з копії замінять локальні',
  restoreSettingsKeepCurrent: 'Поточні налаштування лишаться як є',
  restoreDraftActionLabel: 'Чернетка',
  restoreDraftActionReplace: 'Чернетка з копії замінить локальну',
  restoreDraftActionImportIfEmpty:
    'Чернетка з копії імпортується, лише якщо локальна порожня',
  restoreExportedAtLabel: 'Експортовано',
  restoreAppVersionLabel: 'Застосунок',
  restoreRestoreButton: 'Замінити цією копією',
  restoreMergeButton: 'Об’єднати з цієї копії',
  restoreRestoreButtonBusy: 'Відновлення...',
  restoreConfirmTitle: 'Замінити локальні дані?',
  restoreConfirmDescription:
    'Це замінить сни, чернетку, мову, налаштування нагадувань і налаштування аналізу вибраною копією.',
  restoreMergeConfirmTitle: 'Об’єднати копію з локальними даними?',
  restoreMergeConfirmDescription:
    'Це додасть сни з копії у поточний архів, лишить поточні налаштування і імпортує чернетку з копії лише якщо локальна порожня.',
  restoreSuccessTitle: 'Копію відновлено',
  restoreSuccessDescription: 'Локальні дані замінено з:',
  restoreSuccessModeLabel: 'Застосований режим',
  restoreSuccessCountLabel: 'Снів тепер на пристрої',
  restoreErrorTitle: 'Помилка відновлення',
  transcriptionTitle: 'Офлайн-транскрипція',
  transcriptionDescription:
    'Транскрибуй голосові нотатки локально після одного завантаження моделі.',
  transcriptionStatusLabel: 'Модель',
  transcriptionStatusInstalled: 'Завантажена',
  transcriptionStatusMissing: 'Ще не завантажена',
  transcriptionSizeLabel: 'Розмір',
  transcriptionPathLabel: 'Локальний файл',
  transcriptionDownloadButton: 'Завантажити офлайн-модель',
  transcriptionDownloadButtonBusy: 'Завантаження моделі...',
  transcriptionDownloadSuccessTitle: 'Модель готова',
  transcriptionDownloadSuccessDescription:
    'Офлайн-модель транскрипції тепер збережена локально на цьому пристрої.',
  transcriptionDownloadErrorTitle: 'Не вдалося завантажити модель',
  transcriptionDeleteButton: 'Видалити локальну модель',
  transcriptionDeleteButtonBusy: 'Видалення моделі...',
  transcriptionMissingHint:
    'Завантаж модель один раз, щоб увімкнути офлайн-транскрипцію.',
  transcriptionDeleteSuccessTitle: 'Модель видалено',
  transcriptionDeleteSuccessDescription:
    'Офлайн-модель транскрипції видалено з локального сховища.',
  transcriptionDeleteErrorTitle: 'Не вдалося видалити модель',
  scaleTestTitle: 'Перевірка масштабу',
  scaleTestDescription: 'Згенеруй тестові сни для stress test.',
  developerToolsTitle: 'Інструменти розробника',
  developerToolsDescription:
    'Інструменти лише для debug: preview, seed data і stress test.',
  devSyncHistoryTitle: 'Останні sync спроби',
  devSyncHistoryDescription:
    'Історія лише для debug з останніми результатами cloud sync на цьому пристрої.',
  devSyncReasonManual: 'Вручну',
  devSyncReasonLaunch: 'При запуску',
  devSyncSnapshotTitle: 'Останній sync snapshot',
  devSyncSnapshotDescription:
    'Debug-only перегляд останнього збереженого результату sync на цьому пристрої.',
  devSyncSnapshotStatusTitle: 'Статус',
  devSyncSnapshotReasonTitle: 'Причина',
  devSyncSnapshotPendingTitle: 'Зміни у черзі',
  devSyncSnapshotPendingDreamsTitle: 'Сни у черзі',
  devSyncSnapshotPendingDeletesTitle: 'Видалення у черзі',
  devSyncSnapshotPendingReviewTitle: 'Набори ревʼю у черзі',
  devSyncSnapshotUploadsTitle: 'Відправлено',
  devSyncSnapshotPullsTitle: 'Отримано',
  devSyncSnapshotConflictsTitle: 'Конфлікти',
  devSyncSnapshotErrorsTitle: 'Остання помилка',
  devSyncHistoryEmptyTitle: 'Ще не було sync спроб',
  devSyncHistoryEmptyDescription:
    'Запусти backup sync один раз, і тут зʼявиться debug history.',
  scaleTestSeededLabel: 'Тестових снів',
  scaleTestAdd250: 'Додати 250',
  scaleTestAdd1000: 'Додати 1000',
  scaleTestClear: 'Очистити тести',
  scaleTestBusy: 'Працюю...',
  scaleTestClearTitle: 'Очистити тестові сни?',
  scaleTestClearDescription:
    'Це видалить лише згенеровані тестові сни. Твої власні записи лишаться.',
  scaleTestSeededTitle: 'Тестові сни готові',
  scaleTestSeededDescription:
    'Архів заповнено згенерованими снами для перевірки масштабу.',
  scaleTestErrorTitle: 'Не вдалося підготувати тестові сни',
  biometricLockTitle: 'Блокування застосунку',
  biometricLockDescription:
    'Вимагати Face ID, Touch ID або відбиток пальця під час відкриття застосунку.',
  biometricLockEnabledValue: 'Увімкнено',
  biometricLockDisabledValue: 'Вимкнено',
  biometricLockNotSupportedValue: 'Не підтримується',
  biometricLockNotEnrolledValue: 'Не налаштовано',
  biometricLockPrompt: 'Розблокуй Kaleidoscope',
  biometricLockUnlockLabel: 'Розблокувати',
  biometricLockScreenSubtitle: 'Твої сни захищені.',
  biometricLockAppName: 'Kaleidoscope',
  biometricLockEnableErrorTitle: 'Не вдалося увімкнути блокування',
  biometricLockEnableErrorUnsupported:
    'Цей пристрій не підтримує біометричну автентифікацію.',
  biometricLockEnableErrorNotEnrolled:
    'На цьому пристрої не налаштовано біометрію. Спочатку увімкни Face ID або відбиток у системних налаштуваннях.',
  biometricLockEnableErrorFailed:
    'Біометрична перевірка не пройшла. Блокування не увімкнено.',
  biometricOnboardingEyebrow: 'Захисти приватність',
  biometricOnboardingTitle: 'Додай блокування для своїх снів',
  biometricOnboardingDescription:
    'Face ID, Touch ID або відбиток пальця приховають записи від чужих очей — вимкнути можна будь-коли.',
  biometricOnboardingPrimaryAction: 'Увімкнути блокування',
  biometricOnboardingLaterAction: 'Не зараз',
  analysisTitle: 'Аналіз сну',
  analysisDescription: 'Генеруй локальну рефлексію зі збережених даних сну.',
  analysisProviderLabel: 'Провайдер',
  analysisProviderManual: 'Локальний',
  analysisProviderOpenAi: 'OpenAI (заплановано)',
  analysisNetworkLabel: 'Мережа',
  analysisNetworkAllowed: 'Дозволена',
  analysisNetworkBlocked: 'Заблокована',
  analysisLocalNetworkHint: 'Локальний аналіз не потребує доступу до мережі.',
};
