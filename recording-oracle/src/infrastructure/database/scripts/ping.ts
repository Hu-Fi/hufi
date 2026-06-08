import { MethodNotImplementedError } from '@/common/errors/base';

import { DbScript } from './base';

export default class PingDbScript extends DbScript {
  async execute(): Promise<void> {
    try {
      const [dbInfo] = await this.queryRunner.query(`
        SELECT 
          current_database() as database,
          current_user as user
      `);

      this.logger.info('DB ping OK', { dbInfo });
    } catch (error) {
      this.logger.info('DB ping error', { error });
    }
  }

  async revert(): Promise<void> {
    throw new MethodNotImplementedError();
  }
}
