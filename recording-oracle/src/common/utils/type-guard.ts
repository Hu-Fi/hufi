import _ from 'lodash';

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

/**
 * lodash returns boolean without type guard, so we need to wrap it
 */
export function isFiniteNumber(value: unknown): value is number {
  return _.isFinite(value);
}
