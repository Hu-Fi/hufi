import { BaseError } from '@/common/errors/base';

export type PromisePoolTask = () => Promise<unknown>;

export class BackpressureLimitError extends BaseError {
  constructor(backpressureLimit: number) {
    super(`PromisePool backpressure limit of ${backpressureLimit} reached`);
  }
}

export interface PromisePoolOptions {
  /**
   * Maximum number of tasks executing at the same time.
   */
  concurrency: number;

  /**
   * Maximum number of tasks allowed to wait in the internal execution queue.
   * Once the queue reaches this size, further add() calls are backpressured
   * until a running task finishes or queue capacity becomes available.
   *
   * A value of 0 means do not admit any tasks into the waiting queue: add()
   * will pause until the task can start immediately.
   */
  backpressureLimit?: number;
}

/**
 * Promise pool for fire-and-forget task execution with bounded concurrency.
 *
 * Tasks are submitted dynamically via add() rather than through a fixed
 * iterable. The pool does not retain task results or errors.
 */
export class PromisePool {
  private readonly slotWaiters: Array<() => void> = [];
  private readonly idleWaiters: Array<() => void> = [];

  private readonly concurrency: number;
  private readonly backpressureLimit: number;
  private activeCount = 0;

  constructor({ concurrency, backpressureLimit }: PromisePoolOptions) {
    if (!Number.isInteger(concurrency) || concurrency <= 0) {
      throw new Error('concurrency must be a positive integer');
    }

    if (
      backpressureLimit !== undefined &&
      (!Number.isInteger(backpressureLimit) || backpressureLimit <= 0)
    ) {
      throw new Error('backpressureLimit must be a positive integer');
    }

    this.concurrency = concurrency;
    this.backpressureLimit = backpressureLimit ?? 1;
  }

  get active(): number {
    return this.activeCount;
  }

  get pending(): number {
    return this.slotWaiters.length;
  }

  /**
   * Submit a task to the pool.
   *
   * The returned promise resolves once the task has been accepted by the pool,
   * not when the task itself completes.
   */
  async add(task: PromisePoolTask): Promise<void> {
    await this.acquireSlot();
    // Fire-and-forget
    void this.startTask(task);
  }

  private async acquireSlot(): Promise<void> {
    /**
     * No queue buildup so slot is immediately available.
     */
    if (this.activeCount < this.concurrency && this.slotWaiters.length === 0) {
      this.activeCount += 1;
      return;
    }

    // Enter the internal queue if it still has capacity.
    if (this.slotWaiters.length < this.backpressureLimit) {
      await new Promise<void>((resolve) => {
        this.slotWaiters.push(resolve);
      });

      this.activeCount += 1;
      return;
    } else {
      throw new BackpressureLimitError(this.backpressureLimit);
    }
  }

  private async startTask(task: PromisePoolTask) {
    try {
      await task();
    } finally {
      this.releaseSlot();
    }
  }

  private releaseSlot() {
    this.activeCount -= 1;

    // First, let the next queued task claim the freed execution slot.
    if (this.slotWaiters.length > 0 && this.activeCount < this.concurrency) {
      const nextSlotWaiter = this.slotWaiters.shift();
      nextSlotWaiter?.();
    }

    // Finally, resolve onIdle() waiters once the pool is completely drained.
    if (this.activeCount === 0 && this.slotWaiters.length === 0) {
      while (this.idleWaiters.length > 0) {
        const idleWaiter = this.idleWaiters.shift();
        idleWaiter?.();
      }
    }
  }

  /**
   * Resolves when there are no running and queued tasks left.
   */
  async onIdle(): Promise<void> {
    if (this.activeCount === 0 && this.slotWaiters.length === 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.idleWaiters.push(resolve);
    });
  }
}
