import { NestFactory } from '@nestjs/core';

import { HelloService } from '@/modules/hello';

import { AppModule } from './app.module';
import { S3ConfigService, Web3ConfigService } from './config';
import { nestLoggerOverride } from './logger';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: nestLoggerOverride,
  });

  const s3ConfigService = app.get(S3ConfigService);
  const web3ConfigService = app.get(Web3ConfigService);
  const helloService = app.get(HelloService);
  helloService.sayHello({
    address: web3ConfigService.operatorAddress,
    s3Bucket: s3ConfigService.bucket,
  });

  await app.close();
}

void bootstrap();
