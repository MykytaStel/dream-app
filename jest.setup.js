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
    createTriggerNotification: jest.fn(
      async notification => notification?.id || 'trigger-id',
    ),
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
    useAnimatedStyle: updater =>
      typeof updater === 'function' ? updater() : {},
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
  CachesDirectoryPath: '/caches',
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(''),
  // Partial reads and appends: what chunked encryption is built on.
  read: jest.fn().mockResolvedValue(''),
  appendFile: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ size: '0' }),
  moveFile: jest.fn().mockResolvedValue(undefined),
  readDir: jest.fn().mockResolvedValue([]),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

// libsodium is native, so the suites cannot run the real XChaCha20. What they
// can run — and what mistakes actually live in — is the framing around it:
// version byte, nonce placement, base64, JSON. This stand-in keeps that path
// real while replacing only the primitive.
//
// It is not encryption and is not pretending to be. It has the two properties
// the framing relies on: a wrong key fails loudly, and output differs from
// input. `__tests__/archiveCipher.test.ts` states the same thing at its own
// level; the real primitive is exercised on device, not here.
jest.mock('react-native-libsodium', () => {
  let counter = 0;

  const xor = (bytes, key, nonce) =>
    Uint8Array.from(bytes, (byte, index) =>
      // eslint-disable-next-line no-bitwise
      byte ^ key[index % key.length] ^ nonce[index % nonce.length],
    );

  const tagOf = (bytes, key) =>
    // eslint-disable-next-line no-bitwise
    bytes.reduce((sum, byte) => (sum + byte) & 0xff, key[0]);

  const sodium = {
    ready: Promise.resolve(),
    crypto_aead_xchacha20poly1305_ietf_KEYBYTES: 32,
    crypto_aead_xchacha20poly1305_ietf_NPUBBYTES: 24,
    randombytes_buf: length => {
      counter += 1;
      return Uint8Array.from({ length }, (_, index) =>
        // eslint-disable-next-line no-bitwise
        index === 0 ? counter & 0xff : (index * 31 + counter) & 0xff,
      );
    },
    crypto_aead_xchacha20poly1305_ietf_encrypt: (
      plaintext,
      _additional,
      _secret,
      nonce,
      key,
    ) => {
      const body = xor(plaintext, key, nonce);
      const sealed = new Uint8Array(body.length + 1);
      sealed.set(body, 0);
      sealed[body.length] = tagOf(body, key);
      return sealed;
    },
    crypto_aead_xchacha20poly1305_ietf_decrypt: (
      _secret,
      ciphertext,
      _additional,
      nonce,
      key,
    ) => {
      const body = ciphertext.slice(0, -1);
      if (ciphertext[ciphertext.length - 1] !== tagOf(body, key)) {
        throw new Error('authentication failed');
      }
      return xor(body, key, nonce);
    },
  };

  return { ...sodium, default: sodium };
});

// The secretstream binding is native, so the suites run against a stand-in.
//
// It is not encryption. What it does reproduce is the one property the file
// format leans on: each chunk's authenticator depends on every chunk before it.
// Without that chaining, the tests for reordered and dropped chunks would pass
// against a format that does not actually detect either.
(() => {
  const HEADER_BYTES = 24;
  const TAG_BYTES = 17; // 1 tag byte + 16 of authenticator, as in the real one
  const TAG_MESSAGE = 0;
  const TAG_FINAL = 3;

  let headerCounter = 0;

  // Depends on the key as well as the chain. An earlier version did not, and
  // the suite caught it: a wrong key produced garbage plaintext whose
  // authenticator still verified, so "another key cannot open it" passed
  // against a stand-in that could not actually tell.
  const chainFrom = (previous, body, tag, key) => {
    const next = new Uint8Array(16);
    for (let index = 0; index < 16; index += 1) {
      // eslint-disable-next-line no-bitwise
      let value = (previous[index] ^ tag ^ key[index % key.length]) & 0xff;
      for (let step = index; step < body.length; step += 16) {
        // eslint-disable-next-line no-bitwise
        value = (value + body[step] * (step + 1)) & 0xff;
      }
      next[index] = value;
    }
    return next;
  };

  const mask = (bytes, key, chain) =>
    Uint8Array.from(bytes, (byte, index) =>
      // eslint-disable-next-line no-bitwise
      byte ^ key[index % key.length] ^ chain[index % chain.length],
    );

  global.jsi_crypto_secretstream_xchacha20poly1305_HEADERBYTES = HEADER_BYTES;
  global.jsi_crypto_secretstream_xchacha20poly1305_ABYTES = TAG_BYTES;
  global.jsi_crypto_secretstream_xchacha20poly1305_KEYBYTES = 32;
  global.jsi_crypto_secretstream_xchacha20poly1305_TAG_MESSAGE = TAG_MESSAGE;
  global.jsi_crypto_secretstream_xchacha20poly1305_TAG_FINAL = TAG_FINAL;

  global.jsi_crypto_secretstream_xchacha20poly1305_init_push = keyBuffer => {
    const key = new Uint8Array(keyBuffer);
    headerCounter += 1;
    const header = Uint8Array.from(
      { length: HEADER_BYTES },
      // eslint-disable-next-line no-bitwise
      (_, index) => (index * 7 + headerCounter) & 0xff,
    );
    let chain = header.slice(0, 16);

    return {
      header: header.buffer.slice(0),
      push(messageBuffer, tag = TAG_MESSAGE) {
        const message = new Uint8Array(messageBuffer);
        const body = mask(message, key, chain);
        const authenticator = chainFrom(chain, body, tag, key);
        chain = authenticator;

        const out = new Uint8Array(body.length + TAG_BYTES);
        out[0] = tag;
        out.set(body, 1);
        out.set(authenticator, 1 + body.length);
        return out.buffer;
      },
    };
  };

  global.jsi_crypto_secretstream_xchacha20poly1305_init_pull = (
    headerBuffer,
    keyBuffer,
  ) => {
    const key = new Uint8Array(keyBuffer);
    let chain = new Uint8Array(headerBuffer).slice(0, 16);

    return {
      pull(ciphertextBuffer) {
        const ciphertext = new Uint8Array(ciphertextBuffer);
        if (ciphertext.length < TAG_BYTES) {
          throw new Error('chunk too short');
        }

        const tag = ciphertext[0];
        const body = ciphertext.slice(1, ciphertext.length - 16);
        const authenticator = ciphertext.slice(ciphertext.length - 16);
        const expected = chainFrom(chain, body, tag, key);

        for (let index = 0; index < 16; index += 1) {
          if (authenticator[index] !== expected[index]) {
            throw new Error('authentication failed');
          }
        }

        const message = mask(body, key, chain);
        chain = expected;
        return { message: message.buffer.slice(0), tag };
      },
    };
  };
})();

// The widget TurboModule.
//
// `TurboModuleRegistry.getEnforcing` throws when the module is absent, which is
// the point of it — a missing native module should fail loudly rather than
// producing an object of undefined methods, as the old `NativeModules.X`
// lookup did. In Jest there is no native binary at all, so the module is
// supplied here.
jest.mock('./src/specs/NativeDreamWidget', () => ({
  __esModule: true,
  default: {
    updateSnapshot: jest.fn(async () => undefined),
    getWidgetStatus: jest.fn(async () => ({ hasWidget: false })),
    isPinSupported: jest.fn(async () => false),
    requestPinWidget: jest.fn(async () => false),
  },
}));

jest.mock('react-native-keychain', () => {
  const store = new Map();

  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK: 'AfterFirstUnlock' },
    setGenericPassword: jest.fn(async (username, password, options) => {
      store.set(options?.service ?? 'default', { username, password });
      return true;
    }),
    getGenericPassword: jest.fn(
      async options => store.get(options?.service ?? 'default') ?? false,
    ),
    resetGenericPassword: jest.fn(async options => {
      store.delete(options?.service ?? 'default');
      return true;
    }),
    getSupportedBiometryType: jest.fn(async () => null),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();

  return {
    setItem: jest.fn(async (key, value) => {
      store.set(key, String(value));
    }),
    getItem: jest.fn(async key => store.get(key) ?? null),
    removeItem: jest.fn(async key => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
});

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(async () => ({
    filePath: '/documents/exports/mock.pdf',
  })),
}));

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: {
    trigger: jest.fn(),
  },
  trigger: jest.fn(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native/src/private/animated/NativeAnimatedHelper');
