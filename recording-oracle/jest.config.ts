import type { Config as JestConfig } from 'jest';
import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const jestTsPreset = createDefaultPreset({});

const config: JestConfig = {
  ...jestTsPreset,
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  clearMocks: true,
  setupFiles: ['<rootDir>/src/setup-libs.ts'],
};

module.exports = config;
