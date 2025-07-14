import { NestFactory } from '@nestjs/core';

import { HelloService } from '@/modules/hello';

import { AppModule } from './app.module';
import { nestLoggerOverride } from './logger';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: nestLoggerOverride,
  });

  const helloService = app.get(HelloService);
  helloService.sayHello();

  return app.close();
}
void bootstrap();
