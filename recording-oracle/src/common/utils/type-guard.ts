export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}
