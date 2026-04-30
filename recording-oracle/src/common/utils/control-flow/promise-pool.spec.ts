import { setTimeout as delay } from 'timers/promises';

import { faker } from '@faker-js/faker';

import { BackpressureLimitError, PromisePool } from './promise-pool';

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
};

function createDeferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe('PromisePool', () => {
  describe('constructor', () => {
    it.each([
      0,
      -1 * faker.number.int({ min: 1 }),
      faker.number.float({ min: 0.001, max: 10 }),
    ])('should throw when invalid concurrency [%#]', (testConcurrency) => {
      expect(() => {
        new PromisePool({ concurrency: testConcurrency });
      }).toThrow('concurrency must be a positive integer');
    });

    it.each([
      0,
      -1 * faker.number.int({ min: 1 }),
      faker.number.float({ min: 0.001, max: 10 }),
    ])(
      'should throw when invalid backpressureLimit [%#]',
      (testBackpressureLimit) => {
        expect(() => {
          new PromisePool({
            concurrency: 1,
            backpressureLimit: testBackpressureLimit,
          });
        }).toThrow('backpressureLimit must be a positive integer');
      },
    );
  });

  it('should limit task concurrency with default backpressure', async () => {
    const pool = new PromisePool({ concurrency: 2 });

    const tasks = [createDeferred(), createDeferred(), createDeferred()];

    let nActiveTasks = 0;
    let maxNActiveTasks = 0;

    const runTask = (deferred: Deferred) => async () => {
      nActiveTasks += 1;
      maxNActiveTasks = Math.max(maxNActiveTasks, nActiveTasks);

      await deferred.promise;
      nActiveTasks -= 1;
    };

    const addPromise1 = pool.add(runTask(tasks[0]));
    const addPromise2 = pool.add(runTask(tasks[1]));
    const addPromise3 = pool.add(runTask(tasks[2]));

    let thirdAddResolved = false;
    void addPromise3.then(() => {
      thirdAddResolved = true;
    });

    // Should accept first two tasks only
    await Promise.all([addPromise1, addPromise2]);
    await delay(10);

    expect(thirdAddResolved).toBe(false);
    expect(pool.active).toBe(2);
    expect(pool.pending).toBe(1);

    // Should accept third task once a slot is freed
    tasks[0].resolve();
    await addPromise3;

    expect(thirdAddResolved).toBe(true);
    expect(pool.active).toBe(2);
    expect(pool.pending).toBe(0);

    // Should complete all tasks and wait for idle state
    tasks[1].resolve();
    tasks[2].resolve();
    await pool.onIdle();

    expect(pool.active).toBe(0);
    expect(pool.pending).toBe(0);
    expect(maxNActiveTasks).toBe(2);
  });

  it('should resolve add() as soon as the task is queued, not when it finishes', async () => {
    const pool = new PromisePool({ concurrency: 1 });

    let taskStatus = 'pending';
    const task = createDeferred();

    await pool.add(async () => {
      taskStatus = 'started';
      await task.promise;
      taskStatus = 'finished';
    });

    expect(taskStatus).toBe('started');
    expect(pool.active).toBe(1);
    expect(pool.pending).toBe(0);

    task.resolve();

    await pool.onIdle();

    expect(taskStatus).toBe('finished');
    expect(pool.active).toBe(0);
    expect(pool.pending).toBe(0);
  });

  it('should throw BackpressureLimitError when queue is full', async () => {
    const pool = new PromisePool({ concurrency: 1, backpressureLimit: 1 });

    const tasks = [createDeferred(), createDeferred()];

    // Fills the concurrency slot
    await pool.add(async () => {
      await tasks[0].promise;
    });

    // Fills the only queue slot
    const secondAddPromise = pool.add(async () => {
      await tasks[1].promise;
    });

    expect(pool.active).toBe(1);
    expect(pool.pending).toBe(1);

    let thrownError: any;
    try {
      await pool.add(async () => undefined);
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(BackpressureLimitError);
    expect(thrownError.message).toBe(
      'PromisePool backpressure limit of 1 reached',
    );

    // Pool must remain usable after the error
    tasks[0].resolve();
    await secondAddPromise;
    expect(pool.active).toBe(1);
    expect(pool.pending).toBe(0);

    tasks[1].resolve();
    await pool.onIdle();
    expect(pool.active).toBe(0);
    expect(pool.pending).toBe(0);
  });
});
