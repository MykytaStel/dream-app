module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // Shared fixtures live next to the suites but are not suites themselves.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
  // gesture-handler 3.x dropped its CommonJS build: `main` now points at ESM,
  // which jest cannot parse without transpiling it first. The preset only
  // transpiles react-native itself, so the package is added by hand.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-gesture-handler)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // Style and copy files are declarations, not logic. Counting them would
    // inflate the number without telling us anything about what is tested.
    '!src/**/*.styles.ts',
    '!src/constants/copy/**',
    '!src/@types/**',
    '!src/types/**',
  ],
  // Measured 2026-07-28, rounded down. This is a floor that ratchets upward,
  // not a target. Note it covers all of src/, not just the files the suites
  // happen to import — that distinction nearly halves the number, and the
  // lower one is the honest one.
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 32,
      functions: 30,
      lines: 35,
    },
  },
};
