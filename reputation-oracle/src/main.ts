import { NestFactory } from '@nestjs/core';
import Decimal from 'decimal.js';

import { PayoutsService } from '@/modules/payouts';

import { AppModule } from './app.module';
import logger, { nestLoggerOverride } from './logger';

function configureLibraries(): void {
  // Max EVM token decimals is uint8 - 255;
  Decimal.set({
    toExpNeg: -256,
    toExpPos: 256,
  });
}

async function bootstrap() {
  configureLibraries();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: nestLoggerOverride,
  });

  logger.debug('Application bootstrapped');

  const payoutsService = app.get(PayoutsService);

  await payoutsService.runPayoutsCycle();

  await app.close();
}

void bootstrap();
