import { AppLocale } from '../../i18n/types';

const PRACTICE_COPY_EN = {
  title: 'Dream practice',
  subtitle: 'Lucid training and nightmare support in one calmer place.',
  lucidTab: 'Lucid',
  nightmareTab: 'Nightmares',
  lucidHeroTitle: 'Train awareness gently',
  lucidHeroDescription:
    'Keep recall first, notice dream signs, and use reminders without pushing sleep too hard.',
  nightmareHeroTitle: 'Track and soften nightmares',
  nightmareHeroDescription:
    'Capture quickly, ground after waking, and rewrite recurring scenes when you are ready.',
  openLucid: 'Lucid practice',
  openNightmares: 'Nightmare support',
  openPractice: 'Open practice',
  morningCaptureTitle: 'Morning capture',
  realityChecksTitle: 'Reality checks',
  eveningIntentionTitle: 'Evening intention',
  wbtbTitle: 'WBTB',
  reminderOn: 'On',
  reminderOff: 'Off',
  reminderEnable: 'Enable',
  reminderDisable: 'Disable',
  reminderTimeLabel: 'Time',
  reminderSafeHint: 'Support awareness, not force results.',
  quickActionsTitle: 'Quick actions',
  planTitle: 'What to do',
  doNowTitle: 'Right now',
  tonightTitle: 'Tonight',
  ifAwareTitle: 'If you become aware',
  ifNightmareWakeTitle: 'If a nightmare wakes you',
  progressTitle: 'Progress',
  gentleRulesTitle: 'Keep it gentle',
  gentleRulesBody:
    'The goal is steadier awareness and safer sleep, not forcing results. Skip WBTB when you are already tired.',
  lucidNowOne: 'Capture dreams first. Recall is the base layer for lucid practice.',
  lucidNowTwo: 'Save one or two dream signs that keep repeating.',
  lucidNowThree: 'Use reality checks only during the day, not in bed.',
  lucidTonightOne: 'Set one calm intention before sleep.',
  lucidTonightTwo: 'Pick one dream sign to notice tonight.',
  lucidTonightThree: 'Leave WBTB optional and use it only if sleep feels stable.',
  lucidAwareOne: 'Pause and confirm that you are dreaming.',
  lucidAwareTwo: 'Stabilize first: hands, touch, breathing, or voice.',
  lucidAwareThree: 'Try one small control action instead of forcing the whole scene.',
  nightmareNowOne: 'Ground first. Light, breath, water, or naming the room.',
  nightmareNowTwo: 'Write only the key image or feeling if you are still shaky.',
  nightmareNowThree: 'Mark if it was recurring or highly distressing.',
  nightmareTonightOne: 'Rewrite the ending while fully awake.',
  nightmareTonightTwo: 'Keep the new version short, safe, and believable.',
  nightmareTonightThree: 'Notice stress, late caffeine, alcohol, and repeated cues before sleep.',
  nightmareWakeOne: 'Turn on a light and orient to the room.',
  nightmareWakeTwo: 'Slow the body before analysis.',
  nightmareWakeThree: 'Record the nightmare after you feel more settled.',
  lucidProgressHint: 'More aware dreams usually start with better recall and clearer dream signs.',
  nightmareProgressHint:
    'Progress means less distress, fewer repeats, and safer wake-ups, not perfect nights.',
  quickRecordDream: 'Record dream',
  quickWakeCapture: 'Wake capture',
  quickNightmareRewrite: 'Rewrite ending',
  quickGrounding: 'Ground now',
  quickRealityCheck: 'Mark reality check',
  beginnerPathTitle: 'Beginner path',
  beginnerPathRecall: 'Capture fast after waking',
  beginnerPathSigns: 'Notice recurring dream signs',
  beginnerPathChecks: 'Use reality checks in daytime only',
  beginnerPathMild: 'Set a light intention before sleep',
  beginnerPathWbtb: 'Use WBTB sparingly and only when rested',
  dailyChecklistTitle: 'Today',
  checklistCapture: 'Captured a dream today',
  checklistSigns: 'Saved a dream sign',
  checklistRealityChecks: 'Reality checks are active',
  checklistRewrite: 'A rewrite is in progress',
  lucidStatsTitle: 'Lucid signals',
  lucidStatsAware: 'Aware dreams',
  lucidStatsControlled: 'Controlled dreams',
  lucidStatsTopTechnique: 'Top technique',
  lucidStatsDreamSigns: 'Dream signs',
  lucidStatsNoTechnique: 'No technique logged yet',
  nightmareStatsTitle: 'Nightmare signals',
  nightmareStatsRecurring: 'Recurring',
  nightmareStatsHighDistress: 'High distress',
  nightmareStatsRescripted: 'Rewritten',
  nightmarePatternsTitle: 'Before bad nights',
  nightmarePatternsDescription:
    'Stress, pre-sleep emotion, late caffeine, and recurring cues that show up before heavier nights.',
  nightmareGroundingTitle: 'Grounding after waking',
  nightmareGroundingBody:
    'Turn on a light, name the room, slow your breath, and write what happened once you feel oriented.',
  nightmareEscalationTitle: 'When to get extra help',
  nightmareEscalationBody:
    'If nightmares become frequent, highly distressing, or make you avoid sleep, consider reaching out to a clinician or therapist.',
  nightmareRewritePrompt: 'Draft a calmer ending while awake',
  reminderNotificationMorningTitle: 'Catch the dream before it fades',
  reminderNotificationMorningBody: 'Record a few lines while the memory is still near.',
  reminderNotificationRealityTitle: 'Reality check',
  reminderNotificationRealityBody: 'Pause, look twice, and notice what feels off or stable.',
  reminderNotificationEveningTitle: 'Set tonight’s intention',
  reminderNotificationEveningBody: 'Pick one dream sign or one calm intention before sleep.',
  reminderNotificationWbtbTitle: 'Optional WBTB window',
  reminderNotificationWbtbBody: 'Only use this if you feel rested enough to go back to sleep well.',
  focusLucidHint: 'Lucid signs are forming',
  focusNightmareHint: 'Nightmare patterns need a softer pass',
  filterLucid: 'Lucid',
  filterNightmare: 'Nightmare',
  filterRecurringNightmare: 'Recurring nightmare',
  filterControl: 'Control',
  filterHighDistress: 'High distress',
  homeLucidCtaTitle: 'Practice lucidity',
  homeLucidCtaHint: 'Recall, dream signs, and awareness for tonight.',
  homeNightmareCtaTitle: 'After a nightmare',
  homeNightmareCtaHint: 'Ground, log lightly, and rewrite when ready.',
  statsLucidProgressTitle: 'Lucid progress',
  statsLucidProgressDescription:
    'Track the path from recall to awareness, stabilization, and control.',
  statsNightmareRecoveryTitle: 'Nightmare recovery',
  statsNightmareRecoveryDescription:
    'Watch for less distress, fewer repeats, and calmer wake-ups over time.',
  remindersTitle: 'Reminders',
  lucidDreamSignsLabel: 'Dream signs',
  lucidDreamSignsPlaceholder: 'doorway, false awakening, mirror',
  lucidTriggerLabel: 'Trigger of awareness',
  lucidTriggerPlaceholder: 'What made you realize it was a dream?',
  lucidRecallLabel: 'Recall quality',
  lucidStabilizationLabel: 'Stabilization',
  nightmareRecurringPlaceholder: 'hallway / falling / intruder',
  nightmareWokeLabel: 'Woke from the dream',
  nightmareAftereffectsLabel: 'After waking',
  nightmareGroundingLabel: 'Grounding used',
  nightmareRewriteStatusLabel: 'Rewrite status',
  archiveSpecialFiltersLabel: 'Lucid / nightmare',
  sourceReminder: 'Reminder',
};

type PracticeCopy = typeof PRACTICE_COPY_EN;

const PRACTICE_COPY_UK: PracticeCopy = {
  title: 'Практика снів',
  subtitle: 'Усвідомленість і підтримка при кошмарах в одному спокійному місці.',
  lucidTab: 'Усвідомленість',
  nightmareTab: 'Кошмари',
  lucidHeroTitle: 'Тренуй усвідомлення м’яко',
  lucidHeroDescription:
    'Спершу пам’ять про сон, потім dream signs і нагадування без тиску на сон.',
  nightmareHeroTitle: 'Відстежуй і пом’якшуй кошмари',
  nightmareHeroDescription:
    'Швидко записуй, заземлюйся після пробудження і переписуй повторювані сцени, коли готовий(-а).',
  openLucid: 'Практика усвідомленості',
  openNightmares: 'Підтримка при кошмарах',
  openPractice: 'Відкрити практику',
  morningCaptureTitle: 'Ранковий запис',
  realityChecksTitle: 'Reality checks',
  eveningIntentionTitle: 'Намір на вечір',
  wbtbTitle: 'WBTB',
  reminderOn: 'Увімк.',
  reminderOff: 'Вимк.',
  reminderEnable: 'Увімкнути',
  reminderDisable: 'Вимкнути',
  reminderTimeLabel: 'Час',
  reminderSafeHint: 'Підтримуй усвідомлення, а не форсуй результат.',
  quickActionsTitle: 'Швидкі дії',
  planTitle: 'Що робити',
  doNowTitle: 'Зараз',
  tonightTitle: 'Сьогодні ввечері',
  ifAwareTitle: 'Якщо усвідомив(-ла), що це сон',
  ifNightmareWakeTitle: 'Якщо кошмар тебе розбудив',
  progressTitle: 'Прогрес',
  gentleRulesTitle: 'М’які правила',
  gentleRulesBody:
    'Мета тут не форсувати результат, а мати більше ясності й безпечніший сон. Якщо ти вже втомлений(-а), WBTB краще пропустити.',
  lucidNowOne: 'Спершу записуй сни. Пригадування це база для lucid practice.',
  lucidNowTwo: 'Збережи один-два dream signs, що повторюються.',
  lucidNowThree: 'Роби reality checks лише вдень, а не в ліжку.',
  lucidTonightOne: 'Задай один спокійний намір перед сном.',
  lucidTonightTwo: 'Обери один dream sign, який хочеш помітити цієї ночі.',
  lucidTonightThree: 'Залиш WBTB необов’язковим і використовуй лише коли сон стабільний.',
  lucidAwareOne: 'Зупинись і підтвердь, що ти спиш.',
  lucidAwareTwo: 'Спершу стабілізація: руки, дотик, дихання або голос.',
  lucidAwareThree: 'Почни з однієї малої дії контролю, а не з усього сюжету.',
  nightmareNowOne: 'Спершу заземлення: світло, дихання, вода або назвати кімнату.',
  nightmareNowTwo: 'Якщо ще трусить, запиши лише ключовий образ або відчуття.',
  nightmareNowThree: 'Познач, чи це повторюваний сон і чи був сильний дистрес.',
  nightmareTonightOne: 'Перепиши фінал повністю наяву.',
  nightmareTonightTwo: 'Нова версія має бути короткою, безпечнішою і правдоподібною.',
  nightmareTonightThree: 'Звертай увагу на стрес, пізній кофеїн, алкоголь і повторювані сигнали перед сном.',
  nightmareWakeOne: 'Увімкни світло і зорієнтуйся в кімнаті.',
  nightmareWakeTwo: 'Спочатку заспокой тіло, а не аналізуй.',
  nightmareWakeThree: 'Записуй кошмар лише коли вже трохи стабілізувався(-лась).',
  lucidProgressHint: 'Частіше за все усвідомлені сни починаються з кращого пригадування і чіткіших dream signs.',
  nightmareProgressHint:
    'Прогрес це менше дистресу, менше повторів і спокійніші пробудження, а не “ідеальні ночі”.',
  quickRecordDream: 'Записати сон',
  quickWakeCapture: 'Ранковий запис',
  quickNightmareRewrite: 'Переписати фінал',
  quickGrounding: 'Заземлитись',
  quickRealityCheck: 'Позначити reality check',
  beginnerPathTitle: 'Базовий шлях',
  beginnerPathRecall: 'Записуй відразу після пробудження',
  beginnerPathSigns: 'Помічай повторювані dream signs',
  beginnerPathChecks: 'Роби reality checks лише вдень',
  beginnerPathMild: 'Задавай легкий намір перед сном',
  beginnerPathWbtb: 'Використовуй WBTB рідко і лише коли виспався(-лась)',
  dailyChecklistTitle: 'Сьогодні',
  checklistCapture: 'Сьогодні є запис сну',
  checklistSigns: 'Збережено dream sign',
  checklistRealityChecks: 'Reality checks увімкнені',
  checklistRewrite: 'Є чернетка переписування',
  lucidStatsTitle: 'Сигнали усвідомленості',
  lucidStatsAware: 'Усвідомлені',
  lucidStatsControlled: 'З контролем',
  lucidStatsTopTechnique: 'Головна техніка',
  lucidStatsDreamSigns: 'Dream signs',
  lucidStatsNoTechnique: 'Техніки ще не логувались',
  nightmareStatsTitle: 'Сигнали кошмарів',
  nightmareStatsRecurring: 'Повторювані',
  nightmareStatsHighDistress: 'Високий дистрес',
  nightmareStatsRescripted: 'Переписані',
  nightmarePatternsTitle: 'Перед важкими ночами',
  nightmarePatternsDescription:
    'Стрес, емоції перед сном, пізній кофеїн і повторювані сигнали перед важчими ночами.',
  nightmareGroundingTitle: 'Заземлення після пробудження',
  nightmareGroundingBody:
    'Увімкни світло, назви кімнату, сповільни дихання і запиши сон лише коли знову відчуваєш опору.',
  nightmareEscalationTitle: 'Коли варто звернутись по додаткову допомогу',
  nightmareEscalationBody:
    'Якщо кошмари стають частими, дуже виснажливими або змушують уникати сну, варто поговорити з лікарем чи терапевтом.',
  nightmareRewritePrompt: 'Спробуй записати спокійніший фінал наяву',
  reminderNotificationMorningTitle: 'Злови сон, поки не зник',
  reminderNotificationMorningBody: 'Запиши кілька рядків, поки пам’ять ще поруч.',
  reminderNotificationRealityTitle: 'Reality check',
  reminderNotificationRealityBody: 'Зупинись, глянь двічі й поміть, що стабільне, а що дивне.',
  reminderNotificationEveningTitle: 'Сформуй намір на ніч',
  reminderNotificationEveningBody: 'Обери один dream sign або один спокійний намір перед сном.',
  reminderNotificationWbtbTitle: 'Необов’язкове вікно WBTB',
  reminderNotificationWbtbBody: 'Використовуй це лише якщо почуваєшся достатньо відпочившим(-ою).',
  focusLucidHint: 'Формуються сигнали усвідомленості',
  focusNightmareHint: 'Кошмарним патернам потрібен м’якший перегляд',
  filterLucid: 'Усвідомлений',
  filterNightmare: 'Кошмар',
  filterRecurringNightmare: 'Повторюваний кошмар',
  filterControl: 'Контроль',
  filterHighDistress: 'Високий дистрес',
  homeLucidCtaTitle: 'Практикувати усвідомленість',
  homeLucidCtaHint: 'Пригадування, dream signs і ясність на цю ніч.',
  homeNightmareCtaTitle: 'Після кошмару',
  homeNightmareCtaHint: 'Заземлення, короткий запис і переписування, коли будеш готовий(-а).',
  statsLucidProgressTitle: 'Прогрес усвідомленості',
  statsLucidProgressDescription:
    'Шлях від пригадування до усвідомлення, стабілізації та контролю.',
  statsNightmareRecoveryTitle: 'Відновлення після кошмарів',
  statsNightmareRecoveryDescription:
    'Дивись, чи меншає дистрес, повтори і чи спокійнішими стають пробудження.',
  remindersTitle: 'Нагадування',
  lucidDreamSignsLabel: 'Dream signs',
  lucidDreamSignsPlaceholder: 'двері, хибне пробудження, дзеркало',
  lucidTriggerLabel: 'Що дало усвідомлення',
  lucidTriggerPlaceholder: 'Що підказало, що це сон?',
  lucidRecallLabel: 'Якість пригадування',
  lucidStabilizationLabel: 'Стабілізація',
  nightmareRecurringPlaceholder: 'коридор / падіння / переслідувач',
  nightmareWokeLabel: 'Прокинувся(-лась) від сну',
  nightmareAftereffectsLabel: 'Після пробудження',
  nightmareGroundingLabel: 'Що допомогло заземлитись',
  nightmareRewriteStatusLabel: 'Статус переписування',
  archiveSpecialFiltersLabel: 'Усвідомленість / кошмари',
  sourceReminder: 'Нагадування',
};

export function getPracticeCopy(locale: AppLocale): PracticeCopy {
  return locale === 'uk' ? PRACTICE_COPY_UK : PRACTICE_COPY_EN;
}

export function getLucidTechniqueLabels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        mild: 'MILD',
        wbtb: 'WBTB',
        ssild: 'SSILD',
        reality_check: 'Reality check',
        intention: 'Намір',
      }
    : {
        mild: 'MILD',
        wbtb: 'WBTB',
        ssild: 'SSILD',
        reality_check: 'Reality check',
        intention: 'Intention',
      };
}

export function getLucidControlAreaLabels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        scene: 'Сцена',
        movement: 'Рух',
        characters: 'Персонажі',
        body: 'Тіло',
        emotion: 'Емоції',
        waking: 'Пробудження',
      }
    : {
        scene: 'Scene',
        movement: 'Movement',
        characters: 'Characters',
        body: 'Body',
        emotion: 'Emotion',
        waking: 'Waking',
      };
}

export function getLucidStabilizationLabels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        hands: 'Руки',
        breathing: 'Дихання',
        spinning: 'Обертання',
        touch: 'Дотик',
        voice: 'Голос',
        anchor: 'Якір',
      }
    : {
        hands: 'Hands',
        breathing: 'Breathing',
        spinning: 'Spinning',
        touch: 'Touch',
        voice: 'Voice',
        anchor: 'Anchor',
      };
}

export function getNightmareAftereffectLabels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        panic: 'Паніка',
        sweating: 'Пітливість',
        'racing-heart': 'Серцебиття',
        'fear-to-sleep': 'Страх засинати',
        disoriented: 'Дезорієнтація',
        sadness: 'Смуток',
      }
    : {
        panic: 'Panic',
        sweating: 'Sweating',
        'racing-heart': 'Racing heart',
        'fear-to-sleep': 'Fear to sleep',
        disoriented: 'Disoriented',
        sadness: 'Sadness',
      };
}

export function getNightmareGroundingLabels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        light: 'Світло',
        breathing: 'Дихання',
        water: 'Вода',
        journal: 'Запис',
        'body-check': 'Тіло',
        'safe-sound': 'Звук',
      }
    : {
        light: 'Light',
        breathing: 'Breathing',
        water: 'Water',
        journal: 'Journal',
        'body-check': 'Body check',
        'safe-sound': 'Safe sound',
      };
}

export function getNightmareRescriptStatusLabels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        none: 'Немає',
        drafted: 'Чернетка',
        rehearsed: 'Пропрацьовано',
      }
    : {
        none: 'None',
        drafted: 'Drafted',
        rehearsed: 'Rehearsed',
      };
}
