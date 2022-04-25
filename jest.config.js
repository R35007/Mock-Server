/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  silent: true,
  cache: false,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 100000,
  moduleFileExtensions: ['js', 'json', 'node', 'ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
}