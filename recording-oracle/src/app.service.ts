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
    this.logger.info('Application is about to shutdown', {
      signal,
    });
  }
}
