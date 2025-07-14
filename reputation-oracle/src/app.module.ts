import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import Environment from './common/utils/environment';
import { EnvConfigModule, envValidator } from './config';
import { HelloModule } from './modules/hello';
import { StorageModule } from './modules/storage';
import { Web3Module } from './modules/web3';

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
    StorageModule,
    Web3Module,
  ],
})
export class AppModule {}
