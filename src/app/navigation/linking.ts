import { LinkingOptions, getStateFromPath as defaultGetStateFromPath } from '@react-navigation/native';
import {
  DREAM_WIDGET_PATHS,
  DREAM_WIDGET_URL_PREFIX,
} from '../../features/widgets/model/dreamWidgetLinks';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from './routes';

const linkingConfig: LinkingOptions<RootStackParamList>['config'] = {
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
};

export const appLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [DREAM_WIDGET_URL_PREFIX],
  config: linkingConfig,
  getStateFromPath(path, options) {
    const state = defaultGetStateFromPath(path, options);

    if (!state) return state;

    // When cold-launching into DreamDetail (e.g. from Last Dream widget),
    // inject Tabs as the base route so the back button returns to the journal.
    const routes = state.routes as { name: string; params?: object }[];
    if (routes.length === 1 && routes[0].name === ROOT_ROUTE_NAMES.DreamDetail) {
      return {
        ...state,
        routes: [{ name: ROOT_ROUTE_NAMES.Tabs }, routes[0]],
      };
    }

    return state;
  },
};
