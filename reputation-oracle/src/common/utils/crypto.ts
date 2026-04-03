import crypto from 'crypto';

export function hashString(
  input: string,
  algorithm: string = 'sha256',
): string {
  return crypto.createHash(algorithm).update(input).digest('hex');
}
