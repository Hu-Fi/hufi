import { NestFactory } from '@nestjs/core';

import { PayoutsService } from '@/modules/payouts';

import { AppModule } from './app.module';
import logger, { nestLoggerOverride } from './logger';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: nestLoggerOverride,
  });

  logger.debug('Application bootstrapped');

  const payoutsService = app.get(PayoutsService);

  await payoutsService.runPayoutsCycle();

  await app.close();
}

void bootstrap();
