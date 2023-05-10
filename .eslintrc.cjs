/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */

// @ts-check
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  env: { es2020: true, node: true },
  extends: [
    'semistandard',
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:promise/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', project: true, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'promise', 'import', 'prettier', 'sort-keys-fix'],
  root: true,
  rules: {
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-as-const': 'warn',
    eqeqeq: 0,
    'import/default': 'error',
    'import/export': 'error',
    'import/named': 'error',
    'import/no-absolute-path': 0,
    'import/no-anonymous-default-export': 0,
    'import/no-duplicates': 'error',
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
    'import/no-namespace': 0,
    'linebreak-style': 0,
    'prettier/prettier': ['error', { singleQuote: true }, { properties: { usePrettierrc: true } }],
    quotes: ['error', 'single', { allowTemplateLiterals: true, avoidEscape: false }],
    semi: [2, 'always'],
    'sort-keys-fix/sort-keys-fix': 'error',
    'tailwindcss/no-custom-classname': 0,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.js', '.ts'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
      typescript: {
        alwaysTryTypes: true,
        project: ['tsconfig.json'],
      },
    },
  },
});
