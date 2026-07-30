const reactNativeConfig = require('@react-native/eslint-config/flat');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const jestPlugin = require('eslint-plugin-jest');

module.exports = [
  // Flat config does not read .eslintignore, so the ignores live here.
  {
    ignores: [
      'v0/**',
      'node_modules/**',
      'coverage/**',
      'android/**',
      'ios/Pods/**',
    ],
  },
  ...reactNativeConfig,
  {
    // The upstream config only grants jest globals to **/*.{spec,test}.* and
    // __tests__/, so the setup file itself is left without them.
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { ...jestPlugin.environments.globals.globals },
    },
  },
  {
    // Flat config requires the plugin to be declared in the same object as its rule.
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': typescriptPlugin },
    rules: {
      // `const { score: _score, ...rest } = card` is our idiom for dropping fields.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
