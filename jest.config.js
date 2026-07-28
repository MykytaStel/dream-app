module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // Shared fixtures live next to the suites but are not suites themselves.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
};
