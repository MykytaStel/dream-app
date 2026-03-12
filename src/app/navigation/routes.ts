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
  Tabs: 'Tabs',
  Backup: 'Backup',
  WakeEntry: 'WakeEntry',
  DreamDetail: 'DreamDetail',
  DreamEditor: 'DreamEditor',
  Progress: 'Progress',
  MonthlyReport: 'MonthlyReport',
  PatternDetail: 'PatternDetail',
} as const;

type TabRouteLabelMap = Record<(typeof TAB_ROUTE_NAMES)[keyof typeof TAB_ROUTE_NAMES], string>;

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
  [TAB_ROUTE_NAMES.Stats]: 'Пам\'ять',
  [TAB_ROUTE_NAMES.Settings]: 'Опції',
};

export function getTabRouteLabels(locale: AppLocale) {
  return locale === 'uk' ? TAB_ROUTE_LABELS_UK : TAB_ROUTE_LABELS_EN;
}

export type TabRouteName = keyof typeof TAB_ROUTE_NAMES;
export type PatternDetailKind = 'word' | 'theme' | 'symbol';
export type DreamDetailFocusSection = 'reflection' | 'written' | 'transcript' | 'analysis';

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
  [ROOT_ROUTE_NAMES.Tabs]: NavigatorScreenParams<TabParamList> | undefined;
  [ROOT_ROUTE_NAMES.Backup]: undefined;
  [ROOT_ROUTE_NAMES.WakeEntry]:
    | {
        source?: 'manual' | 'reminder';
      }
    | undefined;
  [ROOT_ROUTE_NAMES.DreamDetail]: {
    dreamId: string;
    justSaved?: boolean;
    focusSection?: DreamDetailFocusSection;
  };
  [ROOT_ROUTE_NAMES.DreamEditor]: {
    dreamId: string;
  };
  [ROOT_ROUTE_NAMES.Progress]: undefined;
  [ROOT_ROUTE_NAMES.MonthlyReport]:
    | {
        yearMonth?: string;
      }
    | undefined;
  [ROOT_ROUTE_NAMES.PatternDetail]: {
    signal: string;
    kind: PatternDetailKind;
  };
};
