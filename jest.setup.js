/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';

jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));

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
