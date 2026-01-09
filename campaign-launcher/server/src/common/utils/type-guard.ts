export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}
