import * as crypto from 'crypto';

export function generateRandomHashString(
  algorithm: string,
  encoding?: 'hex' | 'base64',
): string {
  const hash = crypto
    .createHash(algorithm)
    .update(crypto.randomUUID())
    .digest(encoding || 'hex');

  return hash;
}
