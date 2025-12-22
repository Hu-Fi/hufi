import { ShutdownSignal } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

/**
 * Setup for libs must be done before any other module is imported,
 * so every lib is already configured before its import there
 */
import './setup-libs';

import { PayoutsService } from '@/modules/payouts';

import { AppModule } from './app.module';
import logger, { nestLoggerOverride } from './logger';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: nestLoggerOverride,
  });
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM], {
    useProcessExit: true,
  });

  logger.debug('Application bootstrapped');

  const payoutsService = app.get(PayoutsService);

  await payoutsService.runPayoutsCycle();

  await app.close();
}

void bootstrap();
