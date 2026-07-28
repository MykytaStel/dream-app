module.exports = {
  root: true,
  extends: '@react-native',
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
};
