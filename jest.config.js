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
};
