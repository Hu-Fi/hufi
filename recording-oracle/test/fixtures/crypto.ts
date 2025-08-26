import * as crypto from 'crypto';

import { faker } from '@faker-js/faker';

export function generateES256Keys(): { publicKey: string; privateKey: string } {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
}

/**
 * Generates random key for AES encryption
 * with the key length .expected by the app
 */
export function generateAesEncryptionKey(): string {
  return faker.string.sample(32);
}

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
