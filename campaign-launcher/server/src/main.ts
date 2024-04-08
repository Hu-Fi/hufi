import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import init from '@/app-init';
import { ServerConfigService } from '@/common/config/server-config.service';
import { AppModule } from '@/modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });
  await init(app);

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
