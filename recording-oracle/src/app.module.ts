import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { EnvConfigModule } from './common/config/config.module';
import { envValidator } from './common/config/env-schema';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { HttpValidationPipe } from './common/pipes';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { HealthModule } from './modules/health/health.module';
import { LiquidityScoreModule } from './modules/liquidity-score/liquidity-score.module';
import { MrMarketModule } from './modules/mr-market/mr-market.module';
import { RecordsModule } from './modules/records/records.module';
import { StorageModule } from './modules/storage/storage.module';
import { UserModule } from './modules/user/user.module';
import { Web3Module } from './modules/web3/web3.module';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
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
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    CampaignModule,
    ExchangeModule,
    RecordsModule,
    StorageModule,
    Web3Module,
    LiquidityScoreModule,
    MrMarketModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '././modules/', 'node_modules/swagger-ui-dist'),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
