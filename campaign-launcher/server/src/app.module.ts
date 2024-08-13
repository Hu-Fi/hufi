import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { EnvConfigModule } from './common/config/config.module';
import { envValidator } from './common/config/env-schema';
import { HttpValidationPipe } from './common/pipes';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { HealthModule } from './modules/health/health.module';
import { LeaderModule } from './modules/leader/leader.module';
import { ManifestModule } from './modules/manifest/manifest.module';
import { StorageModule } from './modules/storage/storage.module';
import { Web3Module } from './modules/web3/web3.module';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    EnvConfigModule,
    HealthModule,
    ExchangeModule,
    ManifestModule,
    StorageModule,
    CampaignModule,
    LeaderModule,
    Web3Module,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '././modules/', 'node_modules/swagger-ui-dist'),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
