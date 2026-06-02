import _ from 'lodash';

import { isObject } from './type-guard';

type CaseTransformer = (input: string) => string;

function transformKeysCase(
  input: unknown,
  transformer: CaseTransformer,
): unknown {
  /**
   * Primitives and Date objects returned as is
   * to keep their original value for later use
   */
  if (!isObject(input) || input instanceof Date) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((value) => transformKeysCase(value, transformer));
  }

  const transformedObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    transformedObject[transformer(key)] = transformKeysCase(value, transformer);
  }
  return transformedObject;
}

export function transformKeysToCamelCase(input: unknown): unknown {
  return transformKeysCase(input, _.camelCase);
}

export function transformKeysToSnakeCase(input: unknown): unknown {
  return transformKeysCase(input, _.snakeCase);
}
