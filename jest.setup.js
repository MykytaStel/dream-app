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
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
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

jest.mock('react-native/src/private/animated/NativeAnimatedHelper');
