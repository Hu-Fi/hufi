import { ShutdownSignal } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ServerConfigService } from './config';
import logger, { nestLoggerOverride } from './logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: nestLoggerOverride,
  });
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM]);

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Recording Oracle API')
    .setDescription('Swagger Recording Oracle API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(helmet());

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  await app.listen(port, host, async () => {
    logger.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
