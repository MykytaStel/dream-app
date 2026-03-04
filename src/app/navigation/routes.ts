export const TAB_ROUTE_NAMES = {
  Home: 'Home',
  New: 'New',
  Stats: 'Stats',
  Settings: 'Settings',
} as const;

export const ROOT_ROUTE_NAMES = {
  Tabs: 'Tabs',
  DreamDetail: 'DreamDetail',
  DreamEditor: 'DreamEditor',
} as const;

export const TAB_ROUTE_LABELS = {
  [TAB_ROUTE_NAMES.Home]: 'Timeline',
  [TAB_ROUTE_NAMES.New]: 'Record',
  [TAB_ROUTE_NAMES.Stats]: 'Insights',
  [TAB_ROUTE_NAMES.Settings]: 'Settings',
} as const;

export type TabRouteName = keyof typeof TAB_ROUTE_NAMES;

export type TabParamList = {
  [TAB_ROUTE_NAMES.Home]: undefined;
  [TAB_ROUTE_NAMES.New]: undefined;
  [TAB_ROUTE_NAMES.Stats]: undefined;
  [TAB_ROUTE_NAMES.Settings]: undefined;
};

export type RootStackParamList = {
  [ROOT_ROUTE_NAMES.Tabs]: undefined;
  [ROOT_ROUTE_NAMES.DreamDetail]: {
    dreamId: string;
  };
  [ROOT_ROUTE_NAMES.DreamEditor]: {
    dreamId: string;
  };
};
