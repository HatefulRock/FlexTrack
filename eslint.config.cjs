const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'dist-native/**', 'android/**', 'ios/**'],
  },
  {
    // eslint-config-expo 58 turned on the React Compiler rules. The code they flag is deliberate and works: Animated
    // values live in refs and are read during render, and effects reset local state when a sheet opens. Re-enable
    // them when the app moves to the React Compiler and these patterns are rewritten.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    // The lint rule cannot follow expo-notifications' `export *`; the enums are exported (and typechecked).
    files: ['utils/restNotification.ts'],
    rules: { 'import/namespace': 'off' },
  },
]);
