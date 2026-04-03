import crypto from 'crypto';

import { faker } from '@faker-js/faker';

import * as cryptoUtils from './crypto';

describe('hashString', () => {
  it('should handle empty string input and use correct default algorithm', () => {
    const input = '';

    const expected = crypto.createHash('sha256').update(input).digest('hex');

    expect(cryptoUtils.hashString(input)).toBe(expected);
  });

  it('should return consistent results for the same input', () => {
    const input = faker.string.uuid();

    const first = cryptoUtils.hashString(input);
    const second = cryptoUtils.hashString(input);

    expect(first).toBe(second);
  });

  it.each(['md5', 'sha1', 'sha256', 'sha512'])(
    'should hash string using %s',
    (algorithm) => {
      const input = faker.string.uuid();

      const expected = crypto.createHash(algorithm).update(input).digest('hex');

      expect(cryptoUtils.hashString(input, algorithm)).toBe(expected);
    },
  );
});
