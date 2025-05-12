import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ServerConfigService } from './common/config/server-config.service';
import { GlobalExceptionsFilter } from './common/filter';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  app.useGlobalFilters(new GlobalExceptionsFilter());
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .setTitle('HuFi Reputation Oracle API')
    .setDescription('HuFi Reputation Oracle API Swagger Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(helmet());

  await app.listen(port, host, async () => {
    // eslint-disable-next-line no-console
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
