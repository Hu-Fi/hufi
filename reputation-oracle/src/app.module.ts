import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import Environment from '@/common/utils/environment';
import { HelloModule } from '@/modules/hello';

import { EnvConfigModule, envValidator } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    EnvConfigModule,
    HelloModule,
  ],
})
export class AppModule {}
