import { consumeIteratorOnce, consumeIterator } from './iteration';

describe('Iteration utilities', () => {
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

  describe('consumeIterator', () => {
    it('should consume sync iterable', async () => {
      const randomValues = Array.from({ length: 3 }, () => Math.random());

      const result = await consumeIterator(randomValues);

      expect(result).toEqual(randomValues);
    });

    it('should consume async iterable', async () => {
      const randomValues = Array.from({ length: 3 }, () => Math.random());

      async function* testGenerator() {
        for (const randomValue of randomValues) {
          yield randomValue;
        }
      }

      const result = await consumeIterator(testGenerator());

      expect(result).toEqual(randomValues);
    });
  });
});
