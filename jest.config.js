/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  cache: false,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    axios: 'axios/dist/node/axios.cjs',
  },
  moduleFileExtensions: ['js', 'json', 'node', 'ts'],
  preset: 'ts-jest',
  silent: true,
  testEnvironment: 'node',
  testTimeout: 100000,
  verbose: true,
};
