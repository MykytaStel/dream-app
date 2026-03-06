import { createNavigationContainerRef } from '@react-navigation/native';
import { ROOT_ROUTE_NAMES, TAB_ROUTE_NAMES, type RootStackParamList } from './routes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function openRecordTab() {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.Tabs, {
    screen: TAB_ROUTE_NAMES.New,
  });
  return true;
}
