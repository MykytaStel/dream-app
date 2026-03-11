/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';

jest.mock('@notifee/react-native', () => {
  const AuthorizationStatus = {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
  };

  const EventType = {
    PRESS: 1,
    ACTION_PRESS: 2,
  };

  const mock = {
    AndroidImportance: {
      HIGH: 4,
    },
    AuthorizationStatus,
    EventType,
    RepeatFrequency: {
      DAILY: 'DAILY',
    },
    TriggerType: {
      TIMESTAMP: 'TIMESTAMP',
    },
    createTriggerNotification: jest.fn(async notification => notification?.id || 'trigger-id'),
    createChannel: jest.fn(async channel => channel?.id || 'channel-id'),
    cancelNotification: jest.fn(async () => {}),
    requestPermission: jest.fn(async () => ({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    })),
    getNotificationSettings: jest.fn(async () => ({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    })),
    getInitialNotification: jest.fn(async () => null),
    onForegroundEvent: jest.fn(() => jest.fn()),
  };

  return {
    ...mock,
    default: mock,
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, ScrollView, Text } = require('react-native');

  const createTransitionBuilder = () => {
    const builder = {
      duration: () => builder,
      delay: () => builder,
      springify: () => builder,
      damping: () => builder,
      stiffness: () => builder,
    };

    return builder;
  };

  const AnimatedView = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }, props.children),
  );
  const AnimatedScrollView = React.forwardRef((props, ref) =>
    React.createElement(ScrollView, { ...props, ref }, props.children),
  );
  const AnimatedText = React.forwardRef((props, ref) =>
    React.createElement(Text, { ...props, ref }, props.children),
  );

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      ScrollView: AnimatedScrollView,
      Text: AnimatedText,
      createAnimatedComponent: Component => Component,
      call: () => {},
    },
    View: AnimatedView,
    ScrollView: AnimatedScrollView,
    Text: AnimatedText,
    createAnimatedComponent: Component => Component,
    useSharedValue: value => ({ value }),
    useAnimatedStyle: updater => (typeof updater === 'function' ? updater() : {}),
    withRepeat: value => value,
    withSequence: (...values) => values[values.length - 1],
    withTiming: value => value,
    LinearTransition: createTransitionBuilder(),
    FadeInDown: createTransitionBuilder(),
    Easing: {
      linear: 'linear',
      quad: 'quad',
      inOut: value => value,
    },
  };
});

jest.mock('react-native-mmkv', () => {
  const store = new Map();

  return {
    createMMKV: () => ({
      set: (key, value) => {
        store.set(key, value);
      },
      getString: key => {
        const value = store.get(key);
        return typeof value === 'string' ? value : undefined;
      },
      getBoolean: key => {
        const value = store.get(key);
        return typeof value === 'boolean' ? value : undefined;
      },
      getNumber: key => {
        const value = store.get(key);
        return typeof value === 'number' ? value : undefined;
      },
      delete: key => {
        store.delete(key);
      },
      remove: key => {
        store.delete(key);
      },
      clearAll: () => {
        store.clear();
      },
    }),
  };
});

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  ExternalDirectoryPath: '/external',
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ size: '0' }),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(async () => ({
    filePath: '/documents/exports/mock.pdf',
  })),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native/src/private/animated/NativeAnimatedHelper');
