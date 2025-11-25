import crypto from 'crypto';

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Must be same length to avoid early return timing leaks
  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashString(
  input: string,
  algorithm: string = 'sha256',
): string {
  return crypto.createHash(algorithm).update(input).digest('hex');
}
