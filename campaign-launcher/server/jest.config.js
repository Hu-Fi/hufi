const { createDefaultPreset, pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = require('./tsconfig.json');

const jestTsPreset = createDefaultPreset({});

const config = {
  ...jestTsPreset,
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>' }),
  clearMocks: true,
  setupFiles: ['<rootDir>/src/setup-libs.ts'],
};

module.exports = config;
