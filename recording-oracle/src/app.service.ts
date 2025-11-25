import { setTimeout } from 'timers/promises';

import { Injectable, OnApplicationShutdown } from '@nestjs/common';

import logger from '@/logger';

@Injectable()
export class AppService implements OnApplicationShutdown {
  private readonly logger = logger.child({
    context: AppService.name,
  });

  onApplicationBootstrap() {
    this.logger.debug('Application bootstrapped', {
      pid: process.pid,
    });
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.info('Application is going to shutdown', {
      signal,
    });

    /**
     * Wait a second to flush all buffered logs
     */
    await setTimeout(1000);
  }
}
