import { setTimeout as delay } from 'timers/promises';

import { faker } from '@faker-js/faker';

import { TimeoutError, withTimeout, consumeIteratorOnce } from './control-flow';

describe('Control Flow utilities', () => {
  describe('withTimeout', () => {
    /**
     * Have this to avoid potential flaky tests
     * in case when runs on busy CPU
     */
    const ALLOWED_TIMEOUT_MARGIN_MS = 50;

    let timeoutMs: number;
    let delayMarginMs: number;

    beforeEach(() => {
      /**
       * Real timer w/o mocks will run, so keep it reasonably small
       */
      timeoutMs = faker.number.int({ min: 100, max: 500 });

      delayMarginMs = faker.number.int({
        min: 10,
        max: 20,
      });
    });

    it('should throw if operation times out', async () => {
      const startTs = Date.now();

      let thrownError;
      try {
        await withTimeout(delay(timeoutMs + delayMarginMs), timeoutMs);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(TimeoutError);
      expect(thrownError.message).toBe('Operation timed out');

      const elapsed = Date.now() - startTs;
      expect(elapsed).toBeGreaterThanOrEqual(timeoutMs);
      expect(elapsed).toBeLessThanOrEqual(
        timeoutMs + ALLOWED_TIMEOUT_MARGIN_MS,
      );
    });

    it('should return operation result if finished in time', async () => {
      const startTs = Date.now();

      const mockResult = faker.number.float();

      const result = await withTimeout(
        delay(timeoutMs - delayMarginMs, mockResult),
        timeoutMs,
      );

      expect(result).toBe(mockResult);

      const elapsed = Date.now() - startTs;
      expect(elapsed).toBeLessThan(timeoutMs);
    });
  });

  describe('consumeIteratorOnce', () => {
    it('should support sync iterable', async () => {
      const randomValues = Array.from({ length: 3 }, () => Math.random());

      const result = await consumeIteratorOnce(randomValues);

      expect(result).toBe(randomValues[0]);
    });

    it('should support async iterable', async () => {
      const randomValue = Math.random();

      async function* testGenerator() {
        yield randomValue;
      }

      const result = await consumeIteratorOnce(testGenerator());

      expect(result).toBe(randomValue);
    });

    it('should yield once and cleanup', async () => {
      const randomValue = Math.random();
      const secondYieldSpy = jest.fn();
      const catchBlockSpy = jest.fn();
      const cleanupSpy = jest.fn();

      async function* testGenerator() {
        try {
          yield randomValue;
          yield secondYieldSpy();
        } catch (error) {
          catchBlockSpy(error);
        } finally {
          cleanupSpy();
        }
      }

      const result = await consumeIteratorOnce(testGenerator());

      expect(result).toBe(randomValue);
      expect(secondYieldSpy).toHaveBeenCalledTimes(0);
      expect(catchBlockSpy).toHaveBeenCalledTimes(0);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
  });
});
