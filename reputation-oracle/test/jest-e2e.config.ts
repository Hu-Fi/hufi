import type { Config as JestConfig } from 'jest';
import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from '../tsconfig.json';

const jestTsPreset = createDefaultPreset({});

const config: JestConfig = {
  ...jestTsPreset,
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../',
  }),
  clearMocks: true,
  testTimeout: 30000, // 30s timeout for network requests
};

module.exports = config;
