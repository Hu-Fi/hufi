import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import logger from '@/logger';

@Injectable()
export class PgAdvisoryLock {
  private readonly logger = logger.child({ context: PgAdvisoryLock.name });

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Run `fn` only if the advisory lock can be acquired.
   *
   * @param key  Any stable string (will be hashed to BIGINT)
   * @returns    Whatever `fn` returns, or `null` if key is already locked
   */
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    const [{ locked }] = await runner.query(
      'SELECT pg_try_advisory_lock(hashtext($1)) AS locked',
      [key],
    );

    if (!locked) {
      await runner.release();
      this.logger.warn('Key is already locked', { key });
      return null;
    }

    try {
      return await fn();
    } finally {
      await runner.query('SELECT pg_advisory_unlock(hashtext($1))', [key]);
      await runner.release();
    }
  }
}
