import { createNavigationContainerRef } from '@react-navigation/native';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
  type TabParamList,
} from './routes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function openNewDreamTab(params?: TabParamList[typeof TAB_ROUTE_NAMES.New]) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.Tabs, {
    screen: TAB_ROUTE_NAMES.New,
    params,
  });
  return true;
}

export function openRecordTab(params?: TabParamList[typeof TAB_ROUTE_NAMES.New]) {
  return openNewDreamTab(params);
}

export function openWakeEntry(params?: RootStackParamList[typeof ROOT_ROUTE_NAMES.WakeEntry]) {
  if (!navigationRef.isReady()) {
    return false;
  }

  if (navigationRef.getCurrentRoute()?.name === ROOT_ROUTE_NAMES.WakeEntry) {
    return true;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.WakeEntry, params);
  return true;
}

export function openBackupScreen() {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.Backup);
  return true;
}

export function openBackupOnboardingPreview() {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.BackupOnboardingPreview);
  return true;
}

export function openSyncDiagnosticsPreview() {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.SyncDiagnosticsPreview);
  return true;
}

export function openMonthlyReport(
  params?: RootStackParamList[typeof ROOT_ROUTE_NAMES.MonthlyReport],
) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.MonthlyReport, params);
  return true;
}

export function openDreamPractice(
  params?: RootStackParamList[typeof ROOT_ROUTE_NAMES.DreamPractice],
) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.DreamPractice, params);
  return true;
}
