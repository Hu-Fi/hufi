// src/database/pg-lock.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PgLockService {
  private readonly logger = new Logger(PgLockService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Run `fn` only if the advisory lock can be acquired.
   *
   * @param key  Any stable string (will be hashed to BIGINT)
   * @returns    Whatever `fn` returns, or `null` if another node is working
   */
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
    const runner = this.dataSource.createQueryRunner(); // gets its own dedicated connection
    await runner.connect();

    // hashtext() → BIGINT so we can map strings to the advisory-lock API
    const [{ locked }] = await runner.query(
      'SELECT pg_try_advisory_lock(hashtext($1)) AS locked',
      [key],
    );

    if (!locked) {
      await runner.release(); // somebody else holds the lock
      this.logger.debug(`Skipped - lock "${key}" is busy`);
      return null;
    }

    try {
      return await fn(); // we are the owner
    } finally {
      // always release before giving the connection back
      await runner.query('SELECT pg_advisory_unlock(hashtext($1))', [key]);
      await runner.release();
    }
  }
}
