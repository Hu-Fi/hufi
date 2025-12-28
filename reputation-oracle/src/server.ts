import { NestFactory } from '@nestjs/core';

/**
 * Setup for libs must be done before any other module is imported,
 * so every lib is already configured before its import there
 */
import './setup-libs';

import { AppModule } from './app.module';
import logger, { nestLoggerOverride } from './logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: nestLoggerOverride,
  });

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  logger.info(`Server running on http://${host}:${port}`);
}

void bootstrap();
