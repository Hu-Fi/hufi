import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const jestTsPreset = createDefaultPreset({});

module.exports = {
  ...jestTsPreset,
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  modulePaths: [compilerOptions.baseUrl],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  clearMocks: true,
};
