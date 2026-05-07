import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { isAcceptableTimestamp } from './utils';

describe('API clients utils', () => {
  describe('isAcceptableTimestamp', () => {
    const now = Date.now();
    let maxLookbackMs: number;

    beforeAll(() => {
      vi.useFakeTimers({ now });
      maxLookbackMs = faker.number.int({ max: 1000 });
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    test.each([NaN, false, ''])(
      'should return false if not a number [%#]',
      (timestamp) => {
        expect(isAcceptableTimestamp(timestamp as number, maxLookbackMs)).toBe(
          false,
        );
      },
    );

    test('should return false if timestamp from future', () => {
      expect(
        isAcceptableTimestamp(faker.date.future().valueOf(), maxLookbackMs),
      ).toBe(false);
    });

    test('should return false if timestamp is too far', () => {
      expect(
        isAcceptableTimestamp(now - maxLookbackMs - 1, maxLookbackMs),
      ).toBe(false);
    });

    test('should return true if timestamp is in range', () => {
      const maxLookbackMs = faker.number.int({ max: 100 });
      expect(isAcceptableTimestamp(now - maxLookbackMs, maxLookbackMs)).toBe(
        true,
      );
    });
  });
});
