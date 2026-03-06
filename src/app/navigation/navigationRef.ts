import { createNavigationContainerRef } from '@react-navigation/native';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
  type TabParamList,
} from './routes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function openRecordTab(params?: TabParamList[typeof TAB_ROUTE_NAMES.New]) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(ROOT_ROUTE_NAMES.Tabs, {
    screen: TAB_ROUTE_NAMES.New,
    params,
  });
  return true;
}
