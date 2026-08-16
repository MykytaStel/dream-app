import { NavigatorScreenParams } from '@react-navigation/native';
import { AppLocale } from '../../i18n/types';

export const TAB_ROUTE_NAMES = {
  Home: 'Home',
  Archive: 'Archive',
  New: 'New',
  Stats: 'Stats',
  Settings: 'Settings',
} as const;

export const ROOT_ROUTE_NAMES = {
  Onboarding: 'Onboarding',
  Tabs: 'Tabs',
  Backup: 'Backup',
  BackupOnboardingPreview: 'BackupOnboardingPreview',
  SyncDiagnosticsPreview: 'SyncDiagnosticsPreview',
  WakeEntry: 'WakeEntry',
  DreamDetail: 'DreamDetail',
  DreamEditor: 'DreamEditor',
  Progress: 'Progress',
  MonthlyReport: 'MonthlyReport',
  PatternDetail: 'PatternDetail',
  ReviewWorkspace: 'ReviewWorkspace',
  DreamPractice: 'DreamPractice',
  Privacy: 'Privacy',
  // The settings hub's spokes. Each one is a screen the Settings tab lists a
  // row for, rather than a section it scrolls past.
  SettingsAppearance: 'SettingsAppearance',
  SettingsReminders: 'SettingsReminders',
  SettingsSecurity: 'SettingsSecurity',
  SettingsAnalysis: 'SettingsAnalysis',
  SettingsStorage: 'SettingsStorage',
  ArchiveHealth: 'ArchiveHealth',
  SettingsAbout: 'SettingsAbout',
} as const;

type TabRouteLabelMap = Record<
  (typeof TAB_ROUTE_NAMES)[keyof typeof TAB_ROUTE_NAMES],
  string
>;

const TAB_ROUTE_LABELS_EN: TabRouteLabelMap = {
  [TAB_ROUTE_NAMES.Home]: 'Home',
  [TAB_ROUTE_NAMES.Archive]: 'Archive',
  [TAB_ROUTE_NAMES.New]: 'Add',
  [TAB_ROUTE_NAMES.Stats]: 'Memory',
  [TAB_ROUTE_NAMES.Settings]: 'Settings',
};

const TAB_ROUTE_LABELS_UK: TabRouteLabelMap = {
  [TAB_ROUTE_NAMES.Home]: 'Стрічка',
  [TAB_ROUTE_NAMES.Archive]: 'Архів',
  [TAB_ROUTE_NAMES.New]: 'Додати',
  [TAB_ROUTE_NAMES.Stats]: "Пам'ять",
  [TAB_ROUTE_NAMES.Settings]: 'Опції',
};

export function getTabRouteLabels(locale: AppLocale) {
  return locale === 'uk' ? TAB_ROUTE_LABELS_UK : TAB_ROUTE_LABELS_EN;
}

export type TabRouteName = keyof typeof TAB_ROUTE_NAMES;
export type PatternDetailKind = 'word' | 'theme' | 'symbol';
/** Where a dream detail was opened from, for the §9 revisit funnel. */
export type DreamDetailSource = 'home' | 'archive' | 'stats' | 'other';
export type DreamDetailFocusSection =
  'reflection' | 'written' | 'transcript' | 'analysis';
export type DreamPracticeFocus = 'lucid' | 'nightmares';

export type TabParamList = {
  [TAB_ROUTE_NAMES.Home]: undefined;
  [TAB_ROUTE_NAMES.Archive]: undefined;
  [TAB_ROUTE_NAMES.New]:
    | {
        entryMode?: 'default' | 'voice' | 'wake';
        autoStartRecording?: boolean;
        source?: 'manual' | 'reminder';
        launchKey?: number;
      }
    | undefined;
  [TAB_ROUTE_NAMES.Stats]: undefined;
  [TAB_ROUTE_NAMES.Settings]: undefined;
};

export type RootStackParamList = {
  [ROOT_ROUTE_NAMES.Onboarding]: undefined;
  [ROOT_ROUTE_NAMES.Tabs]: NavigatorScreenParams<TabParamList> | undefined;
  [ROOT_ROUTE_NAMES.Backup]: undefined;
  [ROOT_ROUTE_NAMES.BackupOnboardingPreview]: undefined;
  [ROOT_ROUTE_NAMES.SyncDiagnosticsPreview]: undefined;
  [ROOT_ROUTE_NAMES.WakeEntry]:
    | {
        source?: 'manual' | 'reminder';
      }
    | undefined;
  [ROOT_ROUTE_NAMES.DreamDetail]: {
    dreamId: string;
    justSaved?: boolean;
    focusSection?: DreamDetailFocusSection;
    source?: DreamDetailSource;
  };
  [ROOT_ROUTE_NAMES.DreamEditor]: {
    dreamId: string;
  };
  [ROOT_ROUTE_NAMES.Progress]: undefined;
  [ROOT_ROUTE_NAMES.Privacy]: undefined;
  [ROOT_ROUTE_NAMES.SettingsAppearance]: undefined;
  [ROOT_ROUTE_NAMES.SettingsReminders]: undefined;
  [ROOT_ROUTE_NAMES.SettingsSecurity]: undefined;
  [ROOT_ROUTE_NAMES.SettingsAnalysis]: undefined;
  [ROOT_ROUTE_NAMES.SettingsStorage]: undefined;
  [ROOT_ROUTE_NAMES.ArchiveHealth]: undefined;
  [ROOT_ROUTE_NAMES.SettingsAbout]: undefined;
  [ROOT_ROUTE_NAMES.MonthlyReport]:
    | {
        yearMonth?: string;
      }
    | undefined;
  [ROOT_ROUTE_NAMES.ReviewWorkspace]: undefined;
  [ROOT_ROUTE_NAMES.PatternDetail]: {
    signal: string;
    kind: PatternDetailKind;
  };
  [ROOT_ROUTE_NAMES.DreamPractice]:
    | {
        focus?: DreamPracticeFocus;
        entrySource?:
          'manual' | 'home' | 'stats' | 'detail' | 'onboarding' | 'reminder';
      }
    | undefined;
};
