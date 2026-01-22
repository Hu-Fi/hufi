export function isValidNonce(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[0-9a-fA-F]{32}$/.test(value);
}
