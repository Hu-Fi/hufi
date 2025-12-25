import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import Environment from './common/utils/environment';
import { EnvConfigModule, envValidator } from './config';
import { PayoutModule } from './modules/payouts';
import { StorageModule } from './modules/storage';
import { TdxVerificationModule } from './modules/tdx-verification';
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
    PayoutModule,
    StorageModule,
    Web3Module,
    TdxVerificationModule,
  ],
})
export class AppModule {}
