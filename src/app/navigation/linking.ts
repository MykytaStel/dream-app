import { LinkingOptions } from '@react-navigation/native';
import {
  DREAM_WIDGET_PATHS,
  DREAM_WIDGET_URL_PREFIX,
} from '../../features/widgets/model/dreamWidgetLinks';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from './routes';

export const appLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [DREAM_WIDGET_URL_PREFIX],
  config: {
    screens: {
      [ROOT_ROUTE_NAMES.Tabs]: {
        screens: {
          [TAB_ROUTE_NAMES.New]: DREAM_WIDGET_PATHS.Draft,
          [TAB_ROUTE_NAMES.Stats]: DREAM_WIDGET_PATHS.Memory,
        },
      },
      [ROOT_ROUTE_NAMES.WakeEntry]: DREAM_WIDGET_PATHS.Capture,
      [ROOT_ROUTE_NAMES.DreamDetail]: `${DREAM_WIDGET_PATHS.Dream}/:dreamId`,
    },
  },
};
